# DJAC SaaS - Deployment Guide

## Prerequisites

- Node.js 20+
- pnpm 10+
- Supabase account (project already linked: `gcsoeumdjrejfxuovfcw`)
- Vercel account
- Stripe account (for billing)
- OpenAI API key (for AI features)
- Sentry DSN (for error tracking)

## Environment Setup

1. Copy `.env.example` to `.env` for local development
2. Fill in all required values:
   - `DATABASE_URL` from Supabase → Project Settings → Database
   - `SUPABASE_URL` and `SUPABASE_ANON_KEY` from Supabase → Settings → API
   - `JWT_SECRET` - generate with `openssl rand -hex 64`
   - Stripe, OpenAI, Sentry keys as needed

## Local Development

```bash
# Install dependencies
pnpm install

# Start database (requires Docker)
supabase start

# Run migrations (via Drizzle)
pnpm db:push

# Start dev server
pnpm dev
```

## Database Migrations

### Via Drizzle (TypeScript schema)
```bash
# Generate migration from schema changes
pnpm drizzle-kit generate

# Apply migrations
pnpm db:migrate
```

### Via Supabase CLI (SQL)
```bash
# Push SQL migrations to linked project
supabase db push

# View migration status
supabase db status

# Diff local vs remote
supabase db diff --linked
```

## Supabase Edge Functions

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy send-notification

# Test locally
supabase functions serve
```

## CI/CD Pipeline

### GitHub Actions Workflows

1. **CI** (`.github/workflows/ci.yml`)
   - Runs on push/PR to main/develop
   - Steps: Lint → Type Check → Test → Supabase Migration Check → Build

2. **Deploy Staging** (`.github/workflows/deploy-staging.yml`)
   - Runs on push to develop
   - Deploys to Vercel preview environment

3. **Deploy Production** (`.github/workflows/deploy-production.yml`)
   - Runs on push to main
   - Deploys to Vercel production
   - Applies Supabase migrations
   - Performs health check

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI access token |
| `SUPABASE_DB_PASSWORD` | Supabase database password |
| `VERCEL_TOKEN` | Vercel deployment token |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `DATABASE_URL` | Production database URL |
| `JWT_SECRET` | JWT signing secret |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `APP_URL` | Production app URL |

## Production Deployment (Manual)

```bash
# 1. Build the application
pnpm build

# 2. Deploy to Vercel
vercel --prod

# 3. Apply database migrations
supabase db push --linked

# 4. Deploy edge functions
supabase functions deploy

# 5. Verify deployment
curl https://your-app.com/api/health
```

## Infrastructure Checklist

- [ ] Database connection pool configured (25 connections)
- [ ] Redis/Upstash for job queues
- [ ] Supabase RLS policies enabled
- [ ] Rate limiting configured (120 req/min)
- [ ] CORS origins restricted to production domain
- [ ] JWT_SECRET minimum 64 characters
- [ ] HTTPS enforced (Vercel does this automatically)
- [ ] Sentry error tracking enabled
- [ ] Email SMTP/Resend configured
- [ ] Stripe webhook endpoint registered
- [ ] Backup strategy in place (Supabase daily backups)
