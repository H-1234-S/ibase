import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './controllers/auth.controller.js';
import { AuthSecurityService } from './services/auth-security.service.js';
import { AuthService } from './services/auth.service.js';
import { AuthOriginGuard } from './guards/auth-origin.guard.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { EmailService } from './services/email.service.js';
import { AuthTokenService } from './services/auth-token.service.js';
import { DatabaseModule } from '../database/database.module.js';

/** Wires the API's email registration and cookie session authentication. */
@Module({
  imports: [JwtModule.register({}), DatabaseModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthSecurityService,
    EmailService,
    AuthTokenService,
    JwtAuthGuard,
    AuthOriginGuard,
  ],
})
export class AuthModule {}
