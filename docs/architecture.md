# DJAC SaaS - System Architecture

## Overview

DJAC is a multi-tenant compliance management SaaS platform designed for organizations operating in Saudi Arabia and China. It provides framework mapping, risk assessment, vendor management, and continuous compliance monitoring.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           React SPA (Vite + Tailwind + Radix UI)      │  │
│  │           @tanstack/react-query + tRPC client         │  │
│  └──────────────────────┬────────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────┘
                          │ HTTP / WebSocket
┌─────────────────────────┼───────────────────────────────────┐
│                     API Layer (Vercel)                       │
│  ┌──────────────────────┴────────────────────────────────┐  │
│  │        Express + tRPC Server (Node.js)                │  │
│  │  Rate Limiting │ CORS │ Security Headers │ Auth       │  │
│  └──────┬────────────────────┬──────────────────┬─────────┘  │
└─────────┼────────────────────┼──────────────────┼────────────┘
          │                    │                  │
┌─────────┼────────────────────┼──────────────────┼────────────┐
│         ▼                    ▼                  ▼             │
│  ┌──────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │Supabase  │  │   Supabase PG    │  │   Redis (BullMQ) │   │
│  │ Auth     │  │   (Drizzle ORM)  │  │   (Job Queue)    │   │
│  │ Storage  │  │   + RLS Policies │  │   + Caching      │   │
│  │ Realtime │  └──────────────────┘  └──────────────────┘   │
│  └──────────┘                                                │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          External Services                           │   │
│  │  Stripe (Billing) │ OpenAI (AI Reports) │ Sentry    │   │
│  │  Resend (Email)   │ S3 (File Storage)  │ Umami     │   │
│  └──────────────────────────────────────────────────────┘   │
│                    Infrastructure Layer                      │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, TypeScript, Vite | SPA dashboard |
| **UI** | Tailwind CSS 4, Radix UI, Framer Motion | Responsive components |
| **State** | @tanstack/react-query, tRPC | Data fetching & mutations |
| **Backend** | Node.js, Express, tRPC | API server |
| **Database** | PostgreSQL 17 (Supabase), Drizzle ORM | Data persistence |
| **Auth** | Supabase Auth + Custom JWT | Authentication |
| **Queue** | BullMQ + Redis (Upstash) | Background jobs |
| **Billing** | Stripe | Subscription management |
| **AI** | OpenAI GPT-4o | Compliance analysis |
| **Storage** | Supabase Storage / AWS S3 | File uploads |
| **Email** | Resend / SMTP | Notifications |
| **Monitoring** | Sentry, Umami | Error tracking, analytics |
| **CI/CD** | GitHub Actions, Vercel | Deployment pipeline |

## Database Schema

The database uses PostgreSQL with Drizzle ORM. Key entities:

- **users / localUsers** - Authentication profiles
- **organizations** - Multi-tenant orgs with plans
- **organizationMembers** - RBAC within orgs
- **subscriptions / billingEvents** - Stripe billing
- **frameworks / complianceControls** - Regulatory framework library
- **vendors / vendorAssessments** - Third-party risk
- **complianceReports** - AI-generated reports
- **auditLogs** - Security audit trail
- **remediationTasks / riskRegister** - Risk management
- **complianceIncidents** - Incident tracking
- **ctemAssets / ctemVulnerabilities** - Continuous threat exposure

## API Architecture

- **tRPC** - Type-safe RPC for all CRUD operations
- **Express** - REST endpoints for webhooks, OAuth, health
- **WebSocket** - Real-time AI job status updates
- **Edge Functions** - Supabase Edge Functions for notifications, webhooks, exports

## API Design Principles

1. All mutations go through tRPC procedures with Zod validation
2. Public endpoints: health, readiness, OAuth callbacks
3. Protected endpoints: require valid session/JWT
4. Organization-scoped: require org membership
5. Admin endpoints: require role-based authorization
6. Rate limiting: 120 req/min general, 10 req/min auth
