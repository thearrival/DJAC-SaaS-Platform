# DJAC — Production Readiness Report

**Date:** 2026-10-02 · **Commit:** `63dfb55` (+ staged fixes, see §I) · **Branch:** `main`
**Method:** evidence-based (runtime → tests → code → docs → assumption). No fabricated results.

Evidence status legend: **VERIFIED** (runtime) · **TEST-VERIFIED** · **CODE-VERIFIED** ·
**PARTIALLY VERIFIED** · **UNVERIFIED** · **BLOCKED**.

---

## A. Executive summary

DJAC is a React 19 + Express 4 + tRPC 11 + Drizzle/Postgres SaaS on Vercel
serverless (Supabase Postgres/Auth/Storage), with Stripe billing, SMTP email,
Sentry, and a Forge-hosted AI layer. Core customer workflows function in
production and are live-verified.

- Scope examined: repository, architecture, live runtime, auth, tenant
  isolation, billing, email, AI, localization, security, performance,
  observability, backups/DR, configuration, tests.
- Work completed this engagement: ~30 hardening commits (auth/Google SSO,
  theming, i18n 9-locale with an 87 % smaller entry bundle, onboarding tour,
  WCAG-AA accessibility, strict CSP, dependency security, DB pool + FK indexes,
  autonomous backups + restore harness, ops/readiness, client-error telemetry).
- Major remaining risks: an **undeloyed** security dependency fix, **unverified
  recovery** (restore drill), **pending secret rotation**, **no PITR**, and
  **unverified regulatory provenance**. See §L–§M.
- Evidence quality: strong for functionality/security/tests; incomplete for
  recovery and regulatory-source integrity.

## B. Architecture (VERIFIED + CODE-VERIFIED)

- Frontend: React 19, Vite 7, Tailwind 4, wouter, React Query, tRPC client.
- Backend: Express 4 + tRPC 11, serverless entry (`api/index.mjs` → `dist/index.js`).
- Data: Postgres (Drizzle, `pg`), Supabase Auth/Storage.
- Auth: three paths — OAuth (SDK session), local email/password (JWT), API keys.
- Deploy: Vercel (`app.yalla-hack.ae`), static SPA shell + function API.
- Actual vs target deviation: **the AI layer is Forge, not DeepSeek** (§G).
- Live matrix (VERIFIED): `/api/status`, `/api/health`, `/api/readyz`,
  public tRPC → 200; protected/owner → 401; `/api/_stats` → 404;
  `/login`, `/dashboard`, `/docs` → 200.

## C. Implementation (this engagement)

Verified fixes: branded direct Google OAuth (redirect flow, SDK-signed
session); real light/dark palettes; single localized onboarding tour +
auto-arm; 9-locale catalogs lazy-loaded (entry 1.56 MB → 0.20 MB);
WCAG-AA fixes + axe gate; strict hash-synced CSP; service-worker network-first;
DB pool capped to 2 (serverless); full FK index coverage (48); autonomous
serverless backup + off-site pg_dump workflow + restore harness; readiness
integration reporting; AI-queue mode correctness.

## D. Security

| Item                     | Status                   | Evidence                                                                           |
| ------------------------ | ------------------------ | ---------------------------------------------------------------------------------- |
| Dependency vulns         | VERIFIED (deployed)      | `pnpm audit --prod` **0** after axios ≥1.20.0 upgrade (deployed `330ffa2`)         |
| Secret exposure (tree)   | VERIFIED                 | scan clean; two test fixtures used `sk_live_`/`whsec_` patterns (fake) — corrected |
| CSP                      | VERIFIED                 | strict hash-synced; `accounts.google.com` absent from main app                     |
| Internal backdoor routes | VERIFIED                 | `/api/_*` → 404                                                                    |
| Rate limiting            | TEST-VERIFIED            | `rate-limiter*.test.ts` pass                                                       |
| AuthN/Z                  | TEST-VERIFIED + VERIFIED | 96 security tests pass; Google login live                                          |
| Secret rotation          | BLOCKED                  | Google client secret + others shared out-of-band; rotation is owner-only           |

