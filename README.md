# AlertFlow — Alerts & Workflow System

A production-ready, multi-tenant alert management system with full workflow support.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                     │
│  React + TypeScript + Tailwind + Redux Toolkit              │
│  Port: 5173 (dev) / 80 (prod)                               │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP (X-Org-Id, X-User-Id headers)
┌────────────────────────▼────────────────────────────────────┐
│                     Backend (NestJS)                        │
│  Node.js + NestJS + TypeScript + Prisma ORM                 │
│  Port: 3000                                                 │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │   Orgs   │  │  Users   │  │  Alerts  │  │  Health   │  │
│  │ /orgs    │  │ /users   │  │ /alerts  │  │ /health   │  │
│  └──────────┘  └──────────┘  └────┬─────┘  └───────────┘  │
│                                   │                         │
│              ┌────────────────────▼──────────────────────┐  │
│              │           TenantGuard                      │  │
│              │  Validates X-Org-Id + X-User-Id headers   │  │
│              │  Ensures user belongs to claimed org       │  │
│              │  Attaches orgId/userId to request          │  │
│              └───────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ Prisma ORM
┌────────────────────────▼────────────────────────────────────┐
│                  PostgreSQL Database                        │
│  organizations → users → alerts → alert_events             │
│  Indexes: (org_id), (org_id, status), (alert_id)           │
└─────────────────────────────────────────────────────────────┘
```

## Tenant Isolation Strategy

**How data is isolated between organizations:**

1. Every protected endpoint uses `TenantGuard`
2. The guard reads `X-Org-Id` and `X-User-Id` from request headers
3. It verifies: `SELECT * FROM users WHERE id = $userId AND org_id = $orgId`
4. If verification fails → `401 Unauthorized`
5. The validated `orgId` is attached to the request object
6. All service methods receive `orgId` from the guard — **never from user-supplied body/query**
7. Every database query includes `WHERE org_id = $orgId`

This means: even if a user sends a different `X-Org-Id`, they cannot access data unless they have a user record in that org.

## Workflow State Machine

```
  ┌─────┐    Acknowledge    ┌──────────────┐    Resolve    ┌──────────┐
  │ NEW │ ──────────────▶  │ ACKNOWLEDGED │ ─────────────▶ │ RESOLVED │
  └─────┘                  └──────────────┘                └──────────┘
     │                                                           │
     │           AlertEvent created on every transition         │
     └───────────────────────────────────────────────────────────┘
```

Every status change:

- Validates the transition is allowed
- Updates `alerts.status` atomically
- Creates an `AlertEvent` row with `from_status`, `to_status`, `user_id`, optional `note`

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 14+ (or Docker)

### Option A: Docker Compose (recommended)

Docker uses `backend/.env` directly. Ensure it has `PG_PASSWORD`, `JWT_SECRET`, and other required vars (see `backend/.env.example` for reference).

```bash
# Run (loads backend/.env for compose variables and backend container)
# Database: one migration runs automatically on first start
docker compose --env-file backend/.env up -d
```

On Windows, if `--env-file` does not load (e.g. path with spaces), use the wrapper:
```powershell
.\docker-env.ps1 up -d
```

App runs at:

- Frontend: http://localhost
- Backend API: http://localhost:3000 (direct) or http://localhost/api (via nginx)
- API Docs: http://localhost/api/docs

### Option B: Local Development

**1. Database**

```bash
# Start PostgreSQL
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password -e POSTGRES_DB=alerts_db postgres:16-alpine
```

**2. Backend**

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate deploy   # One migration - creates all tables
npm run start:dev
```

**3. Frontend**

```bash
cd frontend
npm install
npm run dev
```

## API Reference

### Tenant Headers (required for all protected endpoints)

```
X-Org-Id: <organization-uuid>
X-User-Id: <user-uuid>
```

### Endpoints

| Method | Path               | Auth | Description                     |
| ------ | ------------------ | ---- | ------------------------------- |
| GET    | /health            | —    | Health check                    |
| POST   | /orgs              | —    | Create organization             |
| GET    | /orgs              | —    | List organizations              |
| POST   | /users             | —    | Create user in an org           |
| GET    | /users             | ✓    | List users in current org       |
| POST   | /alerts            | ✓    | Create alert                    |
| GET    | /alerts            | ✓    | List alerts (filter + paginate) |
| GET    | /alerts/:id        | ✓    | Get single alert                |
| PATCH  | /alerts/:id/status | ✓    | Advance workflow status         |
| GET    | /alerts/:id/events | ✓    | Get audit trail                 |

### Example: Full Workflow

