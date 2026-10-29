import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, eq, isNotNull, isNull, lt, or } from 'drizzle-orm';
import argon2 from 'argon2';
import { randomBytes, randomUUID } from 'node:crypto';
import type { PublicUser } from '@ibase/shared-types';
import { AuthError } from '../errors/auth-error.js';
import { AuthSecurityService } from './auth-security.service.js';
import { EmailService } from './email.service.js';
import { DatabaseService } from '../../database/database.service.js';
import {
  authRefreshTokens,
  authSessions,
  users,
} from '../../database/schemas/index.js';
import type { IssuedAuthTokenPair } from '../types/auth.types.js';
import { AuthTokenService } from './auth-token.service.js';

const tokenCookieNames = {
  access: 'ibase_at',
  refresh: 'ibase_rt',
};

/** Implements registration, credential login, current-user and session flows. */
@Injectable()
export class AuthService implements OnModuleInit, OnModuleDestroy {
  private dummyPasswordHash = '';
  private cleanupInterval: NodeJS.Timeout | undefined;

  constructor(
    private readonly database: DatabaseService,
    private readonly config: ConfigService,
    private readonly tokens: AuthTokenService,
    private readonly security: AuthSecurityService,
    private readonly email: EmailService,
  ) {}

  async onModuleInit() {
    this.dummyPasswordHash = await argon2.hash(randomBytes(32), {
      type: argon2.argon2id,
    });
    await this.removeExpiredSessions();
    this.cleanupInterval = setInterval(
      () => {
        void this.removeExpiredSessions();
      },
      6 * 60 * 60 * 1000,
    ).unref();
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /** Requests a registration code without revealing whether an email exists. */
  async sendEmailCode(email: string, ip: string) {
    const code = this.security.generateEmailCode();
    const reservation = await this.security.reserveEmailCode(email, ip, code);

    if (reservation === -1) {
      throw new AuthError('RATE_LIMITED', 'Too many code requests', 429, 3600);
    }

    if (reservation === -2) {
      throw new AuthError(
        'RATE_LIMITED',
        'Please wait before requesting again',
        429,
        this.config.getOrThrow<number>('AUTH_EMAIL_CODE_COOLDOWN_SECONDS'),
      );
    }

    const [existingUser] = await this.database.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    try {
      await this.email.sendRegistrationCode(email, code);
      if (!existingUser) {
        await this.security.publishEmailCode(email, code);
      } else {
        await this.security.discardPendingEmailCode(email);
      }
    } catch (error) {
      await this.security.discardPendingEmailCode(email);
      throw error;
    }

    return {
      sent: true,
      expiresIn: this.config.getOrThrow<number>('AUTH_EMAIL_CODE_TTL_SECONDS'),
      retryAfter: this.config.getOrThrow<number>(
        'AUTH_EMAIL_CODE_COOLDOWN_SECONDS',
      ),
    };
  }

  /** Consumes a code, creates a verified user and starts the first session. */
  async register(input: {
    name: string;
    email: string;
    password: string;
    code: string;
  }) {
    const [existingUser] = await this.database.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (existingUser) {
      throw new AuthError(
        'EMAIL_ALREADY_REGISTERED',
        'This email is already registered',
        409,
      );
    }

    const codeIsValid = await this.security.consumeEmailCode(
      input.email,
      input.code,
    );

    if (!codeIsValid) {
      throw new AuthError(
        'INVALID_OR_EXPIRED_CODE',
        'Verification code is invalid or expired',
        400,
      );
    }

    const hashSlot = await this.security.acquirePasswordHashSlot();
    if (!hashSlot) {
      throw new AuthError(
        'RATE_LIMITED',
        'Registration capacity is busy',
        429,
        1,
      );
    }
    let passwordHash: string;
    try {
      passwordHash = await argon2.hash(input.password, {
        type: argon2.argon2id,
      });
    } finally {
      await this.security.releasePasswordHashSlot(hashSlot);
    }
    const now = new Date();
    const absoluteExpiry = new Date(
      now.getTime() +
        this.config.getOrThrow<number>('AUTH_SESSION_ABSOLUTE_TTL_SECONDS') *
          1000,
    );
    const sessionId = randomUUID();

    let user: typeof users.$inferSelect;
    let pair: IssuedAuthTokenPair;

    try {
      const created = await this.database.db.transaction(
        async (transaction) => {
          const [createdUser] = await transaction
            .insert(users)
            .values({
              name: input.name,
              email: input.email,
              passwordHash,
              emailVerifiedAt: now,
            })
            .returning();
          if (!createdUser) {
            throw new Error('User insert returned no row');
          }
          const issuedPair = await this.tokens.issueTokenPair(
            sessionId,
            createdUser.id,
            absoluteExpiry,
          );

          await transaction.insert(authSessions).values({
            id: sessionId,
            userId: createdUser.id,
            createdAt: now,
            lastUsedAt: now,
            expiresAt: absoluteExpiry,
          });
          await transaction.insert(authRefreshTokens).values({
            sessionId,
            tokenId: issuedPair.refreshTokenId,
            tokenHash: issuedPair.refreshTokenHash,
            expiresAt: issuedPair.refreshExpiresAt,
          });

          return { user: createdUser, pair: issuedPair };
        },
      );
      user = created.user;
      pair = created.pair;
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
      ) {
        throw new AuthError(
          'EMAIL_ALREADY_REGISTERED',
          'This email is already registered',
          409,
        );
      }

      throw error;
    }

    return { user: this.toPublicUser(user), tokens: pair };
  }

