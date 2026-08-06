# Contributing to DJAC

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm 10+ (`npm install -g pnpm@10`)
- Docker (for local Supabase)
- Supabase CLI (`npm install -g supabase`)
- Git

### First-Time Setup

```bash
git clone <repo-url> djac
cd djac

# Install dependencies
pnpm install

# Copy environment configuration
cp .env.example .env
# Edit .env with your local values (at minimum: DATABASE_URL)

# Start local Supabase (requires Docker)
supabase start

# Push database schema
pnpm db:push

# Seed reference data
pnpm seed:data

# Start development server
pnpm dev
```

The app will be available at `http://localhost:3000`.

### Environment Configuration

Copy `.env.example` to `.env`. For local development with Supabase, you need at minimum:

- `DATABASE_URL` — from `supabase status` (DB URL)
- `SUPABASE_URL` — from `supabase status` (API URL)
- `SUPABASE_ANON_KEY` — from `supabase status` (anon key)
- `SUPABASE_SERVICE_ROLE_KEY` — from `supabase status` (service_role key)
- `JWT_SECRET` — any random string for dev

For AI features, add `OPENAI_API_KEY`. For billing, add Stripe keys. See `.env.example` for all options.

### Dev Auth Bypass

For local development without Clerk/OAuth, set in `.env`:

```env
DEV_AUTH_BYPASS=true
DEV_AUTH_OPEN_ID=local-dev-user
DEV_AUTH_EMAIL=dev@example.com
DEV_AUTH_ROLE=super_admin
```

## Project Structure

```
client/          React SPA (Vite + Tailwind + Radix UI)
  src/
    pages/       Route pages (one per route)
    components/  Shared UI components
    hooks/       Custom React hooks
    contexts/    React contexts (theme, locale, auth)
    lib/         Utilities, tRPC client setup
    locales/     i18n translations (en, ar, zh)

server/          Express + tRPC backend
    _core/       Core infrastructure (auth, env, security, trpc, rate limit)
    ai/          AI pipeline (orchestrator, queue, RAG, WebSocket)
    services/    Business logic services (auth, billing, email, SSE, OTP)
    __tests__/   Unit and integration tests

shared/          Shared code between client and server
    const.ts     Roles, permissions, RBAC defaults
    types.ts     Unified type exports

drizzle/         Database schema and migrations
    schema.ts    Full Drizzle ORM schema (70+ tables)
    0000_*.sql   Migration files

supabase/        Supabase configuration
    functions/   Edge Functions (Deno)
    migrations/  SQL migrations

scripts/         Operational scripts (seed, smoke, health checks)
```

## Development Workflow

### Running Checks

```bash
pnpm check          # TypeScript type checking
pnpm lint           # ESLint
pnpm test           # Run all tests
pnpm format:check   # Prettier format check
pnpm verify:all     # Run all checks (lint + typecheck + test + build)
```

### Database Changes

1. Edit `drizzle/schema.ts` to add/modify tables
2. Generate migration: `pnpm drizzle-kit generate`
3. Apply migration: `pnpm db:migrate`
4. Update seed scripts if needed: `scripts/seed-*.mjs`

### Pre-commit Hooks

Husky runs `pnpm lint` and `pnpm check` before every commit. Fix issues before committing:

```bash
pnpm format          # Auto-format with Prettier
pnpm lint            # Check for ESLint errors
```

## Conventions

### TypeScript

- Use `type` imports for type-only imports
- All tRPC procedures must have Zod input validation
- Prefer `const` over `let`, avoid `var`
- Use optional chaining (`?.`) and nullish coalescing (`??`)

### Naming

- **Files**: kebab-case (`compliance-framework-router.ts`, `risk-register-router.ts`)
- **tRPC routers**: camelCase matching the file name (`complianceFrameworkRouter`)
- **tRPC procedures**: dot-separated (`compliance.frameworks.list`, `vendor.create`)
- **Database tables**: snake_case (`organization_members`, `compliance_reports`)
- **Database columns**: snake_case (`created_at`, `org_id`)
- **React components**: PascalCase (`VendorAssessmentPage`, `ComplianceDashboard`)
- **Hooks**: `use` prefix (`useAuth`, `useComplianceData`)

### tRPC Router Pattern

Each feature module follows this pattern:

```typescript
// server/my-feature-router.ts
import { z } from "zod";
import { orgProcedure, protectedProcedure } from "./_core/trpc";
import { router } from "./_core/trpc";

export const myFeatureRouter = router({
  list: orgProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Fetch and return data
    }),

  create: orgProcedure
    .input(
      z.object({
        orgId: z.string(),
        name: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Insert and return data
    }),

  update: orgProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Update and return data
    }),

  delete: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Delete and return success
    }),
});
```

Then register in `server/routers.ts`:

```typescript
import { myFeatureRouter } from "./my-feature-router";

export const appRouter = router({
  // ... existing routers
  myFeature: myFeatureRouter,
});
```

### API Design Rules

1. All mutations go through tRPC procedures with Zod validation
2. Use `protectedProcedure` for authenticated-only endpoints
3. Use `orgProcedure` for endpoints requiring organization membership
4. Admin operations must check `ctx.user.role` before proceeding
5. Never trust client input — always validate with Zod
6. Return typed responses (never `any`)

### Adding a New Page

1. Create the page component in `client/src/pages/`
2. Add the route in `client/src/App.tsx`
3. Add navigation link in the sidebar component
4. Add i18n keys in `client/src/locales/en.json` (and `ar.json`, `zh.json`)

### Git Workflow

1. Create a branch from `develop`: `git checkout -b feature/my-feature`
2. Make changes with clear, atomic commits
3. Push and open a PR against `develop`
4. CI must pass (lint, typecheck, test, build)
5. At least one review required before merge
6. Squash merge preferred

### Commit Messages

Follow conventional commits:

```
feat: add vendor compliance scoring engine
fix: resolve race condition in AI job queue
docs: update API documentation for DSR router
refactor: extract email service into own module
test: add integration tests for Stripe webhooks
chore: update dependencies
```

## Testing

```bash
pnpm test              # Run all tests
npx vitest run path    # Run specific test file
npx vitest --ui        # Interactive test UI
```

Tests are in `server/__tests__/` and `client/src/__tests__/`. Write tests for:

- New tRPC procedures (unit)
- Business logic services (unit)
- Critical API paths (integration)
- Security/auth flows (integration)

## Questions?

Open an issue or reach out to the maintainers.
