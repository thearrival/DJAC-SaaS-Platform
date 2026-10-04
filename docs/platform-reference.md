# DJAC Platform — Master Operations & Reference

**Product:** DJAC — Data, Jurisdiction & AI Compliance
**Operator:** Yalla Hack
**Last updated:** 2026-10-04
**Status:** Live in production · 711 automated tests green · all public routes 200

> **Secrets policy.** This document intentionally contains **no passwords, API
> keys, webhook secrets, or connection strings**. Every secret lives encrypted in
> **Vercel → Project → Settings → Environment Variables** (and the provider
> dashboards). Values are marked as `•••• (in Vercel)`. Retrieve or rotate them in
> the provider console, never from a file in this repo.

---

## 1. Live URLs

| Purpose                         | URL                                                          | Status         |
| ------------------------------- | ------------------------------------------------------------ | -------------- |
| App (SPA + API)                 | https://app.yalla-hack.ae                                    | 200            |
| Docs (subdomain redirect)       | https://docs.app.yalla-hack.ae                               | 308 → app docs |
| Documentation portal            | https://app.yalla-hack.ae/docs                               | 200            |
| Pricing                         | https://app.yalla-hack.ae/pricing                            | 200            |
| Sign up / Login                 | https://app.yalla-hack.ae/signup · /login                    | 200            |
| Global Compliance Registry      | https://app.yalla-hack.ae/global-registry                    | 200            |
| Health (JSON)                   | https://app.yalla-hack.ae/api/status                         | 200            |
| Readiness (JSON)                | https://app.yalla-hack.ae/api/readyz                         | 200            |
| robots / sitemap / security.txt | `/robots.txt` · `/sitemap.xml` · `/.well-known/security.txt` | 200            |
| Stripe webhook                  | https://app.yalla-hack.ae/api/webhooks/stripe                | enabled        |
| Owner console                   | https://app.yalla-hack.ae/yalla-hack-owners-console/login    | 200            |
| Legacy admin                    | https://app.yalla-hack.ae/yalla-admin/login                  | 200            |

## 2. Domains, DNS, IPs

| Host                   | Type           | Target / IP                                         |
| ---------------------- | -------------- | --------------------------------------------------- |
| yalla-hack.ae          | A (Vercel)     | 76.76.21.21                                         |
| app.yalla-hack.ae      | CNAME          | `2549584efc4772bc.vercel-dns-017.com` → 64.29.17.1  |
| docs.app.yalla-hack.ae | CNAME (Vercel) | 76.76.21.21                                         |
| yalla-hack.com         | mail only      | MX: `mx1.hostinger.com`, `mx2.hostinger.com`        |
| yalla-hack.net         | associated     | (admin CRM: admincrmanderpdashboard.yalla-hack.net) |

IPs are **Vercel anycast edge** addresses (not dedicated); do not pin allowlists
to them. Mail uses Hostinger (`smtp.hostinger.com`).

## 3. Infrastructure & providers

| Area                       | Provider                                      | Identifier                                                 |
| -------------------------- | --------------------------------------------- | ---------------------------------------------------------- |
| Hosting / CDN / serverless | Vercel                                        | project `djac-saas-platform`, team `yalla-hack-s-projects` |
| Database                   | Supabase (Postgres, AWS ap-northeast-2 Tokyo) | project ref `gcsoeumdjrejfxuovfcw`                         |
| Payments                   | Stripe (live)                                 | account `acct_1SQPD0KdTEdEkrmm` (Yalla Hack, AE)           |
| Transactional email        | Hostinger SMTP                                | from `hello@yalla-hack.com`                                |
| Error monitoring           | Sentry                                        | DSN `•••• (in Vercel)`                                     |
| AI provider                | DeepSeek (primary) → Forge (fallback)         | `DEEPSEEK_API_KEY`                                         |
| Auth                       | Local JWT + Google OAuth                      | Google Cloud OAuth client                                  |
| Repo                       | GitHub                                        | `thearrival/DJAC-SaaS-Platform` (branch `main`)            |

## 4. Applications & access