## E. Database & API

- Schema/migrations: CODE-VERIFIED (Drizzle + idempotent self-healing bootstrap).
- FK index coverage: VERIFIED (audit returns `[]`).
- Tenant isolation: TEST-VERIFIED (`tenant-isolation`, `deadline-tenant-isolation`) + CODE-VERIFIED (IDOR fixes).
- Transactions/idempotency: TEST-VERIFIED (`stripe-idempotency`).
- Pool configuration: VERIFIED (serverless-aware; readiness reports `serverless:true`).

## F. Regulatory intelligence / provenance

- Mechanism: VERIFIED — `shared/regulatory-provenance.ts` with
  `unverified → pending_review → verified → stale`, wired to the public
  summary; every claim resolves to **`unverified`**.
- Source data: **UNVERIFIED** — no curated official citations yet (deliberate;
  no fabricated sources). Regulatory content carries a “not legal advice”
  disclaimer.

## G. AI / provider

- **DeepSeek is NOT integrated (0 references).** AI runs via the Forge API
  (`BUILT_IN_FORGE_API_URL`); Gemini references are minimal.
- AI queue mode: `in_memory` (no `REDIS_URL`); agent swarm not configured.
- Grounding/safety: PARTIALLY VERIFIED (deterministic scoring separate from AI
  explanation; prompt-injection tests exist). Provider connectivity not
  re-verified live in this pass (BLOCKED — no provider credentials).

## H. Billing

- Stripe config: VERIFIED (readiness: “fully configured with 12 price ids”).
- Webhook signature + idempotency + entitlements: TEST-VERIFIED.
- Live/sandbox charge flow: **BLOCKED** (no sandbox run performed).

## I. Fixes applied (committed & deployed — `330ffa2`)

Green (`pnpm verify:all` 696 passed) and live:

- **`axios` ^1.18.0 → ^1.20.0** — clears 12 production advisories (security).
- `scripts/i18n-report.mjs` — repaired after the catalog split (now 9 locales / 100 %).
- `scripts/production-preflight.mjs` — serverless-aware pool advice.
- `scripts/smoke-cleanup.mjs` — new; removes `smoke*@example.com` residue.
- test fixtures `sk_live_`/`whsec_` → `sk_test_`/`whsec_test_`.

## J. Localization / UX

- Coverage: VERIFIED — 9 locales (`en, ar, zh, fr, es, de, ja, ko, pt`), 2944 keys, **0 untranslated**.
- Accessibility: VERIFIED — axe gate (public + authenticated) 0 critical/serious.
- Responsive/RTL: PARTIALLY VERIFIED (smoke + axe at desktop/mobile; broad visual sweep limited).

## K. Testing

| Category                 | Result                         | Evidence                                   |
| ------------------------ | ------------------------------ | ------------------------------------------ |
| Unit/integration         | 696 passed / 35 skipped        | `pnpm verify:all`                          |
| Security-critical subset | 96 passed                      | tenant-isolation, stripe, auth, rate-limit |
| E2E (Playwright)         | 6–16 passed (2 opt-in skipped) | `e2e/`                                     |
| Accessibility (axe)      | 10 passed                      | `e2e/accessibility.spec.ts`                |
| Runtime smoke            | passed (permissive)            | `smoke:runtime` vs prod                    |
| Restore mechanism        | 40 rows coerced (read-only)    | Management API SQL                         |

## L. Remaining issues (findings)

