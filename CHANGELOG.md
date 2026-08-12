# Changelog

All notable changes to the DJAC Compliance Management SaaS Platform are documented in this file.

## [Unreleased] - 2026-08-12

### Production-Readiness Audit Fixes

- **DATE:** 2026-08-12 | **FILE:** `server/_core/readiness.ts` | **ISSUE:** billing readiness reported `ready:false` — missing `STRIPE_PRICE_ENTERPRISE_QUARTERLY` and `STRIPE_PRICE_ENTERPRISE_BIANNUAL` in expected price ID list | **ROOT CAUSE:** env list omitted 2 of the 12 configured price IDs | **FIX:** added both keys | **TEST:** readiness endpoint reports `ready:true`, "fully configured with 12 price ids" | **RESULT:** PASS
- **DATE:** 2026-08-12 | **FILE:** `server/_core/admin-dashboard-router.ts` | **ISSUE:** (P0 latent) `requireAdminSession` only verified cookie existence, not validity | **ROOT CAUSE:** middleware lacked session verification; not exploitable because cookie-parser is not installed, but broken under any future cookie middleware | **FIX:** rewrote middleware to use `getAdminCookie`/`verifySession` (JWT + DB revoke check) from `yalla-admin-router` | **TEST:** 10-test `server/__tests__/integration/admin-security.test.ts` (forged cookie 401, wrong-secret JWT 401, login 200, logout revocation 401) | **RESULT:** PASS
- **DATE:** 2026-08-12 | **FILE:** `server/_core/yalla-admin-router.ts` | **ISSUE:** admin dashboard routes never received the session cookie (browser did not send `Path=/api/yalla-admin` cookie to `/api/admin-dashboard/*`) | **ROOT CAUSE:** cookie scoped to `/api/yalla-admin` | **FIX:** `ADMIN_COOKIE_PATH="/api"`, updated `clearCookie` on logout | **TEST:** login `Set-Cookie: Path=/api; HttpOnly; SameSite=Strict`, both routers return 200 with session | **RESULT:** PASS
- **DATE:** 2026-08-12 | **FILE:** `server/_core/yalla-admin-router.ts` | **ISSUE:** admin logout did not revoke sessions without a database | **ROOT CAUSE:** revocation was DB-only; in-memory fallback never invalidated JWTs | **FIX:** in-memory `revokedSessions` map + `revokeAdminSession`/`isAdminSessionRevoked` exports, wired into `requireSession`, `handleMe`, and admin-dashboard middleware | **TEST:** logout then subsequent request → 401 | **RESULT:** PASS
- **DATE:** 2026-08-12 | **FILE:** `server/_core/yalla-admin-router.ts` | **ISSUE:** admin queries used MySQL syntax incompatible with the production PostgreSQL database | **ROOT CAUSE:** `CURDATE()`, `DATE(col)`, `DATE_SUB(NOW(), INTERVAL n MINUTE/DAY)` are MySQL-isms | **FIX:** `CURRENT_DATE`, `::date`, `NOW() - INTERVAL 'n minutes'/'7 days'` (6 occurrences) | **TEST:** typecheck + admin API 200 responses | **RESULT:** PASS
- **DATE:** 2026-08-12 | **FILE:** `scripts/locale-audit.mjs` | **ISSUE:** audit script crashed (`f;` stray token) and used 4-space indent regexes against 2-space locale blocks | **ROOT CAUSE:** broken script + regex mismatch | **FIX:** removed stray token, corrected indent regexes | **TEST:** script runs, reports missing keys per locale | **RESULT:** PASS
- **DATE:** 2026-08-12 | **FILE:** `client/src/contexts/LocaleContext.tsx` | **ISSUE:** 219 keys used via `t("key", "English fallback")` were absent from the `en` and `ar` dictionaries, 253 absent from `zh` (Arabic/Chinese users saw English fallbacks) | **ROOT CAUSE:** locale dictionaries incomplete vs. code usage | **FIX:** added 219 `en`, 219 `ar`, 253 `zh` entries (219 new keys + 34 zh-only keys) with Arabic and Chinese translations, inserted in sorted positions | **TEST:** `locale-audit.mjs` reports 0 missing in all locales; tsc/eslint clean; locale unit tests pass; full suite 568 passed / 26 skipped | **RESULT:** PASS
- **DATE:** 2026-08-12 | **FILE:** `scripts/entrypoint.sh`, `scripts/production-preflight.mjs` | **ISSUE:** production entrypoint and preflight validated only 10 of 12 Stripe price env keys, tolerating partial billing config that the readiness endpoint rejects | **ROOT CAUSE:** both key lists predated the enterprise quarterly/biannual prices | **FIX:** added `STRIPE_PRICE_ENTERPRISE_QUARTERLY` and `STRIPE_PRICE_ENTERPRISE_BIANNUAL` to both lists | **TEST:** preflight runs (19 checks, BLOCKED locally without prod env as expected); env.ts/readiness/verify-stripe-config all reference the canonical 12-key `STRIPE_PRICE_ENV_KEYS` | **RESULT:** PASS
- **DATE:** 2026-08-12 | **FILE:** `server/_core/yalla-admin-router.ts` | **ISSUE:** lint error `ADMIN_API_PATH` declared but never used after cookie-path change | **ROOT CAUSE:** constant orphaned by the `ADMIN_COOKIE_PATH` refactor | **FIX:** removed unused constant | **TEST:** `pnpm verify:all` clean (lint 0 errors, tsc clean, 568 passed / 31 skipped, build OK) | **RESULT:** PASS
- **DATE:** 2026-08-12 | **FILE:** `server/__tests__/integration/admin-security.test.ts` | **ISSUE:** deny matrix incomplete — react-login GET, bootstrap token gate, revoked-session replay, summary endpoint coverage missing | **ROOT CAUSE:** initial suite covered core auth paths only | **FIX:** added 5 deny-matrix tests (GET react-login rejected, bootstrap without/invalid token rejected, revoked-JWT replay 401, summary requires session) | **TEST:** 15/15 PASS against live server | **RESULT:** PASS

