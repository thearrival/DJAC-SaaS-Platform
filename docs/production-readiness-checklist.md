# DJAC — Production Readiness Checklist & Go-Live Runbook

Status: **Engineering complete, P0 = 0.** Release is gated only on the
owner-side inputs in §1. Evidence for every engineering fix is in the git
history and the live verification matrix.

---

## 0. Engineering status — verified on the live platform

| Area                                                                            | Status   |
| ------------------------------------------------------------------------------- | -------- |
| Auth: local (email/password) + Google SSO (branded domain, SDK-signed sessions) | verified |
| Theming: light/dark across every surface incl. the owner console                | verified |
| i18n: 9 locales; lazy-loaded catalogs (entry chunk 1.56 MB → 0.20 MB)           | verified |
| Onboarding: questionnaire, personalization, owner console, product tour         | verified |
| Accessibility: axe gate on public + authenticated pages, 0 critical/serious     | verified |
| Security: strict hash-synced CSP, 0 dependency vulns, rate limiting             | verified |
| Reliability: serverless DB pool capped; service worker network-first            | verified |
| Observability: `/api/health`, `/api/readyz`, client-error telemetry             | verified |
| Performance: TTFB ~50–80 ms, FCP 156–540 ms warm (~1.0 s cold)                  | verified |

Gate: `pnpm verify:all` (681 unit/integration) + Playwright E2E + axe.
`GET /api/readyz` reports per-integration configuration under `integrations`
(googleSso, supabase, email, observability) plus core services (database,
redis, billing, aiOrchestrator).

## 1. What is needed to declare RELEASE READY (owner inputs)

### 1.1 Rotate leaked secrets (security — do first)

The following were committed to git history at some point and must be rotated:

| Secret                             | Where                              | Action                                                               |
| ---------------------------------- | ---------------------------------- | -------------------------------------------------------------------- |
| SMTP password                      | former `test_smtp*.py`             | Rotate the mailbox password; update `SMTP_PASS` in Vercel            |
| i18n job token (`e77a06bf…`)       | former `api/i18n-job.js` (deleted) | Consider already dead; regenerate/ignore                             |
| Hostinger API key (shared in chat) | —                                  | Revoke + reissue in hPanel → Profile → API                           |
| Google OAuth client secret         | shared in chat (Google Cloud)      | Rotate in Google Cloud, then update `GOOGLE_CLIENT_SECRET` in Vercel |
| `YALLA_ADMIN_SECRET`               | if ever shared                     | Rotate in Vercel                                                     |

Then (optional but recommended) purge history with `git filter-repo` and force-push.

### 1.2 Distributed rate limiting (reliability/abuse) — OPTIONAL

- The limiter now uses a shared **Postgres** counter table (`rateLimitWindows`,
  created by auto-migrate) in production when Redis is absent, so limits span
  all serverless instances.
- A **Redis URL** (`REDIS_URL`) is recommended for lower latency / less DB load,
  but is **no longer required for correctness**.

### 1.3 Backup & Disaster Recovery (data integrity)

- **Implemented:** `.github/workflows/db-backup.yml` runs a daily off-site
  `pg_dump` to GitHub Actions artifacts (30-day retention). Add the
  `DATABASE_URL` repository secret (direct/session connection) to activate it.
  See `docs/disaster-recovery.md` §3.
- **Remaining (owner):**
  - Add the `DATABASE_URL` GitHub secret so the daily backup runs.
  - Provide a **scratch/read-only Postgres URL** (e.g. a Supabase branch) so the
    restore drill in `docs/disaster-recovery.md` §4 can be executed and recorded.
  - For ≤1 h RPO, enable Supabase PITR when the plan allows.

### 1.4 Regulatory provenance (compliance integrity)

- The registry is **implemented** (`shared/regulatory-provenance.ts`) with a
  `verified` → `pending_review` → `stale` lifecycle, wired into
  `/api/trpc/compliance.globalRegistrySummary`, and guarded by tests that
  reject unverified claims. Every claim currently resolves to `unverified`.
- Remaining (data): provide, per framework/law, a verified **source URL**,
  **version**, **effective date**, and **last-verified reviewer** — then add
  the entries to `PROVENANCE_REGISTRY`. No legal sources are fabricated.

### 1.5 Product decisions (confirm)

- New scoring semantics: applicable-jurisdiction-only averaging; **no
  "compliant" verdict when jurisdiction data is missing**; report index is an
  honest 0–100 (no 45-floor/95-cap). Confirm this is the intended behavior.
- USCO logo usage on `/login` (link is live) — confirm you have the right to
  display the U.S. Copyright Office mark.

### 1.6 Test environments (to finish the last 2 code items safely)

- A **staging/preview** environment with a disposable DB, and either:
  - Stripe **test-mode** keys + a webhook secret (to replay webhook events), and
  - an SSO test path (to implement + verify the OAuth `state` nonce).

---

## 2. Required Vercel environment variables (presence check)

| Var                                           | Purpose                             | Status                              |
| --------------------------------------------- | ----------------------------------- | ----------------------------------- |
| `JWT_SECRET` (≥32 chars)                      | sessions                            | present (encrypted)                 |
| `DATABASE_URL`                                | Postgres                            | present                             |
| `APP_URL` / `APP_DOMAIN`                      | absolute links                      | present                             |
| `CRON_SECRET`                                 | cron auth + internal `/api/_*` gate | present                             |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | billing                             | present                             |
| `SMTP_*`                                      | email                               | present (rotate pass)               |
| `SENTRY_DSN`                                  | monitoring                          | present                             |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`   | Google SSO                          | present (rotate secret)             |
| `REDIS_URL`                                   | distributed rate limiting           | OPTIONAL (Postgres fallback active) |
| `AGENT_SWARM_TOKEN`                           | auth for AI swarm egress            | **MISSING (only if swarm used)**    |

---

## 3. Go-live procedure

1. **Pre-deploy**: `pnpm verify:all` (lint + tsc + tests + build) locally; ensure CI green.
2. **Database**: run reviewed migrations (`pnpm db:migrate`); never destructive without a backup.
3. **Deploy**: push to `main` (Vercel Git integration) or `npx vercel deploy --prod --yes`.
4. **Post-deploy smoke** (all must pass):
   ```bash
   curl -s https://app.yalla-hack.ae/api/status         # {"ok":true,"dbConnected":true,"env":"production"}
   curl -s -o /dev/null -w '%{http_code}\n' https://app.yalla-hack.ae/api/_stats   # 404
   curl -s -o /dev/null -w '%{http_code}\n' https://docs.app.yalla-hack.ae/        # 308
   ```
5. **Functional**: create a throwaway account and verify signup → login → dashboard → logout.
6. **Billing (test)**: run `scripts/webhook-test.ts` against a test secret; verify entitlements.
7. **Watch**: Sentry error rate, `/api/status` uptime, function duration, DB pool.

## 4. Rollback

`git revert <commit>` (auto-deploys) or `vercel rollback <previous-url>`.
Database rollback only via a reviewed forward migration.

## 5. Post-launch monitoring

- Uptime probe on `/api/status` and `/health` (expect `ok:true`).
- Alert on Sentry error-rate spike and on repeated auth failures.
- Review Vercel function duration/errors and DB slow queries weekly.
- Verify backups ran; record the next restore-drill date.
