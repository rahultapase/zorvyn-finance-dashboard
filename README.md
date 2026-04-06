# Zorvyn Finance Dashboard API

## Project Overview

Zorvyn is a backend API for role-based finance data processing. It provides JWT authentication, admin user management, financial record CRUD with soft-delete behavior, and dashboard analytics for summary, trends, and recent activity. Access is controlled through three roles (Viewer, Analyst, Admin), and the API is documented with both Swagger UI and Scalar UI.

## Tech Stack

| Layer | Choice | Why chosen |
| --- | --- | --- |
| Runtime | Node.js 18+ | Stable LTS runtime with strong ecosystem support for NestJS and Prisma. |
| Framework | NestJS (TypeScript, strict mode) | Modular architecture, built-in dependency injection, and clear controller/service separation. |
| Database | PostgreSQL | Reliable relational database with strong support for transactional finance workloads. |
| ORM | Prisma | Type-safe queries, clean schema migrations, and predictable data access patterns. |
| Authentication | JWT + Passport (`@nestjs/jwt`, `@nestjs/passport`) | Stateless auth that integrates cleanly with guards and role checks. |
| Validation | `class-validator` + `class-transformer` | Declarative DTO validation and request transformation at API boundaries. |
| Rate Limiting | `@nestjs/throttler` | Built-in request throttling to protect endpoints like login. |
| API Docs | `@nestjs/swagger` + `@scalar/nestjs-api-reference` | Swagger for standard OpenAPI docs and Scalar for a modern interactive API reference. |
| Password Hashing | `bcrypt` | Industry-standard password hashing with configurable salt rounds. |
| Configuration | `@nestjs/config` + dotenv | Centralized environment-based configuration management. |
| Local Database Orchestration | Docker Compose | Consistent local PostgreSQL setup for development and review. |

## Prerequisites

- Node.js 18+
- Docker Desktop
- npm

## Setup Instructions

Run these commands in order:

```bash
git clone ...
cp .env.example .env
docker-compose up -d
npm install
npx prisma migrate dev
npm run seed
npm run start:dev
```

## Environment Variables

| Key | Required | Example | Description |
| --- | --- | --- | --- |
| `PORT` | Yes | `3000` | Port used by the NestJS server. |
| `JWT_SECRET` | Yes | `your_secret_here` | Secret key used to sign and verify JWT access tokens. |
| `DATABASE_URL` | Yes | `postgresql://finance:finance@localhost:5432/finance_db` | PostgreSQL connection string used by Prisma. |
| `NODE_ENV` | Yes | `development` | Runtime mode (`development`, `production`, etc.). |

## API Documentation Links

- Swagger UI: `/api/docs`
- Scalar UI: `/api/reference` (modern interactive reference)

## API Overview

All business/API routes are prefixed with `/api/v1`.

### Health

| Method | Path | Summary |
| --- | --- | --- |
| GET | `/api/v1/health` | Check API health status |

### Auth

| Method | Path | Summary |
| --- | --- | --- |
| POST | `/api/v1/auth/login` | Authenticate user and return JWT token |
| GET | `/api/v1/auth/me` | Get current authenticated user profile (All roles) |

### Users

| Method | Path | Summary |
| --- | --- | --- |
| POST | `/api/v1/users` | Create a new user (Admin only) |
| GET | `/api/v1/users` | List all users with pagination (Admin only) |
| GET | `/api/v1/users/:id` | Get a single user by ID (Admin only) |
| PATCH | `/api/v1/users/:id` | Update a user by ID (Admin only) |
| DELETE | `/api/v1/users/:id` | Deactivate a user (Admin only) |

### Records

| Method | Path | Summary |
| --- | --- | --- |
| POST | `/api/v1/records` | Create a new financial record (Admin only) |
| GET | `/api/v1/records` | List financial records with filters and pagination (Analyst, Admin) |
| GET | `/api/v1/records/:id` | Get a single financial record by ID (Analyst, Admin) |
| PATCH | `/api/v1/records/:id` | Update a financial record (Admin only) |
| DELETE | `/api/v1/records/:id` | Soft-delete a financial record (Admin only) |

### Dashboard

| Method | Path | Summary |
| --- | --- | --- |
| GET | `/api/v1/dashboard/summary` | Get total income, expenses, and net balance (All roles) |
| GET | `/api/v1/dashboard/recent` | Get 10 most recent financial records (All roles) |
| GET | `/api/v1/dashboard/weekly` | Get income, expenses, and net balance for last 7 days (All roles) |
| GET | `/api/v1/dashboard/by-category` | Get totals grouped by category and type (Analyst, Admin) |
| GET | `/api/v1/dashboard/trends` | Get monthly income and expense trends for the last 6 months (Analyst, Admin) |

## Role Permission Table

| Action | Viewer | Analyst | Admin |
| --- | --- | --- | --- |
| login | Yes | Yes | Yes |
| view own profile | Yes | Yes | Yes |
| create user | No | No | Yes |
| list users | No | No | Yes |
| get user | No | No | Yes |
| update user | No | No | Yes* |
| deactivate user | No | No | Yes* |
| create record | No | No | Yes |
| list records | No | Yes | Yes |
| get record | No | Yes | Yes |
| update record | No | No | Yes |
| delete record | No | No | Yes |
| dashboard summary | Yes | Yes | Yes |
| dashboard recent | Yes | Yes | Yes |
| dashboard weekly | Yes | Yes | Yes |
| dashboard by-category | No | Yes | Yes |
| dashboard trends | No | Yes | Yes |

*Admin cannot modify or deactivate their own account.

## Assumptions Made

- Records are never hard deleted; soft delete uses `isDeleted: true` and excluded records are filtered from reads/aggregations.
- Pagination defaults to 20 items per page when `page` and `limit` are not provided.
- JWT access tokens expire in 24 hours.
- Date query input format is ISO 8601 `YYYY-MM-DD`.
- Record `createdBy` shape exposed by the API is `{ id, name }` only.
- Admin users cannot modify or deactivate their own account.
- Viewer access is limited to dashboard summary, recent, and weekly endpoints.
- All amounts are stored as `Decimal(12,2)` in PostgreSQL via Prisma.

## Testing

- `npm test` - runs unit tests.
- `npm run test:e2e` - runs integration tests (requires running DB).

## Tradeoffs

- JWT access tokens are implemented without refresh tokens to keep auth flow simpler for this phase.
- Soft delete preserves audit history but requires explicit filtering in all read and aggregate queries.
- Docker Compose is used for local PostgreSQL consistency, while production is expected to use a managed Postgres service.
- API docs routes (`/api/docs`, `/api/reference`) are not under `/api/v1`, which keeps OpenAPI tooling conventions straightforward.

## Deployment

Live API: <will be added after Phase 10 deployment>
Swagger: <will be added after Phase 10 deployment>

Render deployment outline (Phase 10):

1. Create a managed PostgreSQL instance.
2. Configure web service build command:
   `npm install && npx prisma generate && npx prisma migrate deploy && npm run seed`
3. Configure start command:
   `node dist/main.js`
4. Set environment variables: `DATABASE_URL`, `JWT_SECRET`, `PORT=3000`, `NODE_ENV=production`.
