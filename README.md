# AlertFlow — Alerts & Workflow System

A production-ready, multi-tenant alert management system with full workflow support.

<p align="center">
  <img src="docs/AlertFlow1.png" width="32%" />
  <img src="docs/AlertFlow2.png" width="32%" />
  <img src="docs/AlertFlow3.png" width="32%" />
</p>

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                     │
│  React + TypeScript + Tailwind + Redux Toolkit              │
│  Port: 5173 (dev) / 80 (Docker)                             │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP (Bearer JWT)
                         │ WebSocket (Socket.IO for real-time alerts)
┌────────────────────────▼────────────────────────────────────┐
│                     Backend (NestJS)                         │
│  Node.js + NestJS + TypeScript + Prisma ORM                 │
│  Port: 3000                                                 │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │   Auth   │  │   Orgs   │  │  Users   │  │  Alerts   │  │
│  │ /auth    │  │ /orgs    │  │ /users   │  │ /alerts   │  │
│  └──────────┘  └──────────┘  └──────────┘  └─────┬─────┘  │
│                                                   │         │
│                │
│              │           JwtAuthGuard + OrgRequiredGuard│  │
│              │  Validates JWT, enforces org context     │  │
│              │  Ensures user belongs to claimed org      │  │
│              └───────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ Prisma ORM
┌────────────────────────▼────────────────────────────────────┐
│                  PostgreSQL Database                        │
│  organizations → users → alerts → alert_events             │
│  Indexes: (org_id, status, updated_at), (alert_id) ,(email) │
└─────────────────────────────────────────────────────────────┘
```

## Tenant Isolation Strategy

1. Every protected endpoint uses `JwtAuthGuard` and `OrgRequiredGuard`
2. The JWT contains `sub` (userId), `orgId`, and `role`; guards enforce org context
3. It verifies the user belongs to the claimed org
4. If verification fails → `401 Unauthorized`
5. All service methods receive `orgId` from the guard — never from user-supplied body/query
6. Every database query includes `WHERE org_id = $orgId`

## Workflow State Machine

```
  ┌─────┐    Acknowledge    ┌──────────────┐    Resolve    ┌──────────┐
  │ NEW │ ──────────────▶  │ ACKNOWLEDGED │ ─────────────▶ │ RESOLVED │
  └─────┘                  └──────────────┘                └──────────┘
     │                                                           │
     │           AlertEvent created on every transition          │
     └───────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 14+ (or Docker)

### Option A: Docker Compose

Ensure `backend/.env` has `PG_PASSWORD`, `JWT_SECRET`, and other required vars (see `backend/.env.example`).

```bash
docker compose --env-file backend/.env up -d
```

App runs at:

- Frontend: http://localhost
- Backend API: http://localhost:3000 (direct) or http://localhost/api (via nginx)
- Swagger: http://localhost/api/docs
- Health: http://localhost:3000/health

## New System Setup (Migrations + Admin)

For a fresh install:

**1. Run migrations**

```bash
cd backend
npx prisma migrate deploy
```

**2. Create first admin user**

```bash
# Local
psql -h localhost -U postgres -d alert_workflow_db -f scripts/create-admin.sql

# Docker
docker exec -i alerts_db psql -U postgres -d alert_workflow_db < backend/scripts/create-admin.sql
```

Or run this SQL manually:

```sql
INSERT INTO users (id, org_id, email, password, name, role, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  NULL,
  'admin@alertflow.com',
  'Demouser123',
  'Admin',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;
```

**Admin login:** `admin@alertflow.com` / `Demouser123`

### Option B: Local Development

**1. Database**

```bash
docker run -d -p 5432:5432 \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=alert_workflow_db \
  postgres:16-alpine
```

**2. Backend**

```bash
cd backend
cp .env.example .env
# Edit .env: DATABASE_URL, JWT_SECRET, etc.
npm install
npx prisma migrate deploy
npm run start:dev
```

**3. Frontend**

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173 (Vite proxies `/api` and `/socket.io` to backend)

