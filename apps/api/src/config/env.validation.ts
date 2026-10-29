import { API_PORT } from '@ibase/constants';
import { randomBytes } from 'node:crypto';

/** Validates environment variables and applies the API's local port default. */
export function validateEnvironment(environment: Record<string, unknown>) {
  const nodeEnv = environmentString(
    environment.NODE_ENV,
    'development',
    'NODE_ENV',
  );
  const port = Number(environment.API_PORT ?? API_PORT);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('API_PORT must be an integer between 1 and 65535');
  }

  const webOrigin = environmentString(
    environment.WEB_ORIGIN,
    nodeEnv === 'production' ? '' : 'http://localhost:3000',
    'WEB_ORIGIN',
  );

  if (
    !webOrigin ||
    !URL.canParse(webOrigin) ||
    new URL(webOrigin).origin !== webOrigin
  ) {
    throw new Error('WEB_ORIGIN must be a valid origin without a path');
  }

  const accessSecret = environmentString(
    environment.JWT_ACCESS_SECRET,
    '',
    'JWT_ACCESS_SECRET',
  );
  const refreshSecret = environmentString(
    environment.JWT_REFRESH_SECRET,
    '',
    'JWT_REFRESH_SECRET',
  );
  if (
    (accessSecret && Buffer.byteLength(accessSecret) < 32) ||
    (refreshSecret && Buffer.byteLength(refreshSecret) < 32)
  ) {
    throw new Error(
      'Configured JWT secrets must each contain at least 32 bytes',
    );
  }
  if (accessSecret && accessSecret === refreshSecret) {
    throw new Error('Access and refresh JWT secrets must be different');
  }

  if (nodeEnv === 'production') {
    if (
      Buffer.byteLength(accessSecret) < 32 ||
      Buffer.byteLength(refreshSecret) < 32
    ) {
      throw new Error(
        'Production JWT secrets must each contain at least 32 bytes',
      );
    }

    for (const key of [
      'EMAIL_USER',
      'EMAIL_PASSWORD',
      'REDIS_URL',
      'DATABASE_URL',
    ]) {
      if (!environment[key]) {
        throw new Error(`${key} must be configured in production`);
      }
    }
  }

  const emailUser = environmentString(environment.EMAIL_USER, '', 'EMAIL_USER');
  const emailPassword = environmentString(
    environment.EMAIL_PASSWORD,
    '',
    'EMAIL_PASSWORD',
  );
  const sameSite = environmentString(
    environment.AUTH_COOKIE_SAME_SITE,
    'lax',
    'AUTH_COOKIE_SAME_SITE',
  );
  const cookieSecure =
    environment.AUTH_COOKIE_SECURE === undefined
      ? nodeEnv === 'production'
      : environment.AUTH_COOKIE_SECURE === 'true';

  if (!emailUser || !emailPassword) {
    throw new Error('EMAIL_USER and EMAIL_PASSWORD must be configured');
  }

  const invitationSecret = environmentString(
    environment.INVITATION_TOKEN_SECRET,
    '',
    'INVITATION_TOKEN_SECRET',
  );
  if (Buffer.byteLength(invitationSecret) < 32) {
    throw new Error(
      'INVITATION_TOKEN_SECRET must contain at least 32 bytes',
    );
  }

  if (!['lax', 'strict', 'none'].includes(sameSite)) {
    throw new Error('AUTH_COOKIE_SAME_SITE must be lax, strict, or none');
  }
  if (nodeEnv === 'production' && !cookieSecure) {
    throw new Error('AUTH_COOKIE_SECURE must be true in production');
  }
  if (sameSite === 'none' && !cookieSecure) {
    throw new Error('AUTH_COOKIE_SECURE must be true when SameSite is none');
  }

  const emailCodeTtl = positiveInteger(
    environment.AUTH_EMAIL_CODE_TTL_SECONDS,
    300,
    'AUTH_EMAIL_CODE_TTL_SECONDS',
  );
  if (emailCodeTtl !== 300) {
    throw new Error('AUTH_EMAIL_CODE_TTL_SECONDS must be exactly 300');
  }

  return {
    ...environment,
    API_PORT: port,
    NODE_ENV: nodeEnv,
    WEB_ORIGIN: webOrigin,
    JWT_ACCESS_SECRET: accessSecret || randomBytes(48).toString('base64url'),
    JWT_REFRESH_SECRET: refreshSecret || randomBytes(48).toString('base64url'),
    JWT_ACCESS_TTL_SECONDS: positiveInteger(
      environment.JWT_ACCESS_TTL_SECONDS,
      900,
      'JWT_ACCESS_TTL_SECONDS',
    ),
    JWT_REFRESH_TTL_SECONDS: positiveInteger(
      environment.JWT_REFRESH_TTL_SECONDS,
      604800,
      'JWT_REFRESH_TTL_SECONDS',
    ),
    AUTH_SESSION_ABSOLUTE_TTL_SECONDS: positiveInteger(
      environment.AUTH_SESSION_ABSOLUTE_TTL_SECONDS,
      2592000,
      'AUTH_SESSION_ABSOLUTE_TTL_SECONDS',
    ),
    AUTH_SESSION_IDLE_TTL_SECONDS: positiveInteger(
      environment.AUTH_SESSION_IDLE_TTL_SECONDS,
      604800,
      'AUTH_SESSION_IDLE_TTL_SECONDS',
    ),
    AUTH_EMAIL_CODE_TTL_SECONDS: emailCodeTtl,
    AUTH_EMAIL_CODE_COOLDOWN_SECONDS: positiveInteger(
      environment.AUTH_EMAIL_CODE_COOLDOWN_SECONDS,
      60,
      'AUTH_EMAIL_CODE_COOLDOWN_SECONDS',
    ),
    AUTH_EMAIL_CODE_MAX_ATTEMPTS: positiveInteger(
      environment.AUTH_EMAIL_CODE_MAX_ATTEMPTS,
      5,
      'AUTH_EMAIL_CODE_MAX_ATTEMPTS',
    ),
    AUTH_EMAIL_RATE_LIMIT_PER_HOUR: positiveInteger(
      environment.AUTH_EMAIL_RATE_LIMIT_PER_HOUR,
      5,
      'AUTH_EMAIL_RATE_LIMIT_PER_HOUR',
    ),
    AUTH_IP_EMAIL_RATE_LIMIT_PER_HOUR: positiveInteger(
      environment.AUTH_IP_EMAIL_RATE_LIMIT_PER_HOUR,
      20,
      'AUTH_IP_EMAIL_RATE_LIMIT_PER_HOUR',
    ),
    AUTH_LOGIN_ACCOUNT_LIMIT: positiveInteger(
      environment.AUTH_LOGIN_ACCOUNT_LIMIT,
      10,
      'AUTH_LOGIN_ACCOUNT_LIMIT',
    ),
    AUTH_LOGIN_IP_LIMIT: positiveInteger(
      environment.AUTH_LOGIN_IP_LIMIT,
      30,
      'AUTH_LOGIN_IP_LIMIT',
    ),
    AUTH_LOGIN_HASH_CONCURRENCY: positiveInteger(
      environment.AUTH_LOGIN_HASH_CONCURRENCY,
      4,
      'AUTH_LOGIN_HASH_CONCURRENCY',
    ),
    AUTH_COOKIE_SECURE: cookieSecure,
    AUTH_COOKIE_SAME_SITE: sameSite,
    INVITATION_TOKEN_SECRET: invitationSecret,
    INVITATION_TTL_HOURS: positiveInteger(
      environment.INVITATION_TTL_HOURS,
      168,
      'INVITATION_TTL_HOURS',
    ),
  };
}

function positiveInteger(value: unknown, defaultValue: number, key: string) {
  const parsed = Number(value ?? defaultValue);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${key} must be a positive integer`);
  }

  return parsed;
}

function environmentString(value: unknown, defaultValue: string, key: string) {
  if (value === undefined) {
    return defaultValue;
  }
  if (typeof value !== 'string') {
    throw new Error(`${key} must be a string`);
  }
  return value;
}
