import { NestFactory } from '@nestjs/core';
import { API_PORT } from '@ibase/constants';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? API_PORT);
}
await bootstrap();
