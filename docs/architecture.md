# DJAC SaaS - System Architecture

## Overview

DJAC is a multi-tenant compliance management SaaS platform with an AI-powered assessment pipeline, supporting cross-border compliance workflows across 25+ jurisdictions.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  React 19 SPA (Vite 7 + Tailwind CSS 4 + Radix UI)             │
│  tRPC Client + React Query 5 + Wouter Routing                  │
│  i18n: en/ar/zh via context-based locale switching              │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS / WebSocket
┌──────────────────────────┼──────────────────────────────────────┐
│                     API Layer (Vercel)                           │
│  Express 4 + tRPC 11 Server                                      │
│  ┌────────────┬──────────────┬────────────┬──────────────────┐  │
│  │ Rate Limit │ CORS + CSP   │ JWT Auth   │ Audit Logging    │  │
│  │ (in-memory │ Helmet       │ Cookie     │ Structured JSON  │  │
│  │  + Redis)  │ Headers      │ Session    │ Pino Logger      │  │
│  └────────────┴──────────────┴────────────┴──────────────────┘  │
└──────┬───────────────┬────────────────────┬─────────────────────┘
       │               │                    │
┌──────┼───────────────┼────────────────────┼─────────────────────┐
│      ▼               ▼                    ▼                      │
│  ┌────────┐  ┌──────────────┐  ┌───────────────────┐           │
│  │Supabase│  │ PostgreSQL 17│  │ Redis / Upstash   │           │
│  │ Auth   │  │ (Drizzle ORM)│  │ BullMQ Queue      │           │
│  │Storage │  │ RLS Policies │  │ Rate Limiting     │           │
│  │Real-time│ │ 60+ Tables   │  │ Session Cache     │           │
│  └────────┘  └──────────────┘  └───────────────────┘           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 External Services                         │  │
│  │  OpenAI GPT-4o │ Stripe Billing │ Sentry │ Resend/SMTP   │  │
│  │  S3 Storage    │ Clerk OAuth    │ Umami  │ Manus Forge   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                    Infrastructure Layer                          │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack (Detailed)

| Layer          | Technology                          | Details                                       |
| -------------- | ----------------------------------- | --------------------------------------------- |
| **Frontend**   | React 19, TypeScript 5.9            | SPA with lazy-loaded routes (70+ pages)       |
| **Bundler**    | Vite 7                              | HMR, ESBuild production builds                |
| **Styling**    | Tailwind CSS 4, Radix UI            | 39 shared components + shadcn/ui primitives   |
| **State**      | React Query 5, tRPC React           | Auto-cache, refetch, optimistic updates       |
| **Routing**    | Wouter 3                            | Lightweight hash-based routing                |
| **Backend**    | Express 4, tRPC 11                  | 42 routers, 200+ procedures                   |
| **Validation** | Zod 4                               | Input validation on all mutations             |
| **ORM**        | Drizzle ORM 0.45                    | Type-safe SQL with PostgreSQL driver          |
| **Database**   | PostgreSQL 17 (Supabase managed)    | RLS, connection pooling, daily backups        |
| **Auth**       | Triple path: Clerk + Supabase + JWT | MFA (TOTP), OTP reset, OAuth (Google/GitHub)  |
| **Queue**      | BullMQ 5 + ioredis 5                | AI job processing, in-memory fallback for dev |
| **AI**         | OpenAI GPT-4o                       | 8-stage compliance assessment pipeline        |
| **Billing**    | Stripe v20                          | 5 plans, hosted checkout, webhook processing  |
| **Email**      | Nodemailer + Resend                 | SMTP fallback, HTML templates                 |
| **Storage**    | AWS S3 (via supabase/storage)       | Evidence files, report exports                |
| **Monitoring** | Sentry v10, Pino v9                 | Structured logging, error tracking            |
| **CI/CD**      | GitHub Actions, Vercel              | Lint → Typecheck → Test → Build → Deploy      |
| **Edge**       | Supabase Functions (Deno)           | 4 functions: auth, webhooks, export, notify   |

## Authentication Architecture

