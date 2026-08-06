# DJAC SaaS - Testing Guide

## Overview

DJAC uses **Vitest** as its test runner, with tests written in TypeScript. Tests are organized into unit tests (individual functions/procedures) and integration tests (API flows, database operations).

## Quick Start

```bash
pnpm test                  # Run all tests
pnpm test -- --reporter=verbose   # Verbose output
npx vitest run path/to/file.test.ts  # Run specific file
npx vitest --ui            # Interactive test UI
npx vitest --coverage      # Coverage report
```

## Test Structure

```
server/__tests__/
├── unit/
│   ├── auth.test.ts           # Authentication utilities
│   ├── rbac.test.ts           # Role-based access control
│   ├── validation.test.ts     # Zod schema validation
│   ├── api-health.test.ts     # Health endpoint tests
│   └── supabase-integration.test.ts  # Supabase client integration
├── integration/
│   ├── compliance-flow.test.ts # End-to-end compliance workflows
│   ├── vendor-assessment.test.ts # Vendor assessment pipeline
│   └── billing-webhook.test.ts  # Stripe webhook processing

client/src/__tests__/
├── components/                 # Component rendering tests
└── hooks/                      # Custom hook tests
```

## Writing Tests

### Unit Test Pattern

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("riskCalculator", () => {
  it("should compute risk level from likelihood and impact", () => {
    const result = computeRiskLevel("high", "medium");
    expect(result).toBe("high");
  });

  it("should throw for invalid inputs", () => {
    expect(() => computeRiskLevel("invalid", "low")).toThrow();
  });
});
```

### tRPC Procedure Test Pattern

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { createCallerFactory, type AppRouter } from "../routers";

describe("vendor.list", () => {
  let caller: ReturnType<typeof createCallerFactory<AppRouter>>;

  beforeEach(async () => {
    const createCaller = createCallerFactory();
    caller = createCaller({
      // Mock context with authenticated user
      user: { id: 1, role: "company_admin" },
      orgId: "org_test_123",
    });
  });

  it("should return vendors for the org", async () => {
    const vendors = await caller.vendor.list({ orgId: "org_test_123" });
    expect(Array.isArray(vendors)).toBe(true);
  });
});
```

### Integration Test Pattern

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "../db";

describe("Vendor Assessment Flow", () => {
  let orgId: string;
  let vendorId: number;

  beforeAll(async () => {
    // Set up test data in test database
    const db = getDb();
    const [org] = await db
      .insert(organizations)
      .values({
        name: "Test Org",
        plan: "starter",
      })
      .returning();
    orgId = org.id;
  });

  it("should create vendor and run assessment", async () => {
    // 1. Create vendor
    const vendor = await caller.vendor.create({
      orgId,
      name: "Test Vendor",
      jurisdiction: "Saudi Arabia",
    });
    expect(vendor.id).toBeDefined();

    // 2. Run assessment
    const assessment = await caller.vendorCompliance.assess({
      vendorId: vendor.id,
      frameworkId: "nca-ecc",
    });
    expect(assessment.status).toBe("completed");
  });

  afterAll(async () => {
    // Clean up test data
    const db = getDb();
    await db.delete(organizations).where(eq(organizations.id, orgId));
  });
});
```

### Mocking External Services

```typescript
import { vi, describe, it, expect } from "vitest";

// Mock Stripe
vi.mock("stripe", () => ({
  default: vi.fn(() => ({
    checkout: { sessions: { create: vi.fn() } },
    webhooks: { constructEvent: vi.fn() },
  })),
}));

// Mock OpenAI
vi.mock("openai", () => ({
  default: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: "mocked response" } }],
        }),
      },
    },
  })),
}));
```

## Running Specific Tests

```bash
# Run all unit tests
npx vitest run server/__tests__/unit

# Run all integration tests
npx vitest run server/__tests__/integration

# Run tests matching a pattern
npx vitest run -t "auth"

# Run tests in watch mode (re-run on file changes)
npx vitest

# Run with specific environment
NODE_ENV=test pnpm test
```

## Test Environment

Tests use a dedicated test configuration (`vitest.config.ts`):

- **Environment**: `node` for server tests, `jsdom` for client tests
- **Setup files**: Global test setup (mock database, env vars)
- **Timeout**: 30 seconds default, configurable per test
- **Parallel**: Tests run in parallel by default; use `--pool=forks` for database tests

## CI Integration

Tests run automatically in CI (`.github/workflows/ci.yml`):

```yaml
- name: Run tests
  run: pnpm test
```

CI uses a test database instance provisioned via the Supabase test project.

## Best Practices

1. **Isolated tests** — Each test should set up its own data and clean up after
2. **Mock external APIs** — Never call Stripe, OpenAI, or SendGrid in tests
3. **Test edge cases** — Empty inputs, boundary values, unauthorized access
4. **Use `.test.ts` suffix** — Vitest auto-discovers files matching `*.test.ts`
5. **Group related tests** — Use `describe` blocks for logical grouping
6. **Test RBAC** — Verify that each procedure enforces correct authorization
7. **Test rate limiting** — Verify rate limit headers are returned correctly
8. **Keep tests fast** — Unit tests should run in milliseconds, integration tests in seconds

## Smoke Tests

Operational smoke tests are in `scripts/`:

```bash
pnpm smoke:runtime          # Runtime health check (basic)
pnpm smoke:runtime:strict   # Strict mode with assertions
pnpm smoke:scale            # Load/scale smoke test
pnpm prod:preflight         # Production readiness check
pnpm prod:preflight:strict  # Strict production preflight
pnpm db:doctor              # Database health check
```

## Writing New Tests

When adding a new feature:

1. Write unit tests for pure functions/logic first
2. Write integration tests for the tRPC procedure
3. Test with and without valid authentication
4. Test with different role levels (analyst vs admin)
5. Test input validation (invalid/missing fields)
6. Test error handling paths
7. Add to CI if it's a critical path
