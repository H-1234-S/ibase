import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { randomUUID } from 'node:crypto';
import { AuthExceptionFilter } from '../src/auth/filters/auth-exception.filter.js';
import { EmailService } from '../src/auth/services/email.service.js';
import { AppModule } from '../src/app.module.js';
import { DatabaseService } from '../src/database/database.service.js';
import { users } from '../src/database/schemas/index.js';
import { inArray } from 'drizzle-orm';

function getRootCookie(setCookies: string[], name: string) {
  const cookie = setCookies.find(
    (value) => value.startsWith(`${name}=`) && value.includes('Path=/;'),
  );
  if (!cookie) throw new Error(`${name} cookie was not set`);
  const pair = cookie.split(';')[0];
  if (!pair) throw new Error(`${name} cookie value was empty`);
  return pair;
}

function getAuthCookieHeader(setCookies: string[]) {
  return [
    getRootCookie(setCookies, 'ibase_at'),
    getRootCookie(setCookies, 'ibase_rt'),
  ].join('; ');
}

describe('Authentication session flow (e2e)', () => {
  let app: INestApplication<App>;
  let verificationCode = '';
  const email = `auth-${randomUUID()}@example.test`;
  const testEmails = [email];
  const originHeaders = {
    Origin: 'http://localhost:3000',
    'X-Ibase-Request': '1',
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue({
        sendRegistrationCode: vi.fn(async (_email: string, code: string) => {
          verificationCode = code;
        }),
      })
      .compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new AuthExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app
        .get(DatabaseService)
        .db.delete(users)
        .where(inArray(users.email, testEmails));
      await app.close();
    }
  });

  it('registers, refreshes, revokes on logout, and rejects the old refresh token', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/email/send-code')
      .set(originHeaders)
      .send({ email })
      .expect(200);
    expect(verificationCode).toMatch(/^\d{6}$/);

    const registration = await request(app.getHttpServer())
      .post('/api/auth/register')
      .set(originHeaders)
      .send({
        name: 'Auth Test',
        email,
        password: 'secure-pass-123',
        code: verificationCode,
      })
      .expect(201);

    expect(registration.body.data.user.email).toBe(email);
    expect(JSON.stringify(registration.body)).not.toContain('accessToken');
    expect(JSON.stringify(registration.body)).not.toContain('refreshToken');
    const setCookies = registration.get('Set-Cookie') ?? [];
    const accessCookie = setCookies.find((cookie) =>
      cookie.startsWith('ibase_at='),
    );
    const refreshCookie = setCookies.find((cookie) =>
      cookie.startsWith('ibase_rt='),
    );
    expect(accessCookie).toContain('Path=/;');
    expect(refreshCookie).toContain('Path=/;');
    expect(setCookies.join(';')).toContain('HttpOnly');

    const oldRefreshCookieValue = getRootCookie(setCookies, 'ibase_rt');
    const sessionCookie = getAuthCookieHeader(setCookies);

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', sessionCookie)
      .expect(200);
    const refreshed = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set(originHeaders)
      .set('Cookie', sessionCookie)
      .expect(200);
    const rotatedCookie = getAuthCookieHeader(
      refreshed.get('Set-Cookie') ?? [],
    );
    await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set(originHeaders)
      .set('Cookie', rotatedCookie)
      .expect(204);

    const replay = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set(originHeaders)
      .set('Cookie', oldRefreshCookieValue)
      .expect(401);
    expect(replay.body.error.code).toBe('UNAUTHENTICATED');

    await request(app.getHttpServer()).get('/api/auth/me').expect(401);

    const duplicate = await request(app.getHttpServer())
      .post('/api/auth/register')
      .set(originHeaders)
      .send({
        name: 'Duplicate User',
        email,
        password: 'secure-pass-123',
        code: '000000',
      })
      .expect(409);
    expect(duplicate.body.error.code).toBe('EMAIL_ALREADY_REGISTERED');

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set(originHeaders)
      .send({ email, password: 'secure-pass-123' })
      .expect(200);
    expect(loginResponse.body.data.user.email).toBe(email);
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', getAuthCookieHeader(loginResponse.get('Set-Cookie') ?? []))
      .expect(200);

    const wrongPassword = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set(originHeaders)
      .send({ email, password: 'different-pass-123' })
      .expect(401);
    expect(wrongPassword.body.error.code).toBe('INVALID_PASSWORD');
  });

  it('rejects a consumed registration code', async () => {
    const unusedEmail = `auth-${randomUUID()}@example.test`;
    const registration = await request(app.getHttpServer())
      .post('/api/auth/register')
      .set(originHeaders)
      .send({
        name: 'Auth Test',
        email: unusedEmail,
        password: 'secure-pass-123',
        code: verificationCode,
      })
      .expect(400);

    expect(registration.body.error.code).toBe('INVALID_OR_EXPIRED_CODE');
  });

  it('revokes a session when an already rotated refresh token is replayed', async () => {
    const replayEmail = `auth-${randomUUID()}@example.test`;
    testEmails.push(replayEmail);
    await request(app.getHttpServer())
      .post('/api/auth/email/send-code')
      .set(originHeaders)
      .send({ email: replayEmail })
      .expect(200);
    const replayCode = verificationCode;
    const registration = await request(app.getHttpServer())
      .post('/api/auth/register')
      .set(originHeaders)
      .send({
        name: 'Replay Test',
        email: replayEmail,
        password: 'secure-pass-123',
        code: replayCode,
      })
      .expect(201);
    const originalRefreshCookieValue = getRootCookie(
      registration.get('Set-Cookie') ?? [],
      'ibase_rt',
    );
    const refreshResult = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set(originHeaders)
      .set('Cookie', originalRefreshCookieValue)
      .expect(200);
    const replay = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set(originHeaders)
      .set('Cookie', originalRefreshCookieValue)
      .expect(401);
    expect(replay.body.error.code).toBe('UNAUTHENTICATED');
    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set(originHeaders)
      .set(
        'Cookie',
        getRootCookie(refreshResult.get('Set-Cookie') ?? [], 'ibase_rt'),
      )
      .expect(401);
  });

  it('applies the documented security-first policy to concurrent refreshes', async () => {
    const concurrentEmail = `auth-${randomUUID()}@example.test`;
    testEmails.push(concurrentEmail);
    await request(app.getHttpServer())
      .post('/api/auth/email/send-code')
      .set(originHeaders)
      .send({ email: concurrentEmail })
      .expect(200);
    const code = verificationCode;
    const registration = await request
      .agent(app.getHttpServer())
      .post('/api/auth/register')
      .set(originHeaders)
      .send({
        name: 'Concurrent Refresh',
        email: concurrentEmail,
        password: 'secure-pass-123',
        code,
      })
      .expect(201);
    const refreshCookie = registration
      .get('Set-Cookie')
      ?.find((cookie) => cookie.startsWith('ibase_rt='));
    if (!refreshCookie) {
      throw new Error('Refresh cookie was not set');
    }
    const refreshCookieValue = refreshCookie.split(';')[0];
    if (!refreshCookieValue) {
      throw new Error('Refresh cookie value was empty');
    }

    const responses = await Promise.all([
      request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set(originHeaders)
        .set('Cookie', refreshCookieValue),
      request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set(originHeaders)
        .set('Cookie', refreshCookieValue),
    ]);

    expect(
      responses
        .map((response) => response.status)
        .sort((left, right) => left - right),
    ).toEqual([200, 401]);
    const rotatedCookie = responses
      .find((response) => response.status === 200)
      ?.get('Set-Cookie')
      ?.find((cookie) => cookie.startsWith('ibase_rt='));
    if (!rotatedCookie) {
      throw new Error('The successful refresh did not rotate the cookie');
    }
    const rotatedCookieValue = rotatedCookie.split(';')[0];
    if (!rotatedCookieValue) {
      throw new Error('Rotated refresh cookie value was empty');
    }
    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set(originHeaders)
      .set('Cookie', rotatedCookieValue)
      .expect(401);
  });
});