```
                    ┌─────────────────────┐
                    │    Client Request    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Auth Middleware    │
                    │  (chain of 4 paths) │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Path 1: Clerk  │  │ Path 2: API Key │  │ Path 3: Local   │
│  OAuth Session  │  │ x-djac-api-key  │  │ JWT Cookie      │
│  ┌───────────┐  │  │  Header         │  │ Session         │
│  │ Verify    │  │  │  ┌───────────┐  │  │ ┌───────────┐  │
│  │ Clerk SDK │  │  │  │ Lookup    │  │  │ │ Verify    │  │
│  │ Token     │  │  │  │ API Key   │  │  │ │ JWT +     │  │
│  └─────┬─────┘  │  │  │ + Validate│  │  │ │ Session   │  │
│        │        │  │  └─────┬─────┘  │  │ └─────┬─────┘  │
│        ▼        │  │        ▼        │  │        ▼        │
│  ┌───────────┐  │  │  ┌───────────┐  │  │  ┌───────────┐  │
│  │ Get User  │  │  │  │ Get User  │  │  │  │ Get User  │  │
│  │ from      │  │  │  │ + Org     │  │  │  │ from DB   │  │
│  │ users     │  │  │  │ from key  │  │  │  │ + session │  │
│  └───────────┘  │  │  └───────────┘  │  │  └───────────┘  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Path 4: Dev Bypass  │
                    │ (development only)  │
                    │ DEV_AUTH_BYPASS=    │
                    │ true → static user  │
                    └─────────────────────┘
```

### Session Flow

1. User logs in (OAuth or email/password) → JWT issued
2. JWT stored in HTTP-only, Secure, SameSite cookie (`app_session_id`)
3. Every request: middleware validates JWT, attaches `ctx.user`
4. tRPC procedures access `ctx.user` for authorization decisions
5. Protected routes redirect unauthenticated users

## AI Pipeline Architecture

The 8-stage AI compliance assessment pipeline:

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Job Lifecycle                               │
│                                                                   │
│  1. Gatekeeper ──► 2. Intake ──► 3. Extractor ──► 4. RAG        │
│  ┌──────────────┐  ┌─────────┐  ┌────────────┐  ┌────────────┐ │
│  │ Validate      │  │ Parse   │  │ Extract     │  │ Retrieve   │ │
│  │ input safety  │  │ document│  │ facts, DP   │  │ relevant   │ │
│  │ (injection    │  │ type,   │  │ categories, │  │ controls   │ │
│  │  detection)   │  │ tags    │  │ entities    │  │ from DB    │ │
│  └──────┬───────┘  └────┬────┘  └─────┬──────┘  └─────┬──────┘ │
│         │               │             │               │          │
│         ▼               ▼             ▼               ▼          │
│  5. Judge ──────► 6. Synthesizer ──► 7. Validator ──► 8. Reporter│
│  ┌──────────────┐  ┌───────────┐  ┌────────────┐  ┌───────────┐ │
│  │ Compare facts│  │ Generate  │  │ Self-check  │  │ Format    │ │
│  │ against      │  │ gap       │  │ output      │  │ final     │ │
│  │ controls     │  │ analysis  │  │ quality &   │  │ report    │ │
│  │ (GPT-4o)    │  │ per ctrl  │  │ retry fail  │  │ struct    │ │
│  └──────────────┘  └───────────┘  └────────────┘  └───────────┘ │
│                                                                   │
│  Queue: BullMQ + Redis  │  Streaming: WebSocket /ws/ai-jobs      │
│  Persistence: aiAgentRuns table  │  RAG Top-K: configurable       │
└─────────────────────────────────────────────────────────────────┘
```

### AI Queue Modes

| Mode        | Backend        | Use Case                     |
| ----------- | -------------- | ---------------------------- |
| `in_memory` | EventEmitter   | Development, single instance |
| `redis`     | BullMQ + Redis | Production, distributed      |

The queue auto-selects `redis` if `REDIS_URL` is configured, otherwise falls back to `in_memory`. Set `AI_QUEUE_MODE` explicitly to override.

## RBAC & Permission System Architecture

### Platform Roles (7 levels)

```
super_admin (100)
    │
yalla_hack_employee (45)
    │
platform_admin (40) / admin (40) [legacy]
    │
company_admin (30)
    │
professional_user (20)
    │
basic_user (10) / user (10) [legacy]
```

### Organization Roles (4 levels)

```
owner (40)
    │
admin (30)
    │
compliance_officer (20)
    │
analyst (10)
```

### Permission Resolution

```
Request
  │
  ▼
tRPC Procedure (e.g., vendor.create)
  │
  ▼
Auth Middleware → ctx.user, ctx.orgRole
  │
  ▼
