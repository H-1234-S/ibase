import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CurrentUser } from '../decorators/current-user.decorator.js';
import { AuthOriginGuard } from '../guards/auth-origin.guard.js';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { AuthService } from '../services/auth.service.js';
import { LoginDto, RegisterDto, SendEmailCodeDto } from '../dto/auth.dto.js';
import { AuthError } from '../errors/auth-error.js';
import type { PublicUser } from '@ibase/shared-types';

/** Exposes registration, login, session refresh, logout and current user. */
@Controller('auth')
@UseGuards(AuthOriginGuard)
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('email/send-code')
  @HttpCode(HttpStatus.OK)
  async sendCode(@Body() input: SendEmailCodeDto, @Req() request: Request) {
    return {
      data: await this.auth.sendEmailCode(input.email, request.ip ?? 'unknown'),
    };
  }

  @Post('register')
  async register(
    @Body() input: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.register(input);
    this.setTokenCookies(response, result.tokens);
    return { data: { user: result.user } };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() input: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.login(
      input.email,
      input.password,
      request.ip ?? 'unknown',
    );
    this.setTokenCookies(response, result.tokens);
    return { data: { user: result.user } };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@CurrentUser() user: PublicUser) {
    return { data: { user } };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = request.cookies?.[this.auth.cookieNames.refresh] as
      string | undefined;
    if (!token) {
      this.clearTokenCookies(response);
      throw new AuthError('UNAUTHENTICATED', 'Refresh session is missing', 401);
    }

    try {
      const result = await this.auth.refresh(token);
      this.setTokenCookies(response, result.tokens);
      return { data: { user: result.user } };
    } catch (error) {
      if (error instanceof AuthError && error.getStatus() === 401) {
        this.clearTokenCookies(response);
      }

      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = request.cookies?.[this.auth.cookieNames.refresh] as
      string | undefined;
    await this.auth.logout(token);
    this.clearTokenCookies(response);
  }

  private setTokenCookies(
    response: Response,
    tokens: {
      accessToken: string;
      refreshToken: string;
      refreshExpiresAt: Date;
    },
  ) {
    const settings = this.auth.cookieSettings;
    const common = {
      httpOnly: true,
      secure: settings.secure,
      sameSite: settings.sameSite,
      ...(settings.domain ? { domain: settings.domain } : {}),
    } as const;

    response.cookie(this.auth.cookieNames.access, tokens.accessToken, {
      ...common,
      path: '/',
      maxAge: settings.accessTtl * 1000,
    });
    response.cookie(this.auth.cookieNames.refresh, tokens.refreshToken, {
      ...common,
      path: '/',
      maxAge: Math.max(0, tokens.refreshExpiresAt.getTime() - Date.now()),
    });
    response.clearCookie(this.auth.cookieNames.access, {
      ...common,
      path: '/api',
    });
    response.clearCookie(this.auth.cookieNames.refresh, {
      ...common,
      path: '/api/auth',
    });
  }

  private clearTokenCookies(response: Response) {
    const settings = this.auth.cookieSettings;
    const common = {
      httpOnly: true,
      secure: settings.secure,
      sameSite: settings.sameSite,
      ...(settings.domain ? { domain: settings.domain } : {}),
    } as const;

    response.clearCookie(this.auth.cookieNames.access, {
      ...common,
      path: '/',
    });
    response.clearCookie(this.auth.cookieNames.refresh, {
      ...common,
      path: '/',
    });
    response.clearCookie(this.auth.cookieNames.access, {
      ...common,
      path: '/api',
    });
    response.clearCookie(this.auth.cookieNames.refresh, {
      ...common,
      path: '/api/auth',
    });
  }
}
