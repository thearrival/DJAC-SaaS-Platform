# DJAC SaaS - Troubleshooting Guide

## Common Issues & Solutions

### Development Environment

#### `pnpm install` fails with native module errors

```bash
# Clear pnpm store and reinstall
pnpm store prune
rm -rf node_modules
pnpm install
```

Ensure Node.js 20+ and pnpm 10+ are installed:

```bash
node --version   # Should be >= 20
pnpm --version   # Should be >= 10
```

#### `supabase start` fails

```bash
# Check Docker is running
docker ps

# Reset Supabase completely
supabase stop --no-backup
supabase start
```

If port conflicts, edit `supabase/config.toml` to change ports.

#### `pnpm dev` crashes with database connection error

1. Verify Supabase is running: `supabase status`
2. Check `DATABASE_URL` in `.env` matches the DB URL from `supabase status`
3. Try explicit URL from Supabase: `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres`

#### TypeScript errors after dependency update

```bash
pnpm check --noEmit
# If types are broken, try:
rm -rf node_modules/.cache
pnpm install
```

#### `pnpm db:push` fails

```bash
# Check migration status
supabase db status

# Force reset (development only)
supabase db reset

# Re-push
pnpm db:push
```

### Authentication

#### Login returns "Authentication required (10001)"

- Check `JWT_SECRET` is set in `.env` (minimum 32 chars in production)
- Verify `COOKIE_DOMAIN` matches your deployment domain
- Clear browser cookies and try again
- Check browser console for CORS errors

#### OAuth callback fails with "Invalid state parameter"

- Verify `APP_URL` matches the redirect URI registered in Google/GitHub OAuth console
- Check that `GOOGLE_CALLBACK_URL` and `GITHUB_CALLBACK_URL` are correct

#### MFA setup shows invalid QR code

- Regenerate TOTP secret: call `localAuth.setupMfa` again
- Ensure device time is synchronized (TOTP is time-based)
- Use backup codes if MFA device is lost

#### "Too many login attempts"

Rate limited at 10 requests/minute on auth endpoints. Wait 1 minute or restart the dev server.

### Database

#### Migration conflicts

```bash
# Check current migration state
supabase db status

# Generate fresh migration
pnpm drizzle-kit generate

# Apply migrations
pnpm db:migrate
```

#### Connection pool exhausted

```
error: too many clients already
```

Increase pool size in `.env`:

```
DATABASE_POOL_SIZE=25
```

Or check for connection leaks in code (unclosed `getDb()` calls).

#### Supabase RLS blocking queries

Development: Ensure `SUPABASE_SERVICE_ROLE_KEY` is set — this bypasses RLS for backend operations.

Check RLS policies:

```sql
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public';
```

### AI Pipeline

#### AI assessment stuck in "queued" state

- Check if Redis is running (production): `redis-cli ping`
- In dev mode, ensure `AI_QUEUE_MODE=in_memory` or Redis is available
- Check server logs for queue worker errors

#### OpenAI API errors

Common errors:

- `401 Unauthorized` — Invalid `OPENAI_API_KEY`
- `429 Rate Limit` — OpenAI rate limit reached; add retry logic or upgrade plan
- `context_length_exceeded` — Input document too large; split or truncate

Check `OPENAI_MODEL` is set correctly (default: `gpt-4o`).

#### "Validator stage failed after max retries"

The AI Validator stage self-checks output quality. If it fails repeatedly:

- Check input document quality (clear formatting, valid text)
- Increase `AI_VALIDATOR_MAX_RETRIES` (default: 1)
- Review `aiAgentRuns` table for stage-level error messages

### Stripe Billing

#### Webhook not receiving events

- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
- Check the webhook endpoint is registered in Stripe: `/api/webhooks/stripe`
- In development, use Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

#### Checkout session creation fails

- Ensure all `STRIPE_PRICE_*` env vars are set with valid price IDs
- Price IDs must match the mode (live vs test) of your `STRIPE_SECRET_KEY`

### Deployment

#### Build fails on Vercel

Common issues:

- **Missing env vars**: Check Vercel project settings
- **Memory limit**: Large dependencies; consider externalizing
- **Node version**: Vercel must use Node 20+

```bash
# Test build locally
pnpm build
```

#### Supabase migration deploy fails

```bash
# Check migration status
supabase db status --linked

# Apply pending migrations
supabase db push --linked

# If stuck, check for manual changes on remote
supabase db diff --linked
```

#### Health check returns 503

Readiness endpoint checks: Database ↔ Redis ↔ Stripe ↔ AI. A 503 means one is down:

1. Check database connectivity: `DATABASE_URL` is valid
2. Check Redis connectivity: `REDIS_URL` is valid (if using redis mode)
3. Check Stripe API: `STRIPE_SECRET_KEY` is valid
4. Check OpenAI API: `OPENAI_API_KEY` is valid (if AI features required)

### Performance

#### Slow tRPC queries

- Check for N+1 queries: use `drizzle.select().where(...)` with proper joins
- Enable Drizzle query logging in development
- Check `compliance_framework_cache` TTL — increase from 10s (dev) to 60s (prod)

#### Large bundle size (client)

```bash
# Analyze bundle
pnpm build
npx vite-bundle-visualizer
```

Common culprits:

- Lazy-load heavy pages: use `React.lazy()` + `Suspense`
- Tree-shake unused Radix UI imports
- Check for duplicate dependencies in `pnpm-lock.yaml`

### Logging & Debugging

#### Enable verbose logging

```bash
# Set Pino log level
LOG_LEVEL=debug pnpm dev
```

#### Check structured logs

Pino logs JSON to stdout. In development, `pino-pretty` formats them. Production logs go to Vercel log drains.

#### Debug specific requests

Look for `X-Request-ID` in response headers — find matching log entries by this ID.

#### Sentry error tracking

- Verify `SENTRY_DSN` is set
- Check Sentry dashboard for error grouping
- Environment filtering: development errors have `SENTRY_ENVIRONMENT=development`

### Emergency Recovery

#### Database rollback

Supabase provides point-in-time recovery (PITR) on paid plans. For immediate recovery:

1. Download latest backup from Supabase dashboard
2. Restore to a new database
3. Update `DATABASE_URL` to point to restored DB

#### Service degradation

If a dependent service is down, the readiness endpoint reflects it:

```
GET /api/readiness
{
  "status": "degraded",
  "checks": {
    "database": "ok",
    "redis": "ok",
    "stripe": "ok",
    "ai": "unavailable"
  }
}
```

The app continues to serve requests that don't depend on unavailable services.

## Getting Help

1. Check existing documentation: `docs/`
2. Review codebase report: `DJAC-CODEBASE-REPORT.md`
3. Check GitHub Actions CI logs for build failures
4. Search Sentry for error patterns
5. Contact maintainers via the security reporting channel