| Console                  | Path                               | Username(s)                             |
| ------------------------ | ---------------------------------- | --------------------------------------- |
| Founders / Owner console | `/yalla-hack-owners-console/login` | `djac_founder`                          |
| Legacy admin             | `/yalla-admin/login`               | (configured via `YALLA_ADMIN_USERNAME`) |

Passwords are **not listed here** — the owner password is stored as a **bcrypt
hash** in `YALLA_ADMIN_PASSWORD` (`••••`), and the URL access token is
`YALLA_ADMIN_SECRET` (`••••`). Rotate in Vercel if compromised.

**Observed admin login IPs** (for a future IP allowlist — _not yet applied_
because they vary): `18.180.135.91`, `184.33.133.25`, `54.65.162.4`.

## 5. Database

- Engine: PostgreSQL via Supabase. Connection via `DATABASE_URL` (pooled) /
  `POSTGRES_URL_NON_POOLING` (`••••`).
- Tables of note: `users`, `localUsers`, `organizations`, `organizationMembers`,
  `subscriptions`, `billingEvents`, `userInteractionLogs`, `email_log`,
  `yallaAdminSessions`, `yallaAdminAuditLogs`, onboarding + personalization
  tables, and the compliance/registry corpora.
- Startup runs an idempotent migration/bootstrap + FK index creation.
- Row Level Security is on for the Supabase anon path; the app uses the service
  role server-side only.

## 6. Email (from `hello@yalla-hack.com`)

Automated transactional emails: welcome (first login), security alert (new
sign-in), OTP login/register, password reset, **password changed**, **subscription
confirmed**, team invite, and intake/submission notifications. Delivery is logged
to `email_log`; failures now report to **Sentry**.

## 7. Payments (Stripe, live)

- 12 configured price IDs (`STRIPE_PRICE_*`), matching the live account.
- Webhook `https://app.yalla-hack.ae/api/webhooks/stripe` subscribes to:
  `checkout.session.completed`, `invoice.payment_succeeded`,
  `invoice.payment_failed`, `customer.subscription.updated`,
  `customer.subscription.deleted`.
- Webhook signature verified with `STRIPE_WEBHOOK_SECRET` (`••••`).
- `checkout.session.completed` → org plan updated, subscription recorded, and a
  **subscription-confirmed email** sent.

## 8. AI

- Provider selection is central (`server/_core/llm.ts`): **DeepSeek** when
  `DEEPSEEK_API_KEY` is set, else the Forge gateway. Configurable via
  `DEEPSEEK_BASE_URL` (default `https://api.deepseek.com`) and `DEEPSEEK_MODEL`
  (default `deepseek-chat`).
- Powers the compliance chat, AI agents/orchestrator, and report generation.
- Visible in `/api/readyz` → `integrations.llm` and `llmProvider`.

## 9. Environment variables (names only — values in Vercel)

Core: `NODE_ENV`, `APP_URL`, `APP_DOMAIN`, `BASE_DOMAIN`, `PORT`, `JWT_SECRET`,
`CRON_SECRET`, `DATABASE_URL`, `DATABASE_POOL_SIZE`, `ALLOW_IN_MEMORY_PERSISTENCE`,
`OPENAI_API_KEY` (legacy), `OWNER_OPEN_ID`, `VITE_APP_ID`, `CACHE_BUST`,
`COMPLIANCE_CACHE_TTL_MS`, `HTTP_KEEP_ALIVE_TIMEOUT_MS`, `HTTP_HEADERS_TIMEOUT_MS`,
`HTTP_REQUEST_TIMEOUT_MS`.

Auth/SSO: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `OAUTH_SERVER_URL`.

Supabase: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`SUPABASE_JWT_SECRET`, plus `NEXT_PUBLIC_SUPABASE_*` / `POSTGRES_*` aliases.

Admin console: `YALLA_ADMIN_USERNAME`, `YALLA_ADMIN_PASSWORD` (bcrypt),
`YALLA_ADMIN_SECRET`, `YALLA_ADMIN_JWT_SECRET`, `YALLA_ADMIN_SESSION_TTL_HOURS`.

