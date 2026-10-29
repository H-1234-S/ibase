import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AuthError } from '../errors/auth-error.js';
import { AuthService } from '../services/auth.service.js';

/** Verifies the Access Cookie and attaches the current public user to Request. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<
        Request & { user?: Awaited<ReturnType<AuthService['getCurrentUser']>> }
      >();
    const token = request.cookies?.[this.auth.cookieNames.access] as
      string | undefined;

    if (!token) {
      throw new AuthError('UNAUTHENTICATED', 'Authentication is required', 401);
    }

    const claims = await this.auth.verifyAccessToken(token);
    request.user = await this.auth.getCurrentUser(claims.sub);
    return true;
  }
}
