import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
} from 'node:crypto';
import { RedisService } from '../redis/redis.service.js';
import { OrganizationError } from './errors/organization-error.js';

/** Owns invitation token protection and request throttling. */
@Injectable()
export class OrganizationInvitationSecurityService {
  private readonly secret: string;

  constructor(
    config: ConfigService,
    private readonly redis: RedisService,
  ) {
    this.secret = config.getOrThrow<string>('INVITATION_TOKEN_SECRET');
  }

  create() {
    const token = randomBytes(32).toString('base64url');
    return {
      token,
      tokenHash: this.hash(token),
      tokenCiphertext: this.encrypt(token),
    };
  }

  hash(value: string) {
    return createHmac('sha256', this.secret).update(value).digest('hex');
  }

  decrypt(value: string) {
    const [ivText, tagText, ciphertextText] = value.split('.');
    const decipher = createDecipheriv(
      'aes-256-gcm',
      createHash('sha256').update(this.secret).digest(),
      Buffer.from(ivText!, 'base64url'),
    );
    decipher.setAuthTag(Buffer.from(tagText!, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertextText!, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  }

  async limit(key: string, max: number, seconds: number) {
    const redisKey = `org:limit:${this.hash(key)}`;
    const count = Number(
      await this.redis.client.eval(
        `local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
return count`,
        1,
        redisKey,
        seconds,
      ),
    );
    if (count > max) {
      throw new OrganizationError(
        'RATE_LIMITED',
        'Too many requests; try again later',
        429,
        seconds,
      );
    }
  }

  private encrypt(token: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv(
      'aes-256-gcm',
      createHash('sha256').update(this.secret).digest(),
      iv,
    );
    const ciphertext = Buffer.concat([
      cipher.update(token, 'utf8'),
      cipher.final(),
    ]);
    return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${ciphertext.toString('base64url')}`;
  }
}