Email: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`,
`SMTP_FROM`.

Billing: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and the 12 `STRIPE_PRICE_*`.

AI: `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, `DEEPSEEK_MODEL`,
`BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`, `AI_ORCHESTRATOR_ENABLED`,
`AI_QUEUE_MODE`, `AI_RAG_TOP_K`, `AI_VALIDATOR_MAX_RETRIES`, `AI_JOB_TIMEOUT_MS`,
`AI_WEBSOCKET_PATH`.

Ops: `SENTRY_DSN`, `INTERACTION_RETENTION_*`, `REPORT_TEMPLATE_NAME`.

Optional / not yet set: none required. `REDIS_URL` is provisioned (Upstash,
2026-10-04). `YALLA_ADMIN_IP_ALLOWLIST` is intentionally **unused** — admin
security uses per-login alert emails instead (see §4/§11).

## 10. Security posture

- Strict, hash-synced **CSP** (vercel.json + server) with an inline-script SHA
  guard test; **HSTS** (`max-age=63072000; includeSubDomains; preload`),
  `X-Frame-Options: DENY`, `nosniff`, Referrer/Permissions/COOP/CORP policies.
- Rate limiting (Postgres-backed; Redis optional), bcrypt password hashing, TOTP
  2FA, session JWTs, tenant isolation tests, input validation (Zod).
- Dependency hygiene: `pnpm audit --prod --audit-level=high` gate in CI, **SBOM**
  artifact, **Dependabot** (npm + Actions), CodeQL.
- `/.well-known/security.txt` for responsible disclosure.

## 11. Monitoring & operations

- `/api/status` (health + **deployed commit SHA**) and `/api/readyz` (services +
  integrations: database, redis, billing, aiOrchestrator; integrations: googleSso,
  supabase, email, observability, llm).
- **Health Monitor** GitHub workflow (every 30 min) probes the site and opens/
  closes a labelled issue on failure.
- Sentry error monitoring (server + client); email failures alert.
- **Owner-console sign-in alerts** — every successful founder login emails
  `hello@yalla-hack.com` with IP, device, and time.

## 12. CI/CD

- GitHub Actions: `ci.yml` (lint, typecheck, tests, security scan + SBOM),
  `codeql.yml`, `e2e.yml`, `db-backup.yml`, `health-check.yml`, deploy workflows.
- Deploy: push to `main` (Vercel Git integration) or `vercel deploy --prod`.
- Rollback: `git revert` or `vercel rollback`.

## 13. Backups & DR

- Daily autonomous snapshot (cron → private Supabase Storage, 14 retained).
- Off-site `pg_dump` workflow (`db-backup.yml`) — activates once the
  `DATABASE_URL` **GitHub secret** is added.
- Restore drill executed; procedure in `docs/disaster-recovery.md`.

## 14. Verification (this release)

- `pnpm verify:all` → lint + tsc + **711 tests** + build, all green.
- Live matrix: status / readyz / login / pricing / signup / docs / robots /
  sitemap / security.txt / registry / health → **200**; docs subdomain 308.
- Deployed commit verifiable via `/api/status`.

## 15. Pending actions (owner)

1. **Rotate** the Stripe live secret key and the DeepSeek key (both were shared in
   chat). New values must be set in Vercel — the platform currently runs on the
   prior (still-valid) values.
2. Optional: `APP_VERSION`, off-site `DATABASE_URL` GitHub secret, Supabase PITR.

_Done: `REDIS_URL` provisioned (Upstash). Admin IP allowlist intentionally
skipped — replaced by per-login alert emails (owner is emailed on every console
sign-in)._

## 16. Key commands

```bash
pnpm verify:all        # lint + typecheck + tests + build
pnpm prod:preflight    # production config checks
pnpm smoke:cleanup     # remove smoke residue (--dry-run to preview)
pnpm drill:restore     # restore drill (refuses prod without --force)
pnpm i18n:report       # translation coverage
pnpm db:doctor         # database diagnostics
pnpm provenance:signoff -- --reviewer "Name" --confirm   # regulatory sign-off
```
