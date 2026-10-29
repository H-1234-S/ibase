import { beforeEach, describe, expect, it, vi } from 'vitest';
import argon2 from 'argon2';
import { ConfigService } from '@nestjs/config';
import { AuthSecurityService } from '../../../src/auth/services/auth-security.service.js';
import { AuthService } from '../../../src/auth/services/auth.service.js';
import { AuthTokenService } from '../../../src/auth/services/auth-token.service.js';
import { EmailService } from '../../../src/auth/services/email.service.js';
import { DatabaseService } from '../../../src/database/database.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let database: DatabaseService;
  let security: AuthSecurityService;
  let rateLimit: ReturnType<typeof vi.fn>;
  let acquireHashSlot: ReturnType<typeof vi.fn>;
  let databaseSelect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    databaseSelect = vi.fn();
    database = {
      db: { select: databaseSelect },
    } as unknown as DatabaseService;
    rateLimit = vi.fn().mockResolvedValue(false);
    acquireHashSlot = vi.fn();
    security = {
      checkLoginRateLimit: rateLimit,
      acquirePasswordHashSlot: acquireHashSlot,
      releasePasswordHashSlot: vi.fn(),
    } as unknown as AuthSecurityService;
    const config = {
      getOrThrow: vi.fn((key: string) => {
        const values: Record<string, string> = {
          JWT_ACCESS_SECRET: 'a'.repeat(48),
          JWT_REFRESH_SECRET: 'b'.repeat(48),
        };
        return values[key];
      }),
      get: vi.fn(),
    } as unknown as ConfigService;

    service = new AuthService(
      database,
      config,
      {} as AuthTokenService,
      security,
      {} as EmailService,
    );
  });

  it('rejects a rate-limited login before database lookup or Argon2id verification', async () => {
    const verify = vi.spyOn(argon2, 'verify');

    await expect(
      service.login('person@example.com', 'password-value', '127.0.0.1'),
    ).rejects.toMatchObject({
      code: 'RATE_LIMITED',
    });

    expect(rateLimit).toHaveBeenCalledWith('person@example.com', '127.0.0.1');
    expect(acquireHashSlot).not.toHaveBeenCalled();
    expect(databaseSelect).not.toHaveBeenCalled();
    expect(verify).not.toHaveBeenCalled();
    verify.mockRestore();
  });
});
