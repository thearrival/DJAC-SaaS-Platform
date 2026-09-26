# Development Guide — DJAC Platform

## Prerequisites

Before contributing to DJAC, ensure your environment meets the following requirements:

| Requirement      | Minimum Version | Installation                                          |
| ---------------- | --------------- | ----------------------------------------------------- |
| **Node.js**      | 20+             | [nodejs.org](https://nodejs.org)                      |
| **pnpm**         | 10+             | `npm install -g pnpm@10`                              |
| **Docker**       | 24+             | [docker.com](https://docker.com) (for local Supabase) |
| **Supabase CLI** | Latest          | `npm install -g supabase`                             |
| **Git**          | 2.40+           | [git-scm.com](https://git-scm.com)                    |
| **VS Code**      | Recommended     | With extensions: ESLint, Prettier, Vitest             |

### Verify Your Environment

```bash
node --version    # Must be >= 20
pnpm --version    # Must be >= 10
docker --version  # Required for local Supabase
supabase --version
git --version
```

## Project Structure

```
├── api/                    # Vercel serverless entry point
├── client/                 # React SPA (Vite + Tailwind + Radix UI)
│   └── src/
│       ├── pages/          # Route pages (one per route)
│       ├── components/     # Shared UI components
│       ├── hooks/          # Custom React hooks
│       ├── contexts/       # React contexts (theme, locale, auth)
│       ├── lib/            # Utilities, tRPC client setup
│       ├── locales/        # i18n translations (en, ar, zh)
│       └── __tests__/      # Client-side tests
├── server/                 # Express + tRPC backend
│   ├── _core/              # Core infrastructure (auth, env, security, trpc, rate limit)
│   ├── ai/               # AI pipeline (orchestrator, queue, RAG, WebSocket)
│   ├── services/         # Business logic services (auth, billing, email, SSE, OTP)
│   ├── routers/          # tRPC router definitions
│   ├── __tests__/        # Unit and integration tests
│   └── _core/index.ts    # Server entry point
├── shared/               # Shared code between client and server
│   ├── const.ts          # Roles, permissions, RBAC defaults
│   └── types.ts          # Unified type exports
├── drizzle/              # Database schema and migrations
│   ├── schema.ts         # Full Drizzle ORM schema (70+ tables)
│   └── 0000_*.sql        # Migration files
├── supabase/             # Supabase configuration
│   ├── functions/        # Edge Functions (Deno)
│   ├── migrations/       # SQL migrations
│   └── config.toml       # Local config
├── scripts/              # Operational scripts (seed, smoke, health checks, backups)
├── docs/                 # Project documentation
└── test/                 # Shared test utilities
```

## Development Workflow

### First-Time Setup

```bash
# Clone the repository
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

The application will be available at `http://localhost:3000`.

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

### Daily Development Cycle

```bash
# Start development server
pnpm dev

# In another terminal, run checks
pnpm check          # TypeScript type checking
pnpm lint           # ESLint
pnpm format:check   # Prettier format check
```

### Running Checks

```bash
pnpm check          # TypeScript type checking
pnpm lint           # ESLint
pnpm test           # Run all tests
pnpm format:check   # Prettier format check
pnpm verify:all     # Run all checks (lint + typecheck + test + build)
```

## Testing

### Test Framework

DJAC uses **Vitest** with TypeScript. Tests are organized into:

- **Unit tests** (`server/__tests__/unit/`) — Individual functions, procedures, and services
- **Integration tests** (`server/__tests__/integration/`) — API flows, database operations, auth flows
- **Client tests** (`client/src/__tests__/`) — React component and hook tests

### Running Tests

```bash
pnpm test                        # Run all tests
npx vitest run path/to/file    # Run specific test file
npx vitest --ui                # Interactive test UI
npx vitest --coverage          # Coverage report
npx vitest run --reporter=verbose  # Verbose output
```

### Writing Tests

Tests should cover:

- **New tRPC procedures** — Unit test input validation, query/mutation logic
- **Business logic services** — Unit test core functionality
- **Critical API paths** — Integration test end-to-end flows
- **Security/auth flows** — Integration test authentication, authorization, RBAC

Test conventions:

- Use `describe` blocks grouped by feature/module
- Use `it` or `test` for individual assertions
- Use `beforeEach`/`afterEach` for setup/teardown
- Mock external services (OpenAI, Stripe, Supabase) using Vitest mocks
- All tests must pass before a PR can be merged

### Test Coverage

- All new code must have test coverage (minimum 80% for new modules)
- Critical paths (auth, billing, security) must have 100% coverage
- Coverage reports generated with `npx vitest --coverage`

## Conventions

### TypeScript

- Use `type` imports for type-only imports
- All tRPC procedures must have Zod input validation
- Prefer `const` over `let`, avoid `var`
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Use strict TypeScript mode (`strict: true` in tsconfig)
- Avoid `any` — use proper types or `unknown` with type guards

### Naming

| Category             | Convention                   | Examples                                                    |
| -------------------- | ---------------------------- | ----------------------------------------------------------- |
| **Files**            | kebab-case                   | `compliance-framework-router.ts`, `risk-register-router.ts` |
| **tRPC routers**     | camelCase matching file name | `complianceFrameworkRouter`                                 |
| **tRPC procedures**  | dot-separated                | `compliance.frameworks.list`, `vendor.create`               |
| **Database tables**  | snake_case                   | `organization_members`, `compliance_reports`                |
| **Database columns** | snake_case                   | `created_at`, `org_id`                                      |
| **React components** | PascalCase                   | `VendorAssessmentPage`, `ComplianceDashboard`               |
| **Hooks**            | `use` prefix                 | `useAuth`, `useComplianceData`                              |
| **Constants**        | UPPER_SNAKE_CASE             | `MAX_UPLOAD_SIZE`, `DEFAULT_PAGE_SIZE`                      |
| **Enums**            | PascalCase                   | `Role`, `PermissionFlag`                                    |
| **Types/Interfaces** | PascalCase                   | `User`, `Organization`                                      |
| **Test files**       | `.test.ts` suffix            | `auth.test.ts`, `compliance-router.test.ts`                 |

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
7. Use `publicProcedure` for unauthenticated endpoints (health, webhooks)

### Database Changes

1. Edit `drizzle/schema.ts` to add/modify tables
2. Generate migration: `pnpm drizzle-kit generate`
3. Apply migration: `pnpm db:migrate`
4. Update seed scripts if needed: `scripts/seed-*.mjs`
5. Document schema changes in the relevant docs

### CSS / Styling

- Use Tailwind CSS utility classes exclusively
- Use Radix UI components for interactive elements
- Define custom styles in `tailwind.config.js` using `extend`
- Use `cn()` and `cva()` for conditional class composition
- Avoid inline styles except for dynamic values

### i18n / Internationalization

- All user-facing strings must use i18n keys from `client/src/locales/`
- Supported languages: English (`en.json`), Arabic (`ar.json`), Chinese (`zh.json`)
- Add missing translation keys to all language files when adding new strings
- Use `useTranslation()` hook for accessing translations in components

### Pre-commit Hooks

Husky runs `pnpm lint` and `pnpm check` before every commit. Fix issues before committing:

```bash
pnpm format          # Auto-format with Prettier
pnpm lint            # Check for ESLint errors
pnpm check           # Type check
```

## Commit Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

| Type       | Description                    | Example                                           |
| ---------- | ------------------------------ | ------------------------------------------------- |
| `feat`     | New feature                    | `feat: add vendor compliance scoring engine`      |
| `fix`      | Bug fix                        | `fix: resolve race condition in AI job queue`     |
| `docs`     | Documentation only             | `docs: update API documentation for DSR router`   |
| `refactor` | Code change without bug fix    | `refactor: extract email service into own module` |
| `test`     | Adding or updating tests       | `test: add integration tests for Stripe webhooks` |
| `chore`    | Maintenance tasks              | `chore: update dependencies`                      |
| `style`    | Formatting, missing semicolons | `style: fix indentation in router file`           |
| `perf`     | Performance improvement        | `perf: optimize compliance report generation`     |
| `security` | Security-related change        | `security: patch JWT token validation`            |
| `ci`       | CI/CD configuration            | `ci: add Supabase deploy workflow`                |

### Examples

```
feat: add vendor compliance scoring engine
fix: resolve race condition in AI job queue
docs: update API documentation for DSR router
refactor: extract email service into own module
test: add integration tests for Stripe webhooks
chore: update dependencies
security: patch JWT token validation
ci: add Supabase deploy workflow
```

### Commit Message Rules

- Keep the subject line under 72 characters
- Use imperative mood ("add" not "added" or "adds")
- Scope the commit to a specific module when possible
- Reference related issues: `fix: resolve null pointer (#123)`
- Break complex changes into multiple atomic commits

## Troubleshooting

### Common Issues

#### `pnpm install` fails with native module errors

```bash
pnpm store prune
rm -rf node_modules
pnpm install
```

Ensure Node.js 20+ and pnpm 10+ are installed.

#### Database connection errors

```bash
# Check Supabase status
supabase status

# Verify DATABASE_URL in .env matches supabase status output
# Restart the development server after changing .env
pnpm dev
```

#### TypeScript type errors

```bash
pnpm check            # Identify type errors
pnpm format           # Auto-fix formatting issues
```

Common causes:

- Missing dependencies — run `pnpm install`
- Stale type cache — delete `node_modules/.cache` and restart
- Incompatible versions — check `package.json` for version conflicts

#### ESLint errors

```bash
pnpm lint             # Show all ESLint errors
pnpm format           # Auto-fix many issues with Prettier
```

#### Test failures

```bash
npx vitest run        # Run all tests and see failures
npx vitest run path/to/file.test.ts  # Run specific test
npx vitest --ui       # Interactive test runner for debugging
```

#### Migration issues

```bash
# Check migration status
npx drizzle-kit migrate:status

# Reset and re-run migrations (development only)
npx drizzle-kit migrate:reset

# Push schema directly (bypass migrations)
pnpm db:push
```

#### Port conflicts

If port 3000 is in use:

```bash
# Change port in .env
PORT=3001
pnpm dev
```

#### Memory issues during build

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" pnpm build
```

### Getting Help

- **Issues**: Open an issue on GitHub with the `help-wanted` label
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: See `docs/` directory for architecture, API, deployment, and troubleshooting guides
- **Security**: See `SECURITY.md` for vulnerability reporting procedures
