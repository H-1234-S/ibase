import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service.js';

/** Provides the required Redis connection to authentication features. */
@Global()
@Module({ providers: [RedisService], exports: [RedisService] })
export class RedisModule {}
