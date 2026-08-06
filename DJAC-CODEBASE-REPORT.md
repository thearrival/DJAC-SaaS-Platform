# DJAC-SaaS (app.yalla-hack.ae) — Complete Codebase Inventory

> Generated: comprehensive analysis of the production source code for https://app.yalla-hack.ae
> Repository: `D:\Github\DJAC-SaaS`
> Supabase Project: `gcsoeumdjrejfxuovfcw` (ap-northeast-2, AWS Tokyo)
> Package Manager: `pnpm@10.4.1`
> Runtime: Node 20, TypeScript 5.9.3, React 19.1, Express 4.21

---

## 1. Architecture Overview

| Layer          | Technology                                     | Details                                             |
| -------------- | ---------------------------------------------- | --------------------------------------------------- |
| Frontend       | React 19 + TypeScript                          | Vite 7, tRPC 11, React Query 5, wouter routing      |
| Backend        | Express 4 + tRPC 11                            | Node.js, Drizzle ORM 0.45, pg (PostgreSQL driver)   |
| Database       | PostgreSQL 17                                  | Supabase managed, drizzle-kit migrations            |
| Edge Functions | Supabase Edge Functions (Deno)                 | 4 functions on `std@0.224.0`                        |
| Auth           | Clerk + Supabase Auth + Local JWT + Dev Bypass | Triple path + dev mode                              |
| AI             | OpenAI GPT-4o + Manus Forge                    | 8-stage assessment pipeline                         |
| Billing        | Stripe v20                                     | 5 plans × 4 intervals, 20 price IDs                 |
| Hosting        | Vercel (serverless) + Docker                   | Vercel OIDC for CI/CD                               |
| Monorepo       | Turborepo-style                                | `server/` + `client/` + `shared/` in single package |
| Logging        | Pino v9                                        | Structured JSON log, pino-pretty in dev             |
| Monitoring     | Sentry v10                                     | 10% trace sample in production, 100% in dev         |
| Redis          | ioredis v5                                     | Rate limiting, AI queue, session (optional)         |

---

## 2. External Domains, APIs & Services

### Production Application Endpoints

| URL                                             | Purpose                                             | Source                               |
| ----------------------------------------------- | --------------------------------------------------- | ------------------------------------ |
| `https://app.yalla-hack.ae`                     | Main SPA                                            | `.env.production.example`            |
| `https://app.yalla-hack.ae/api/trpc/*`          | tRPC API (~200+ procedures)                         | `server/routers.ts`                  |
| `https://app.yalla-hack.ae/api/health`          | Health check (status, ok, timestamp, scale profile) | `server/_core/index.ts:217`          |
| `https://app.yalla-hack.ae/api/healthz`         | Liveness probe (200)                                | `server/_core/index.ts:218`          |
| `https://app.yalla-hack.ae/api/readiness`       | Readiness (DB, Redis, Stripe, AI, scaling)          | `server/_core/index.ts:221`          |
| `https://app.yalla-hack.ae/api/readyz`          | Alias for readiness                                 | `server/_core/index.ts:222`          |
| `https://app.yalla-hack.ae/health`              | Alias for health                                    | `server/_core/index.ts:217`          |
| `https://app.yalla-hack.ae/readiness`           | Alias for readiness                                 | `server/_core/index.ts:221`          |
| `https://app.yalla-hack.ae/api/oauth/callback`  | OAuth redirect handler                              | `server/_core/oauth.ts:13`           |
| `https://app.yalla-hack.ae/api/webhooks/stripe` | Stripe webhook (raw body)                           | `server/_core/index.ts:184`          |
| `https://app.yalla-hack.ae/api/csp-report`      | CSP violation report collector                      | `server/_core/index.ts:228`          |
| `https://app.yalla-hack.ae/api/yalla-admin/*`   | Yalla admin panel (12 endpoints)                    | `server/_core/yalla-admin-router.ts` |
| `https://app.yalla-hack.ae/api/sse`             | (built into admin) SSE event stream                 | `server/services/sse-bus.ts`         |
| `https://app.yalla-hack.ae/ws/ai-jobs`          | WebSocket AI job streaming                          | `server/ai/ws.ts:99`                 |

### Third-Party Domains & Services

| Domain/Service                             | Integration      | Details                                     |
| ------------------------------------------ | ---------------- | ------------------------------------------- |
| `api.openai.com`                           | AI — GPT-4o      | Compliance assessment reasoning engine      |
| `api.stripe.com`                           | Billing          | Subscriptions, checkout sessions, webhooks  |
| `gcsoeumdjrejfxuovfcw.supabase.co`         | Database         | PostgreSQL pooler (port 6543, Tokyo/AWS)    |
| `gcsoeumdjrejfxuovfcw.pooler.supabase.com` | Supabase pooler  | Transaction pooler                          |
| `*.clerk.com`                              | OAuth Auth       | Clerk SDK session management                |
| `*.sentry.io`                              | Error tracking   | Client + server error reporting             |
| `fonts.googleapis.com`                     | Fonts            | CSS font loading                            |
| `fonts.gstatic.com`                        | Fonts            | Font file serving                           |
| `resend.com`                               | Email            | Alternative email provider (via SDK)        |
| `manus.im` / Forge API                     | AI — Agent Swarm | Notification service + fallback AI          |
| `github.com`                               | OAuth            | GitHub login (Supabase auth configured)     |
| `google.com` / `googleapis.com`            | OAuth            | Google login (Supabase auth configured)     |
| `yalla-hack.net`                           | Email            | Default SMTP from: `noreply@yalla-hack.net` |

### Bypassed Rate Limits (health endpoints)

- `/api/health`, `/api/healthz`, `/api/readiness`, `/api/readyz`, `/health`, `/healthz`, `/readiness`, `/readyz`
- All allowed unlimited access for load balancer health checks

---

## 3. Environment Variables (70+ across 12 categories)

### App Core (10)

| Variable               | Default                 | Description                                        |
| ---------------------- | ----------------------- | -------------------------------------------------- |
| `NODE_ENV`             | `development`           | Runtime environment                                |
| `APP_URL`              | `http://localhost:3000` | Application base URL (production guard ≥ 32 chars) |
| `VITE_APP_ID`          | `""`                    | OAuth app identifier                               |
| `VITE_APP_TITLE`       | `"App"`                 | Browser tab title                                  |
| `VITE_APP_DESCRIPTION` | —                       | Meta description for SEO                           |
| `VITE_OG_IMAGE`        | —                       | Open Graph image URL                               |
| `JWT_SECRET`           | dev fallback            | HS256 signing key (production guard ≥ 32 chars)    |
| `COOKIE_SECRET`        | (same as JWT_SECRET)    | Cookie encryption                                  |
| `DATABASE_URL`         | —                       | PostgreSQL connection string                       |
| `OWNER_OPEN_ID`        | —                       | Platform owner identifier for system notifications |
| `OAUTH_SERVER_URL`     | —                       | External OAuth portal base URL                     |

### Supabase (3)

| Variable                    | Description                                |
| --------------------------- | ------------------------------------------ |
| `SUPABASE_URL`              | `https://gcsoeumdjrejfxuovfcw.supabase.co` |
| `SUPABASE_ANON_KEY`         | Anonymous client key                       |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (admin bypass RLS)            |

### Stripe / Billing (14)

| Variable                          | Purpose                        |
| --------------------------------- | ------------------------------ |
| `STRIPE_SECRET_KEY`               | `sk_live_...` or `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET`           | `whsec_...`                    |
| `STRIPE_PRICE_STARTER_MONTHLY`    | Price ID                       |
| `STRIPE_PRICE_STARTER_QUARTERLY`  | Price ID                       |
| `STRIPE_PRICE_STARTER_BIANNUAL`   | Price ID                       |
| `STRIPE_PRICE_STARTER_ANNUAL`     | Price ID                       |
| `STRIPE_PRICE_PRO_MONTHLY`        | Price ID                       |
| `STRIPE_PRICE_PRO_QUARTERLY`      | Price ID                       |
| `STRIPE_PRICE_PRO_BIANNUAL`       | Price ID                       |
| `STRIPE_PRICE_PRO_ANNUAL`         | Price ID                       |
| `STRIPE_PRICE_ENTERPRISE_MONTHLY` | Price ID                       |
| `STRIPE_PRICE_ENTERPRISE_ANNUAL`  | Price ID                       |

### AI & Orchestration (11)

| Variable                   | Default                              | Description                        |
| -------------------------- | ------------------------------------ | ---------------------------------- |
| `OPENAI_API_KEY`           | —                                    | OpenAI API key                     |
| `AI_ORCHESTRATOR_ENABLED`  | `true`                               | Toggle AI pipeline                 |
| `AI_QUEUE_MODE`            | `in_memory`                          | `redis` or `in_memory`             |
| `AI_JOB_HISTORY_FILE`      | `.runtime/ai-job-history.json` (dev) | Path for persisted job history     |
| `REDIS_URL`                | —                                    | Redis connection URL               |
| `AGENT_SWARM_BASE_URL`     | —                                    | Manus Forge base URL               |
| `BUILT_IN_FORGE_API_URL`   | —                                    | Built-in Forge API                 |
| `BUILT_IN_FORGE_API_KEY`   | —                                    | Forge API key                      |
| `AI_WEBSOCKET_PATH`        | `/ws/ai-jobs`                        | WebSocket path for job streaming   |
| `AI_VALIDATOR_MAX_RETRIES` | —                                    | Max retries for validator stage    |
| `AI_JOB_TIMEOUT_MS`        | —                                    | Job timeout in ms                  |
| `AI_RAG_TOP_K`             | —                                    | Number of RAG controls to retrieve |

