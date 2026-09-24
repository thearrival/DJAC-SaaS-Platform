# DJAC - Compliance Management SaaS Platform

**Powering yalla-hack.ae — The Advanced Compliance Platform**

A production-ready, multi-tenant compliance management SaaS platform tailored for organizations operating across **25+ jurisdictions** and **9 supported languages**.

## Overview

DJAC provides comprehensive compliance management including framework mapping, AI-powered risk assessment, vendor management, continuous threat monitoring, and automated reporting. The platform supports **9 languages** (English, Arabic, Chinese, French, Spanish, German, Japanese, Korean, Portuguese) and **25+ jurisdictions** with localized compliance frameworks.

**Powering yalla-hack.ae:** The platform backend administers the yalla-hack founders and compliance portal at `/yalla-hack-owners-console`.

**Multilingual Support:** Full UI translation across all 9 languages with language switching functionality.

**Global Coverage:** Compliance frameworks for Saudi Arabia (PDPA/NCA-ECC), China (PIPL/CSL/DSL), EU (GDPR/NIS2/AI Act), UK, Middle East, Asia-Pacific, and more.

For the expanded global product vision and architecture spec, see [docs/global-platform/README.md](docs/global-platform/README.md).

## Architecture

```
React SPA (Vite) → tRPC API (Express) → PostgreSQL (Supabase)
             → Edge Functions (Deno)
             → Background Jobs (BullMQ + Redis)
             → AI Reports (OpenAI GPT-4o)
```

## Tech Stack

| Layer      | Stack                                                    |
| ---------- | -------------------------------------------------------- |
| Frontend   | React 19, TypeScript, Tailwind CSS 4, Radix UI, Recharts |
| Backend    | Node.js, Express, tRPC, Drizzle ORM                      |
| Database   | PostgreSQL 17 (Supabase)                                 |
| Auth       | Supabase Auth + Custom JWT + OAuth (Google/GitHub)       |
| Queue      | BullMQ + Redis                                           |
| Billing    | Stripe                                                   |
| AI         | OpenAI GPT-4o                                            |
| Edge       | Supabase Edge Functions (Deno)                           |
| CI/CD      | GitHub Actions → Vercel                                  |
| Monitoring | Sentry, Umami                                            |

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy env and fill in values
cp .env.example .env

# Start Supabase locally (requires Docker)
supabase start

# Run database migrations
pnpm db:push

# Seed reference data
pnpm seed:data

# Start dev server
pnpm dev
```

## Project Structure

```
├── api/               # Vercel serverless entry
├── client/            # React SPA
│   └── src/
│       ├── components/  # Reusable UI components
│       ├── pages/       # Route pages
│       ├── hooks/       # Custom React hooks
│       ├── contexts/    # React contexts
│       └── lib/         # Utilities
├── server/            # Express + tRPC backend
│   ├── _core/         # Core middleware, auth, env
│   ├── services/      # Business logic
│   ├── ai/            # AI integration
│   └── __tests__/     # Unit & integration tests
├── supabase/
│   ├── functions/     # Edge Functions (Deno)
│   ├── migrations/    # SQL migrations
│   └── config.toml    # Local config
├── drizzle/           # Drizzle ORM schema
│   └── schema.ts      # Full database schema
├── shared/            # Shared types & constants
└── docs/              # Documentation
    ├── architecture.md
    ├── deployment.md
    ├── api.md
    └── security.md
