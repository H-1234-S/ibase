import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { PublicUser } from '@ibase/shared-types';

/** Injects the authenticated user's public profile into a controller method. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): PublicUser =>
    context.switchToHttp().getRequest<Request & { user: PublicUser }>().user,
);
