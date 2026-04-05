import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.enableCors();
  app.use('/favicon.ico', (_req: Request, res: Response) => {
    res.status(204).end();
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Finance Dashboard API')
    .setDescription('Backend API for role-based finance data processing and dashboard analytics.')
    .setVersion('1.0')
    .addServer('http://localhost:3000')
    .addBearerAuth()
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  const scalarModule = await import('@scalar/nestjs-api-reference');
  const createApiReference =
    'ApiReference' in scalarModule
      ? (
          scalarModule as unknown as {
            ApiReference: typeof scalarModule.apiReference;
          }
        ).ApiReference
      : scalarModule.apiReference;

  app.use(
    '/api/reference',
    createApiReference({
      url: '/api/docs-json',
      theme: 'purple',
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