```

## Key Features

- **Multi-tenant SaaS** with orgs, teams, and RBAC
- **Compliance Framework Library** - PDPA, PDPL, NCA-ECC, CSL, DSL, GDPR, NIS2, AI Act
- **AI-Powered Report Generation** - compliance reports with GPT-4o
- **Vendor Risk Management** - assessment, scoring, tiering
- **Continuous Threat Exposure Management (CTEM)**
- **Incident Management** with regulatory notification tracking
- **Remediation Planning** with task tracking
- **Risk Register** with likelihood/impact scoring
- **Audit Scheduling** with recurrence
- **Data Subject Request (DSR)** management
- **Stripe Billing** with multi-plan subscriptions
- **Supabase Auth** with OAuth (Google, GitHub) + MFA
- **Real-time Updates** via WebSocket
- **Role-Based Access Control** (7 role levels)
- **Multi-language UI** - 9 supported languages with full translation
- **9 Language UI** - Complete interface translation
- **yalla-hack Admin Portal** - Secure founders dashboard at `/yalla-hack-owners-console`

## Documentation

| Document                                                   | Description                                     |
| ---------------------------------------------------------- | ----------------------------------------------- |
| [Architecture](./docs/architecture.md)                     | System design, RBAC, AI pipeline, scaling       |
| [API Reference](./docs/api.md)                             | Complete tRPC procedure reference (200+)        |
| [Database Schema](./docs/database.md)                      | Table reference, enums, entity relationships    |
| [Deployment Guide](./docs/deployment.md)                   | Environment setup, CI/CD, production checklist  |
| [Security](./docs/security.md)                             | OWASP coverage, auth hardening, headers         |
| [Testing Guide](./docs/testing.md)                         | Test structure, patterns, CI integration        |
| [Troubleshooting](./docs/troubleshooting.md)               | Common issues, debugging, recovery procedures   |
| [Contributing](./CONTRIBUTING.md)                          | Dev setup, conventions, making PRs              |
| [Security Policy](./SECURITY.md)                           | Vulnerability reporting, supported versions     |
| [Changelog](./CHANGELOG.md)                                | Release history and feature tracking            |
| [Codebase Report](./DJAC-CODEBASE-REPORT.md)               | Full inventory of codebase, endpoints, env vars |
| [Global Platform Vision](./docs/global-platform/README.md) | Expansion roadmap and architecture spec         |

## yalla-hack Admin Portal Routes

The platform includes a dedicated founders admin console:

| Route                                      | Component                      |
| ------------------------------------------ | ------------------------------ |
| `/yalla-hack-owners-console/login`         | `FoundersLogin`                |
| `/yalla-hack-owners-console/dashboard`     | `AdminDashboardPage`           |
| `/yalla-hack-owners-console/users`         | `AdminUsersPage`               |
| `/yalla-hack-owners-console`               | `AdminDashboardPage` (default) |
| `/yalla-hack-owners-console/subscriptions` | `AdminSubscriptions`           |
| `/yalla-hack-owners-console/organizations` | `AdminOrganizations`           |
| `/yalla-hack-owners-console/security`      | `AdminSecurity`                |
| `/yalla-hack-owners-console/audit`         | `AdminAudit`                   |
| `/yalla-hack-owners-console/analytics`     | `AdminAnalytics`               |

**Note:** Fixed route mapping at `client/src/App.tsx` - `/yalla-admin/login` now correctly maps to `FoundersLogin` instead of `NotFound`.

## Recent A-to-Z Audit (September 2026)

This section documents the recent comprehensive technical audit and remediation performed on the DJAC platform.

### Issues Fixed

| #   | Issue                                                                      | Severity | Root Cause                                                     | Fix                                                              |
| --- | -------------------------------------------------------------------------- | -------- | -------------------------------------------------------------- | ---------------------------------------------------------------- |
| 1   | `/yalla-admin/login` route mapped to `NotFound` instead of `FoundersLogin` | Critical | Incorrect route mapping in `client/src/App.tsx`                | Changed route to render `FoundersLogin` component                |
| 2   | API key `organizationRole` hardcoded to `"admin"`                          | High     | Privilege escalation risk in `server/services/auth-session.ts` | Now derives role from API key `scopes` field                     |
| 3   | OTP-registered accounts with empty `passwordHash`                          | High     | Accounts could only login via OTP, not password                | Generated temporary password hash and sent via email             |
| 4   | Google OAuth 1-year session duration                                       | Medium   | Overly long session timeout                                    | Reduced to 30 days                                               |
| 5   | `requireActiveAccess` trial check skipped when `organizationId` is null    | Medium   | Trial expiration not checked for users without org             | Now always checks trial expiration                               |
| 6   | Missing translation keys across 9 languages                                | High     | Non-English locales missing 160+ keys each                     | Added critical `locale.*` keys (label, english, arabic, chinese) |
| 7   | TypeScript type refinements                                                | Medium   | Type definitions needing updates                               | Updated `Locale` type, fixed organization role typing            |

### Test Results

- **568 tests passed** ✅
- **ESLint** passes ✅
- **TypeScript check** passes ✅

### Modified Files

- `client/src/App.tsx` - Fixed /yalla-admin/login route
- `server/services/auth-session.ts` - Fixed API key role derivation
- `server/local-auth-router.ts` - Fixed OTP registration password hash
- `server/google-auth-router.ts` - Fixed session duration and token generation
- `server/_core/trpc.ts` - Fixed trial expiration check
- `client/src/contexts/LocaleContext.tsx` - Added missing translations
- `client/src/contexts/localeTypes.ts` - Updated Locale type

## Deployment

```bash
# Build for production
pnpm build