  /** Verifies credentials after rate limits have passed and starts a session. */
  async login(email: string, password: string, ip: string) {
    const allowed = await this.security.checkLoginRateLimit(email, ip);

    if (!allowed) {
      throw new AuthError('RATE_LIMITED', 'Too many login attempts', 429, 900);
    }

    const slot = await this.security.acquirePasswordHashSlot();

    if (!slot) {
      throw new AuthError('RATE_LIMITED', 'Login capacity is busy', 429, 1);
    }

    let user;
    let passwordIsValid: boolean;

    try {
      [user] = await this.database.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      passwordIsValid = await argon2.verify(
        user?.passwordHash ?? this.dummyPasswordHash,
        password,
      );
    } finally {
      await this.security.releasePasswordHashSlot(slot);
    }

    if (!user) {
      throw new AuthError(
        'EMAIL_NOT_REGISTERED',
        'Email is not registered',
        404,
      );
    }

    if (!passwordIsValid) {
      throw new AuthError('INVALID_PASSWORD', 'Password is incorrect', 401);
    }

    const now = new Date();
    const sessionId = randomUUID();
    const absoluteExpiry = new Date(
      now.getTime() +
        this.config.getOrThrow<number>('AUTH_SESSION_ABSOLUTE_TTL_SECONDS') *
          1000,
    );
    const pair = await this.tokens.issueTokenPair(
      sessionId,
      user.id,
      absoluteExpiry,
    );

    await this.database.db.transaction(async (transaction) => {
      await transaction.insert(authSessions).values({
        id: sessionId,
        userId: user.id,
        createdAt: now,
        lastUsedAt: now,
        expiresAt: absoluteExpiry,
      });
      await transaction.insert(authRefreshTokens).values({
        sessionId,
        tokenId: pair.refreshTokenId,
        tokenHash: pair.refreshTokenHash,
        expiresAt: pair.refreshExpiresAt,
      });
    });

    return { user: this.toPublicUser(user), tokens: pair };
  }

  /** Returns an active user's public profile for a verified Access Token. */
  async getCurrentUser(userId: string) {
    const [user] = await this.database.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new AuthError('UNAUTHENTICATED', 'Authentication is required', 401);
    }