### SMTP / Email (7)

| Variable         | Default                  | Description                  |
| ---------------- | ------------------------ | ---------------------------- |
| `SMTP_HOST`      | —                        | SMTP server hostname         |
| `SMTP_PORT`      | —                        | SMTP port                    |
| `SMTP_USER`      | —                        | SMTP username                |
| `SMTP_PASS`      | —                        | SMTP password                |
| `SMTP_FROM`      | `noreply@yalla-hack.net` | From address                 |
| `SMTP_SECURE`    | —                        | Use TLS                      |
| `RESEND_API_KEY` | —                        | Resend alternative email API |

### Auth / OAuth (8)

| Variable                     | Description                    |
| ---------------------------- | ------------------------------ |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk frontend publishable key |
| `CLERK_SECRET_KEY`           | Clerk backend secret           |
| `GITHUB_CLIENT_ID`           | GitHub OAuth                   |
| `GITHUB_CLIENT_SECRET`       | GitHub OAuth secret            |
| `GOOGLE_CLIENT_ID`           | Google OAuth                   |
| `GOOGLE_CLIENT_SECRET`       | Google OAuth secret            |

### Dev Bypass (5)

| Variable           | Default           | Description                          |
| ------------------ | ----------------- | ------------------------------------ |
| `DEV_AUTH_BYPASS`  | `false`           | Enable dev bypass (development only) |
| `DEV_AUTH_OPEN_ID` | `local-dev-user`  | Dev user OpenID                      |
| `DEV_AUTH_NAME`    | `Local Developer` | Dev user name                        |
| `DEV_AUTH_EMAIL`   | `""`              | Dev user email                       |
| `DEV_AUTH_ROLE`    | `user`            | Dev user role override               |

### Sentry (3)

| Variable            | Description       |
| ------------------- | ----------------- |
| `SENTRY_DSN`        | Sentry DSN        |
| `VITE_SENTRY_DSN`   | Client Sentry DSN |
| `SENTRY_AUTH_TOKEN` | Sentry auth token |

### Vercel (3)

| Variable            | Description                          |
| ------------------- | ------------------------------------ |
| `VERCEL_OIDC_TOKEN` | Vercel OIDC (machine identity)       |
| `VERCEL_URL`        | Auto-set by Vercel                   |
| `VERCEL_ENV`        | `production`/`preview`/`development` |

### Yalla Admin (6)

| Variable                        | Description                                         |
| ------------------------------- | --------------------------------------------------- |
| `YALLA_ADMIN_SECRET`            | URL access token                                    |
| `YALLA_ADMIN_USERNAME`          | Admin username (default: `yalla_admin`)             |
| `YALLA_ADMIN_PASSWORD`          | bcrypt hash of password                             |
| `YALLA_ADMIN_IP_ALLOWLIST`      | CSV CIDRs                                           |
| `YALLA_ADMIN_JWT_SECRET`        | Admin JWT signing secret (falls back to JWT_SECRET) |
| `YALLA_ADMIN_SESSION_TTL_HOURS` | Session TTL (default: 8h)                           |

### HTTP / Server Tuning (5)

| Variable                     | Default | Description                                     |
| ---------------------------- | ------- | ----------------------------------------------- |
| `PORT`                       | `3000`  | HTTP listen port                                |
| `HTTP_KEEP_ALIVE_TIMEOUT_MS` | —       | Keep-alive timeout                              |
| `HTTP_HEADERS_TIMEOUT_MS`    | —       | Headers timeout                                 |
| `HTTP_REQUEST_TIMEOUT_MS`    | —       | Request timeout                                 |
| `DATABASE_POOL_SIZE`         | —       | PostgreSQL pool size (prod recommendation ≥ 20) |

### Interaction Retention (4)

| Variable                               | Description                |
| -------------------------------------- | -------------------------- |
| `INTERACTION_RETENTION_AUTORUN`        | Enable retention scheduler |
| `INTERACTION_RETENTION_DAYS`           | Retention period in days   |
| `INTERACTION_RETENTION_INTERVAL_HOURS` | Scheduler interval         |

### Other (5+)

| Variable                      | Description                                |
| ----------------------------- | ------------------------------------------ |
| `COMPLIANCE_CACHE_TTL_MS`     | Compliance data cache TTL                  |
| `ALLOW_IN_MEMORY_PERSISTENCE` | In-memory DB fallback (disabled in Docker) |
| `REPORT_TEMPLATE_NAME`        | Report template name                       |
| `OAUTH_PORTAL_URL`            | External OAuth portal URL                  |
| `VITE_API_URL`                | API proxy path (`/api`)                    |

---

## 4. Database Schema (drizzle/schema.ts — 1211 lines)

### 70+ Tables

**Auth & Identity (8)**

- `users` — All users (id, openId, name, email, loginMethod, role, status, locale, timestamps)
- `localUsers` — Email/password users (hashed password, TOTP secret, MFA backup codes, email verified at)
- `sessions` — Active session tracking
- `otpCodes` — SHA-256 hashed OTPs (identifier, code hash, purpose, attempts, expiresAt)
- `apiKeys` — `djac_<hex>` prefixed keys (key hash, name, userId, organizationId, lastUsedAt)
- `accessRequests` — Org access requests (fullName, email, orgName, useCase, status)
- `userOnboarding` — Onboarding wizard progress (stage, accountIntent)
- `consultationRequests` — Consultation signups

**Organizations (2)**

- `organizations` — Multi-tenant (slug, name, plan, trial dates, isActive, maxSeats, billingEmail, primaryJurisdiction, trial reminder flags)
- `organizationMembers` — Membership with role

**Compliance Core (6)**

- `frameworks` — Regulatory frameworks (id, code, country, name, description, effectiveDate, authority)
- `complianceControls` — Individual controls (frameworkId, controlCode, category, name, requirement)
- `frameworkRelationships` — Cross-framework mappings
- `vendorAssessments` — AI assessment results per vendor per framework (complianceScore, riskLevel, findings, recommendations)
- `assessmentGaps` — Identified compliance gaps (vendorAssessmentId, framework, gapCode, jurisdiction, severity, description, mitigation, penaltyContext)
- `complianceReports` — Generated report records (organizationId, type, jurisdiction, locale, score, status, metadata)

**Vendors (3)**

- `vendors` — Supply chain vendor profiles (name, industry, jurisdiction, risk tier, tech stack, locale data)
- `vendorContacts` — Point-of-contact (name, email, phone, role)
- `vendorRiskOverrides` — Manual risk score adjustments

**Risk & Incidents (3)**

- `incidents` — Security/compliance incidents (title, severity, status, organizationId, description, timeline)
- `incidentAssignees` — Incident ownership
- `riskRegister` — Risk registry (risk description, category, likelihood, impact, riskScore, status)

**Remediation (3)**

- `remediationPlans` — Remediation workflows (title, description, deadline, status, organizationId)
- `remediationTasks` — Individual actions (planId, assignee, description, dueDate, status)
- `remediationEvidence` — Proof of completion

**Policies (4)**

- `policies` — Compliance policies (name, description, category, status, organizationId)
- `policyVersions` — Version history (policyId, versionNumber, content, effectiveDate, status)
- `policyAcknowledgmentLog` — Staff acknowledgment (userId, policyVersionId, acknowledgedAt)
- `policyCategories` — Categorization

**Audit (4)**

- `auditLogs` — All audit events (category, action, entityType, entityId, outcome, payload, ipAddress, timestamp)
- `auditSchedules` — Planned audits (title, scope, startDate, endDate, status, organizationId)
- `auditFindings` — Results (auditScheduleId, controlId, finding, severity, status)
- `auditChecklists` — Audit checklist items

**Evidence (2)**

- `evidenceLocker` — Evidence containers (name, description, organizationId, status)
- `evidenceFiles` — Uploaded files (evidenceLockerId, fileName, fileType, fileSize, storageUrl, uploadedBy)

**Data Subject Requests (1)**

- `dataSubjectRequests` — DSAR (requesterName, email, requestType, status, dueDate, notes)

**Threat Intelligence (2)**

- `threatIntelFeeds` — Threat data sources (name, url, apiKey, refreshInterval, lastRefreshed)
- `threatIndicators` — IOCs (feedId, indicator, type, severity, firstSeen, lastSeen)

**Billing (3)**

- `subscriptions` — Stripe subscription sync (organizationId, stripeSubscriptionId, plan, interval, amountCents, status, periodStart, periodEnd)
- `billingEvents` — Stripe event log (eventId, type, organizationId, processedAt)
- `invoices` — Invoice records (stripeInvoiceId, subscriptionId, amountPaid, status, paidAt)

