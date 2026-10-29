import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { setupSwagger } from './config/swagger.js';
import cookieParser from 'cookie-parser';
import { AuthExceptionFilter } from './auth/filters/auth-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableShutdownHooks();
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.enableCors({
    origin: app.get(ConfigService).getOrThrow<string>('WEB_ORIGIN'),
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Ibase-Request'],
  });
  app.useGlobalFilters(new AuthExceptionFilter());
  setupSwagger(app);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = app.get(ConfigService).getOrThrow<number>('API_PORT');
  await app.listen(port);
}

await bootstrap();
