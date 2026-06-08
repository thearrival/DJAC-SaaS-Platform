# DJAC - Compliance Management SaaS Platform

A production-ready, multi-tenant compliance management SaaS platform tailored for organizations operating in **Saudi Arabia (PDPA/NCA-ECC)** and **China (PIPL/CSL/DSL)** regulatory environments.

## Overview

DJAC provides comprehensive compliance management including framework mapping, risk assessment, vendor management, continuous threat monitoring, and AI-powered reporting.

## Architecture

```
React SPA (Vite) → tRPC API (Express) → PostgreSQL (Supabase)
                 → Edge Functions (Deno)
                 → Background Jobs (BullMQ + Redis)
                 → AI Reports (OpenAI GPT-4o)
```

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 19, TypeScript, Tailwind CSS 4, Radix UI, Recharts |
| Backend | Node.js, Express, tRPC, Drizzle ORM |
| Database | PostgreSQL 17 (Supabase) |
| Auth | Supabase Auth + Custom JWT + OAuth (Google/GitHub) |
| Queue | BullMQ + Redis |
| Billing | Stripe |
| AI | OpenAI GPT-4o |
| Edge | Supabase Edge Functions (Deno) |
| CI/CD | GitHub Actions → Vercel |
| Monitoring | Sentry, Umami |

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy env and fill in values
cp .env.example .env

# Start Supabase locally (requires Docker)
supabase start

# Run database migrations
pnpm db:push

# Seed reference data
pnpm seed:data

# Start dev server
pnpm dev
```

## Project Structure

```
├── api/               # Vercel serverless entry
├── client/            # React SPA
│   └── src/
│       ├── components/  # Reusable UI components
│       ├── pages/       # Route pages
│       ├── hooks/       # Custom React hooks
│       ├── contexts/    # React contexts
│       └── lib/         # Utilities
├── server/            # Express + tRPC backend
│   ├── _core/         # Core middleware, auth, env
│   ├── services/      # Business logic
│   ├── ai/            # AI integration
│   └── __tests__/     # Unit & integration tests
├── supabase/
│   ├── functions/     # Edge Functions (Deno)
│   ├── migrations/    # SQL migrations
│   └── config.toml    # Local config
├── drizzle/           # Drizzle ORM schema
│   └── schema.ts      # Full database schema
├── shared/            # Shared types & constants
└── docs/              # Documentation
    ├── architecture.md
    ├── deployment.md
    ├── api.md
    └── security.md
```

## Key Features

- **Multi-tenant SaaS** with orgs, teams, and RBAC
- **Compliance Framework Library** - PDPA, PDPL, NCA-ECC, CSL, DSL
- **AI-Powered Report Generation** - compliance reports with GPT-4o
- **Vendor Risk Management** - assessment, scoring, tiering
- **Continuous Threat Exposure Management (CTEM)**
- **Incident Management** with regulatory notification tracking
- **Remediation Planning** with task tracking
- **Risk Register** with likelihood/impact scoring
- **Audit Scheduling** with recurrence
- **Data Subject Request (DSR)** management
- **Stripe Billing** with multi-plan subscriptions
- **Supabase Auth** with OAuth (Google, GitHub) + MFA
- **Real-time Updates** via WebSocket
- **Role-Based Access Control** (7 role levels)

## Documentation

- [Architecture](./docs/architecture.md)
- [API Reference](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)
- [Security Review](./docs/security.md)

## Deployment

```bash
# Build for production
pnpm build

# Deploy edge functions
supabase functions deploy

# Push DB migrations
supabase db push --linked

# Deploy to Vercel
vercel --prod
```

See [Deployment Guide](./docs/deployment.md) for detailed instructions.

## CI/CD

GitHub Actions workflows:
- **CI** - Lint, typecheck, test, build on every PR
- **Deploy Staging** - Auto-deploys develop branch to staging
- **Deploy Production** - Auto-deploys main branch to production
- **Supabase Deploy** - Deploys migration & function changes

## Testing

```bash
# Run all tests
pnpm test

# Run specific test file
npx vitest run server/__tests__/unit/auth.test.ts
```

6 test files with 22 tests covering validation, RBAC, auth, API health, and Supabase integration.

## License

MIT
