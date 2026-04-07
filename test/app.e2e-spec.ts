import {
  INestApplication,
  ValidationPipe,
  type ValidationPipeOptions,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { TransformInterceptor } from './../src/common/interceptors/transform.interceptor';

interface ApiSuccessBody {
  statusCode?: unknown;
  data?: unknown;
  error?: unknown;
}

interface DashboardSummaryBody {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const parseSuccessBody = (response: request.Response): ApiSuccessBody => {
  const body: unknown = response.body;

  if (!isRecord(body)) {
    throw new Error('Expected response body to be an object');
  }

  return body;
};

const readStatusCode = (response: request.Response): number => {
  const statusCode = parseSuccessBody(response).statusCode;

  if (typeof statusCode !== 'number') {
    throw new Error('Expected statusCode to be a number');
  }

  return statusCode;
};

const readDataObject = (
  response: request.Response,
): Record<string, unknown> => {
  const data = parseSuccessBody(response).data;

  if (!isRecord(data)) {
    throw new Error('Expected response data to be an object');
  }

  return data;
};

const readErrorMessage = (response: request.Response): string => {
  const body = parseSuccessBody(response);
  const error = body.error;

  if (typeof error !== 'string') {
    throw new Error('Expected error to be a string');
  }

  return error;
};

const readAccessToken = (response: request.Response): string => {
  const data = readDataObject(response);
  const accessToken = data.accessToken;

  if (typeof accessToken !== 'string') {
    throw new Error('Expected accessToken to be a string');
  }

  return accessToken;
};

const readDashboardSummary = (
  response: request.Response,
): DashboardSummaryBody => {
  const data = readDataObject(response);
  const totalIncome = data.totalIncome;
  const totalExpenses = data.totalExpenses;
  const netBalance = data.netBalance;

  if (
    typeof totalIncome !== 'number' ||
    typeof totalExpenses !== 'number' ||
    typeof netBalance !== 'number'
  ) {
    throw new Error('Expected dashboard summary values to be numbers');
  }

  return {
    totalIncome,
    totalExpenses,
    netBalance,
  };
};

const readLoginUser = (response: request.Response): Record<string, unknown> => {
  const data = readDataObject(response);
  const user = data.user;

  if (!isRecord(user)) {
    throw new Error('Expected user to be an object');
  }

  return user;
};

describe('Phase 12 API checks (e2e)', () => {
  let app: INestApplication<App>;
  let viewerAccessToken: string | null = null;

  const getViewerAccessToken = async (): Promise<string> => {
    if (viewerAccessToken) {
      return viewerAccessToken;
    }

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'viewer@finance.com',
        password: 'Viewer123!',
      })
      .expect(200);

    viewerAccessToken = readAccessToken(loginResponse);
    return viewerAccessToken;
  };

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

    const healthData = readDataObject(response);
    expect(typeof healthData.timestamp).toBe('string');
  });

  it('POST /api/v1/auth/login returns access token and user shape', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@finance.com',
        password: 'Admin123!',
      })
      .expect(200);

    expect(readStatusCode(response)).toBe(200);

    const accessToken = readAccessToken(response);
    expect(typeof accessToken).toBe('string');

    const user = readLoginUser(response);
    expect(typeof user.id).toBe('string');
    expect(typeof user.name).toBe('string');
    expect(user.email).toBe('admin@finance.com');
    expect(user.role).toBe('admin');
    expect(user).not.toHaveProperty('password');
  });

  it('POST /api/v1/auth/login returns 401 for bad password', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@finance.com',
        password: 'WrongPassword123!',
      })
      .expect(401);

    expect(readStatusCode(response)).toBe(401);
    expect(readErrorMessage(response).toLowerCase()).toContain('unauthorized');
  });

  it('GET /api/v1/auth/me returns 401 with no token', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .expect(401);

    expect(readStatusCode(response)).toBe(401);
    expect(readErrorMessage(response).toLowerCase()).toContain('unauthorized');
  });

  it('GET /api/v1/dashboard/summary returns 200 for viewer token', async () => {
    const token = await getViewerAccessToken();

    const response = await request(app.getHttpServer())
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(readStatusCode(response)).toBe(200);

    const summary = readDashboardSummary(response);
    expect(Number.isFinite(summary.totalIncome)).toBe(true);
    expect(Number.isFinite(summary.totalExpenses)).toBe(true);
    expect(Number.isFinite(summary.netBalance)).toBe(true);
  });

  it('GET /api/v1/dashboard/by-category returns 403 for viewer token', async () => {
    const token = await getViewerAccessToken();

    const response = await request(app.getHttpServer())
      .get('/api/v1/dashboard/by-category')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(readStatusCode(response)).toBe(403);
    expect(readErrorMessage(response).toLowerCase()).toContain('forbidden');
  });

  afterAll(async () => {
    await app.close();
  });
});
