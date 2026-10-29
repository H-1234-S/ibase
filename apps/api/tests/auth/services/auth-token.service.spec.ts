import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthTokenService } from '../../../src/auth/services/auth-token.service.js';

describe('AuthTokenService', () => {
  let service: AuthTokenService;
  let verifyAsync: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    verifyAsync = vi.fn();
    const jwt = { verifyAsync } as unknown as JwtService;
    const values: Record<string, string> = {
      JWT_ACCESS_SECRET: 'a'.repeat(48),
      JWT_REFRESH_SECRET: 'b'.repeat(48),
    };
    const config = {
      getOrThrow: (key: string) => values[key],
      get: () => undefined,
    } as unknown as ConfigService;
    service = new AuthTokenService(jwt, config);
  });

  it('distinguishes expired Access Tokens from other invalid credentials', async () => {
    const expired = Object.assign(new Error('expired'), {
      name: 'TokenExpiredError',
    });
    verifyAsync.mockRejectedValue(expired);

    await expect(service.verifyAccessToken('expired')).rejects.toMatchObject({
      code: 'ACCESS_TOKEN_EXPIRED',
    });

    verifyAsync.mockRejectedValue(new Error('invalid signature'));
    await expect(service.verifyAccessToken('invalid')).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    });
  });
});