**Security Maturity (2)**

- `securityMaturityAssessments` — Maturity scores (organizationId, category, score, level, assessedAt)
- `securityMaturityCategories` — Maturity dimensions (name, description, weight)

**Assets (1)**

- `assetInventory` — IT asset register (name, type, owner, location, classification, status)

**SCM / CTEM (2)**

- `ctemAssessments` — Continuous Threat Exposure Management (vendorId, scope, score, status)
- `ctemFindings` — CTEM findings (assessmentId, finding, severity, remediation)

**Service Requests (1)**

- `serviceRequests` — Support/consultation (organizationId, subject, description, priority, status, assignee)

**Compliance Calendar (2)**

- `complianceDeadlines` — Regulatory deadlines (title, jurisdiction, framework, dueDate, organizationId)
- `complianceDeadlineReminders` — Sent reminder tracking

**Scorecard (1)**

- `scorecardEntries` — Score snapshots (organizationId, score, category, period)

**Notifications (1)**

- `adminNotifications` — System notifications (category, title, content, entityType, entityId, readAt)

**Interaction Logs (1)**

- `userInteractionLogs` — Full activity audit (context, action, entityType, entityId, inputSnapshot, outputRef, durationMs, userId)

**Activity Events (1)**

- `activityEvents` — Real-time activity feed (organizationId, userId, event, payload)

### 51 PostgreSQL Enums

`jurisdiction` (`china`, `saudi_arabia`, `both`), `frameworkCode` (PIPL, CSL, DSL, PDPL, NCA, MLPS, etc.), `plan` (`free_trial`, `starter`, `professional`, `enterprise`), `orgStatus` (`active`, `suspended`, `cancelled`), `memberRole` (`analyst`, `compliance_officer`, `admin`, `owner`), `platformRole` (`basic_user`, `professional_user`, `company_admin`, `platform_admin`, `yalla_hack_employee`, `super_admin`, `user`, `admin`), `authMethod` (`clerk-oauth`, `supabase-auth`, `local`, `api-key`, `dev-bypass`), `userStatus` (`active`, `inactive`, `suspended`), `incidentSeverity`, `incidentStatus`, `riskLevel`, `assessmentStatus`, `remediationStatus`, `auditStatus`, `policyStatus`, `dsrStatus`, `serviceRequestPriority`, `serviceRequestStatus`, `evidenceStatus`, `assetClassification`, `maturityLevel`, `onboardingStage`, `accountIntent`, `notificationCategory`, `otpPurpose`, `interactionCategory`, and more.

---

## 5. API Surface

### tRPC Routers (33 total, composed in `server/routers.ts`)

| Namespace          | Router File                             | Key Procedures                                                                                                 |
| ------------------ | --------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `system`           | `server/_core/systemRouter.ts`          | `health(query)`, `readiness(query)`, `notifyOwner(mutation)`                                                   |
| `ai`               | `server/ai/router.ts`                   | `assess`, `status`, `history`, `cancel`, `queue`                                                               |
| `billing`          | `server/billing.ts`                     | `createCheckout`, `portal`, `plans`, `invoices`, `trials`                                                      |
| `admin`            | `server/admin-router.ts`                | `users`, `systemConfig`, `auditLog`, `metrics`                                                                 |
| `portal`           | `server/portal-router.ts`               | `privacy`, `terms`, `publicInfo`                                                                               |
| `localAuth`        | `server/local-auth-router.ts`           | `register`, `login`, `me`, `logout`, `forgotPassword`, `resetPassword`, `enableMfa`, `verifyTotp`, `adminList` |
| `googleAuth`       | `server/google-auth-router.ts`          | `googleLogin`, `callback`                                                                                      |
| `auth`             | `server/auth-router.ts`                 | `me`, `updateProfile`, `sessions`                                                                              |
| `role`             | `server/role-router.ts`                 | `list`, `assign`, `permissions`                                                                                |
| `rbac`             | `server/rbac-router.ts`                 | `check`, `guard`, `effectivePermissions`                                                                       |
| `orgMembers`       | `server/org-members-router.ts`          | `invite`, `join`, `leave`, `remove`, `list`                                                                    |
| `orgSettings`      | `server/org-settings-router.ts`         | `get`, `update`, `billingInfo`                                                                                 |
| `vendor`           | `server/vendor-router.ts`               | `create`, `update`, `list`, `detail`, `search`                                                                 |
| `vendorCompliance` | `server/vendor-compliance-router.ts`    | `assess`, `profile`, `history`                                                                                 |
| `compliance`       | `server/compliance-framework-router.ts` | `frameworks`, `controls`, `comparison`, `matrix`, `obligations`, `obligationsByCountry`                        |
| `complianceReport` | `server/compliance-report-router.ts`    | `generate`, `list`, `download`, `share`                                                                        |
| `complianceChat`   | `server/compliance-chat-router.ts`      | `ask`, `history`, `context`                                                                                    |
| `scorecard`        | `server/scorecard-router.ts`            | `get`, `update`, `history`                                                                                     |
| `ctem`             | `server/ctem-router.ts`                 | `assess`, `findings`, `dashboard`                                                                              |
| `evidence`         | `server/evidence-router.ts`             | `upload`, `list`, `verify`                                                                                     |
| `remediation`      | `server/remediation-router.ts`          | `plans`, `tasks`, `progress`                                                                                   |
| `riskRegister`     | `server/risk-register-router.ts`        | `entries`, `treatments`                                                                                        |
| `policyManager`    | `server/policy-router.ts`               | `policies`, `versions`, `acknowledge`                                                                          |
| `incidentRegister` | `server/incident-router.ts`             | `report`, `update`, `timeline`                                                                                 |
| `auditSchedule`    | `server/audit-schedule-router.ts`       | `schedule`, `findings`, `close`                                                                                |
| `dsr`              | `server/dsr-router.ts`                  | `requests`, `fulfill`, `status`                                                                                |
| `serviceRequests`  | `server/service-request-router.ts`      | `create`, `list`, `assign`                                                                                     |
| `assetInventory`   | `server/asset-inventory-router.ts`      | `assets`, `categories`                                                                                         |
| `threatIntel`      | `server/threat-intel-router.ts`         | `feeds`, `indicators`, `alerts`                                                                                |
| `securityMaturity` | `server/security-maturity-router.ts`    | `assess`, `benchmark`, `trends`                                                                                |
| `deadlines`        | `server/deadline-router.ts`             | `upcoming`, `calendar`                                                                                         |
| `apiKeys`          | `server/api-keys-router.ts`             | `create`, `revoke`, `list`                                                                                     |

### REST Endpoints (non-tRPC)

| Path                                     | Method | Handler                      |
| ---------------------------------------- | ------ | ---------------------------- |
| `/health`                                | GET    | Health JSON                  |
| `/healthz`                               | GET    | Health JSON                  |
| `/readiness`                             | GET    | System readiness + services  |
| `/readyz`                                | GET    | System readiness             |
| `/api/health`                            | GET    | Health JSON                  |
| `/api/healthz`                           | GET    | Health JSON                  |
| `/api/readiness`                         | GET    | System readiness             |
| `/api/readyz`                            | GET    | System readiness             |
| `/api/webhooks/stripe`                   | POST   | Stripe webhook (raw body)    |
| `/api/oauth/callback`                    | GET    | OAuth code → token → session |
| `/api/csp-report`                        | POST   | CSP violation collector      |
| `/api/yalla-admin/bootstrap`             | GET    | Access token gate            |
| `/api/yalla-admin/login`                 | POST   | Username + password          |
| `/api/yalla-admin/logout`                | POST   | Revoke session               |
| `/api/yalla-admin/access-links/generate` | POST   | One-time owner links         |
| `/api/yalla-admin/me`                    | GET    | Session info                 |
| `/api/yalla-admin/stats/overview`        | GET    | Platform KPIs                |
| `/api/yalla-admin/stats/users`           | GET    | User list + activity         |
| `/api/yalla-admin/stats/system`          | GET    | API + DB metrics             |
| `/api/yalla-admin/stats/audit`           | GET    | Audit log stream             |
| `/api/yalla-admin/stream`                | GET    | SSE live events              |
| `/api/yalla-admin/export/csv`            | GET    | Data export                  |

### WebSocket

| Path          | Purpose                              | Protocol                                                                        |
| ------------- | ------------------------------------ | ------------------------------------------------------------------------------- |
| `/ws/ai-jobs` | Real-time AI assessment job progress | JSON messages: `subscribe`, `unsubscribe`, `ping`/`pong`, `job_snapshot` events |

---

## 6. Authentication System (Triple Path + Dev + Yalla Admin)

### Auth Resolution Order (`server/services/auth-session.ts`)

1. **Dev Bypass** (if `DEV_AUTH_BYPASS=true`) — returns pseudo-user id=-1 with overridable role
2. **Path 1: Clerk OAuth SDK** — resolves Clerk session from request → DB user lookup
3. **Path 2: API Key** — `Authorization: Bearer djac_<hex>` → `apiKeys` table lookup → user + org
4. **Path 3: Local Auth JWT** — `djac_local_session` cookie → HS256 JWT verify → `localUsers` table → DB `users`