### Core Platform

- Multi-tenant SaaS with organization isolation and RBAC (7 platform roles + 4 organization roles)
- Compliance Framework Library with PDPA, PDPL, NCA-ECC, CSL, DSL support
- Cross-framework mapping and jurisdiction-based filtering
- Global compliance registry with regulatory change tracking

### AI & Intelligence

- 8-stage AI compliance assessment pipeline (Gatekeeper → Intake → Extractor → RAG → Judge → Synthesizer → Validator → Reporter)
- BullMQ-based AI job queue with Redis backing (in-memory fallback for development)
- WebSocket streaming for real-time AI job status
- OpenAI GPT-4o integration for compliance reasoning
- Agent Swarm orchestration support (Manus Forge)
- RAG-based control retrieval from framework knowledge base

### Authentication & Authorization

- Triple authentication path: Clerk OAuth → Supabase Auth → Local JWT with dev bypass
- OAuth support: Google, GitHub
- TOTP MFA with QR setup and backup codes
- OTP-based password reset (SHA-256 hashed, 5-minute expiry)
- Rate limiting: 10 req/min auth, 120 req/min general, 300/5min admin
- JWT session management with HTTP-only Secure SameSite cookies
- 32 permission-gated modules with 6 permission flags per module

### Compliance Management

- **Vendor Risk Management**: Assessment, scoring, tiering, compliance profiles, transfer checking
- **Continuous Threat Exposure Management (CTEM)**: Assessments, findings, remediation tracking
- **Incident Management**: Reporting, tracking, regulatory notification timelines
- **Remediation Planning**: Plans, tasks, evidence collection
- **Risk Register**: Likelihood/impact scoring, treatment assignment
- **Audit Scheduling**: Recurring audits with findings and checklists
- **Policy Manager**: Versioned policies with staff acknowledgment tracking
- **Data Subject Request (DSR)**: Request tracking and fulfillment
- **Evidence Locker**: Secure evidence containers and file uploads
- **Security Maturity Assessment**: Category-based scoring and benchmarking
- **Asset Inventory**: IT asset register with classification
- **Threat Intelligence**: Feed management, indicator tracking
- **Compliance Calendar**: Regulatory deadline tracking with email alerts
- **Scorecard**: Compliance score snapshots per reporting period
- **Compliance Simulation**: What-if scenario modeling
- **Compliance Chat**: AI-powered conversational compliance assistant

### Reporting & Delivery

- 6 report types (gap analysis, risk assessment, vendor compliance, audit, maturity, incident)
- 3 locales: English, Arabic, Chinese (en/ar/zh)
- PDF generation via pdf-lib with i18n font support
- DOCX generation with formatted templates
- Email delivery with Resend and SMTP providers
- Scheduled report delivery with cron-based scheduler
- Secure download links with expiry

### Billing & Subscriptions

- Stripe integration with hosted checkout and customer portal
- 5 plans: Free, Starter, Pro, Enterprise, Custom
- 4 billing intervals: monthly, quarterly, biannual, annual
- Trial management with automated expiry reminders
- Webhook processing with signature verification
- Entitlement-based feature gating

### Infrastructure

- Express 4 + tRPC 11 backend with Zod 4 validation
- React 19 SPA frontend with Vite 7, Tailwind CSS 4, Radix UI
- PostgreSQL 17 via Supabase with Drizzle ORM
- Supabase Edge Functions (Deno): auth-hooks, compliance-webhook, report-export, send-notification
- Redis (Upstash/ioredis) for rate limiting, AI queue, caching
- Pino structured logging with development pretty-print
- Sentry error monitoring (10% trace sample production, 100% development)

### Security

- Argon2id/bcrypt password hashing (12 rounds)
- Row Level Security (RLS) on all database tables
- CSP, HSTS, X-Frame-Options, X-Content-Type-Options headers
- Stripe webhook signature verification
- CORS origin restriction
- Yalla Admin portal with 4-layer security (URL token, IP allowlist, JWT session, login lockout)
- API key management (`djac_` prefixed keys for programmatic access)

### Background Schedulers

- Interaction retention scheduler (configurable TTL, default 90 days)
- Trial reminder scheduler (email notifications for expiring trials)
- Deadline alert scheduler (regulatory deadline notifications)
- Scheduled report delivery (cron-based report generation and email)
- SSE broadcast bus for admin dashboard real-time events

### CI/CD

- GitHub Actions CI pipeline: lint, typecheck, test, build
- Automated staging deployment (develop branch)
- Automated production deployment (main branch)
- Supabase migration and function deployment workflow
- Vercel OIDC for secure machine identity
- Docker production image with entrypoint script

### Developer Experience

- pnpm monorepo (client + server + shared)
- TypeScript 5.9 strict mode
- ESLint flat config with typescript-eslint
- Prettier formatting
- Vitest with 40+ test files
- Pre-commit hooks via Husky
- 43 operational scripts (seed, smoke, load tests, preflight, db-doctor)
- Dev auth bypass for local development
- In-memory AI queue mode for development without Redis
