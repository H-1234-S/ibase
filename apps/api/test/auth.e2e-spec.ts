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
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/api/auth/email/send-code')
      .set(originHeaders)
      .send({ email })
      .expect(200);
    expect(verificationCode).toMatch(/^\d{6}$/);

    const registration = await agent
      .post('/api/auth/register')
      .set(originHeaders)
      .send({
        name: 'Auth Test',
        email,
        password: 'a-secure-test-password',
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
    expect(accessCookie).toContain('Path=/api;');
    expect(refreshCookie).toContain('Path=/api/auth;');
    expect(setCookies.join(';')).toContain('HttpOnly');

    const oldRefreshCookie = setCookies.find((cookie) =>
      cookie.startsWith('ibase_rt='),
    );
    if (!oldRefreshCookie) {
      throw new Error('Refresh cookie was not set');
    }
    const oldRefreshCookieValue = oldRefreshCookie.split(';')[0];
    if (!oldRefreshCookieValue) {
      throw new Error('Refresh cookie value was empty');
    }

    await agent.get('/api/auth/me').expect(200);
    await agent.post('/api/auth/refresh').set(originHeaders).expect(200);
    await agent.post('/api/auth/logout').set(originHeaders).expect(204);

    const replay = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set(originHeaders)
      .set('Cookie', oldRefreshCookieValue)
      .expect(401);
    expect(replay.body.error.code).toBe('UNAUTHENTICATED');

    await agent.get('/api/auth/me').expect(401);

    const duplicate = await request(app.getHttpServer())
      .post('/api/auth/register')
      .set(originHeaders)
      .send({
        name: 'Duplicate User',
        email,
        password: 'a-secure-test-password',
        code: '000000',
      })
      .expect(409);
    expect(duplicate.body.error.code).toBe('EMAIL_ALREADY_REGISTERED');

    const login = request.agent(app.getHttpServer());
    const loginResponse = await login
      .post('/api/auth/login')
      .set(originHeaders)
      .send({ email, password: 'a-secure-test-password' })
      .expect(200);
    expect(loginResponse.body.data.user.email).toBe(email);
    await login.get('/api/auth/me').expect(200);

    const wrongPassword = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set(originHeaders)
      .send({ email, password: 'a-different-password' })
      .expect(401);
    expect(wrongPassword.body.error.code).toBe('INVALID_PASSWORD');
  });

  it('rejects a consumed registration code', async () => {
    const unusedEmail = `auth-${randomUUID()}@example.test`;
    const agent = request.agent(app.getHttpServer());
    const registration = await agent
      .post('/api/auth/register')
      .set(originHeaders)
      .send({
        name: 'Auth Test',
        email: unusedEmail,
        password: 'a-secure-test-password',
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
    const agent = request.agent(app.getHttpServer());
    const registration = await agent
      .post('/api/auth/register')
      .set(originHeaders)
      .send({
        name: 'Replay Test',
        email: replayEmail,
        password: 'a-secure-test-password',
        code: replayCode,
      })
      .expect(201);
    const originalRefreshCookie = registration
      .get('Set-Cookie')
      ?.find((cookie) => cookie.startsWith('ibase_rt='));
    if (!originalRefreshCookie) {
      throw new Error('Refresh cookie was not set');
    }
    const originalRefreshCookieValue = originalRefreshCookie.split(';')[0];
    if (!originalRefreshCookieValue) {
      throw new Error('Refresh cookie value was empty');
    }

    await agent.post('/api/auth/refresh').set(originHeaders).expect(200);
    const replay = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set(originHeaders)
      .set('Cookie', originalRefreshCookieValue)
      .expect(401);
    expect(replay.body.error.code).toBe('UNAUTHENTICATED');
    await agent.post('/api/auth/refresh').set(originHeaders).expect(401);
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
        password: 'a-secure-test-password',
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