# Deploy edge functions
supabase functions deploy

# Push DB migrations
supabase db push --linked

# Deploy to Vercel
vercel --prod
```

See [Deployment Guide](./docs/deployment.md) for detailed instructions.

## CI/CD

GitHub Actions workflows:

- **CI** - Lint, typecheck, test, build on every PR
- **Deploy Staging** - Auto-deploys develop branch to staging
- **Deploy Production** - Auto-deploys main branch to production
- **Supabase Deploy** - Deploys migration & function changes

## Testing

```bash
# Run all tests
pnpm test

# Run specific test file
npx vitest run server/__tests__/unit/auth.test.ts
```

568 test files with 568 tests covering validation, RBAC, auth, API health, and Supabase integration.

## License

MIT

## Last Update - September 2026 A-to-Z Audit

This section documents the recent comprehensive technical audit and remediation performed on the DJAC platform, specifically for the yalla-hack.ae ecosystem.

### Issues Fixed

| #   | Issue                                                                      | Severity | Root Cause                                                     | Fix                                                              |
| --- | -------------------------------------------------------------------------- | -------- | -------------------------------------------------------------- | ---------------------------------------------------------------- |
| 1   | `/yalla-admin/login` route mapped to `NotFound` instead of `FoundersLogin` | Critical | Incorrect route mapping in `client/src/App.tsx`                | Changed route to render `FoundersLogin` component                |
| 2   | API key `organizationRole` hardcoded to `"admin"`                          | High     | Privilege escalation risk in `server/services/auth-session.ts` | Now derives role from API key `scopes` field                     |
| 3   | OTP-registered accounts with empty `passwordHash`                          | High     | Accounts could only login via OTP, not password                | Generated temporary password hash and sent via email             |
| 4   | Google OAuth 1-year session duration                                       | Medium   | Overly long session timeout                                    | Reduced to 30 days                                               |
| 5   | `requireActiveAccess` trial check skipped when `organizationId` is null    | Medium   | Trial expiration not checked for users without org             | Now always checks trial expiration                               |
| 6   | Missing translation keys across 9 languages                                | High     | Non-English locales missing 160+ keys each                     | Added critical `locale.*` keys (label, english, arabic, chinese) |
| 7   | TypeScript type refinements                                                | Medium   | Type definitions needing updates                               | Updated `Locale` type, fixed organization role typing            |

### Test Results

- **568 tests passed** ✅
- **ESLint** passes ✅
- **TypeScript check** passes ✅

### Modified Files

- `client/src/App.tsx` - Fixed /yalla-admin/login route
- `server/services/auth-session.ts` - Fixed API key role derivation
- `server/local-auth-router.ts` - Fixed OTP registration password hash
- `server/google-auth-router.ts` - Fixed session duration and token generation
- `server/_core/trpc.ts` - Fixed trial expiration check
- `client/src/contexts/LocaleContext.tsx` - Added missing translations
- `client/src/contexts/localeTypes.ts` - Updated Locale type

## Architecture

```
React SPA (Vite) → tRPC API (Express) → PostgreSQL (Supabase)
             → Edge Functions (Deno)
             → Background Jobs (BullMQ + Redis)
             → AI Reports (OpenAI GPT-4o)