### OAuth Flow (`server/_core/oauth.ts` + `server/_core/sdk.ts`)

- OAuth server URL from `OAUTH_SERVER_URL` env
- Endpoints: `ExchangeToken`, `GetUserInfo`, `GetUserInfoWithJwt` (gRPC-style protobuf)
- Session cookie: `app_session_id` (HS256 JWT, 1-year TTL)
- Cookie: `SameSite=None` + `Secure` in production, `SameSite=Lax` in dev
- Auto-syncs user from OAuth server to local DB on first login

### Local Auth (`server/local-auth-router.ts` — 702 lines)

- Registration: email (lowercased), password (bcrypt cost 12), optional phone
- Login: password verify → JWT session (7-day TTL)
- Password reset: OTP-based
- **TOTP MFA**: `otplib` generates secrets, `qrcode` renders setup QR, 8 backup codes
- Session cookie: `djac_local_session` (httpOnly, SameSite=Strict, Secure in prod)
- Edge: In-memory fallback when DB is unavailable (`ALLOW_IN_MEMORY_PERSISTENCE`)

### OTP Auth (`server/services/otp.ts` — 181 lines)

- 6-digit numeric codes, SHA-256 hashed
- 5-minute expiry, 5 max attempts (locks on excess)
- Supports email + phone (regex: `^\+?[1-9]\d{6,14}$`)
- Dev: code logged to console + returned in API response

### Supabase Auth (`server/services/supabase.ts` — 112 lines)

- `getSupabaseClient()` — anon key, `autoRefreshToken: true`
- `getSupabaseAdmin()` — service role, `autoRefreshToken: false`
- `verifySupabaseSession(token)` — JWT decode + DB user resolution
- `createSupabaseUser(email, password, metadata)` — auth admin API
- `updateSupabaseUser(userId, attributes)`, `deleteSupabaseUser(userId)`
- `listSupabaseUsers()`, `signOutUser(userId)`

### Yalla Admin Auth (4 security layers)

1. **URL Token Gate** — `?access_token=` vs `YALLA_ADMIN_SECRET` (SHA-256 gate cookie)
2. **IP Allowlist** — `YALLA_ADMIN_IP_ALLOWLIST` CSV CIDR check
3. **JWT Session** — `yalla_admin_session` cookie (HS256, 8h TTL default, httpOnly+Secure+SameSite=Strict)
4. **Login Lockout** — 5 attempts → 15 min IP lockout
5. **Rate Limiting** — 300 req/5min per IP on admin endpoints

### Role Hierarchy & Permissions

**Platform Roles** (from `shared/const.ts`):
| Role | Level | Description |
|------|-------|-------------|
| `basic_user` (legacy: `user`) | 10 | Basic access |
| `professional_user` | 20 | Professional features |
| `company_admin` | 30 | Org administration |
| `platform_admin` (legacy: `admin`) | 40 | Platform management |
| `yalla_hack_employee` | 45 | Internal staff |
| `super_admin` | 100 | Full access |

**Org Roles** (from `shared/const.ts`):
| Role | Level | Description |
|------|-------|-------------|
| `analyst` | 10 | Read-only on most modules |
| `compliance_officer` | 20 | CRUD on compliance modules |
| `admin` | 30 | Full access + API keys, team mgmt |
| `owner` | 40 | Full access + billing, org settings |

**Permission Flags**: `canView`, `canCreate`, `canEdit`, `canDelete`, `canExport`, `canInvite`

**30 Permission-Gated Modules**: `asset_inventory`, `vendor_assessment`, `gap_tracker`, `remediation_planner`, `risk_register`, `policy_manager`, `incident_register`, `audit_schedule`, `dsr_management`, `evidence_repository`, `security_maturity`, `compliance_tracker`, `compliance_reports`, `report_center`, `compliance_heatmap`, `compliance_calendar`, `vendor_compliance_profiles`, `assessment_history`, `service_requests`, `api_keys`, `team_members`, `org_settings`, `audit_log`, `pro_intelligence`, `transfer_checker`, `law_library`, `framework_analysis`, `billing`, `admin_control_center`, `saas_metrics`

### Account Intents (onboarding)

`compliance_professional`, `legal_advisor`, `enterprise_admin`, `consultant`, `vendor`, `government`, `researcher`

### Onboarding Stages

`not_started` → `account_type_selected` → `org_created` → `org_joined` → `jurisdiction_set` → `completed`

---

## 7. AI Pipeline (`server/ai/`)

### Queue System (`queue.ts` — 545 lines + `queueFactory.ts`)

- **In-memory** (default): Singleton `Map` + optional file persistence
- **Redis**: `RedisAssessmentQueue` when `AI_QUEUE_MODE=redis` + `REDIS_URL` set
- Factory auto-detects mode; falls back to in-memory on Redis failure

### 8-Stage Pipeline (`pipeline.ts`)

```
Gatekeeper → Intake → Extractor → RAG Context → Judge → Synthesizer → Validator → Reporter
```

1. **Gatekeeper**: Injection detection, input validation
2. **Intake**: Document parsing, text normalization
3. **Extractor**: Structured fact extraction (key-value-evidence triples)
4. **RAG Context**: Compliance control lookup from DB, relevance scoring
5. **Judge**: GPT-4o evaluates compliance against controls (score 0-100)
6. **Synthesizer**: Merges findings, generates cross-framework report
7. **Validator**: Schema validation, cross-field consistency, max retries
8. **Reporter**: Final formatted output

### Orchestrator (`orchestrator.ts`)

- Wraps pipeline execution with progress callbacks
- Persists results to DB via `persistence.ts`
- Exposes: `enqueueAssessmentJob`, `getAssessmentJob`, `listAssessmentJobsForUser`, `getAssessmentHistoryDiagnostics`

### WebSocket Streaming (`ws.ts` — 218 lines)

- Path: `/ws/ai-jobs` (configurable via `AI_WEBSOCKET_PATH`)
- Auth: Cookie-based session verification (or dev bypass)
- Messages: `subscribe {jobId}`, `unsubscribe {jobId}`, `ping`
- Events: `connected`, `job_snapshot`, `subscribed`, `unsubscribed`, `error`
- Admin: users with role ≥ `admin` see all jobs; others see only their own

### AI Models & Services

| Service        | API                          | Purpose                                     |
| -------------- | ---------------------------- | ------------------------------------------- |
| OpenAI         | GPT-4o (`openai` package v4) | Primary assessment engine                   |
| Manus Forge    | `AGENT_SWARM_BASE_URL`       | Fallback assessment + notification delivery |
| Built-in Forge | `BUILT_IN_FORGE_API_URL`     | Alternative AI endpoint                     |

### LLM Types (`server/_core/llm.ts` — 332 lines)

- Full type system for OpenAI-compatible API: `Role`, `Message`, `Tool`, `ToolChoice`, `InvokeParams`
- Content types: text, image_url, file_url (audio, video, PDF)
- Configurable model routing and fallback chain

### Zod Schemas (`server/ai/schemas.ts` — 152 lines)

- `aiJobStatusSchema`: queued, running, completed, failed
- `aiJobStageSchema`: 12 stages (queued through persistence + completed/failed)
- `assessmentSeveritySchema`: critical, high, medium, low
- `supplierGapSchema`: code, jurisdiction, frameworks, severity, title, description, mitigation, penaltyContext
- `supplierAssessmentSchema`: vendorId, overallScore, jurisdictionScores, status, riskLevel, gaps, recommendations
- `extractedFactSchema`: key, value, evidence, mappedControlBuckets
- `ragControlSchema`: controlId, frameworkCode, controlCode, category, controlName, requirement, relevanceScore
- `dbAssessmentPayloadSchema`: frameworkCode, complianceScore, riskLevel, findings, recommendations

---

## 8. Billing & Stripe Integration

### Plan Catalog (5 plans × intervals = 20 price IDs)

| Plan         | Monthly | Quarterly | Biannual | Annual |
| ------------ | ------- | --------- | -------- | ------ |
| Starter      | ✓       | ✓         | ✓        | ✓      |
| Professional | ✓       | ✓         | ✓        | ✓      |
| Enterprise   | ✓       | —         | —        | ✓      |

### Stripe Events Handled (`stripe-webhook.ts` — 416 lines)

1. `checkout.session.completed` — Initial subscription activation
2. `invoice.payment_succeeded` — Mark sub active, record billing event
3. `invoice.payment_failed` — Update sub to `past_due`
4. `customer.subscription.updated` — Sync plan/interval/status
5. `customer.subscription.deleted` — Cancel sub in DB

### Billing Features (`billing.ts` — 432 lines)

- Hosted checkout session creation
- Customer portal redirect
- Webhook event processing
- Trial management (7-day free trial)
- Price tier resolution
- tRPC billing router (`billingRouter`)

### Entitlements (`server/services/billing-entitlements.ts`)

| Function                     | Purpose                                     |
| ---------------------------- | ------------------------------------------- |
| `trialEndsAt(startedAt)`     | 7 days from start                           |
| `daysRemainingInTrial(org)`  | Days until trial expiry                     |
| `isTrialExpired(org)`        | Only for `free_trial` plans                 |
| `isAccessAllowed(org, sub?)` | Trial valid OR subscription active/trialing |