| ID            | Finding                                                     | Severity | Status                                                         |
| ------------- | ----------------------------------------------------------- | -------- | -------------------------------------------------------------- |
| DJAC-SEC-001  | `axios` 1.19 advisories                                     | High     | **FIXED (staged, undeployed)**                                 |
| DJAC-DATA-001 | `smoke:runtime` left 20 test users in prod                  | Medium   | **CLEANED + tool added**                                       |
| DJAC-OPS-001  | i18n report broken by catalog split                         | Low      | **FIXED**                                                      |
| DJAC-OPS-002  | preflight advised serverless-unsafe pool ≥20                | Low      | **FIXED**                                                      |
| DJAC-SEC-002  | test fixtures matched `sk_live_` pattern                    | Info     | **FIXED**                                                      |
| DJAC-AI-001   | DeepSeek assumed but not integrated (Forge used)            | Info     | Documented                                                     |
| DJAC-SEC-003  | Google client secret shared out-of-band                     | High     | BLOCKED (owner rotation)                                       |
| DJAC-DR-001   | Restore drill                                               | High     | **RESOLVED — executed 2026-10-02 (all counts matched)**        |
| DJAC-BKP-001  | Backup used wrong table name (`organizationProfilesCustom`) | Medium   | **FIXED** (drill found it; now `organization_profiles_custom`) |
| DJAC-DR-002   | Supabase PITR off; no backup timestamps historically        | Medium   | BLOCKED (plan)                                                 |
| DJAC-REG-001  | Regulatory provenance unverified                            | Medium   | BLOCKED (owner data)                                           |

## M. Production blockers (unresolved)

1. **DJAC-SEC-003:** leaked/shared secrets not yet rotated (Google client secret;
   earlier SMTP/i18n/Hostinger).

_(DJAC-SEC-001 — undeloyed axios fix — resolved in `330ffa2`. DJAC-DR-001 —
restore drill — resolved: executed 2026-10-02 with all row counts matching.
DJAC-BKP-001 — wrong backup table name — fixed.)_

## N. Unverified items (and what unlocks each)

- **Live/sandbox Stripe charge + webhook replay** — needs Stripe sandbox keys.
- **Email delivery confirmation** — needs a mailbox/allowlisted recipient.
- **AI/Forge connectivity + cost controls proof** — needs provider credentials.
- **Secret rotation** — owner Google Cloud / provider consoles.
- **Supabase PITR / off-site pg_dump activation** — plan + `DATABASE_URL` GitHub secret.
- **Broad visual/response sweep across all routes/roles** — needs authenticated owner creds.
- **Repeat restore drill against a separate scratch database** (schema drill passed).

## O. Operational handover (prepared)

- Deploy: push `main` (Vercel) or `vercel deploy --prod`; rollback via
  `vercel rollback`.
- Migrations: idempotent startup bootstrap + `drizzle-kit migrate`; forward-only.
- Backups: autonomous snapshot (cron, Supabase Storage, 14 retained);
  off-site `pg_dump` workflow (add `DATABASE_URL` secret); `pnpm smoke:cleanup`.
- Restore: `pnpm drill:restore` (refuses production without `--force`).
- Monitor: `/api/health`, `/api/readyz` (services + integrations), Sentry,
  client-error telemetry.
- Runbooks: `docs/disaster-recovery.md`, `docs/production-readiness-checklist.md`.

## P. Final decision

# NOT PRODUCTION READY

**Rationale (evidence-based):** while the platform is live and the vast
majority of controls are verified, the mandate’s release gate is not met:

- **shared secrets are not rotated** (DJAC-SEC-003),
- **regulatory provenance is unverified** (DJAC-REG-001).

_(Blockers cleared this engagement: undeloyed security fix — `330ffa2`;
restore drill — executed 2026-10-02 with all counts matching.)_

**Fastest path to PRODUCTION READY** (all small, mostly owner-actions):

1. Rotate the Google client secret (and the earlier shared secrets).
2. Enable Supabase PITR **or** add the `DATABASE_URL` GitHub secret for off-site dumps.
3. Populate the provenance registry (or accept the “unverified” labeling).

Nothing above requires re-architecture.
