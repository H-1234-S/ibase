import { HttpException } from '@nestjs/common';

/** An expected API error with a stable machine-readable authentication code. */
export class AuthError extends HttpException {
  constructor(
    readonly code: string,
    message: string,
    status: number,
    readonly retryAfter?: number,
  ) {
    super({ code, message }, status);
  }
}