### Trial Reminder Scheduler (`trial-reminder-scheduler.ts` — 177 lines)

- Runs every 6 hours
- Milestones: 3 days before, 1 day before, on expiry
- Persistent dedup via DB columns (`trialReminderDay3Sent`, etc.)
- HTML email with CTA buttons

---

## 9. Supabase Edge Functions (4 Deno Functions)

| Function             | Path      | Purpose                                                  |
| -------------------- | --------- | -------------------------------------------------------- |
| `auth-hooks`         | Webhook   | Syncs Supabase Auth events → `users` table + `auditLogs` |
| `compliance-webhook` | Webhook   | Accepts 5 external compliance event types                |
| `report-export`      | HTTP POST | Exports reports as JSON/CSV/PDF with Content-Disposition |
| `send-notification`  | HTTP POST | Creates admin notifications, optional email              |

### Compliance Webhook Events

`incident.reported`, `assessment.completed`, `vendor.updated`, `deadline.approaching`, `policy.expiring`

### Shared Modules

- `_shared/cors.ts` — `Access-Control-Allow-Origin: *`
- `_shared/supabase-client.ts` — Singleton `createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)`

### Common Pattern

- Runtime: `https://deno.land/std@0.224.0/http/server.ts`
- Validation: `https://deno.land/x/zod@v3.23.8/mod.ts`
- Supabase: `jsr:@supabase/supabase-js@2`
- Auth: Bearer token in Authorization header
- CORS: Preflight OPTIONS handler

---

## 10. Middleware Stack & Security

### Server Middleware Order (`server/_core/index.ts`)

1. **compression** — gzip/brotli (threshold 1KB, level 6)
2. **X-Request-ID** — nanoid(21) per request
3. **CORS** — Allowed origins: `APP_URL` + `localhost:3000/3001` (dev)
4. **Security Headers** — CSP, HSTS, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection
5. **Auth Rate Limit** — 10 req/min on `localAuth.*` procedures
6. **API Rate Limit** — 120 req/min on all `/api/*` paths
7. **Stripe webhook** — `express.raw()` before JSON parser
8. **JSON parser** — 2MB limit
9. **URL-encoded parser** — 2MB limit
10. **tRPC middleware** — `/api/trpc`
11. **Yalla-Admin router** — `/api/yalla-admin`
12. **Sentry error handler**

### Content Security Policy (`server/_core/security.ts`)

```
default-src 'self';
script-src 'self' 'strict-dynamic' 'sha256-...' 'sha256-...' https://*.clerk.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: blob: https:;
connect-src 'self' https://api.stripe.com https://*.supabase.co https://*.sentry.io https://*.clerk.com https://fonts.googleapis.com https://fonts.gstatic.com wss://*.supabase.co;
frame-src 'self' https://*.stripe.com https://*.clerk.com;
```

### Rate Limiting (Redis-backed, in-memory fallback)

| Scope             | Limit      | Window         |
| ----------------- | ---------- | -------------- |
| Global API        | 120        | 1 minute       |
| Auth endpoints    | 10         | 1 minute       |
| Yalla Admin       | 300        | 5 minutes      |
| Yalla Admin login | 5 attempts | 15 min lockout |

### No-Index Paths (54 paths blocked from crawlers)

All `/api/`, `/dashboard`, `/vendor-assessment`, `/login`, `/signup`, and all authenticated routes

### CSP Report Endpoint

`POST /api/csp-report` — Logs violations via Pino logger with category `security`