    return this.toPublicUser(user);
  }

  /** Rotates one refresh token and revokes its family if an old token reappears. */
  async refresh(refreshToken: string) {
    const claims = await this.tokens.verifyToken(refreshToken, 'refresh');
    const oldHash = this.tokens.hashRefreshToken(refreshToken);
    const outcome = await this.database.db.transaction(async (transaction) => {
      const [session] = await transaction
        .select()
        .from(authSessions)
        .where(eq(authSessions.id, claims.sid))
        .for('update')
        .limit(1);

      if (!session) {
        return { kind: 'invalid' as const };
      }

      const [storedToken] = await transaction
        .select()
        .from(authRefreshTokens)
        .where(eq(authRefreshTokens.tokenHash, oldHash))
        .limit(1);

      if (
        !storedToken ||
        storedToken.sessionId !== session.id ||
        storedToken.tokenId !== claims.jti
      ) {
        return { kind: 'invalid' as const };
      }

      const now = new Date();
      if (storedToken.replacedAt || storedToken.revokedAt) {
        await transaction
          .update(authSessions)
          .set({ revokedAt: now })
          .where(eq(authSessions.id, session.id));
        return { kind: 'replay' as const };
      }

      const idleExpiry = new Date(
        session.lastUsedAt.getTime() +
          this.config.getOrThrow<number>('AUTH_SESSION_IDLE_TTL_SECONDS') *
            1000,
      );
      if (
        session.revokedAt ||
        session.expiresAt <= now ||
        idleExpiry <= now ||
        storedToken.expiresAt <= now
      ) {
        return { kind: 'invalid' as const };
      }

      const pair = await this.tokens.issueTokenPair(
        session.id,
        session.userId,
        session.expiresAt,
      );
      await transaction
        .update(authRefreshTokens)
        .set({ replacedAt: now })
        .where(eq(authRefreshTokens.id, storedToken.id));
      await transaction.insert(authRefreshTokens).values({
        sessionId: session.id,
        tokenId: pair.refreshTokenId,
        tokenHash: pair.refreshTokenHash,
        expiresAt: pair.refreshExpiresAt,
      });
      await transaction
        .update(authSessions)
        .set({ lastUsedAt: now })
        .where(eq(authSessions.id, session.id));

      return { kind: 'rotated' as const, pair, userId: session.userId };
    });

    if (outcome.kind !== 'rotated') {
      throw new AuthError(
        'UNAUTHENTICATED',
        outcome.kind === 'replay'
          ? 'Refresh token reuse detected; sign in again'
          : 'Refresh session is invalid or expired',
        401,
      );
    }

    return {
      user: await this.getCurrentUser(outcome.userId),
      tokens: outcome.pair,
    };
  }

  /** Revokes the server-side refresh session before logout returns success. */
  async logout(refreshToken: string | undefined) {
    if (!refreshToken) {
      return;
    }

    const hash = this.tokens.hashRefreshToken(refreshToken);
    await this.database.db.transaction(async (transaction) => {
      const [token] = await transaction
        .select({ sessionId: authRefreshTokens.sessionId })
        .from(authRefreshTokens)
        .where(eq(authRefreshTokens.tokenHash, hash))
        .limit(1);

      if (token) {
        await transaction
          .update(authSessions)
          .set({ revokedAt: new Date() })
          .where(
            and(
              eq(authSessions.id, token.sessionId),
              isNull(authSessions.revokedAt),
            ),
          );
      }
    });
  }

  /** Exposes the selected cookie names to the controller without raw tokens. */
  get cookieNames() {
    return tokenCookieNames;
  }

  get cookieSettings() {
    return {
      secure: this.config.getOrThrow<boolean>('AUTH_COOKIE_SECURE'),
      sameSite: this.config.getOrThrow<'lax' | 'strict' | 'none'>(
        'AUTH_COOKIE_SAME_SITE',
      ),
      domain: this.config.get<string>('AUTH_COOKIE_DOMAIN'),
      accessTtl: this.config.getOrThrow<number>('JWT_ACCESS_TTL_SECONDS'),
    };
  }

  /** Verifies and returns claims for the Access Token guard. */
  async verifyAccessToken(token: string) {
    return this.tokens.verifyAccessToken(token);
  }

  private async removeExpiredSessions() {
    const now = new Date();
    const revokedRetention = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    await this.database.db
      .delete(authSessions)
      .where(
        or(
          lt(authSessions.expiresAt, now),
          lt(
            authSessions.lastUsedAt,
            new Date(
              now.getTime() -
                this.config.getOrThrow<number>(
                  'AUTH_SESSION_IDLE_TTL_SECONDS',
                ) *
                  1000,
            ),
          ),
          and(
            isNotNull(authSessions.revokedAt),
            lt(authSessions.revokedAt, revokedRetention),
          ),
        ),
      );
  }

  private toPublicUser(user: typeof users.$inferSelect): PublicUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? '',
    };
  }
}
