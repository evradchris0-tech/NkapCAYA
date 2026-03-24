import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Versioning API
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Validation globale des DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Préfixe global
  app.setGlobalPrefix('api');

  // Swagger — documentation interactive
  const config = new DocumentBuilder()
    .setTitle('CAYA API')
    .setDescription('API de gestion de la tontine Club des Amis de Yaoundé')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // CORS
  // DEV : toutes origines autorisées — restreindre en production
  app.enableCors({ origin: '*' });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

bootstrap();
