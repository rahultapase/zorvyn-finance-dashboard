import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AppModule } from './app.module';
import { LoginDto } from './auth/dto/login.dto';
import { PaginatedResponseDto } from './common/dto/paginated-response.dto';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { FilterDashboardByTypeDto } from './dashboard/dto/filter-dashboard-by-type.dto';
import { CreateRecordDto } from './records/dto/create-record.dto';
import { FilterRecordDto } from './records/dto/filter-record.dto';
import { UpdateRecordDto } from './records/dto/update-record.dto';
import { CreateUserDto } from './users/dto/create-user.dto';
import { UpdateUserDto } from './users/dto/update-user.dto';

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
    .setDescription(
      'Backend API for role-based finance data processing which supports user management, financial records CRUD, access control, and aggregated dashboard analytics.',
    )
    .setVersion('1.0')
    .addTag('Health', 'API health check')
    .addTag('Auth', 'Authentication and session management')
    .addTag('Users', 'User management - Admin only')
    .addTag('Records', 'Financial records CRUD with filtering and search')
    .addTag('Dashboard', 'Aggregated analytics and summary data')
    .addServer('http://localhost:3000', 'Local server')
    .addServer('<your-render-url>', 'Production server')
    .addBearerAuth()
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig, {
    extraModels: [
      LoginDto,
      CreateUserDto,
      UpdateUserDto,
      CreateRecordDto,
      UpdateRecordDto,
      FilterRecordDto,
      FilterDashboardByTypeDto,
      PaginatedResponseDto,
    ],
  });

  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    swaggerOptions: { persistAuthorization: true },
  });

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
      layout: 'modern',
      persistAuth: true,
      authentication: {
        preferredSecurityScheme: 'bearer',
      },
      defaultHttpClient: {
        targetKey: 'js',
        clientKey: 'fetch',
      },
      metaData: {
        title: 'Finance Dashboard API Reference',
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
