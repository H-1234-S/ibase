import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { randomUUID } from 'node:crypto';
import { AuthError } from '../errors/auth-error.js';

/** Converts auth and validation exceptions to the public error envelope. */
@Catch()
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const requestId = randomUUID();

    if (exception instanceof AuthError) {
      const payload = exception.getResponse() as {
        code: string;
        message: string;
      };
      if (exception.retryAfter) {
        response.setHeader('Retry-After', exception.retryAfter);
      }
      response.status(exception.getStatus()).json({
        error: { ...payload, requestId },
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const details =
        typeof body === 'object' && body !== null
          ? (body as Record<string, unknown>)
          : {};
      const code =
        status === HttpStatus.TOO_MANY_REQUESTS
          ? 'RATE_LIMITED'
          : status === HttpStatus.FORBIDDEN
            ? 'FORBIDDEN'
            : status === HttpStatus.UNAUTHORIZED
              ? 'UNAUTHENTICATED'
              : status === HttpStatus.BAD_REQUEST
                ? 'VALIDATION_ERROR'
                : 'INTERNAL_SERVER_ERROR';

      response.status(status).json({
        error: {
          code,
          message:
            typeof details.message === 'string'
              ? details.message
              : status === HttpStatus.BAD_REQUEST
                ? 'Please check the submitted information'
                : 'Request failed',
          ...(Array.isArray(details.validationErrors)
            ? { validationErrors: details.validationErrors }
            : {}),
          requestId,
        },
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        requestId,
      },
    });
  }
}