- Swagger UI: `http://localhost:3000/api/docs`
- Health UI: `http://localhost:3000/health`

### Option C: Built Frontend + Backend (Separate Processes)

When serving the built frontend with `npm run serve` and backend separately:

1. Create `frontend/.env` with `VITE_API_BASE_URL=http://localhost:3000`
2. Rebuild: `cd frontend && npm run build`
3. Ensure `backend/.env` has `CORS_ORIGINS=http://localhost:5173`
4. Start backend: `cd backend && npm run start`
5. Start frontend: `cd frontend && npm run serve`

## API Reference

All API routes use the `/api` prefix (except `/health`).

### Base URLs

- Direct backend: `http://localhost:3000`
- Via Docker/nginx: `http://localhost/api`
- Swagger UI: `http://localhost/api/docs`

### Authentication

Protected endpoints require a bearer token:

```http
Authorization: Bearer <accessToken>
```

The token payload includes:

- `sub` (user id)
- `orgId` (organization id, can be `null` for admin users)
- `email`
- `role` (`admin` or `normal`)

### Authorization model

- `POST /api/orgs` and `POST /api/users`: admin only
- `GET /api/users`: admin gets all users; normal users get users in their own org
- Alerts endpoints are auth-protected and org-scoped for normal users
- Admin can query alerts across orgs; when creating an alert, admin must provide `orgId`

### Endpoint Summary

| Method | Path                   | Auth | Description                                         |
| ------ | ---------------------- | ---- | --------------------------------------------------- |
| GET    | /health                | —    | Health check (includes DB probe)                    |
| POST   | /api/auth/login        | —    | Login and receive access token                      |
| GET    | /api/orgs              | —    | List organizations                                  |
| POST   | /api/orgs              | ✓    | Create organization (admin only)                    |
| POST   | /api/users             | ✓    | Create user in an organization (admin only)         |
| GET    | /api/users             | ✓    | List users (admin: all, normal: current org)        |
| POST   | /api/alerts            | ✓    | Create alert (admin may pass `orgId`)               |
| GET    | /api/alerts            | ✓    | List alerts with pagination/filter/search           |
| GET    | /api/alerts/:id        | ✓    | Get single alert                                    |
| PATCH  | /api/alerts/:id/status | ✓    | Advance workflow status with optimistic concurrency |
| GET    | /api/alerts/:id/events | ✓    | Get alert audit trail (status transitions + notes)  |

### Request/Response Details

#### 1) Login

**POST** `/api/auth/login`

Request:

```json
{
  "email": "admin@alertflow.com",
  "password": "Demouser123"
}
```

Response (example):

```json
{
  "accessToken": "<jwt>",
  "user": {
    "id": "user-uuid",
    "email": "admin@alertflow.com",
    "name": "Admin",
    "role": "admin",
    "organization": null
  },
  "org": null
}
```

#### 2) Create organization (admin)

**POST** `/api/orgs`

Request:

```json
{
  "name": "Acme Corp"
}
```

#### 3) Create user (admin)

**POST** `/api/users`

Request:

```json
{
  "email": "alice@acme.com",
  "name": "Alice",
  "password": "securePassword123",
  "orgId": "org-uuid"
}
```

#### 4) Create alert

**POST** `/api/alerts`

Request (normal user):

```json
{
  "title": "Database CPU spike",
  "description": "CPU usage exceeded 90% threshold"
}
```

Request (admin creating for a specific org):

```json
{
  "title": "Database CPU spike",
  "description": "CPU usage exceeded 90% threshold",
  "orgId": "org-uuid"
}
```

Notes:

- New alerts start at status `NEW`
- Server also creates an initial `alert_event` entry

#### 5) List alerts (pagination/filter/search)

**GET** `/api/alerts?limit=10&offset=0&status=NEW&search=cpu`

Query params:

- `limit` (1-100, default `20`)
- `offset` (>= 0, default `0`)
- `status` (`NEW` | `ACKNOWLEDGED` | `RESOLVED`)
- `search` (matches title/description, case-insensitive)

Response shape:

