# Zorvyn Finance Dashboard API

## Project Overview

Zorvyn is a backend API for role-based finance data processing. It provides JWT authentication, admin user management, financial record CRUD with soft-delete behavior, and dashboard analytics for summary, trends, and recent activity. Access is controlled through three roles (Viewer, Analyst, Admin), and the API is documented with both Swagger UI and Scalar UI.

## Live Deployment

- Base URL: https://zorvyn-finance-dashboard-hxmu.onrender.com
- Swagger UI: https://zorvyn-finance-dashboard-hxmu.onrender.com/api/docs
- Scalar API Reference: https://zorvyn-finance-dashboard-hxmu.onrender.com/api/reference

## Tech Stack

| Layer                        | Choice                                             | Why chosen                                                                                    |
| ---------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Runtime                      | Node.js 18+                                        | Stable LTS runtime with strong ecosystem support for NestJS and Prisma.                       |
| Framework                    | NestJS (TypeScript, strict mode)                   | Modular architecture, built-in dependency injection, and clear controller/service separation. |
| Database                     | PostgreSQL                                         | Reliable relational database with strong support for transactional finance workloads.         |
| ORM                          | Prisma                                             | Type-safe queries, clean schema migrations, and predictable data access patterns.             |
| Authentication               | JWT + Passport (`@nestjs/jwt`, `@nestjs/passport`) | Stateless auth that integrates cleanly with guards and role checks.                           |
| Validation                   | `class-validator` + `class-transformer`            | Declarative DTO validation and request transformation at API boundaries.                      |
| Rate Limiting                | `@nestjs/throttler`                                | Built-in request throttling to protect endpoints like login.                                  |
| API Docs                     | `@nestjs/swagger` + `@scalar/nestjs-api-reference` | Swagger for standard OpenAPI docs and Scalar for a modern interactive API reference.          |
| Password Hashing             | `bcrypt`                                           | Industry-standard password hashing with configurable salt rounds.                             |
| Configuration                | `@nestjs/config` + dotenv                          | Centralized environment-based configuration management.                                       |
| Local Database Orchestration | Docker Compose                                     | Consistent local PostgreSQL setup for development and review.                                 |

## Prerequisites

- Node.js 18+
- Docker Desktop
- npm

## Local Setup Instructions

Run these commands from a fresh terminal:

```bash
git clone https://github.com/rahultapase/zorvyn-finance-dashboard.git
cd zorvyn-finance-dashboard
cp .env.example .env
docker-compose up -d
npm install
npx prisma migrate dev
npm run seed
npm run start:dev
```

The API starts at:

- Swagger: http://localhost:3000/api/docs
- Scalar: http://localhost:3000/api/reference

## Environment Variables

```
PORT=3000
JWT_SECRET=your_secret_here
DATABASE_URL=postgresql://finance:finance@localhost:5432/finance_db
NODE_ENV=development
```

## API Documentation Links

- Swagger UI: http://localhost:3000/api/docs
- Scalar UI: http://localhost:3000/api/reference  (modern interactive)

## API Overview

All business/API routes are prefixed with `/api/v1`.

### Health

| Method | Path             | Summary                 |
| ------ | ---------------- | ----------------------- |
| GET    | `/api/v1/health` | Check API health status |

### Auth

| Method | Path                 | Summary                                            |
| ------ | -------------------- | -------------------------------------------------- |
| POST   | `/api/v1/auth/login` | Authenticate user and return JWT token             |
| GET    | `/api/v1/auth/me`    | Get current authenticated user profile (All roles) |

### Users

| Method | Path                | Summary                                     |
| ------ | ------------------- | ------------------------------------------- |
| POST   | `/api/v1/users`     | Create a new user (Admin only)              |
| GET    | `/api/v1/users`     | List all users with pagination (Admin only) |
| GET    | `/api/v1/users/:id` | Get a single user by ID (Admin only)        |
| PATCH  | `/api/v1/users/:id` | Update a user by ID (Admin only)            |
| DELETE | `/api/v1/users/:id` | Deactivate a user (Admin only)              |

### Records

| Method | Path                  | Summary                                                             |
| ------ | --------------------- | ------------------------------------------------------------------- |
| POST   | `/api/v1/records`     | Create a new financial record (Admin only)                          |
| GET    | `/api/v1/records`     | List financial records with filters and pagination (Analyst, Admin) |
| GET    | `/api/v1/records/:id` | Get a single financial record by ID (Analyst, Admin)                |
| PATCH  | `/api/v1/records/:id` | Update a financial record (Admin only)                              |
| DELETE | `/api/v1/records/:id` | Soft-delete a financial record (Admin only)                         |

### Dashboard

| Method | Path                            | Summary                                                                      |
| ------ | ------------------------------- | ---------------------------------------------------------------------------- |
| GET    | `/api/v1/dashboard/summary`     | Get total income, expenses, and net balance (All roles)                      |
| GET    | `/api/v1/dashboard/recent`      | Get 10 most recent financial records (All roles)                             |
| GET    | `/api/v1/dashboard/weekly`      | Get income, expenses, and net balance for last 7 days (All roles)            |
| GET    | `/api/v1/dashboard/by-category` | Get totals grouped by category and type (Analyst, Admin)                     |
| GET    | `/api/v1/dashboard/trends`      | Get monthly income and expense trends for the last 6 months (Analyst, Admin) |


## Role Permission Table

| Feature / Action | Viewer | Analyst | Admin |
| --- | --- | --- | --- |
| Login | Yes | Yes | Yes |
| View own profile | Yes | Yes | Yes |
| Create user | No | No | Yes |
| List users | No | No | Yes |
| Get single user | No | No | Yes |
| Update user | No | No | Yes* |
| Deactivate user | No | No | Yes* |
| Create record | No | No | Yes |
| List records | No | Yes | Yes |
| Get record | No | Yes | Yes |
| Update record | No | No | Yes |
| Soft-delete record | No | No | Yes |
| Dashboard summary | Yes | Yes | Yes |
| Dashboard recent | Yes | Yes | Yes |
| Dashboard weekly | Yes | Yes | Yes |
| Dashboard by-category | No | Yes | Yes |
| Dashboard trends | No | Yes | Yes |

`*` Admin users cannot modify or deactivate their own account.

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

Unit and integration test commands:

```bash
npm test
npm run test:cov
npm run test:e2e
```

Notes:
- `npm run test:e2e` requires a running PostgreSQL instance.
- If your `.env` points to production/remote DB, override `DATABASE_URL` to local before running seed/e2e.

```powershell
$env:DATABASE_URL='postgresql://finance:finance@localhost:5432/finance_db'
npm run seed
npm run test:e2e
```

## Tradeoffs

- JWT access tokens are implemented without refresh tokens to keep auth flow simpler for this phase.
- Soft delete preserves audit history but requires explicit filtering in all read and aggregate queries.
- Docker Compose is used for local PostgreSQL consistency, while production is expected to use a managed Postgres service.
- API docs routes (`/api/docs`, `/api/reference`) are not under `/api/v1`, which keeps OpenAPI tooling conventions straightforward.