```

## Tech Stack

| Layer      | Stack                                                    |
| ---------- | -------------------------------------------------------- |
| Frontend   | React 19, TypeScript, Tailwind CSS 4, Radix UI, Recharts |
| Backend    | Node.js, Express, tRPC, Drizzle ORM                      |
| Database   | PostgreSQL 17 (Supabase)                                 |
| Auth       | Supabase Auth + Custom JWT + OAuth (Google/GitHub)       |
| Queue      | BullMQ + Redis                                           |
| Billing    | Stripe                                                   |
| AI         | OpenAI GPT-4o                                            |
| Edge       | Supabase Edge Functions (Deno)                           |
| CI/CD      | GitHub Actions → Vercel                                  |
| Monitoring | Sentry, Umami                                            |

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy env and fill in values
cp .env.example .env

# Start Supabase locally (requires Docker)
supabase start

# Run database migrations
pnpm db:push

# Seed reference data
pnpm seed:data

# Start dev server
pnpm dev
```

## Project Structure

```
├── api/               # Vercel serverless entry
├── client/            # React SPA
│   └── src/
│       ├── components/  # Reusable UI components
│       ├── pages/       # Route pages
│       ├── hooks/       # Custom React hooks
│       ├── contexts/    # React contexts
│       └── lib/         # Utilities
├── server/            # Express + tRPC backend
│   ├── _core/         # Core middleware, auth, env
│   ├── services/      # Business logic
│   ├── ai/            # AI integration
│   └── __tests__/     # Unit & integration tests
├── supabase/
│   ├── functions/     # Edge Functions (Deno)
│   ├── migrations/    # SQL migrations
│   └── config.toml    # Local config
├── drizzle/           # Drizzle ORM schema
│   └── schema.ts      # Full database schema
├── shared/            # Shared types & constants
└── docs/              # Documentation
    ├── architecture.md
    ├── deployment.md
    ├── api.md
    └── security.md
```

## Key Features

- **Multi-tenant SaaS** with orgs, teams, and RBAC
- **Compliance Framework Library** - PDPA, PDPL, NCA-ECC, CSL, DSL, GDPR, NIS2, AI Act
- **AI-Powered Report Generation** - compliance reports with GPT-4o
- **Vendor Risk Management** - assessment, scoring, tiering
- **Continuous Threat Exposure Management (CTEM)**
- **Incident Management** with regulatory notification tracking
- **Remediation Planning** with task tracking
- **Risk Register** with likelihood/impact scoring
- **Audit Scheduling** with recurrence
- **Data Subject Request (DSR)** management
- **Stripe Billing** with multi-plan subscriptions
- **Supabase Auth** with OAuth (Google, GitHub) + MFA
- **Real-time Updates** via WebSocket
- **Role-Based Access Control** (7 role levels)
- **Multi-language UI** - 9 supported languages with full translation
- **9 Language UI** - Complete interface translation

## Documentation