### Security Headers Applied

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=31536000` (if HTTPS)
- `X-XSS-Protection: 0`
- `Cache-Control: no-store` (for admin/API paths)
- `X-RateLimit-*` headers on all API requests

---

## 11. Background Jobs & Schedulers (8 total)

| Scheduler             | File                                 | Interval             | Purpose                                       |
| --------------------- | ------------------------------------ | -------------------- | --------------------------------------------- |
| AI Assessment Queue   | `server/ai/queue.ts`                 | On-demand            | Processes compliance assessments              |
| Interaction Retention | `server/interaction-retention.ts`    | Configurable (hours) | Purges old interaction logs                   |
| Trial Reminder        | `server/trial-reminder-scheduler.ts` | Every 6h             | Sends trial expiry emails (3d, 1d, expired)   |
| Deadline Alert        | `server/deadline-alert-scheduler.ts` | Every 2h             | Sends deadline alerts (30d, 7d, 1d before)    |
| Scheduled Reports     | `server/report-scheduler.ts`         | Every 6h             | Generates weekly + monthly compliance reports |
| SSE Broadcast         | `server/services/sse-bus.ts`         | Real-time            | Broadcasts platform events to admin panel     |
| WebSocket Streaming   | `server/ai/ws.ts`                    | Real-time            | AI job progress to connected clients          |
| Rate Limiter Cleanup  | `server/_core/rateLimiter.ts`        | Every 5min           | Prunes expired in-memory rate limit entries   |

---

## 12. Email System (`server/email.ts` — 48 lines)

| Config       | Value                                |
| ------------ | ------------------------------------ |
| Default from | `noreply@yalla-hack.net`             |
| Transport    | nodemailer with SMTP                 |
| Fallback     | Console log in development           |
| Timeouts     | 10s connect, 5s greeting, 10s socket |
| Alternative  | Resend API (`RESEND_API_KEY`)        |

### Trial Reminder Email Templates

- **3-day**: "Your free trial ends in 3 days" — CTA to subscribe
- **1-day**: "Your free trial ends tomorrow" — urgency messaging
- **Expired**: "Your trial has ended" — feature lock notice

### Deadline Alert Email Templates (3 milestones)

- **30 days**: Advance planning alert
- **7 days**: Action required warning
- **1 day**: Final day urgent alert

### Scheduled Report Emails

- Weekly (Monday) and Monthly (1st) compliance report delivery
- Dedup per org per period via in-process `Set`

---

## 13. Report Generation & Delivery

### `report-generator.ts` (690 lines)

| Report Type           | Purpose                                |
| --------------------- | -------------------------------------- |
| `full_compliance`     | Complete multi-jurisdiction assessment |
| `gap_analysis`        | Identified compliance gaps only        |
| `vendor_assessment`   | Vendor-specific compliance evaluation  |
| `risk_assessment`     | Risk scoring and treatment             |
| `executive_summary`   | High-level stakeholder report          |
| `regulatory_deadline` | Upcoming deadline digest               |

- 3 locales: `en` (en-US), `ar` (ar-SA), `zh` (zh-CN)
- 2 jurisdictions + both
- Sections: Executive Summary, Scorecard, Gap Table, Framework Coverage, Cross-Jurisdiction Comparison, Remediation Roadmap, Regulatory References
- i18n via locale-labeled constant maps

### `report-delivery.ts` (1169 lines)

- **PDF**: `pdf-lib` + `@pdf-lib/fontkit` with multi-OS font detection (Windows/Mac/Linux)
- **DOCX**: `pizzip` (PizZip) + XML template
- **Email**: `nodemailer` with attachment support
- Font fallback chains for English, Arabic, Chinese across all platforms

---

## 14. Logger System (`server/_core/logger.ts` — 100 lines)

| Feature       | Value                                                                        |
| ------------- | ---------------------------------------------------------------------------- |
| Library       | Pino v9                                                                      |
| Dev transport | `pino-pretty` (colored, timestamps)                                          |
| Prod format   | Structured JSON (stdout)                                                     |
| Log levels    | debug, info, warn, error                                                     |
| Auto-redact   | passwords, tokens, secrets, apiKeys, jwt, authorization, cookies             |
| Serializers   | err, error, req, res                                                         |
| Base fields   | `service: "djac-tool"`, `env`                                                |
| Categories    | auth, rbac, audit, billing, ai, report, vendor, compliance, system, http, db |

---

## 15. Readiness & Health System (`server/_core/readiness.ts` — 217 lines)

| Check           | What it validates                                                             |
| --------------- | ----------------------------------------------------------------------------- |
| Database        | PostgreSQL connection + `SELECT 1`                                            |
| Redis           | `PING` response (when queue mode = redis)                                     |
| Stripe          | All 20 price IDs + secret key + webhook secret                                |
| AI Orchestrator | Enabled/disabled + queue mode match                                           |
| Scaling         | Redis presence, pool size ≥ 20, in-memory fallback disabled, redis queue mode |

Service-level readiness returned via `/api/readiness` with HTTP 200 or 503.

---

## 16. Client Application

### Tech Stack

- React 19.1, TypeScript 5.9
- Vite 7 with `vite-plugin-react` + `vite-plugin-manus-runtime`
- tRPC 11 + React Query 5
- Tailwind CSS 4 with `tailwindcss-animate` + `tw-animate-css`
- shadcn/ui (54 Radix-based components)
- `wouter` v3 (patched) for routing
- `framer-motion` v12 for animations
- `recharts` v2 for charts
- `sonner` for toasts
- `cmdk` for command palette
- `lucide-react` for icons
- `date-fns` v4 for dates
- `vaul` for drawers
- `embla-carousel-react` for carousels
- `react-markdown` + `remark-gfm` for markdown rendering
- `react-hook-form` for forms
- `react-day-picker` for date pickers
- `react-resizable-panels` for layouts

### SPA Architecture (`App.tsx` — 378 lines)

- `ErrorBoundary` root → `LocaleProvider` → `ThemeProvider` → `TooltipProvider` → `Toaster`
- Lazy-loaded all page components with Suspense fallback (spinner + "Loading…")
- Global background: `ParticleField` + `CyberGrid`
- Cookie consent banner
- Route structure:
  - Public: `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/pricing`, `/hero`, `/privacy`, `/terms`, `/invite-accept`, `/404`
  - Admin (no layout): `/yalla-hack-owners-console/*` (bootstrap, login, portal)
  - Protected (DashboardLayout sidebar): 55+ routes

### Pages (61 lazy-loaded)

- **Dashboard**: Dashboard, DashboardEnhanced, Home, CompanyDashboard, SuperAdminDashboard, ProIntelligenceDashboard, SaaSMetrics, ClientWorkspace, OperationsStatus
- **Compliance**: ComplianceTracker, ComplianceScorecard, ComplianceReports, ComplianceCalendar, ComplianceHeatmap, ComplianceChat, FrameworkAnalysis, GapTracker, ContinuousCompliance, ComplianceHeatmap
- **Vendors**: VendorRiskDashboard, VendorDetail, VendorComplianceProfiles, VendorAssessment, TransferChecker
- **Risk**: RiskRegister, RemediationPlanner, IncidentRegister, ThreatIntelFeed
- **Security**: SecurityMaturity, AssetInventory, DataSubjectRequests
- **Audit**: AuditLog, AuditSchedule, EvidenceLocker, PolicyManager
- **Billing**: BillingAccount
- **Settings**: AccountSettings, OrgSettings, TeamMembers, ApiKeys, Notifications
- **Admin**: AdminControlCenter, AdminHealth, AdminServiceRequests, AdminThreatIntel
- **Yalla Admin**: YallaAdminAccessBootstrap, YallaAdminLogin, YallaAdminPortal
- **Other**: AssessmentHistory, ReportCenter, LawLibrary, OnboardingWizard, ServiceRequests, ComponentShowcase (dev)

### Components (36 domain + 54 UI = 90 total)

- **Domain**: AIAssessmentJobProgress, AIChatBox, AIOrchestrationFeed, CommandPalette, ComplianceHealthScore, ComplianceMatrix, ComplianceRegionMap, CookieConsentBanner, CyberGrid, DashboardLayout, DashboardLayoutSkeleton, DataFlowVisualization, DeHengFooter, DjacLogoMark, ErrorBoundary, FeatureGate, FrameworkCard, FrameworkRelationshipOrb, LiveThreatFeed, LocaleSwitcher, ManusDialog, Map, NotificationCenter, ParticleField, PermissionGate, RegulatoryPulseMatrix, RoleGuard, RouteErrorBoundary, SinoGulfHeatmap, StatsRow, ThemeToggle, TourGuide, TrialBanner, VendorRiskGauge, WelcomeBanner
- **UI** (all Radix-based): accordion, alert-dialog, alert, aspect-ratio, avatar, badge, breadcrumb, button-group, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, empty, field, form, hover-card, input-group, input-otp, input, item, kbd, label, menubar, navigation-menu, pagination, popover, progress, query-error-panel, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, spinner, switch, table, tabs, textarea, toggle-group, toggle, tooltip

### Custom Hooks (10)

- `useAuth` — Clerk + local auth session management
- `useRbac` — Role-based access control
- `usePermission` — Module-level permission checking
- `useLocalAuth` — Local auth state
- `useAiAssessmentJobs` — AI job polling + WebSocket
- `useNotificationBadge` — Unread notification count
- `usePageTitle` — Dynamic document title
- `useDebounce` — Debounced value
- `useMobile` — Responsive breakpoint
- `usePersistFn` — Stable function reference
- `useComposition` — IME composition handling

### Contexts (7 files)

- `LocaleContext.tsx` / `localeStore.ts` / `localeTypes.ts` / `useLocale.ts` — i18n state
- `ThemeContext.tsx` / `themeStore.ts` / `useTheme.ts` — Theme (light/dark) with `next-themes`

### Lib (5 files)

- `trpc.ts` — `createTRPCReact<AppRouter>()` single export
- `intl.ts` — `formatDate`, `formatDateTime` with locale-aware formatting (en-US, ar-SA, zh-CN)
- `utils.ts` — Shared utilities
- `sounds.ts` — Sound effects
- `recharts-compat.ts` — Recharts type compatibility

### Feature Gating

- `FeatureGate` component: `plan="professional|enterprise"` + `feature` name
- Routes gated: `/vendor-risk` (professional), `/saas-metrics` (enterprise)

---

## 17. UI Routes (Complete Map)

| Route                              | Page                            | Gated         |
| ---------------------------------- | ------------------------------- | ------------- |
| `/`                                | Redirect → /dashboard or Signup | —             |
| `/login`                           | Signup                          | —             |
| `/signup`                          | Signup                          | —             |
| `/pricing`                         | Pricing                         | —             |
| `/hero`                            | DJACHero                        | —             |
| `/privacy`                         | PrivacyPolicy                   | —             |
| `/terms`                           | TermsOfService                  | —             |
| `/forgot-password`                 | ForgotPassword                  | —             |
| `/reset-password`                  | ResetPassword                   | —             |
| `/invite-accept`                   | InviteAccept                    | —             |
| `/404`                             | NotFound                        | —             |
| `/yalla-hack-owners-console/enter` | YallaAdminAccessBootstrap       | Admin secret  |
| `/yalla-hack-owners-console/login` | YallaAdminLogin                 | Gate cookie   |
| `/yalla-hack-owners-console`       | YallaAdminPortal                | JWT session   |
| `/dashboard`                       | Dashboard                       | Auth          |
| `/home`                            | Home                            | Auth          |
| `/dashboard-enhanced`              | DashboardEnhanced               | Auth          |
| `/analysis`                        | FrameworkAnalysis               | Auth          |
| `/vendor-assessment`               | VendorAssessment                | Auth          |
| `/vendor-risk`                     | VendorRiskDashboard             | Professional+ |
| `/transfer-checker`                | TransferChecker                 | Auth          |
| `/market-entry`                    | ClientWorkspace                 | Auth          |
| `/client-workspace`                | ClientWorkspace                 | Auth          |
| `/admin-control-center`            | AdminControlCenter              | Auth          |
| `/operations`                      | OperationsStatus                | Auth          |
| `/laws`                            | LawLibrary                      | Auth          |
| `/compliance-tracker`              | ComplianceTracker               | Auth          |
| `/report-center`                   | ReportCenter                    | Auth          |
| `/billing`                         | BillingAccount                  | Auth          |
| `/compliance-calendar`             | ComplianceCalendar              | Auth          |
| `/onboarding-wizard`               | OnboardingWizard                | Auth          |
| `/saas-metrics`                    | SaaSMetrics                     | Enterprise    |
| `/heatmap`                         | ComplianceHeatmap               | Auth          |
| `/notifications`                   | Notifications                   | Auth          |
| `/company/dashboard`               | CompanyDashboard                | Auth          |
| `/superadmin/dashboard`            | SuperAdminDashboard             | Auth          |
| `/pro-intelligence`                | ProIntelligenceDashboard        | Auth          |
| `/account-settings`                | AccountSettings                 | Auth          |
| `/team-members`                    | TeamMembers                     | Auth          |
| `/org-settings`                    | OrgSettings                     | Auth          |
| `/audit-log`                       | AuditLog                        | Auth          |
| `/compliance-scorecard`            | ComplianceScorecard             | Auth          |
| `/api-keys`                        | ApiKeys                         | Auth          |
| `/gap-tracker`                     | GapTracker                      | Auth          |
| `/assessment-history`              | AssessmentHistory               | Auth          |
| `/vendor/:id`                      | VendorDetail                    | Auth          |
| `/remediation-planner`             | RemediationPlanner              | Auth          |
| `/risk-register`                   | RiskRegister                    | Auth          |
| `/policy-manager`                  | PolicyManager                   | Auth          |
| `/incident-register`               | IncidentRegister                | Auth          |
| `/audit-schedule`                  | AuditSchedule                   | Auth          |
| `/vendor-compliance`               | VendorComplianceProfiles        | Auth          |
| `/compliance-reports`              | ComplianceReports               | Auth          |
| `/continuous-compliance`           | ContinuousCompliance            | Auth          |
| `/evidence-locker`                 | EvidenceLocker                  | Auth          |
| `/dsr-tracker`                     | DataSubjectRequests             | Auth          |
| `/compliance-chat`                 | ComplianceChat                  | Auth          |
| `/service-requests`                | ServiceRequests                 | Auth          |
| `/asset-inventory`                 | AssetInventory                  | Auth          |
| `/threat-intel`                    | ThreatIntelFeed                 | Auth          |
| `/security-maturity`               | SecurityMaturity                | Auth          |
| `/admin/service-requests`          | AdminServiceRequests            | Auth          |
| `/admin/threat-intel`              | AdminThreatIntel                | Auth          |
| `/component-showcase`              | ComponentShowcase               | Dev only      |

---

## 18. Vendors & Supply Chain (`shared/vendorProfile.ts` — 555 lines)

### 12 Industry Categories

`software-saas`, `cloud-digital-infrastructure`, `financial-services`, `healthcare-life-sciences`, `government-public-sector`, `telecommunications`, `energy-utilities`, `manufacturing-operational-technology`, `retail-ecommerce`, `logistics-supply-chain`, `professional-services`, `other`

### Localized Labels

Each industry has `{ en, zh, ar? }` labels — total 36+ translations

### Supplier Assessment (`server/supplier-assessment.ts` — 454 lines)

- Jurisdictions: `china`, `saudi`, `cross_border`
- Frameworks: PIPL, CSL, DSL, PDPL, NCA
- Severity levels: critical, high, medium, low
- Assessment dimensions: overallScore (0-100), jurisdictionScores, status, riskLevel, gaps, recommendations
- Penalty context: PIPL (5% turnover), PDPL (SAR 5M), etc.
- Clamp score to 0-100, auto-status based on threshold (≥85 = compliant)

### Vendor Risk Profiles

- Multi-value parsing for localized fields
- Tech stack tracking per vendor
- Risk override capability

---

## 19. Shared Constants & Types (`shared/`)

### `shared/const.ts` (277 lines)

- `COOKIE_NAME = "app_session_id"`, `ONE_YEAR_MS`, `AXIOS_TIMEOUT_MS = 30000`
- Error message constants with codes (10001-10005)
- Platform role system: 8 roles with numeric levels (10-100)
- Org role system: 4 roles with numeric levels (10-40)
- `hasMinRole()`, `hasMinOrgRole()` helpers
- 7 account intents, 6 onboarding stages
- 30 module slugs for RBAC
- Full default permission matrix: `DEFAULT_ORG_ROLE_PERMISSIONS` — 4 roles × 30 modules × 6 permission flags
- Onboarding gate rules

### `shared/_core/errors.ts`

- `HttpError(statusCode, message)` — base class
- `BadRequestError(400)`, `UnauthorizedError(401)`, `ForbiddenError(403)`, `NotFoundError(404)`

### `shared/themePolicy.ts`

- `resolveDefaultThemeForPath(path)` — light for public pages, dark for app pages
- `isPublicLightRoute(path)` — check helper

### `shared/vendorProfile.ts` (555 lines)

- Full vendor profile types, localized options, industry definitions

### `shared/types.ts`

- Re-exports drizzle schema types + errors

---

## 20. CI/CD Pipeline (5 GitHub Actions Workflows)

| Workflow          | File                    | Trigger                                                | Jobs                                                                              |
| ----------------- | ----------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------- |
| CI                | `ci.yml`                | Push main/develop + PR main                            | Lint & Type Check → Tests → Supabase Migration Check → Build                      |
| Deploy Production | `deploy-production.yml` | Push main + manual                                     | Lint+Check+Test+Build → Preflight → Migrate → Seed → Vercel Deploy → Health Check |
| Deploy Staging    | `deploy-staging.yml`    | Push develop                                           | Lint+Check+Test → Vercel Deploy (preview) → Health Check                          |
| Supabase Deploy   | `supabase-deploy.yml`   | Changes to migrations/functions/config on main/develop | Deploy Edge Functions → Push DB Migrations                                        |
| CodeQL            | `codeql.yml`            | Push main/develop + PR + weekly Monday                 | CodeQL Analysis (JavaScript/TypeScript)                                           |

### CI Details

- Node 20, pnpm 10, ubuntu-latest
- `DATABASE_URL`, `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` from secrets
- `SUPABASE_ACCESS_TOKEN` + `SUPABASE_DB_PASSWORD` for migration check
- `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `VERCEL_TOKEN` for deployment
- Build output stored as artifact

---

## 21. Deployment & Infrastructure

### Vercel Configuration (`vercel.json`)

- Build: `node scripts/prebuild-vercel.mjs`
- Output: `dist/public`
- Serverless function: `api/index.mjs` (60s max duration), `api/ping.ts` (30s)
- Route mapping: `/api/*` → function, static assets with immutable cache, SPA fallback with `no-store`
- Env: `NODE_ENV=production`, `VITE_API_URL=/api`

### Docker (`Dockerfile`)

- Base: `node:20-alpine`
- Multi-stage: deps → build → runner
- Build: `pnpm build` + `node scripts/prebuild-vercel.mjs`
- User: `appuser` (UID 1001)
- Port: 3000
- Entrypoint: `/app/scripts/entrypoint.sh`
- Installed: `dist/`, `drizzle/`, `scripts/`, `package.json`, `node_modules/`
- Enforced: `ALLOW_IN_MEMORY_PERSISTENCE=false`

### Drizzle Config (`drizzle.config.ts`)

- Schema: `./drizzle/schema.ts`, Output: `./drizzle/`
- Dialect: PostgreSQL
- SSL: `rejectUnauthorized: false` in production

### TypeScript Config (`tsconfig.json`)

- Strict mode, ESNext modules, ES2020 target
- Paths: `@/*` → `./client/src/*`, `@shared/*` → `./shared/*`
- `noEmit` — type checking only (esbuild for bundling)

### Vitest Config (`vitest.config.ts`)

- Includes: `server/**/*.test.ts`, `server/**/*.spec.ts`
- Pool: forks (isolated worker processes)

### Production Startup Guards (`server/_core/env.ts`)

- Fails if `JWT_SECRET` missing or < 32 chars
- Fails if `DATABASE_URL` missing
- Fails if `APP_URL` still default value `http://localhost:3000`
- Warns if Stripe billing partially configured

