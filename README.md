# AlertFlow — Alerts & Workflow System

A production-ready, multi-tenant alert management system with full workflow support.

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

### Option C: Built Frontend + Backend (Separate Processes)

When serving the built frontend with `npm run serve` and backend separately:

1. Create `frontend/.env` with `VITE_API_BASE_URL=http://localhost:3000`
2. Rebuild: `cd frontend && npm run build`
3. Ensure `backend/.env` has `CORS_ORIGINS=http://localhost:5173`
4. Start backend: `cd backend && npm run start`
5. Start frontend: `cd frontend && npm run serve`

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

## API Reference

All API routes use the `/api` prefix (except `/health`).

### Auth

| Method | Path           | Description        |
| ------ | -------------- | ------------------ |
| POST   | /api/auth/login | Login (email, password) |

### Tenant Headers (protected endpoints)

```
Authorization: Bearer <jwt>
X-Org-Id: <organization-uuid>
X-User-Id: <user-uuid>
```

### Endpoints

| Method | Path                 | Auth | Description                     |
| ------ | -------------------- | ---- | ------------------------------- |
| GET    | /health              | —    | Health check                    |
| POST   | /api/orgs            | —    | Create organization             |
| GET    | /api/orgs            | —    | List organizations              |
| POST   | /api/users           | —    | Create user in an org           |
| GET    | /api/users           | ✓    | List users in current org       |
| POST   | /api/alerts          | ✓    | Create alert                    |
| GET    | /api/alerts          | ✓    | List alerts (filter + paginate) |
| GET    | /api/alerts/:id      | ✓    | Get single alert                |
| PATCH  | /api/alerts/:id/status | ✓  | Advance workflow status         |
| GET    | /api/alerts/:id/events | ✓  | Get audit trail                 |

### Example: Full Workflow

```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@alertflow.com", "password": "Demouser123"}'

# 2. Create org
curl -X POST http://localhost:3000/api/orgs \
  -H "Content-Type: application/json" \
  -d '{"name": "Acme Corp"}'

# 3. Create user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "email": "alice@acme.com", "orgId": "org-uuid"}'

# 4. Create alert (with JWT + tenant headers)
curl -X POST http://localhost:3000/api/alerts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -H "X-Org-Id: org-uuid" \
  -H "X-User-Id: user-uuid" \
  -d '{"title": "DB CPU spike", "description": "Optional context"}'

# 5. Acknowledge
curl -X PATCH http://localhost:3000/api/alerts/alert-uuid/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -H "X-Org-Id: org-uuid" \
  -H "X-User-Id: user-uuid" \
  -d '{"status": "ACKNOWLEDGED", "note": "Investigating"}'
```

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

| Variable         | Default                 | Description                  |
| ---------------- | ----------------------- | ---------------------------- |
| `PORT`           | `3000`                  | API server port              |
| `DATABASE_URL`   | —                       | PostgreSQL connection string |
| `PG_USER`        | `postgres`              | DB user (Docker)             |
| `PG_PASSWORD`     | —                       | DB password (required)       |
| `PG_DATABASE`    | `alert_workflow_db`     | DB name                      |
| `JWT_SECRET`     | —                       | JWT signing secret           |
| `CORS_ORIGINS`   | `http://localhost:5173` | Allowed frontend origins     |
| `THROTTLE_TTL`   | `60000`                 | Rate limit window (ms)       |
| `THROTTLE_LIMIT` | `100`                   | Requests per window          |
| `WS_RATE_LIMIT_*`| —                       | WebSocket rate limiting      |
| `VITE_API_BASE_URL` | —                    | Frontend: backend URL when serving separately |

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

On Ubuntu, if `serve` shows a clipboard error (`xsel`), the app still runs. Install `xsel` to fix it: `sudo apt install xsel`. Or use `npm run preview` instead.