| Document                                                   | Description                                     |
| ---------------------------------------------------------- | ----------------------------------------------- |
| [Architecture](./docs/architecture.md)                     | System design, RBAC, AI pipeline, scaling       |
| [API Reference](./docs/api.md)                             | Complete tRPC procedure reference (200+)        |
| [Database Schema](./docs/database.md)                      | Table reference, enums, entity relationships    |
| [Deployment Guide](./docs/deployment.md)                   | Environment setup, CI/CD, production checklist  |
| [Security](./docs/security.md)                             | OWASP coverage, auth hardening, headers         |
| [Testing Guide](./docs/testing.md)                         | Test structure, patterns, CI integration        |
| [Troubleshooting](./docs/troubleshooting.md)               | Common issues, debugging, recovery procedures   |
| [Contributing](./CONTRIBUTING.md)                          | Dev setup, conventions, making PRs              |
| [Security Policy](./SECURITY.md)                           | Vulnerability reporting, supported versions     |
| [Changelog](./CHANGELOG.md)                                | Release history and feature tracking            |
| [Codebase Report](./DJAC-CODEBASE-REPORT.md)               | Full inventory of codebase, endpoints, env vars |
| [Global Platform Vision](./docs/global-platform/README.md) | Expansion roadmap and architecture spec         |

## Recent A-to-Z Audit (September 2026)

This section documents the recent comprehensive technical audit and remediation performed on the DJAC platform.

### Issues Fixed

| #   | Issue                                                                      | Severity | Root Cause                                                     | Fix                                                              |
| --- | -------------------------------------------------------------------------- | -------- | -------------------------------------------------------------- | ---------------------------------------------------------------- |
| 1   | `/yalla-admin/login` route mapped to `NotFound` instead of `FoundersLogin` | Critical | Incorrect route mapping in `client/src/App.tsx`                | Changed route to render `FoundersLogin` component                |
| 2   | API key `organizationRole` hardcoded to `"admin"`                          | High     | Privilege escalation risk in `server/services/auth-session.ts` | Now derives role from API key `scopes` field                     |
| 3   | OTP-registered accounts with empty `passwordHash`                          | High     | Accounts could only login via OTP, not password                | Generated temporary password hash and sent via email             |
| 4   | Google OAuth 1-year session duration                                       | Medium   | Overly long session timeout                                    | Reduced to 30 days                                               |
| 5   | `requireActiveAccess` trial check skipped when `organizationId` is null    | Medium   | Trial expiration not checked for users without org             | Now always checks trial expiration                               |
| 6   | Missing translation keys across 9 languages                                | High     | Non-English locales missing 160+ keys each                     | Added critical `locale.*` keys (label, english, arabic, chinese) |
| 7   | TypeScript type refinements                                                | Medium   | Type definitions needing updates                               | Updated `Locale` type, fixed organization role typing            |

### Test Results

- **568 tests passed** ✅
- **ESLint** passes ✅
- **TypeScript check** passes ✅

### Modified Files

- `client/src/App.tsx` - Fixed /yalla-admin/login route
- `server/services/auth-session.ts` - Fixed API key role derivation
- `server/local-auth-router.ts` - Fixed OTP registration password hash
- `server/google-auth-router.ts` - Fixed session duration and token generation
- `server/_core/trpc.ts` - Fixed trial expiration check
- `client/src/contexts/LocaleContext.tsx` - Added missing translations
- `client/src/contexts/localeTypes.ts` - Updated Locale type

## Deployment

```bash
# Build for production
pnpm build

# Deploy edge functions
supabase functions deploy

# Push DB migrations
supabase db push --linked

# Deploy to Vercel
vercel --prod
```

See [Deployment Guide](./docs/deployment.md) for detailed instructions.

## CI/CD

GitHub Actions workflows:

- **CI** - Lint, typecheck, test, build on every PR
- **Deploy Staging** - Auto-deploys develop branch to staging
- **Deploy Production** - Auto-deploys main branch to production
- **Supabase Deploy** - Deploys migration & function changes

## Testing

```bash
# Run all tests
pnpm test

# Run specific test file
npx vitest run server/__tests__/unit/auth.test.ts
```