---

## 22. VPS Management Scripts (37 files)

| Script                                   | Purpose                                                             |
| ---------------------------------------- | ------------------------------------------------------------------- |
| `yh-monitor.sh`                          | Health: app, SSL (21d), disk (85%), CPU, memory, Traefik → Telegram |
| `entrypoint.sh`                          | Docker entrypoint                                                   |
| `check-db.mjs`                           | DB connectivity (hardcoded password: `XPAPA4MdNCYFfYSo`)            |
| `yh-backup-check.sh`                     | Backup verification                                                 |
| `yh-verify-stack.sh`                     | Full stack verification                                             |
| `vps-first-boot.sh`                      | Initial VPS setup                                                   |
| `vps-harden.sh`                          | Security hardening                                                  |
| `vps-safe-hardening.sh`                  | Safe hardening subset                                               |
| `vps-emergency-recover.sh`               | Emergency recovery                                                  |
| `install-yh-monitor-cron.sh`             | Install monitor cron                                                |
| `install-yh-backup-check-cron.sh`        | Install backup check cron                                           |
| `install-yh-logrotate.sh`                | Log rotation setup                                                  |
| `install-yh-verify-stack.sh`             | Stack verify cron                                                   |
| `production-preflight.mjs`               | Pre-deployment validation                                           |
| `migrate-production.mjs`                 | Production migration runner                                         |
| `seed-compliance.mjs`                    | Compliance data seeding                                             |
| `db-doctor.mjs`                          | Database diagnostics                                                |
| `db-backup.mjs`                          | Database backup                                                     |
| `smoke-runtime.mjs`                      | Runtime smoke tests                                                 |
| `smoke-cleanup.ps1`                      | Smoke test cleanup (Windows)                                        |
| `load-smoke.mjs`                         | Load testing                                                        |
| `create-admin.mjs`                       | Admin user creation                                                 |
| `generate-yalla-admin-link.mjs`          | Admin access link generator                                         |
| `generate-owner-credentials.mjs`         | Owner credential generation                                         |
| `generate-full-sql.mjs`                  | Full SQL export                                                     |
| `fix-home-encoding.mjs`                  | Fix encoding issues                                                 |
| `locale-audit.mjs`                       | Locale consistency audit                                            |
| `gen-docx-template.mjs`                  | DOCX template generation                                            |
| `prebuild-vercel.mjs`                    | Vercel prebuild step                                                |
| `push-schema.mjs` / `push-schema-v2.mjs` | Schema push utilities                                               |
| `safe-migrate.mjs`                       | Safe migration runner                                               |
| `compliance-reference-data.mjs`          | Reference data seeding                                              |
| `add-vendor-risk-locale.mjs`             | Add locale to vendor risk                                           |
| `inject-vendor-risk-locale.mjs`          | Inject locale data                                                  |
| `drizzle-push.mjs`                       | Drizzle push wrapper                                                |
| `run-local.ps1`                          | Local dev startup (Windows)                                         |

---

## 23. Tests (15 unit + 4 integration)

### Integration Tests (`server/__tests__/integration/`)

| File                        | Coverage                                                                           |
| --------------------------- | ---------------------------------------------------------------------------------- |
| `api.test.ts`               | Health endpoints, security headers, auth flow, error handling, CORS, rate limiting |
| `auth-flow.test.ts`         | Full auth lifecycle                                                                |
| `endpoints.test.ts`         | API endpoint validation                                                            |
| `report-generation.test.ts` | Report generator validation                                                        |