Permission Check:
  1. Load custom rolePermissions row for (orgId, role, moduleSlug)
  2. If not found, fall back to DEFAULT_ORG_ROLE_PERMISSIONS[role][moduleSlug]
  3. Compare requested action (canCreate) against PermissionFlags
  │
  ▼
  Allow ✓ or Deny ✗ (403 FORBIDDEN)
```

### Module Permission Flags

Each of the 32 modules has 6 permission flags:

| Flag        | Description                        |
| ----------- | ---------------------------------- |
| `canView`   | Read access to records             |
| `canCreate` | Create new records                 |
| `canEdit`   | Modify existing records            |
| `canDelete` | Remove records                     |
| `canExport` | Export data (CSV, PDF, etc.)       |
| `canInvite` | Invite team members / share access |

### Default Permission Templates

| Role                 | Pattern                                            |
| -------------------- | -------------------------------------------------- |
| `analyst`            | VIEW_ONLY on most modules, STANDARD on requests    |
| `compliance_officer` | STANDARD on compliance modules, VIEW_ONLY on legal |
| `admin`              | FULL on compliance, STANDARD on settings/api/team  |
| `owner`              | FULL on everything, including billing              |

## Multi-Tenant Data Isolation

Every organization-scoped query includes `orgId` filtering:

```
SELECT * FROM vendors WHERE orgId = $1 AND id = $2
```

This is enforced at multiple levels:

1. **tRPC middleware** — Extracts `orgId` from session and adds to context
2. **Drizzle queries** — All queries filter by `ctx.orgId`
3. **Row-Level Security** — PostgreSQL RLS policies as defense-in-depth
4. **API keys** — Scoped to a single organization

## Background Schedulers

8 background schedulers run on server startup:

| Scheduler                 | Interval  | Purpose                                     |
| ------------------------- | --------- | ------------------------------------------- |
| Interaction Retention     | 24h       | Purge interaction logs older than TTL (90d) |
| Trial Reminder            | 6h        | Email users with expiring trials            |
| Deadline Alert            | 1h        | Notify of upcoming regulatory deadlines     |
| Scheduled Report Delivery | Config    | Generate and email recurring reports        |
| SSE Broadcast             | Real-time | Push events to Yalla Admin dashboard        |
| Rate Limiter Cleanup      | 5min      | Clean expired rate limit entries            |
| Interaction Logger        | Real-time | Log user interactions for analytics         |

## Caching Strategy

| Cache                | Backend      | TTL        | Purpose                          |
| -------------------- | ------------ | ---------- | -------------------------------- |
| Compliance Framework | In-memory    | 60s (prod) | Framework/control queries        |
| Rate Limiting        | Memory/Redis | Per-window | Request rate tracking            |
| AI RAG Results       | In-memory    | Per-job    | Avoid re-fetching controls       |
| tRPC Batching        | None         | N/A        | React Query handles client cache |

## Scaling Considerations

### Current Architecture (Single Instance)

- Single Node.js process on Vercel serverless
- PostgreSQL connection pool: 5 dev / 25 production
- AI jobs processed sequentially in-memory

### Horizontal Scaling (Future)

1. **Stateless API**: Move session to Redis, add load balancer
2. **AI Queue**: BullMQ + Redis for distributed job processing
3. **Database**: Read replicas for reporting queries
4. **CDN**: Serve static assets from Vercel CDN
5. **Edge Functions**: Offload compute to Supabase Edge (Deno)

### Database Connection Management

- Drizzle ORM uses `pg` Pool with configurable size
- Prisma Accelerator connection string fallback chain
- Transaction pooler for Supabase (port 6543)

## Security Architecture

See [docs/security.md](security.md) for detailed OWASP coverage, security headers, authentication hardening, and secret management.

## Deployment Architecture

See [docs/deployment.md](deployment.md) for environment setup, CI/CD pipeline, database migrations, and production checklist.

## Key Design Decisions

1. **tRPC over REST** — End-to-end type safety from database to frontend
2. **Drizzle over Prisma** — Lighter weight, better SQL control, no code generation
3. **Supabase over self-hosted** — Managed PostgreSQL, Auth, Storage, Edge Functions
4. **BullMQ over custom queue** — Production-proven Redis-based job processing
5. **Express over Fastify** — Ecosystem maturity, middleware compatibility
6. **Wouter over React Router** — Minimalist routing for SPA without SSR needs
7. **Enum-heavy schema** — Database-level data integrity over application validation
8. **JSONB for flexible data** — Vendor profiles, user preferences, simulation results