```json
{
  "data": [],
  "total": 0,
  "limit": 10,
  "offset": 0,
  "hasMore": false,
  "counts": {
    "total": 0,
    "NEW": 0,
    "ACKNOWLEDGED": 0,
    "RESOLVED": 0
  }
}
```

#### 6) Update alert status (workflow + concurrency safe)

**PATCH** `/api/alerts/:id/status`

Request:

```json
{
  "status": "ACKNOWLEDGED",
  "version": 1,
  "note": "Investigating"
}
```

Rules:

- Allowed transitions only: `NEW -> ACKNOWLEDGED -> RESOLVED`
- `version` is required for optimistic locking
- If another user already updated the alert, API returns `409 Conflict`

#### 7) Get alert events

**GET** `/api/alerts/:id/events`

Returns ordered audit history (created event + status transition events with actor and optional note).

### Standard Error Format

Errors are returned in a consistent shape:

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "Unique constraint violation on field: email",
  "timestamp": "2026-03-10T12:00:00.000Z",
  "path": "/api/users",
  "method": "POST"
}
```

Common statuses:

- `400` bad request / invalid transition
- `401` invalid or expired token
- `403` role/organization forbidden
- `404` resource not found
- `409` uniqueness conflict or stale `version` on status update
- `429` throttled (rate limit)

## Project Structure

```
alertflow/
├── backend/                    # NestJS API
│   ├── src/
│   │   ├── main.ts             # Bootstrap, CORS, Swagger, global prefix
│   │   ├── app.module.ts
│   │   ├── auth/                # Login, JWT
│   │   ├── orgs/
│   │   ├── users/
│   │   ├── alerts/              # CRUD + WebSocket gateway
│   │   ├── health/
│   │   └── common/              # Guards, filters, interceptors
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── scripts/
│   │   └── create-admin.sql
│   └── Dockerfile
├── frontend/                    # React SPA
│   ├── src/
│   │   ├── app/                 # Router, AdminRoute
│   │   ├── pages/               # Login, Alerts, Users, Organizations
│   │   ├── components/
│   │   ├── hooks/               # useAuth, useAlertsSocket
│   │   ├── services/            # API client, auth, alerts
│   │   └── store/               # Redux slices
│   ├── nginx.conf               # Docker: proxy /api, /socket.io
│   └── Dockerfile
└── docker-compose.yml
```

## Database Schema

```
organizations (id, name, created_at, updated_at)
users         (id, org_id, email, password, name, role, ...)
              UNIQUE: email
alerts        (id, title, description, status, org_id, created_by_id, ...)
              INDEX: (org_id, status, updated_at DESC)
alert_events  (id, alert_id, user_id, from_status, to_status, note, created_at)
              INDEX: (alert_id)
```

## Config (env vars)

| Variable            | Default                 | Description                                   |
| ------------------- | ----------------------- | --------------------------------------------- |
| `PORT`              | `3000`                  | API server port                               |
| `DATABASE_URL`      | —                       | PostgreSQL connection string                  |
| `PG_USER`           | `postgres`              | DB user (Docker)                              |
| `PG_PASSWORD`       | —                       | DB password (required)                        |
| `PG_DATABASE`       | `alert_workflow_db`     | DB name                                       |
| `JWT_SECRET`        | —                       | JWT signing secret                            |
| `CORS_ORIGINS`      | `http://localhost:5173` | Allowed frontend origins                      |
| `THROTTLE_TTL`      | `60000`                 | Rate limit window (ms)                        |
| `THROTTLE_LIMIT`    | `100`                   | Requests per window                           |
| `WS_RATE_LIMIT_*`   | —                       | WebSocket rate limiting                       |
| `VITE_API_BASE_URL` | —                       | Frontend: backend URL when serving separately |

## Tests

```bash
cd backend
npm test
npm run test:watch
npm run test:cov
```

## Build & Run (Production)

```bash
# Backend
cd backend
npm run build
npm run start

# Frontend (built, served separately)
cd frontend
npm run build
npm run serve
```
