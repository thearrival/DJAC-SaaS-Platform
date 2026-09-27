# DJAC SaaS — Testing Guide

## Overview

DJAC uses **Vitest**. Tests currently run in a **single `node` environment** and
cover server logic plus static client consistency checks. There is no DOM/JSX
test environment installed, so component (`.tsx`) tests do not run today.

## Quick Start

```bash
pnpm test              # run all tests (vitest run)
pnpm test:coverage     # run with coverage (thresholds enforced)
pnpm verify:all        # lint + tsc + tests + production build
```

Run a single file: `npx vitest run server/__tests__/unit/rbac.test.ts`.

## Test Structure (actual)

```
server/__tests__/unit/          # ~40 files — helpers, stores, config, scoring
server/__tests__/integration/   # API/auth/admin security; smoke tests skip unless SMOKE_BASE_URL is set
client/src/__tests__/           # static consistency: locales, jurisdictions, i18n integrity
```

Config lives in `vitest.config.ts`:

- `environment: "node"`, `pool: "forks"`, `minWorkers: 1`, `maxWorkers: 6`.
- `include`: `server/**/*.test.ts`, `server/**/*.spec.ts`,
  `client/src/**/*.test.ts|spec.ts` — **`.tsx` is intentionally excluded**.
- No `setupFiles`, no globals.
- Coverage (`v8`) with a **baseline ratchet**: lines/statements ≥ 3,
  functions ≥ 2, branches ≥ 2. Raise these as tests are added — do not lower.
- Aliases: `@` → `client/src`, `@shared` → `shared`.

## Database in tests

Unit tests intentionally exercise the **in-memory fallback** (no `getDb()`
database). CI **does not** inject `DATABASE_URL` on purpose — tests must never
write to a real or managed database. When DB-path integration tests are added,
run them against a disposable Postgres **service container**, not a shared
instance.

## CI

`.github/workflows/ci.yml` gates every push/PR on: `pnpm lint`, `pnpm check`,
`pnpm format:check`, `pnpm test:coverage`, a production `pnpm build`, and
Supabase migration lint. A separate **Security Scans** job runs a gitleaks
secret scan (reporting) and `pnpm audit --audit-level=critical`.
CodeQL runs on a schedule.

## Writing Tests

### Unit test

```typescript
import { describe, it, expect } from "vitest";

describe("riskCalculator", () => {
  it("computes the risk level", () => {
    expect(computeRiskLevel("high", "medium")).toBe("high");
  });
});
```

### Mocking modules

```typescript
import { describe, it, expect, vi } from "vitest";

vi.mock("../../db", () => ({ getDb: async () => null }));
// now imports resolved below use the in-memory fallback deterministically
```

### Asserting tenant isolation

Every store query/mutation that takes an `organizationId` must be scoped by it.
Add a regression test whenever you touch such a query (see
`server/__tests__/unit/deadline-tenant-isolation.test.ts`).

## Smoke & ops scripts

```bash
pnpm smoke:runtime          # runtime health check
pnpm smoke:runtime:strict   # strict assertions
pnpm prod:preflight         # production config preflight
pnpm db:doctor              # database diagnostics
```

## Best Practices

1. Isolate tests; prefer the in-memory fallback over a real database.
2. Never call Stripe/OpenAI/SMTP in tests — mock them.
3. Cover authorization and tenant-scoping for new procedures.
4. Add a regression test for every bug fixed.
5. Keep the coverage ratchet moving **up**, never down.
