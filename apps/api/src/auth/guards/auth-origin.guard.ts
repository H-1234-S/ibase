import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { AuthError } from '../errors/auth-error.js';

/** Rejects auth mutations without the configured origin and CSRF marker. */
@Injectable()
export class AuthOriginGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return true;
    }

    if (
      request.header('origin') !==
        this.config.getOrThrow<string>('WEB_ORIGIN') ||
      request.header('x-ibase-request') !== '1'
    ) {
      throw new AuthError('FORBIDDEN', 'Request origin is not allowed', 403);
    }

    return true;
  }
}