```bash
# 1. Create org
curl -X POST http://localhost:3000/orgs \
  -H "Content-Type: application/json" \
  -d '{"name": "Acme Corp"}'
# → {"id": "org-uuid", "name": "Acme Corp", ...}

# 2. Create user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "email": "alice@acme.com", "orgId": "org-uuid"}'
# → {"id": "user-uuid", ...}

# 3. Create alert (tenant-scoped)
curl -X POST http://localhost:3000/alerts \
  -H "Content-Type: application/json" \
  -H "X-Org-Id: org-uuid" \
  -H "X-User-Id: user-uuid" \
  -d '{"title": "DB CPU spike", "description": "Optional context"}'

# 4. List alerts
curl http://localhost:3000/alerts?status=NEW&limit=10&offset=0 \
  -H "X-Org-Id: org-uuid" \
  -H "X-User-Id: user-uuid"

# 5. Acknowledge
curl -X PATCH http://localhost:3000/alerts/alert-uuid/status \
  -H "Content-Type: application/json" \
  -H "X-Org-Id: org-uuid" \
  -H "X-User-Id: user-uuid" \
  -d '{"status": "ACKNOWLEDGED", "note": "Investigating now"}'

# 6. Resolve
curl -X PATCH http://localhost:3000/alerts/alert-uuid/status \
  -H "Content-Type: application/json" \
  -H "X-Org-Id: org-uuid" \
  -H "X-User-Id: user-uuid" \
  -d '{"status": "RESOLVED", "note": "Fixed — increased DB instance size"}'

# 7. View audit trail
curl http://localhost:3000/alerts/alert-uuid/events \
  -H "X-Org-Id: org-uuid" \
  -H "X-User-Id: user-uuid"
```

## Project Structure

```
alerts-app/
├── docker-compose.yml
│
├── backend/                          # NestJS API
│   ├── src/
│   │   ├── main.ts                   # Bootstrap, Swagger, global middleware
│   │   ├── app.module.ts             # Root module
│   │   ├── prisma/
│   │   │   ├── prisma.service.ts     # PrismaClient singleton
│   │   │   └── prisma.module.ts      # Global Prisma module
│   │   ├── common/
│   │   │   ├── guards/
│   │   │   │   └── tenant.guard.ts   # 🔑 Core tenant isolation logic
│   │   │   ├── decorators/
│   │   │   │   └── tenant.decorator.ts # @OrgId() @UserId() param decorators
│   │   │   ├── filters/
│   │   │   │   └── http-exception.filter.ts # Global error handler
│   │   │   ├── interceptors/
│   │   │   │   └── logging.interceptor.ts   # Request logging
│   │   │   └── dto/
│   │   │       └── pagination.dto.ts
│   │   ├── health/
│   │   ├── orgs/
│   │   │   ├── orgs.controller.ts
│   │   │   ├── orgs.service.ts
│   │   │   ├── orgs.module.ts
│   │   │   └── dto/create-org.dto.ts
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.module.ts
│   │   │   └── dto/create-user.dto.ts
│   │   └── alerts/
│   │       ├── alerts.controller.ts
│   │       ├── alerts.service.ts    # Workflow transitions, tenant scoping
│   │       ├── alerts.module.ts
│   │       └── dto/alert.dto.ts
│   ├── prisma/
│   │   ├── schema.prisma            # DB schema with indexes
│   │   └── migrations/              # SQL migrations
│   ├── Dockerfile
│   └── package.json
│
└── frontend/                         # React SPA
    ├── src/
    │   ├── main.tsx
    │   ├── App.tsx
    │   ├── types/index.ts            # Shared TypeScript types
    │   ├── api/
    │   │   ├── client.ts             # Axios + header injection
    │   │   └── index.ts              # API functions
    │   ├── store/
    │   │   ├── index.ts              # Redux store
    │   │   ├── hooks.ts              # Typed hooks
    │   │   └── slices/
    │   │       ├── authSlice.ts      # Org/user session
    │   │       └── alertsSlice.ts    # Alerts state + async thunks
    │   ├── pages/
    │   │   ├── SetupPage.tsx         # Org + user creation flow
    │   │   └── DashboardPage.tsx     # Main alerts dashboard
    │   ├── components/
    │   │   ├── AlertCard.tsx
    │   │   ├── AlertDetailModal.tsx  # Events timeline
    │   │   └── CreateAlertForm.tsx
    │   └── utils/index.ts
    ├── Dockerfile
    └── package.json
```

## Database Schema

```sql
organizations (id, name, created_at, updated_at)
users         (id, email, name, org_id → organizations, ...)
              INDEX: (org_id)
alerts        (id, title, description, status, org_id, created_by_id, ...)
              INDEX: (org_id)          -- for list queries
              INDEX: (org_id, status)  -- for filtered list queries
              INDEX: (org_id, created_at DESC) -- for ordered list
alert_events  (id, alert_id, user_id, from_status, to_status, note, created_at)
              INDEX: (alert_id)         -- for event lookup
              INDEX: (alert_id, created_at ASC) -- for timeline ordering
```

## Config (env vars)

| Variable       | Default                 | Description                  |
| -------------- | ----------------------- | ---------------------------- |
| `PORT`         | `3000`                  | API server port              |
| `DATABASE_URL` | —                       | PostgreSQL connection string |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed frontend origins     |
| `NODE_ENV`     | `development`           | Environment                  |
| `LOG_LEVEL`    | `debug`                 | Log verbosity                |

src/alerts/alerts.service.spec.ts

create: Creates alert and initial event, emits gateway event
findAll: Pagination, org filter, status filter, search, admin (no org)
findOne: Returns alert, throws NotFoundException when missing
updateStatus: NEW → ACKNOWLEDGED, invalid transition, version conflict, not found
getEvents: Returns events, throws when alert not found

src/alerts/alerts.controller.spec.ts

create: Normal user with org, admin with dto.orgId, validation errors
findAll: Org-scoped list, admin, validation
findOne: Returns alert by id
updateStatus: Delegates to service
getEvents: Delegates to service

Run tests
cd backend
npm test # run once
npm run test:watch # watch mode
npm run test:cov # with coverage
