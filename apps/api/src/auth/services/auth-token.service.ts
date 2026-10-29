import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHmac, randomUUID } from 'node:crypto';
import { AuthError } from '../errors/auth-error.js';
import type {
  AuthTokenClaims,
  IssuedAuthTokenPair,
} from '../types/auth.types.js';

/** Owns JWT signing, verification, and refresh-token digest operations. */
@Injectable()
export class AuthTokenService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly issuer: string;
  private readonly audience: string;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    this.accessSecret = config.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.refreshSecret = config.getOrThrow<string>('JWT_REFRESH_SECRET');
    this.issuer = config.get<string>('JWT_ISSUER') ?? 'ibase-api';
    this.audience = config.get<string>('JWT_AUDIENCE') ?? 'ibase-web';
  }

  /** Creates an Access/Refresh pair with a Refresh expiry bounded by session. */
  async issueTokenPair(
    sessionId: string,
    userId: string,
    sessionExpiry: Date,
  ): Promise<IssuedAuthTokenPair> {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const refreshTtl = Math.max(
      1,
      Math.min(
        this.config.getOrThrow<number>('JWT_REFRESH_TTL_SECONDS'),
        Math.floor(sessionExpiry.getTime() / 1000) - nowSeconds,
      ),
    );
    const refreshTokenId = randomUUID();
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sid: sessionId, token_use: 'access' },
        {
          secret: this.accessSecret,
          subject: userId,
          jwtid: randomUUID(),
          expiresIn: this.config.getOrThrow<number>('JWT_ACCESS_TTL_SECONDS'),
          issuer: this.issuer,
          audience: this.audience,
        },
      ),
      this.jwt.signAsync(
        { sid: sessionId, token_use: 'refresh' },
        {
          secret: this.refreshSecret,
          subject: userId,
          jwtid: refreshTokenId,
          expiresIn: refreshTtl,
          issuer: this.issuer,
          audience: this.audience,
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
      refreshTokenId,
      refreshTokenHash: this.hashRefreshToken(refreshToken),
      refreshExpiresAt: new Date((nowSeconds + refreshTtl) * 1000),
    };
  }

  /** Verifies a signed token and enforces its intended use. */
  async verifyToken(token: string, use: AuthTokenClaims['token_use']) {
    const secret = use === 'access' ? this.accessSecret : this.refreshSecret;

    try {
      const claims = await this.jwt.verifyAsync<AuthTokenClaims>(token, {
        secret,
        issuer: this.issuer,
        audience: this.audience,
      });

      if (
        claims.token_use !== use ||
        !claims.sub ||
        !claims.sid ||
        !claims.jti
      ) {
        throw new AuthError('UNAUTHENTICATED', 'Invalid credentials', 401);
      }

      return claims;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }

      if (
        use === 'access' &&
        error instanceof Error &&
        error.name === 'TokenExpiredError'
      ) {
        throw new AuthError(
          'ACCESS_TOKEN_EXPIRED',
          'Access token has expired',
          401,
        );
      }

      throw new AuthError('UNAUTHENTICATED', 'Invalid credentials', 401);
    }
  }

  /** Verifies and returns claims for the Access Token guard. */
  async verifyAccessToken(token: string) {
    return this.verifyToken(token, 'access');
  }

  /** Creates the server-side keyed digest used to look up a Refresh Token. */
  hashRefreshToken(token: string) {
    return createHmac('sha256', this.refreshSecret).update(token).digest('hex');
  }
}
