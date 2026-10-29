import { describe, expect, it } from 'vitest';
import { validateEnvironment } from '../../src/config/env.validation.js';

describe('validateEnvironment', () => {
  it('uses independent per-process secrets for local development when omitted', () => {
    const environment = validateEnvironment({
      EMAIL_USER: 'test@example.com',
      EMAIL_PASSWORD: 'test-smtp-password',
    });

    expect(environment.WEB_ORIGIN).toBe('http://localhost:3000');
    expect(String(environment.JWT_ACCESS_SECRET)).toHaveLength(64);
    expect(String(environment.JWT_REFRESH_SECRET)).toHaveLength(64);
    expect(environment.JWT_ACCESS_SECRET).not.toBe(
      environment.JWT_REFRESH_SECRET,
    );
    expect(environment.AUTH_EMAIL_CODE_TTL_SECONDS).toBe(300);
  });

  it('fails production startup without independent strong JWT secrets', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        WEB_ORIGIN: 'https://web.example.com',
        EMAIL_USER: 'test@example.com',
        EMAIL_PASSWORD: 'test-smtp-password',
        DATABASE_URL: 'postgresql://db.example/app',
        REDIS_URL: 'redis://redis.example',
      }),
    ).toThrow('Production JWT secrets must each contain at least 32 bytes');
  });

  it('rejects insecure production cookies and non-five-minute code TTLs', () => {
    const production = {
      NODE_ENV: 'production',
      WEB_ORIGIN: 'https://web.example.com',
      JWT_ACCESS_SECRET: 'a'.repeat(48),
      JWT_REFRESH_SECRET: 'b'.repeat(48),
      EMAIL_USER: 'test@example.com',
      EMAIL_PASSWORD: 'test-smtp-password',
      DATABASE_URL: 'postgresql://db.example/app',
      REDIS_URL: 'redis://redis.example',
    };

    expect(() =>
      validateEnvironment({ ...production, AUTH_COOKIE_SECURE: 'false' }),
    ).toThrow('AUTH_COOKIE_SECURE must be true in production');
    expect(() =>
      validateEnvironment({
        ...production,
        AUTH_EMAIL_CODE_TTL_SECONDS: '301',
      }),
    ).toThrow('AUTH_EMAIL_CODE_TTL_SECONDS must be exactly 300');
  });
});