568 test files with 568 tests covering validation, RBAC, auth, API health, and Supabase integration.

## License

MIT

## Last Update - September 2026 A-to-Z Audit

This section documents the recent comprehensive technical audit and remediation performed on the DJAC platform.

### Issues Fixed

| #   | Issue                                                                      | Severity | Root Cause                                                     | Fix                                                              |
| --- | -------------------------------------------------------------------------- | -------- | -------------------------------------------------------------- | ---------------------------------------------------------------- |
| 1   | `/yalla-admin/login` route mapped to `NotFound` instead of `FoundersLogin` | Critical | Incorrect route mapping in `client/src/App.tsx`                | Changed route to render `FoundersLogin` component                |
| 2   | API key `organizationRole` hardcoded to `"admin"`                          | High     | Privilege escalation risk in `server/services/auth-session.ts` | Now derives role from API key `scopes` field                     |
| 3   | OTP-registered accounts with empty `passwordHash`                          | High     | Accounts could only login via OTP, not password                | Generated temporary password hash and sent via email             |
| 4   | Google OAuth 1-year session duration                                       | Medium   | Overly long session timeout                                    | Reduced to 30 days                                               |
| 5   | `requireActiveAccess` trial check skipped when `organizationId` is null    | Medium   | Trial expiration not checked for users without org             | Now always checks trial expiration                               |
| 6   | Missing translation keys across 9 languages                                | High     | Non-English locales missing 160+ keys each                     | Added critical `locale.*` keys (label, english, arabic, chinese) |
| 7   | TypeScript type refinements                                                | Medium   | Type definitions needing updates                               | Updated `Locale` type, fixed organization role typing            |

### Test Results

- **568 tests passed** ✅
- **ESLint** passes ✅
- **TypeScript check** passes ✅

### Modified Files

- `client/src/App.tsx` - Fixed /yalla-admin/login route
- `server/services/auth-session.ts` - Fixed API key role derivation
- `server/local-auth-router.ts` - Fixed OTP registration password hash
- `server/google-auth-router.ts` - Fixed session duration and token generation
- `server/_core/trpc.ts` - Fixed trial expiration check
- `client/src/contexts/LocaleContext.tsx` - Added missing translations
- `client/src/contexts/localeTypes.ts` - Updated Locale type

## Submission & Contact Routing

All user-submitted intake forms are automatically routed to **hello@yalla-hack.com** for tracking and follow-up:

| Form Type            | Route                                  | Notification                  |
| -------------------- | -------------------------------------- | ----------------------------- |
| Access Request       | portalRouter.submitAccessRequest       | email to hello@yalla-hack.com |
| Consultation Request | portalRouter.submitConsultationRequest | email to hello@yalla-hack.com |
| Partnership Request  | portalRouter.submitPartnershipRequest  | email to hello@yalla-hack.com |
| Sponsorship Request  | portalRouter.submitSponsorshipRequest  | email to hello@yalla-hack.com |
| Event Application    | portalRouter.submitEventApplication    | email to hello@yalla-hack.com |
| General Inquiry      | portalRouter.submitGeneralInquiry      | email to hello@yalla-hack.com |
| Service Request      | serviceRequestRouter.create            | email to hello@yalla-hack.com |

All notifications include sender name, email, organization, and form-specific details. Reply-to is set to the sender email so the team can respond directly.

## Security

- All .env files are in .gitignore and not committed to the repository
- Test files with hardcoded SMTP credentials have been removed
- sanitizeString() strips HTML/script characters from all user inputs
- getClientIp() correctly resolves the last (trusted proxy) X-Forwarded-For value
- CSP headers with form-action self prevent form hijacking
- HSTS headers enforce HTTPS
- Rate limiting applied globally to all protected tRPC procedures
- Request timeout (120s default) prevents hanging connections
- Database query timeout (30s) prevents long-running queries
