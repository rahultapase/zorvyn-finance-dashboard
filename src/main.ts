import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
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

const OPEN_API_SERVERS = [
  {
    url: 'http://localhost:3000',
    description: 'Local server',
  },
  {
    url: 'https://zorvyn-finance-dashboard-hxmu.onrender.com',
    description: 'Production server',
  },
] as const;

function getRequestOrigin(req: Request): string | null {
  const forwardedProtoHeader = req.headers['x-forwarded-proto'];
  const forwardedHostHeader = req.headers['x-forwarded-host'];
  const forwardedProto = Array.isArray(forwardedProtoHeader)
    ? forwardedProtoHeader[0]
    : forwardedProtoHeader?.split(',')[0]?.trim();
  const forwardedHost = Array.isArray(forwardedHostHeader)
    ? forwardedHostHeader[0]
    : forwardedHostHeader?.split(',')[0]?.trim();

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const host = req.get('host');

  if (!host) {
    return null;
  }

  return `${req.protocol}://${host}`;
}

function orderServersForRequest(req: Request) {
  const requestOrigin = getRequestOrigin(req);

  if (!requestOrigin) {
    return [...OPEN_API_SERVERS];
  }

  const prioritizedServers = OPEN_API_SERVERS.filter(
    ({ url }) => url === requestOrigin,
  );
  const remainingServers = OPEN_API_SERVERS.filter(
    ({ url }) => url !== requestOrigin,
  );

  return [...prioritizedServers, ...remainingServers];
}

function patchOpenApiDocument(
  req: Request,
  swaggerDocument: OpenAPIObject,
): OpenAPIObject {
  return {
    ...swaggerDocument,
    servers: orderServersForRequest(req),
  };
}

const patchDocumentOnRequest = <TRequest = unknown, TResponse = unknown>(
  req: TRequest,
  _res: TResponse,
  document: OpenAPIObject,
): OpenAPIObject => patchOpenApiDocument(req as Request, document);

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
    .addBearerAuth()
    .build();

  swaggerConfig.servers = [...OPEN_API_SERVERS];

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
    patchDocumentOnRequest,
    swaggerOptions: {
      persistAuthorization: true,
      patchDocumentOnRequest,
    },
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
