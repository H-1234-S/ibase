import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomInt, randomUUID } from 'node:crypto';
import { RedisService } from '../../redis/redis.service.js';

const reserveCodeScript = `
if redis.call('EXISTS', KEYS[3]) == 1 then return -2 end
local emailCount = redis.call('INCR', KEYS[1])
if emailCount == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
local ipCount = redis.call('INCR', KEYS[2])
if ipCount == 1 then redis.call('EXPIRE', KEYS[2], ARGV[1]) end
if emailCount > tonumber(ARGV[2]) or ipCount > tonumber(ARGV[3]) then return -1 end
redis.call('SET', KEYS[3], '1', 'EX', ARGV[4])
redis.call('SET', KEYS[4], ARGV[5], 'EX', ARGV[6])
return 1
`;

const publishCodeScript = `
local pending = redis.call('GET', KEYS[1])
if not pending or pending ~= ARGV[1] then return 0 end
redis.call('DEL', KEYS[1])
redis.call('SET', KEYS[2], ARGV[1], 'EX', ARGV[2])
return 1
`;

const consumeCodeScript = `
local stored = redis.call('GET', KEYS[1])
if not stored then return 0 end
if stored == ARGV[1] then
  redis.call('DEL', KEYS[1])
  redis.call('DEL', KEYS[2])
  return 1
end
local attempts = redis.call('INCR', KEYS[2])
if attempts == 1 then redis.call('EXPIRE', KEYS[2], ARGV[2]) end
if attempts >= tonumber(ARGV[3]) then redis.call('DEL', KEYS[1]) end
return 0
`;

const rateLimitScript = `
for i = 1, #KEYS do
  local count = redis.call('INCR', KEYS[i])
  if count == 1 then redis.call('EXPIRE', KEYS[i], ARGV[1]) end
  if count > tonumber(ARGV[i + 1]) then return 0 end
end
return 1
`;

const acquireHashSlotScript = `
for i = 1, #KEYS do
  local acquired = redis.call('SET', KEYS[i], ARGV[1], 'PX', ARGV[2], 'NX')
  if acquired then return i end
end
return 0
`;

const releaseHashSlotScript = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
`;

const emailKeyPrefix = 'auth:v1:email';

/** Implements atomic registration-code and credential-flood controls. */
@Injectable()
export class AuthSecurityService {
  private readonly keySecret: string;

  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {
    this.keySecret = config.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  /** Atomically reserves email/IP quota and a pending code before sending. */
  async reserveEmailCode(email: string, ip: string, code: string) {
    const emailKey = this.hashKey(email);
    const ipKey = this.hashKey(ip);
    const codeHash = this.hashCode(email, code);
    const result = Number(
      await this.redis.client.eval(
        reserveCodeScript,
        4,
        `${emailKeyPrefix}:rate:email:${emailKey}`,
        `${emailKeyPrefix}:rate:ip:${ipKey}`,
        `${emailKeyPrefix}:cooldown:${emailKey}`,
        `${emailKeyPrefix}:pending:${emailKey}`,
        3600,
        this.config.getOrThrow<number>('AUTH_EMAIL_RATE_LIMIT_PER_HOUR'),
        this.config.getOrThrow<number>('AUTH_IP_EMAIL_RATE_LIMIT_PER_HOUR'),
        this.config.getOrThrow<number>('AUTH_EMAIL_CODE_COOLDOWN_SECONDS'),
        codeHash,
        this.config.getOrThrow<number>('AUTH_EMAIL_CODE_TTL_SECONDS'),
      ),
    );

    return result;
  }

  /** Makes a pending code usable only after SMTP delivery completed. */
  async publishEmailCode(email: string, code: string) {
    const emailKey = this.hashKey(email);
    const codeHash = this.hashCode(email, code);
    const result = Number(
      await this.redis.client.eval(
        publishCodeScript,
        2,
        `${emailKeyPrefix}:pending:${emailKey}`,
        `${emailKeyPrefix}:code:${emailKey}`,
        codeHash,
        this.config.getOrThrow<number>('AUTH_EMAIL_CODE_TTL_SECONDS'),
      ),
    );

    if (result !== 1) {
      throw new Error(
        'Pending registration code expired before it was published',
      );
    }
  }

  /** Deletes an undelivered code while preserving the send cooldown. */
  async discardPendingEmailCode(email: string) {
    await this.redis.client.del(
      `${emailKeyPrefix}:pending:${this.hashKey(email)}`,
    );
  }

  /** Checks and atomically consumes a registration code exactly once. */
  async consumeEmailCode(email: string, code: string) {
    const emailKey = this.hashKey(email);
    const result = Number(
      await this.redis.client.eval(
        consumeCodeScript,
        2,
        `${emailKeyPrefix}:code:${emailKey}`,
        `${emailKeyPrefix}:attempts:${emailKey}`,
        this.hashCode(email, code),
        this.config.getOrThrow<number>('AUTH_EMAIL_CODE_TTL_SECONDS'),
        this.config.getOrThrow<number>('AUTH_EMAIL_CODE_MAX_ATTEMPTS'),
      ),
    );

    return result === 1;
  }

  /** Applies account and source IP limits before any password hashing. */
  async checkLoginRateLimit(email: string, ip: string) {
    const allowed = Number(
      await this.redis.client.eval(
        rateLimitScript,
        2,
        `auth:v1:login:account:${this.hashKey(email)}`,
        `auth:v1:login:ip:${this.hashKey(ip)}`,
        900,
        this.config.getOrThrow<number>('AUTH_LOGIN_ACCOUNT_LIMIT'),
        this.config.getOrThrow<number>('AUTH_LOGIN_IP_LIMIT'),
      ),
    );

    return allowed === 1;
  }

  /** Acquires one bounded slot for an expensive Argon2id operation. */
  async acquirePasswordHashSlot() {
    const owner = randomUUID();
    const limit = this.config.getOrThrow<number>('AUTH_LOGIN_HASH_CONCURRENCY');
    const keys = Array.from(
      { length: limit },
      (_, index) => `auth:v1:login:hash-slot:${index}`,
    );
    const slot = Number(
      await this.redis.client.eval(
        acquireHashSlotScript,
        keys.length,
        ...keys,
        owner,
        30_000,
      ),
    );

    if (slot === 0) {
      return null;
    }
    const key = keys[slot - 1];
    if (!key) {
      throw new Error('Redis returned an invalid hash slot');
    }
    return { owner, key };
  }

  /** Releases a hash slot only when this request still owns it. */
  async releasePasswordHashSlot(slot: { owner: string; key: string }) {
    await this.redis.client.eval(
      releaseHashSlotScript,
      1,
      slot.key,
      slot.owner,
    );
  }

  /** Creates a cryptographically random six-digit registration code. */
  generateEmailCode() {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  private hashKey(value: string) {
    return createHmac('sha256', this.keySecret).update(value).digest('hex');
  }

  private hashCode(email: string, code: string) {
    return createHmac('sha256', this.keySecret)
      .update(`${email}:${code}`)
      .digest('hex');
  }
}
