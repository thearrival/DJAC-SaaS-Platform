# Changelog

All notable changes to the DJAC Compliance Management SaaS Platform are documented in this file.

## [1.0.0] - 2025-08-06

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