### Unit Tests (`server/__tests__/unit/`)

| File                           | Coverage                                         |
| ------------------------------ | ------------------------------------------------ |
| `auth.test.ts`                 | Password validation, email format, rate limiting |
| `billing.test.ts`              | Billing logic                                    |
| `compliance-reference.test.ts` | Compliance reference data                        |
| `compliance-timetable.test.ts` | Compliance timeline                              |
| `ctem-scoring.test.ts`         | CTEM scoring                                     |
| `legal-knowledge.test.ts`      | Legal knowledge base                             |
| `local-jwt-edge.test.ts`       | JWT edge cases                                   |
| `local-jwt.test.ts`            | JWT functionality                                |
| `otp-validation.test.ts`       | OTP validation                                   |
| `otp.test.ts`                  | OTP generation/verification                      |
| `rbac.test.ts`                 | Role-based access control                        |
| `security-config.test.ts`      | Security configuration                           |
| `shared-const.test.ts`         | Shared constants                                 |
| `supabase.test.ts`             | Supabase service                                 |
| `validation.test.ts`           | Schema validation                                |

---

## 24. npm Dependencies (~172 total)

### Runtime (120)

`react`, `react-dom`, `@trpc/*`, `express`, `drizzle-orm`, `pg`, `@supabase/supabase-js`, `stripe`, `openai`, `@clerk/clerk-sdk-node`, `@sentry/node`, `@sentry/react`, `nodemailer`, `pdf-lib`, `@pdf-lib/fontkit`, `pizzip`, `jose`, `zod`, `cookie`, `ioredis`, `bcryptjs`, `otplib`, `qrcode`, `pino`, `pino-pretty`, `nanoid`, `superjson`, `axios`, `aws-sdk/client-s3`, `bullmq`, `framer-motion`, `recharts`, `lucide-react`, `sonner`, `cmdk`, `wouter`, `react-hook-form`, `date-fns`, `react-markdown`, `remark-gfm`, `tailwind-merge`, `clsx`, `class-variance-authority`, `vaul`, `embla-carousel-react`, `react-day-picker`, `react-resizable-panels`, `input-otp`, `sonner`, `@tanstack/react-query`, `next-themes`, `@aws-sdk/s3-request-presigner`, `@xmldom/xmldom`, `mysql2`, `dotenv`, `compression`, `@radix-ui/*` (27 packages), `@tailwindcss/*`

### Dev (22)

`typescript`, `vite`, `@vitejs/plugin-react`, `vitest`, `eslint`, `prettier`, `drizzle-kit`, `tsx`, `cross-env`, `postcss`, `autoprefixer`, `tailwindcss`, `tw-animate-css`, `@types/*` (12 packages), `@builder.io/vite-plugin-jsx-loc`, `vite-plugin-manus-runtime`, `@eslint/js`, `typescript-eslint`, `pnpm`

### Patched Dependencies

- `wouter@3.7.1` — patched

### Override Resolutions

- `tailwindcss>nanoid` → `3.3.7`
- `qs` → `^6.14.1`
- `path-to-regexp` → `^0.1.13`
- `fast-xml-parser` → `^5.7.0`
- `@xmldom/xmldom` → `^0.9.10`
- `lodash` → `^4.18.1`
- `follow-redirects` → `>=1.16.0`
- `uuid` → `11.1.1`
- `@smithy/config-resolver` → `>=4.4.0`

---

## 25. Security Findings (Hardcoded Credentials & Secrets)

| Location                  | Credential Type              | Value/Pattern                        | Risk                                        |
| ------------------------- | ---------------------------- | ------------------------------------ | ------------------------------------------- |
| `scripts/check-db.mjs`    | PostgreSQL password          | `XPAPA4MdNCYFfYSo` in plaintext      | **CRITICAL** — DB credential in script file |
| `.env.local`              | Supabase anon key            | Live key for `gcsoeumdjrejfxuovfcw`  | HIGH — committed                            |
| `.env.local`              | Supabase service role key    | Admin-level key                      | **CRITICAL** — full DB access               |
| `.env.local`              | Vercel OIDC token            | Machine identity token               | **CRITICAL** — Vercel org access            |
| `.env.local`              | `DATABASE_URL`               | Full connection string with password | **CRITICAL** — includes password            |
| `.env.local`              | `STRIPE_SECRET_KEY`          | Live Stripe key                      | **CRITICAL** — financial transactions       |
| `.env.local`              | `STRIPE_WEBHOOK_SECRET`      | Webhook signing secret               | HIGH — payment event forgery                |
| `.env.local`              | `SENTRY_AUTH_TOKEN`          | Sentry token                         | MEDIUM — error data access                  |
| `.env.local`              | `CLERK_SECRET_KEY`           | Clerk backend secret                 | HIGH — user auth bypass                     |
| `.env.production.example` | All placeholders             | Domain: app.yalla-hack.ae            | LOW — structural exposure                   |
| Browser source            | `VITE_CLERK_PUBLISHABLE_KEY` | Exposed to client                    | LOW — intentionally public                  |

---

## 26. Internationalization (i18n)

| Locale  | BCP 47  | UI Label           | Report Support                            |
| ------- | ------- | ------------------ | ----------------------------------------- |
| English | `en-US` | Default            | Full (report-generator + report-delivery) |
| Arabic  | `ar-SA` | Right-to-left      | Full (Arabic fonts in report PDF)         |
| Chinese | `zh-CN` | Simplified Chinese | Full (CJK fonts in report PDF)            |

- `shared/vendorProfile.ts` — 36+ industry translations
- `client/src/lib/intl.ts` — `formatDate`, `formatDateTime` with locale-aware rendering
- `client/src/contexts/LocaleContext.tsx` — UI locale state
- Report generator: full i18n for all 6 report types × 3 locales
- Font discovery: Arial, Segoe UI, SimSun, MSYH, PingFang, Noto Sans CJK, DejaVu Sans for cross-platform PDF generation

---

## 27. Org & Tenant Model

- **Auto-provisioning**: First login creates `{user.name} Organization` with 7-day free trial (`org-context.ts`)
- **Org slug**: Auto-generated from user name
- **Default plan**: `free_trial`, 5 max seats
- **Primary jurisdiction**: `Both` (China + Saudi Arabia)
- **Plan enforcement**: `isAccessAllowed()` — checks trial expiry + subscription status
- **Billing email**: User's email
- **Plan upgrades**: Via Stripe checkout → webhook → subscription record
- **Trial reminders**: Automated email at 3d, 1d, and expiry

---

## 28. Local Development Setup

### Supabase Local (`supabase/config.toml`)

- PostgreSQL 17
- Auth: Google + GitHub OAuth providers configured
- Storage buckets: `compliance-evidence`, `report-exports` (both with MIME type restrictions)
- Edge Functions: all 4 registered

### Dev Server

- `pnpm dev` — `tsx watch server/_core/index.ts` on port 3000
- `pnpm dev:strict` — with `ALLOW_IN_MEMORY_PERSISTENCE=false`
- `pnpm dev:local` — PowerShell script `scripts/run-local.ps1`
- Vite HMR via Express middleware (`server/_core/vite.ts`)
- Pretty-printed Pino logs in dev

### Dev Bypass

- `DEV_AUTH_BYPASS=true` — skips all auth, creates pseudo-user id=-1
- OpenID, name, email, role all configurable via env

### DB Commands

- `pnpm db:push` — `drizzle-kit generate && drizzle-kit migrate`
- `pnpm db:migrate` — `drizzle-kit migrate`
- `pnpm db:doctor` — `node scripts/db-doctor.mjs`
- `pnpm seed:compliance` — `node scripts/seed-compliance.mjs`

### Verification

- `pnpm verify:all` — lint + typecheck + test + build
- `pnpm smoke:runtime` — smoke test against local server
- `pnpm prod:preflight` — production environment validation

---

## 29. Key Business Logic Flows

### AI Assessment Flow

1. User uploads vendor document → tRPC `ai.assess` → enqueue job
2. WebSocket client subscribed to `/ws/ai-jobs`
3. Worker runs 8-stage pipeline (GPT-4o)
4. Progress events streamed via WebSocket
5. Results optionally persisted to `vendorAssessments` + `assessmentGaps`
6. SSE broadcast to admin panel

### Compliance Report Flow

1. User selects jurisdiction + locale + report type
2. `report-generator.ts` builds Markdown with scorecard, gaps, remediation
3. `report-delivery.ts` converts to PDF/DOCX
4. Emailed via nodemailer or downloadable via tRPC

### Billing Flow

1. User selects plan → Stripe hosted checkout
2. Webhook `checkout.session.completed` → create subscription record
3. Webhook `invoice.paid` → mark subscription active
4. `isAccessAllowed()` gates feature access

### Yalla Admin Authentication Flow

1. User visits `/yalla-hack-owners-console/enter?access_token=...`
2. Server validates token vs `YALLA_ADMIN_SECRET`, sets gate cookie
3. Redirect to `/yalla-hack-owners-console/login`
4. Username + password → bcrypt verify → JWT session cookie
5. All subsequent requests checked: IP allowlist → JWT session → rate limit
6. SSE stream for real-time monitoring
