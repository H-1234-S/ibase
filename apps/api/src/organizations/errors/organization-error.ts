import { HttpException } from '@nestjs/common';

/** An expected organization failure with a stable public error code. */
export class OrganizationError extends HttpException {
  constructor(
    readonly code: string,
    message: string,
    status: number,
    readonly retryAfter?: number,
  ) {
    super({ code, message, ...(retryAfter ? { retryAfter } : {}) }, status);
  }
}
