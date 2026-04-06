import {
  INestApplication,
  ValidationPipe,
  type ValidationPipeOptions,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { LoginDto } from './../src/auth/dto/login.dto';
import { PaginatedResponseDto } from './../src/common/dto/paginated-response.dto';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { TransformInterceptor } from './../src/common/interceptors/transform.interceptor';
import { FilterDashboardByTypeDto } from './../src/dashboard/dto/filter-dashboard-by-type.dto';
import { CreateRecordDto } from './../src/records/dto/create-record.dto';
import { FilterRecordDto } from './../src/records/dto/filter-record.dto';
import { UpdateRecordDto } from './../src/records/dto/update-record.dto';
import { CreateUserDto } from './../src/users/dto/create-user.dto';
import { UpdateUserDto } from './../src/users/dto/update-user.dto';

describe('Phase 8 API checks (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');

    const validationOptions: ValidationPipeOptions = {
      whitelist: true,
      forbidNonWhitelisted: true,
    };
    app.useGlobalPipes(new ValidationPipe(validationOptions));
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    await app.init();
  });

  it('GET /api/v1/health returns wrapped health payload', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    expect(response.body).toMatchObject({
      data: {
        status: 'ok',
      },
      statusCode: 200,
    });
    expect(typeof response.body.data.timestamp).toBe('string');
  });

  it('POST /api/v1/auth/login returns access token and user shape', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@finance.com',
        password: 'Admin123!',
      })
      .expect(200);

    expect(typeof response.body.data.accessToken).toBe('string');
    expect(response.body.data.user).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      email: 'admin@finance.com',
      role: 'admin',
    });
    expect(response.body.data.user).not.toHaveProperty('password');
  });

  it('GET /api/v1/auth/me returns 401 with no token', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .expect(401);

    expect(response.body.statusCode).toBe(401);
    expect(String(response.body.error).toLowerCase()).toContain('unauthorized');
  });

  it('Generated OpenAPI document contains Phase 8 Swagger metadata', () => {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Finance Dashboard API')
      .setVersion('1.0')
      .addTag('Health', 'API health check')
      .addTag('Auth', 'Authentication and session management')
      .addTag('Users', 'User management - Admin only')
      .addTag('Records', 'Financial records CRUD with filtering and search')
      .addTag('Dashboard', 'Aggregated analytics and summary data')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig, {
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

    const tags = document.tags as Array<{ name: string }>;
    const tagNames = tags.map((tag) => tag.name);
    expect(tagNames).toEqual([
      'Health',
      'Auth',
      'Users',
      'Records',
      'Dashboard',
    ]);

    const recordsGetParams = document.paths['/api/v1/records'].get
      .parameters as Array<{ name: string }>;
    const recordsParamNames = recordsGetParams.map((param) => param.name);

    expect(recordsParamNames).toEqual([
      'type',
      'category',
      'startDate',
      'endDate',
      'search',
      'sortBy',
      'order',
      'page',
      'limit',
    ]);
  });

  afterAll(async () => {
    await app.close();
  });
});
