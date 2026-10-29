import { APP_NAME } from '@ibase/constants';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { INestApplication } from '@nestjs/common';

/** Registers the OpenAPI document and Swagger UI under the API global prefix. */
export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle(`${APP_NAME} API`)
    .setDescription(`${APP_NAME} API documentation`)
    .setVersion('1.0')
    .build();

  SwaggerModule.setup(
    'docs',
    app,
    () => SwaggerModule.createDocument(app, config),
    {
      useGlobalPrefix: true,
    },
  );
}
