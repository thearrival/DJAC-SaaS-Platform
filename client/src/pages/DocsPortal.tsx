/**
 * DJAC Documentation Portal — comprehensive product documentation
 * with multilingual support, interactive demos, and case studies.
 *
 * Route: /docs and /docs/:section
 */
import { useState, useMemo, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useLocale } from "@/contexts/useLocale";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Search,
  ChevronRight,
  ChevronDown,
  Globe,
  Zap,
  Shield,
  BarChart3,
  Building2,
  FileText,
  Gauge,
  Star,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Network,
  Play,
  Terminal,
  Server,
  CreditCard,
  Code,
  Lock,
  Rocket,
  Key,
  Bug,
  Layers,
} from "lucide-react";

interface DocSection {
  id: string;
  title: string;
  icon: string;
  pages: DocPage[];
}

interface DocPage {
  id: string;
  title: string;
  summary: string;
  content: string;
  diagram?: string;
  caseStudy?: {
    company: string;
    challenge: string;
    solution: string;
    results: string;
  };
  demoSteps?: string[];
  bestPractices?: string[];
  troubleshooting?: { problem: string; solution: string }[];
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  book: BookOpen,
  zap: Zap,
  shield: Shield,
  chart: BarChart3,
  building: Building2,
  file: FileText,
  gauge: Gauge,
  globe: Globe,
  star: Star,
  terminal: Terminal,
  server: Server,
  card: CreditCard,
  code: Code,
  lock: Lock,
  rocket: Rocket,
  key: Key,
  bug: Bug,
  layers: Layers,
};

const docsData: Record<string, DocSection[]> = {
  en: [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: "book",
      pages: [
        {
          id: "welcome",
          title: "Welcome to DJAC",
          summary:
            "DJAC is the world's first AI-powered cross-jurisdiction compliance intelligence platform. Deploy in minutes, not months, and achieve regulatory compliance across 29+ jurisdictions with continuous automated monitoring.",
          content: `### What is DJAC?

DJAC (De Jure Automated Compliance) is an enterprise SaaS platform that automates regulatory compliance across jurisdictions — China, Saudi Arabia, the GCC, the EU, North America, and APAC. Built for compliance officers, legal teams, enterprise administrators, consultants, and government regulators.

### Why DJAC?

- **29+ Jurisdictions** — PIPL, PDPL, CSL, DSL, GDPR, ISO 27001, SOC 2, NIST CSF, HIPAA, and more
- **AI-Powered Analysis** — GPT-4o driven 8-stage compliance assessment pipeline
- **Real-Time Monitoring** — Continuous compliance tracking with automated gap detection
- **Cross-Border Intelligence** — Data transfer compliance checker and regulatory change monitoring
- **Vendor Risk Management** — Automated third-party assessments across all selected frameworks
- **Enterprise-Grade Security** — AES-256 encryption, RBAC, audit trails, SOC 2 ready

### Quick Start (5 minutes)

1. **Create your organization** — Set up your company profile and billing
2. **Select jurisdictions** — Choose China, Saudi Arabia, EU, or any combination
3. **Pick frameworks** — AI auto-recommends relevant regulations
4. **Register a vendor** — Add your first third-party supplier
5. **Run assessment** — AI generates a complete compliance report in under 60 seconds

### Platform Tiers

| Tier | Monthly | Best For |
|------|---------|----------|
| Starter | From $99/mo | Small teams, single jurisdiction |
| Professional | From $249/mo | Multi-jurisdiction compliance |
| Enterprise | Custom | Global enterprises, API access, dedicated support |`,
        },
        {
          id: "architecture",
          title: "Platform Architecture",
          summary:
            "DJAC runs on a cloud-native architecture with React 19, Express + tRPC, PostgreSQL on Supabase, Redis, and OpenAI GPT-4o. All data is encrypted at rest and in transit.",
          content: `### System Architecture

DJAC employs a modern monorepo architecture:

**Frontend**: React 19 + TypeScript + Vite 7 + Tailwind CSS 4 + shadcn/ui  
**Backend**: Express 4 + tRPC 11 (200+ API procedures) + Drizzle ORM  
**Database**: PostgreSQL 17 on Supabase (AWS Tokyo, ap-northeast-2)  
**AI Engine**: OpenAI GPT-4o with 8-stage assessment pipeline  
**Queue**: In-memory / Redis (BullMQ-ready)  
**Auth**: Triple-path (Clerk OAuth + Supabase Auth + Local JWT)  
**Billing**: Stripe (5 plans × 4 intervals)  
**Hosting**: Vercel (serverless) + Docker  

### Data Flow

1. User submits vendor assessment request
2. Gatekeeper validates inputs (injection detection)
3. Intake parses documents and normalizes text
4. Extractor identifies structured facts (key-value-evidence triples)
5. RAG Context retrieves relevant compliance controls from DB
6. Judge (GPT-4o) evaluates compliance against controls
7. Synthesizer merges findings into cross-framework report
8. Validator ensures schema consistency and data integrity
9. Reporter generates final formatted output (PDF/DOCX/JSON)`,
          diagram: `[User] → [Gatekeeper] → [Intake] → [Extractor] → [RAG Context] → [Judge (GPT-4o)] → [Synthesizer] → [Validator] → [Reporter] → [PDF / DOCX / JSON]`,
        },
        {
          id: "roles",
          title: "Roles & Permissions",
          summary:
            "DJAC provides granular role-based access control with 6 platform roles and 4 organization roles. Each role has specific permission sets across 30+ modules.",
          content: `### Platform Roles

| Role | Level | Access |
|------|-------|--------|
| Basic User | 10 | Read-only access to assigned modules |
| Professional User | 20 | Full access to compliance features |
| Company Admin | 30 | Organization management + team |
| Platform Admin | 40 | Cross-org oversight and configuration |
| Yalla Hack Employee | 45 | Internal support and operations |
| Super Admin | 100 | Unrestricted full platform access |

### Organization Roles

| Role | Level | Capabilities |
|------|-------|-------------|
| Analyst | 10 | View-only on most modules |
| Compliance Officer | 20 | Create/Edit compliance data |
| Admin | 30 | Team management + API keys |
| Owner | 40 | Billing + org settings + full access |

### Permission Model

Each of the 30+ modules has 6 permission flags:
- \`canView\` — Read access
- \`canCreate\` — Create new records
- \`canEdit\` — Modify existing records
- \`canDelete\` — Remove records
- \`canExport\` — Download/export data
- \`canInvite\` — Invite team members`,
        },
      ],
    },
    {
      id: "ai-engine",
      title: "AI Compliance Engine",
      icon: "zap",
      pages: [
        {
          id: "ai-overview",
          title: "AI Engine Overview",
          summary:
            "DJAC's 8-stage AI pipeline uses GPT-4o to assess vendor compliance across multiple frameworks simultaneously. Each stage adds intelligence, validation, and quality assurance.",
          content: `### The 8-Stage Pipeline

1. **Gatekeeper** — Input validation, injection detection, data sanitization
2. **Intake** — Document parsing, text normalization, language detection
3. **Extractor** — Structured fact extraction into key-value-evidence triples
4. **RAG Context** — Retrieval-Augmented Generation: pulls relevant compliance controls from PostgreSQL
5. **Judge (GPT-4o)** — Evaluates each fact against applicable control requirements
6. **Synthesizer** — Merges findings, generates cross-framework comparison
7. **Validator** — Schema validation, cross-field consistency, retry on failure
8. **Reporter** — Final formatted output in PDF, DOCX, or JSON

### AI Features

- **Automated Gap Analysis** — Identifies missing controls and non-compliance areas
- **Risk Scoring (0-100)** — Per-framework and aggregate compliance scores
- **Remediation Recommendations** — AI-suggested actions ranked by priority
- **Penalty Estimation** — Calculates potential fines based on jurisdiction
- **Cross-Jurisdiction Comparison** — Side-by-side framework coverage analysis
- **Real-Time Job Streaming** — WebSocket-based progress tracking during assessments`,
        },
        {
          id: "rag-system",
          title: "RAG Context System",
          summary:
            "The Retrieval-Augmented Generation system retrieves the most relevant compliance controls from the database before AI analysis, ensuring grounded, accurate assessments.",
          content: `### How RAG Works

1. **Document Parsing** — Extracted facts from vendor documents
2. **Semantic Search** — Matches facts against 1,000+ compliance controls
3. **Relevance Scoring** — Ranks controls by jurisdictional and topical relevance
4. **Context Assembly** — Builds a focused context window for GPT-4o
5. **Grounded Response** — AI evaluates based ONLY on retrieved controls (no hallucination)

### Benefits

- Eliminates AI hallucinations in compliance advice
- Ensures framework-specific recommendations
- Maintains audit trail of control-to-finding mappings
- Supports 29+ jurisdictions with jurisdiction-specific controls

### Knowledge Base

- 46 regulatory frameworks
- 1,000+ compliance controls
- 14+ cross-framework relationship types
- Global standards cluster: ISO 27001, NIST CSF, SOC 2, HIPAA, PCI DSS`,
        },
      ],
    },
    {
      id: "frameworks",
      title: "Compliance Frameworks",
      icon: "shield",
      pages: [
        {
          id: "jurisdictions",
          title: "Supported Jurisdictions",
          summary:
            "DJAC covers 29+ jurisdictions across APAC, EMEA, North America, and Africa with comprehensive regulatory frameworks and continuous updates.",
          content: `### APAC Region

- **China** — PIPL (Personal Information Protection Law)
- **China** — CSL (Cybersecurity Law)
- **China** — DSL (Data Security Law)
- **China** — MLPS 2.0 (Multi-Level Protection Scheme)
- **Japan** — APPI (Act on Protection of Personal Information)
- **South Korea** — PIPA (Personal Information Protection Act)
- **Singapore** — PDPA (Personal Data Protection Act)
- **India** — DPDP Act (Digital Personal Data Protection)
- **Australia** — Privacy Act 1988

### Middle East / GCC

- **Saudi Arabia** — PDPL (Personal Data Protection Law)
- **Saudi Arabia** — NCA ECC / CSCC / OCC
- **UAE** — UAE PDPL
- **Qatar** — Qatar PDPPL
- **Bahrain** — Bahrain PDPL
- **Kuwait** — Kuwait DPA
- **Oman** — Oman PDPL

### Europe

- **EU/EEA** — GDPR (General Data Protection Regulation)
- **EU** — NIS2 Directive
- **EU** — DORA (Digital Operational Resilience Act)
- **United Kingdom** — UK GDPR / DPA 2018

### North America

- **United States** — HIPAA, CCPA/CPRA, SOX, PCI DSS
- **Canada** — PIPEDA

### Global Standards

- ISO 27001 / 27002
- NIST Cybersecurity Framework (CSF)
- SOC 2 Type II
- PCI DSS v4.0`,
        },
        {
          id: "pipl-guide",
          title: "PIPL Compliance Guide",
          summary:
            "Comprehensive guide to China's Personal Information Protection Law (PIPL), including data localization requirements, cross-border transfer rules, and CAC assessment procedures.",
          content: `### PIPL Overview

China's Personal Information Protection Law (PIPL) came into effect November 1, 2021. It regulates how organizations collect, use, store, and transfer personal information of individuals in China.

### Key Requirements

1. **Consent** — Explicit, informed consent for data collection and processing
2. **Data Minimization** — Collect only what is necessary for stated purposes
3. **Purpose Limitation** — Use data only for specified, reasonable purposes
4. **Data Localization** — Critical information infrastructure operators must store data in China
5. **Cross-Border Transfer** — CAC security assessment required for large-scale transfers
6. **DPIAs** — Data Protection Impact Assessments before high-risk processing
7. **Data Subject Rights** — Access, correction, deletion, portability
8. **Breach Notification** — Report to authorities within 72 hours

### Penalties

- Up to ¥50 million RMB (~$7M USD) or 5% of annual revenue
- Personal liability for responsible persons
- Business license revocation

### How DJAC Helps

- Automated PIPL control mapping (all 72 articles)
- Cross-border transfer assessment with CAC guidance
- Vendor risk scoring against PIPL requirements
- Continuous monitoring for regulatory updates
- Penalty calculator based on revenue and violation severity`,
          caseStudy: {
            company: "European SaaS Company",
            challenge:
              "Needed to launch in China while maintaining GDPR compliance. Required PIPL gap analysis for 12 vendors handling Chinese user data.",
            solution:
              "Used DJAC's PIPL module to assess all 12 vendors simultaneously. Generated cross-framework report showing GDPR-PIPL coverage overlap and gaps.",
            results:
              "Identified 47 compliance gaps across vendors. Achieved full PIPL compliance within 6 weeks. Reduced legal consultation costs by 60%.",
          },
        },
      ],
    },
    {
      id: "vendor-risk",
      title: "Vendor Risk Management",
      icon: "building",
      pages: [
        {
          id: "vendor-assessment",
          title: "Vendor Compliance Assessment",
          summary:
            "Automate third-party vendor compliance assessments across all selected frameworks. DJAC runs AI-powered analysis and generates gap reports with remediation guidance.",
          content: `### Automated Vendor Assessment

1. **Register Vendor** — Add vendor name, industry, jurisdiction, and tech stack
2. **Select Frameworks** — Choose applicable regulatory frameworks (PIPL, GDPR, PDPL, etc.)
3. **Upload Evidence** — Attach vendor policies, certifications, audit reports
4. **Run Assessment** — AI analyzes vendor against all selected frameworks
5. **Review Results** — Detailed gap analysis with risk scoring (0-100)
6. **Export Report** — Professional PDF/DOCX report for stakeholders

### Assessment Output

- **Overall Score** — Weighted average across all frameworks (0-100)
- **Per-Framework Scores** — Individual compliance scores
- **Risk Level** — Critical / High / Medium / Low
- **Gap Analysis** — Specific non-compliant controls with severity
- **Remediation Plan** — Prioritized action items with deadlines
- **Penalty Context** — Applicable fines per jurisdiction per gap

### Continuous Monitoring

DJAC automatically re-assesses vendors at configurable intervals (weekly, monthly, quarterly) and alerts you to:
- New regulatory requirements affecting existing vendors
- Changes in vendor risk profile
- Expiring certifications or audit reports
- Emerging threats related to vendor jurisdictions`,
          bestPractices: [
            "Assess vendors BEFORE contract signing, not after",
            "Set up quarterly re-assessment schedules for high-risk vendors",
            "Use the cross-jurisdiction comparison to identify framework overlaps",
            "Document all vendor responses to assessment findings",
            "Link vendor gaps to your internal risk register for traceability",
          ],
        },
        {
          id: "supplier-profiles",
          title: "Supplier Compliance Profiles",
          summary:
            "Build comprehensive vendor profiles with jurisdiction-specific data, tech stack analysis, and contact management.",
          content: `### Profile Components

- **Basic Info** — Name, industry, website, jurisdiction
- **Tech Stack** — Technology components with version tracking
- **Contacts** — Key personnel with role and jurisdiction assignment
- **Risk Tier** — Automated risk classification based on data processing
- **Assessment History** — Full timeline of all compliance assessments
- **Document Repository** — Evidence, certifications, policies

### Risk Tiering

DJAC automatically calculates vendor risk tiers:
- **Critical** — Handles personal/sensitive data, operates in high-regulation jurisdictions
- **High** — Processes regulated data, cross-border data flows
- **Medium** — Limited data exposure, standard regulatory requirements
- **Low** — Minimal risk profile, no sensitive data processing`,
        },
      ],
    },
    {
      id: "api-integration",
      title: "API & Integration",
      icon: "terminal",
      pages: [
        {
          id: "api-reference",
          title: "API Reference",
          summary:
            "DJAC exposes a type-safe tRPC API with 200+ procedures across 42 routers, plus REST endpoints for webhooks and health checks. All mutations use Zod validation.",
          content: `### API Overview

DJAC uses **tRPC** for end-to-end type-safe API operations. All procedures go through \`POST /api/trpc\` with batch support.

**Base URLs:**
- Production: \`https://app.yalla-hack.ae\`
- Local: \`http://localhost:3000\`

### Authentication Methods

| Method | Header | Use Case |
|--------|--------|----------|
| Session Cookie | \`app_session_id\` cookie | Web app (default) |
| API Key | \`x-djac-api-key: djac_<hex>\` | Programmatic access |
| Clerk OAuth | Auto-managed by Clerk SDK | External OAuth |

### Router Categories (42 routers, 200+ procedures)

| Domain | Routers | Key Procedures |
|--------|---------|----------------|
| **Auth** | \`localAuth\`, \`auth\`, \`googleAuth\` | register, login, mfa, logout |
| **Organization** | \`orgSettings\`, \`orgMembers\`, \`portal\` | create, invite, updateRole |
| **RBAC** | \`role\`, \`rbac\` | getPermissions, setModulePermissions |
| **Compliance** | \`compliance\`, \`regulatoryChanges\` | frameworks.list, controls.get |
| **Vendors** | \`vendor\`, \`vendorCompliance\` | list, create, assess |
| **Risk** | \`riskRegister\`, \`remediation\` | list, create, update |
| **Policy** | \`policyManager\`, \`incidentRegister\` | create, publish, update |
| **Audit** | \`auditSchedule\`, \`evidence\` | schedule, addFinding, upload |
| **CTEM** | \`ctem\`, \`assetInventory\` | list, create, getVulnerabilities |
| **DSR** | \`dsr\`, \`serviceRequests\` | list, create, fulfill |
| **AI** | \`ai\` | startAssessment, getJob |
| **Reports** | \`complianceReport\` | generate, download, schedule |
| **Graph** | \`knowledgeGraph\`, \`crossBorderFlow\` | search, analyze |
| **Billing** | \`billing\` | getPlans, createCheckoutSession |
| **Admin** | \`admin\`, \`system\` | getStats, getAuditLogs |
| **UX** | \`onboarding\`, \`notifications\`, \`analytics\`, \`personalization\`, \`customer360\` | Various |

### Error Response Format

All errors follow:
\`\`\`
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required (10001)",
    "details": {}
  }
}
\`\`\`

### Error Codes

| Code | Description |
|------|-------------|
| \`UNAUTHORIZED\` | Authentication required |
| \`FORBIDDEN\` | Insufficient permissions |
| \`NOT_FOUND\` | Resource not found |
| \`VALIDATION_ERROR\` | Input validation failed |
| \`RATE_LIMITED\` | Too many requests |
| \`INTERNAL_ERROR\` | Unexpected server error |`,
        },
        {
          id: "rate-limiting",
          title: "Rate Limiting & Security",
          summary:
            "DJAC implements tiered rate limiting with configurable windows to protect the API from abuse while ensuring fair usage for all tenants.",
          content: `### Rate Limiting Tiers

| Scope | Limit | Window | Headers |
|-------|-------|--------|---------|
| General API | 120 requests | 1 minute | \`X-RateLimit-Limit\`, \`X-RateLimit-Remaining\` |
| Auth endpoints | 10 requests | 1 minute | Same as above |
| Admin panel | 300 requests | 5 minutes | Custom headers |
| Health checks | Unlimited | N/A | None (bypassed) |

### Response Headers

Every rate-limited response includes:
- \`X-RateLimit-Limit\` — Maximum requests per window
- \`X-RateLimit-Remaining\` — Requests remaining in current window
- \`X-RateLimit-Reset\` — Unix timestamp when the window resets

### API Key Best Practices

- API keys use the \`djac_\` prefix format
- Keys inherit permissions of the creating user
- Keys are scoped to a single organization
- Revoke unused or compromised keys immediately
- Rotate keys every 90 days`,
        },
        {
          id: "webhooks",
          title: "Webhooks & Edge Functions",
          summary:
            "DJAC receives Stripe webhooks and uses Supabase Edge Functions for notifications, compliance events, and report exports.",
          content: `### Stripe Webhooks

**Endpoint:** \`POST /api/webhooks/stripe\`
**Auth:** Stripe signature verification (\`STRIPE_WEBHOOK_SECRET\`)

**Events handled:**
- \`checkout.session.completed\` — Provision subscription
- \`customer.subscription.updated\` — Update plan/status
- \`customer.subscription.deleted\` — Cancel subscription
- \`invoice.payment_succeeded\` — Record billing event
- \`invoice.payment_failed\` — Flag payment issue

### Supabase Edge Functions (Deno)

| Function | Endpoint | Purpose |
|----------|----------|---------|
| \`send-notification\` | \`/functions/v1/send-notification\` | Create user notifications |
| \`compliance-webhook\` | \`/functions/v1/compliance-webhook\` | Process compliance events |
| \`report-export\` | \`/functions/v1/report-export\` | Export JSON/CSV/PDF |
| \`auth-hooks\` | \`/functions/v1/auth-hooks\` | Sync auth users to DB |

**Development:** \`supabase functions serve\`
**Deploy:** \`supabase functions deploy\``,
        },
        {
          id: "websocket",
          title: "WebSocket Streaming",
          summary:
            "Real-time AI assessment progress is streamed via WebSocket at /ws/ai-jobs with job lifecycle events.",
          content: `### WebSocket Endpoint

**URL:** \`wss://app.yalla-hack.ae/ws/ai-jobs\`

### Event Types

| Event | Direction | Payload |
|-------|-----------|---------|
| \`job:progress\` | Server → Client | \`{ jobId, stage, message, progress }\` |
| \`job:complete\` | Server → Client | \`{ jobId, result: AiAssessmentReport }\` |
| \`job:error\` | Server → Client | \`{ jobId, error: string }\` |
| \`subscribe\` | Client → Server | \`{ jobId: string }\` |
| \`unsubscribe\` | Client → Server | \`{ jobId: string }\` |

### Usage Example

\`\`\`typescript
const ws = new WebSocket("wss://app.yalla-hack.ae/ws/ai-jobs");
ws.onopen = () => ws.send(JSON.stringify({ type: "subscribe", jobId }));
ws.onmessage = (e) => {
  const { type, stage, message } = JSON.parse(e.data);
  if (type === "job:progress") updateUI(stage, message);
  if (type === "job:complete") showResults(data.result);
};
\`\`\`

### AI Job Stages (8-stage pipeline)

1. **Gatekeeper** — Input validation, injection detection
2. **Intake** — Document parsing, text normalization
3. **Extractor** — Structured fact extraction
4. **RAG** — Retrieve relevant compliance controls
5. **Judge** — GPT-4o evaluates facts against controls
6. **Synthesizer** — Merge findings into cross-framework report
7. **Validator** — Schema validation, retry on failure
8. **Reporter** — Final formatted output (PDF/DOCX/JSON)`,
        },
      ],
    },
    {
      id: "security-compliance",
      title: "Security & Compliance",
      icon: "lock",
      pages: [
        {
          id: "security-overview",
          title: "Security Architecture",
          summary:
            "DJAC implements defense-in-depth across authentication, authorization, data protection, and infrastructure layers following OWASP Top 10 and SOC 2 principles.",
          content: `### Defense-in-Depth Layers

**Authentication:**
- Passwords hashed with bcrypt (12 rounds)
- JWT tokens signed with HS256 (min 64-char secret)
- HTTP-only, Secure, SameSite cookies
- TOTP-based MFA with backup codes
- OTP-based password reset (SHA-256, 5-min expiry)
- Brute force protection with exponential backoff

**Authorization:**
- 7 platform roles + 4 organization roles
- 32 permission-gated modules
- 6 granular permission flags per module
- Row-Level Security on all PostgreSQL tables
- Organization-scoped data isolation

**Data Protection:**
- TLS 1.3 for all data in transit
- PostgreSQL encrypted at rest (Supabase)
- Secrets in Vercel env vars + GitHub Actions secrets
- Never in code or version control

### Security Headers

| Header | Value | Purpose |
|--------|-------|---------|
| Strict-Transport-Security | max-age=63072000 | Enforce HTTPS |
| X-Content-Type-Options | nosniff | MIME sniffing prevention |
| X-Frame-Options | DENY | Clickjacking prevention |
| Content-Security-Policy | Restricted per route | XSS mitigation |
| Referrer-Policy | strict-origin-when-cross-origin | Referrer leakage |

### CVE Patching

- Dependabot automated vulnerability alerts
- pnpm overrides for transitive dependency patches
- CodeQL security analysis in CI pipeline`,
        },
        {
          id: "rbac-system",
          title: "RBAC & Permission System",
          summary:
            "DJAC's role-based access control system provides granular permissions across 32 platform modules with custom role overrides per organization.",
          content: `### Platform Roles (7 levels)

| Role | Level | Typical User |
|------|-------|-------------|
| Basic User | 10 | Read-only access |
| Professional User | 20 | Full compliance features |
| Company Admin | 30 | Organization + team management |
| Platform Admin | 40 | Cross-org oversight |
| Yalla Hack Employee | 45 | Internal support |
| Super Admin | 100 | Unrestricted access |

### Organization Roles (4 levels)

| Role | Level | Capabilities |
|------|-------|-------------|
| Analyst | 10 | View-only on most modules |
| Compliance Officer | 20 | Create/Edit compliance data |
| Admin | 30 | Team + API key management |
| Owner | 40 | Billing + full org settings |

### Permission Resolution Flow

1. Request arrives at tRPC procedure
2. Auth middleware extracts \`ctx.user\` and \`ctx.orgRole\`
3. System checks custom \`rolePermissions\` row for (orgId, role, module)
4. If no custom row, falls back to \`DEFAULT_ORG_ROLE_PERMISSIONS\`
5. Compares requested action (e.g., canEdit) against PermissionFlags
6. Returns Allow or 403 FORBIDDEN

### Permission Flags

Each module has 6 boolean flags:
- \`canView\` — Read access
- \`canCreate\` — Create new records
- \`canEdit\` — Modify existing records
- \`canDelete\` — Remove records
- \`canExport\` — Download/export data
- \`canInvite\` — Invite team members

### Default Permission Templates

| Role | Default Pattern |
|------|----------------|
| Analyst | VIEW_ONLY on most modules |
| Compliance Officer | STANDARD on compliance, VIEW_ONLY on legal |
| Admin | FULL on compliance, STANDARD on settings |
| Owner | FULL on everything, including billing |`,
        },
        {
          id: "audit-trail",
          title: "Audit Logging & Monitoring",
          summary:
            "Comprehensive audit logging tracks all data mutations with category, action, outcome, and actor attribution. Sentry provides real-time error monitoring.",
          content: `### Audit Log System

**Table:** \`auditLogs\`
**Categories:** auth, data_write, data_read, role_change, system, billing
**Outcomes:** success, failure, blocked

Every audit log entry records:
- \`actorId\` — Who performed the action
- \`category\` — Type of event
- \`action\` — What was done
- \`outcome\` — Result (success/failure/blocked)
- \`details\` — JSON payload with relevant data
- \`ipAddress\` — Request origin
- \`createdAt\` — Timestamp

### Audit Log Access

- **Org Admins** — View audit logs for their organization
- **Yalla Admin** — View all platform audit logs with filtering
- **API Access** — \`admin.getAuditLogs\` tRPC procedure

### Sentry Monitoring

- **Server:** \`@sentry/node\` v10 with Express integration
- **Client:** \`@sentry/react\` with React error boundary
- **Sampling:** 10% trace sample production, 100% development
- **Environments:** production, staging, development

### Pino Structured Logging

- **Format:** JSON (production) / pretty-print (development)
- **Levels:** trace, debug, info, warn, error, fatal
- **Context:** request ID, user ID, org ID per log entry`,
        },
        {
          id: "data-protection",
          title: "Data Protection & Privacy",
          summary:
            "DJAC implements multi-tenant data isolation, end-to-end encryption, and supports data subject request management for GDPR, PIPL, and PDPL compliance.",
          content: `### Multi-Tenant Data Isolation

Every organization-scoped query includes \`orgId\` filtering enforced at:
1. **tRPC middleware** — Extracts \`orgId\` from session
2. **Drizzle queries** — All queries filter by \`ctx.orgId\`
3. **Row-Level Security** — PostgreSQL RLS as defense-in-depth
4. **API keys** — Scoped to a single organization

### Encryption Standards

- **In Transit:** TLS 1.3 via Vercel edge network
- **At Rest:** AES-256 (Supabase managed PostgreSQL)
- **Passwords:** bcrypt with 12 salt rounds
- **Secrets:** Vercel encrypted environment variables
- **OTP Codes:** SHA-256 hashed in database

### Data Subject Requests (DSR)

Full DSR lifecycle management:
- **Request Types:** Access, Rectification, Erasure, Portability, Restriction
- **Workflow:** Submission → Validation → Fulfillment → Verification
- **Deadline Tracking:** Jurisdiction-specific response times
- **Automated Evidence:** Audit trail of all DSR actions

### Data Retention

- **Interaction Logs:** Configurable TTL (default 90 days)
- **Audit Logs:** Retained indefinitely for compliance
- **Deleted Users:** Anonymized per GDPR/PIPL requirements`,
        },
      ],
    },
    {
      id: "developer-guide",
      title: "Developer Guide",
      icon: "code",
      pages: [
        {
          id: "dev-setup",
          title: "Development Environment Setup",
          summary:
            "Set up your local development environment with Node.js 20+, pnpm 10+, Docker for Supabase, and all required services.",
          content: `### Prerequisites

- Node.js 20+
- pnpm 10+ (\`npm install -g pnpm@10\`)
- Docker Desktop (for local Supabase)
- Supabase CLI (\`npm install -g supabase\`)
- Git

### First-Time Setup

\`\`\`bash
git clone <repo-url> djac
cd djac
pnpm install
cp .env.example .env
# Edit .env with your local values (minimum: DATABASE_URL)
supabase start
pnpm db:push
pnpm seed:data
pnpm dev
# App available at http://localhost:3000
\`\`\`

### Required Environment Variables

| Variable | Source | Purpose |
|----------|--------|---------|
| \`DATABASE_URL\` | \`supabase status\` | PostgreSQL connection |
| \`SUPABASE_URL\` | \`supabase status\` | Supabase API URL |
| \`SUPABASE_ANON_KEY\` | \`supabase status\` | Anonymous client key |
| \`SUPABASE_SERVICE_ROLE_KEY\` | \`supabase status\` | Service role (bypass RLS) |
| \`JWT_SECRET\` | Any random string | JWT signing |
| \`OPENAI_API_KEY\` | OpenAI dashboard | AI features (optional) |
| \`STRIPE_SECRET_KEY\` | Stripe dashboard | Billing (optional) |

### Dev Auth Bypass

For local development without OAuth:
\`\`\`env
DEV_AUTH_BYPASS=true
DEV_AUTH_OPEN_ID=local-dev-user
DEV_AUTH_EMAIL=dev@example.com
DEV_AUTH_ROLE=super_admin
\`\`\`

### Available Scripts

| Command | Purpose |
|---------|---------|
| \`pnpm dev\` | Start dev server with hot reload |
| \`pnpm check\` | TypeScript type checking |
| \`pnpm lint\` | ESLint code quality |
| \`pnpm test\` | Run all tests (vitest) |
| \`pnpm build\` | Production build |
| \`pnpm verify:all\` | Run all checks + build |`,
          demoSteps: [
            "Clone the repository and install dependencies with 'pnpm install'",
            "Copy .env.example to .env and fill in required values",
            "Start Supabase locally with 'supabase start'",
            "Push database schema with 'pnpm db:push'",
            "Seed reference data with 'pnpm seed:data'",
            "Start dev server with 'pnpm dev' and open http://localhost:3000",
          ],
        },
        {
          id: "project-structure",
          title: "Project Structure & Architecture",
          summary:
            "DJAC is a pnpm monorepo with client (React SPA), server (Express + tRPC), and shared code organized by domain.",
          content: `### Directory Structure

\`\`\`
djac/
├── client/              # React 19 SPA (Vite 7 + Tailwind CSS 4)
│   └── src/
│       ├── pages/       # 70+ route pages
│       ├── components/  # 39 shared UI components
│       ├── hooks/       # Custom React hooks
│       ├── contexts/    # Theme, Locale contexts
│       └── lib/         # tRPC client, utilities
├── server/              # Express 4 + tRPC 11 backend
│   ├── _core/           # Auth, env, security, trpc, rate limit
│   ├── ai/              # 8-stage AI pipeline + queue
│   ├── services/        # Business logic (billing, email, OTP)
│   └── __tests__/       # 40+ test files
├── shared/              # Shared types and constants
│   └── const.ts         # Roles, permissions, RBAC defaults
├── drizzle/             # Drizzle ORM schema + migrations
│   └── schema.ts        # 60+ tables, 30+ enums
├── supabase/            # Supabase config + Edge Functions
│   └── functions/       # 4 Deno Edge Functions
└── scripts/             # 43 operational scripts
\`\`\`

### Tech Stack Details

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React, TypeScript | 19.2, 5.9 |
| Bundler | Vite | 7.3 |
| Styling | Tailwind CSS, Radix UI | 4.1, latest |
| Backend | Express, tRPC | 4.21, 11.8 |
| ORM | Drizzle ORM | 0.45 |
| Database | PostgreSQL (Supabase) | 17 |
| Queue | BullMQ + Redis | 5.7 |
| AI | OpenAI GPT-4o | 4.67 |
| Billing | Stripe | 20.4 |
| Monitoring | Sentry, Pino | 10.47, 9.5 |

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case | \`compliance-framework-router.ts\` |
| tRPC Routers | camelCase | \`complianceFrameworkRouter\` |
| Procedures | dot-separated | \`compliance.frameworks.list\` |
| DB Tables | snake_case | \`organization_members\` |
| DB Columns | snake_case | \`created_at\` |
| React Components | PascalCase | \`VendorAssessmentPage\` |
| Hooks | \`use\` prefix | \`useAuth\` |`,
        },
        {
          id: "adding-features",
          title: "Adding New Features",
          summary:
            "Follow DJAC's patterns for adding new tRPC routers, React pages, database tables, and tests.",
          content: `### Adding a New tRPC Router

**1. Create router file** — \`server/my-feature-router.ts\`:
\`\`\`typescript
import { z } from "zod";
import { orgProcedure, router } from "./_core/trpc";

export const myFeatureRouter = router({
  list: orgProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      return db.select().from(myTable).where(eq(myTable.orgId, input.orgId));
    }),
  create: orgProcedure
    .input(z.object({ orgId: z.string(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const [record] = await db.insert(myTable).values(input).returning();
      return record;
    }),
});
\`\`\`

**2. Register in \`server/routers.ts\`:**
\`\`\`typescript
import { myFeatureRouter } from "./my-feature-router";
export const appRouter = router({
  // ... existing routers
  myFeature: myFeatureRouter,
});
\`\`\`

### Adding a New Page

1. Create \`client/src/pages/MyNewPage.tsx\`
2. Add route in \`client/src/App.tsx\`:
   \`\`\`tsx
   const MyNewPage = lazy(() => import("./pages/MyNewPage"));
   <Route path="/my-page" component={MyNewPage} />
   \`\`\`
3. Add navigation link in \`DashboardLayout.tsx\`
4. Add i18n keys in \`LocaleContext.tsx\`

### Adding Database Tables

1. Edit \`drizzle/schema.ts\`
2. Generate migration: \`pnpm drizzle-kit generate\`
3. Apply: \`pnpm db:migrate\`
4. Update seed scripts if needed

### API Design Rules

1. All mutations use tRPC with Zod validation
2. Use \`protectedProcedure\` for authenticated endpoints
3. Use \`orgProcedure\` for org-scoped endpoints
4. Check \`ctx.user.role\` for authorization
5. Never trust client input — always validate with Zod
6. Return typed responses (never \`any\`)`,
        },
        {
          id: "testing",
          title: "Testing Guide",
          summary:
            "DJAC uses Vitest for unit and integration tests. 40+ test files cover auth, RBAC, validation, and API flows.",
          content: `### Running Tests

\`\`\`bash
pnpm test                   # Run all tests
npx vitest run path/to/file # Run specific file
npx vitest --ui             # Interactive UI
npx vitest --coverage       # Coverage report
\`\`\`

### Test Structure

\`\`\`
server/__tests__/
├── unit/               # Unit tests (auth, RBAC, validation)
└── integration/        # API flow tests
client/src/__tests__/
├── components/         # Component rendering tests
└── hooks/              # Custom hook tests
\`\`\`

### Test Patterns

**tRPC Procedure Test:**
\`\`\`typescript
import { describe, it, expect } from "vitest";

describe("vendor.list", () => {
  it("should return vendors for the org", async () => {
    const vendors = await caller.vendor.list({ orgId: "org_123" });
    expect(Array.isArray(vendors)).toBe(true);
  });
});
\`\`\`

### Best Practices

- Isolate tests with setup/teardown
- Mock external APIs (Stripe, OpenAI, SendGrid)
- Test edge cases and authorization
- Test with different role levels`,
        },
      ],
    },
    {
      id: "deployment-operations",
      title: "Deployment & Operations",
      icon: "server",
      pages: [
        {
          id: "deployment",
          title: "Deployment Options",
          summary:
            "DJAC supports deployment on Vercel (serverless), Docker, and manual VPS. CI/CD pipelines automate staging and production deployments.",
          content: `### Deployment Options

| Option | Best For | Setup Time |
|--------|----------|------------|
| Vercel (Recommended) | Production SaaS | 5 minutes |
| Docker | Self-hosted, on-prem | 15 minutes |
| Manual VPS | Custom infrastructure | 30 minutes |

### Vercel Deployment (Production)

\`\`\`bash
# 1. Build
pnpm build

# 2. Deploy
vercel --prod

# 3. Apply DB migrations
supabase db push --linked

# 4. Deploy Edge Functions
supabase functions deploy

# 5. Verify
curl https://your-app.com/api/health
\`\`\`

### Docker Deployment

\`\`\`bash
docker build -t djac:latest .
docker run -d -p 3000:3000 --env-file .env.production --name djac-app djac:latest
\`\`\`

### CI/CD Pipeline

| Workflow | Trigger | Actions |
|----------|---------|---------|
| CI | Push/PR to main/develop | Lint, Typecheck, Test, Build |
| Staging | Push to develop | Auto-deploy to Vercel preview |
| Production | Push to main | Deploy + DB migration + health check |
| Supabase Deploy | Push to main | Deploy migrations + functions |

### Production Checklist

- [ ] JWT_SECRET ≥ 64 random characters
- [ ] ALLOW_IN_MEMORY_PERSISTENCE=false
- [ ] DEV_AUTH_BYPASS=false
- [ ] Database pool size: 25 connections
- [ ] Redis configured for AI queue
- [ ] RLS policies enabled
- [ ] CORS restricted to production domain
- [ ] Sentry error tracking enabled
- [ ] Stripe webhook registered`,
        },
        {
          id: "monitoring",
          title: "Monitoring & Observability",
          summary:
            "DJAC uses Sentry for error tracking, Pino for structured logging, and health/readiness endpoints for operational monitoring.",
          content: `### Health Endpoints

| Endpoint | Purpose | Response |
|----------|---------|----------|
| \`/api/health\` | Health check | Status, uptime, version |
| \`/api/healthz\` | Liveness probe | Always 200 |
| \`/api/readiness\` | Readiness check | DB, Redis, Stripe, AI status |
| \`/api/readyz\` | Alias for readiness | Same |

### Readiness Response Example

\`\`\`json
{
  "status": "ok",
  "checks": {
    "database": "ok",
    "redis": "ok",
    "stripe": "ok",
    "ai": "ok"
  }
}
\`\`\`

A degraded response (\`503\`) indicates one or more services are unavailable.

### Pino Logging

\`\`\`bash
# Development (pretty-print)
pnpm dev

# Debug level logging
LOG_LEVEL=debug pnpm dev
\`\`\`

### Sentry Setup

Set in \`.env.production\`:
\`\`\`
SENTRY_DSN=https://...
VITE_SENTRY_DSN=https://...
SENTRY_ENVIRONMENT=production
\`\`\`

### Background Schedulers

| Scheduler | Interval | Purpose |
|-----------|----------|---------|
| Interaction Retention | 24h | Purge old interaction logs |
| Trial Reminder | 6h | Email expiring trials |
| Deadline Alert | 1h | Regulatory deadline notifications |
| Report Delivery | Config | Scheduled report generation |
| SSE Broadcast | Real-time | Admin dashboard events |`,
        },
        {
          id: "troubleshooting",
          title: "Troubleshooting Common Issues",
          summary:
            "Solutions for common development, deployment, and operational issues encountered with DJAC.",
          content: `### Common Issues

**Database connection errors on startup:**

- Verify \`DATABASE_URL\` in \`.env\`
- Ensure Supabase is running: \`supabase status\`
- Check for stale connection pool: restart server

**AI assessment stuck in "queued":**

- Check Redis connectivity: \`redis-cli ping\`
- In dev mode, confirm \`AI_QUEUE_MODE=in_memory\`
- Check server logs for queue worker errors

**OpenAI API errors:**

- \`401\`: Invalid \`OPENAI_API_KEY\`
- \`429\`: Rate limit reached — add retry logic
- \`context_length_exceeded\`: Input too large — truncate

**Build fails on Vercel:**

- Check Vercel project env vars are set
- Ensure Node 20+ in Vercel settings
- Test locally: \`pnpm build\`

### Debugging

- Enable debug logs: \`LOG_LEVEL=debug pnpm dev\`
- Track requests: \`X-Request-ID\` in response headers
- Check Sentry dashboard for error grouping

### Recovery Procedures

**Database rollback:**
1. Download latest backup from Supabase
2. Restore to new database
3. Update \`DATABASE_URL\`

**Service degradation:**
The readiness endpoint shows which services are down. The app continues serving requests that don't depend on unavailable services.`,
          troubleshooting: [
            {
              problem: "Login returns 'Authentication required (10001)'",
              solution:
                "Check JWT_SECRET is set in .env. Clear browser cookies. Verify COOKIE_DOMAIN matches deployment domain.",
            },
            {
              problem: "pnpm db:push fails with migration errors",
              solution:
                "Check migration status with 'supabase db status'. Use 'supabase db reset' for development reset.",
            },
            {
              problem: "Vercel build fails with memory limit",
              solution:
                "Consider externalizing large dependencies. Increase Node memory in Vercel settings.",
            },
            {
              problem: "Stripe webhook not receiving events",
              solution:
                "Verify STRIPE_WEBHOOK_SECRET. Check webhook endpoint in Stripe dashboard. Use 'stripe listen' for local testing.",
            },
          ],
        },
      ],
    },
    {
      id: "billing-plans",
      title: "Billing & Plans",
      icon: "card",
      pages: [
        {
          id: "pricing-overview",
          title: "Pricing & Plans Overview",
          summary:
            "DJAC offers flexible subscription plans for teams of all sizes — from startups needing single jurisdiction compliance to global enterprises.",
          content: `### Plan Comparison

| Feature | Free Trial | Starter | Professional | Enterprise |
|---------|-----------|---------|-------------|------------|
| Jurisdictions | 1 | 3 | 10 | Unlimited |
| Vendors | 5 | 25 | 100 | Unlimited |
| AI Assessments/mo | 3 | 20 | 100 | Custom |
| Team Members | 2 | 10 | 50 | Unlimited |
| Reports | Basic | Standard | Advanced | Custom |
| API Access | — | — | ✓ | ✓ |
| Priority Support | — | — | ✓ | ✓ |
| Custom Integrations | — | — | — | ✓ |
| SLA | — | 99.5% | 99.9% | 99.95% |

### Billing Intervals

All paid plans support:
- **Monthly** — Standard rate
- **Quarterly** — 10% discount
- **Biannual** — 15% discount
- **Annual** — 20% discount

### Free Trial

- 14-day free trial on Starter plan
- No credit card required to start
- Full access to all Starter features
- Automatic upgrade reminder before trial ends`,
        },
        {
          id: "subscription-management",
          title: "Managing Your Subscription",
          summary:
            "Upgrade, downgrade, or cancel your subscription through the Stripe Customer Portal. View billing history and download invoices.",
          content: `### Subscription Lifecycle

1. **Trial** → Automatic 14-day trial on signup
2. **Active** → Paid subscription after trial or direct purchase
3. **Past Due** → Payment failed; grace period before cancellation
4. **Canceled** → Subscription ended; data retained for 30 days
5. **Paused** → Temporarily suspended (Enterprise only)

### Upgrade / Downgrade

- **Upgrade:** Immediate access to new features. Prorated charges for current billing period.
- **Downgrade:** Takes effect at end of current billing period.

### Billing Portal

Access via: **Dashboard → Billing & Plan → Manage Subscription**

The Stripe Customer Portal allows:
- Update payment method
- View billing history
- Download invoices
- Change plan
- Cancel subscription

### Payment Methods

- Credit/Debit cards (Visa, Mastercard, Amex)
- Bank transfers (Enterprise only)
- Invoice billing (Enterprise only)

### Refund Policy

- Monthly plans: Prorated refund within 7 days
- Annual plans: Full refund within 30 days, prorated thereafter
- Credit applied to account for service outages exceeding SLA`,
          troubleshooting: [
            {
              problem: "Payment failed but card is valid",
              solution:
                "Check with your bank for international transaction blocks. Try an alternative card. Contact support for manual invoice payment.",
            },
            {
              problem: "Upgrade not reflected in dashboard",
              solution:
                "Allow up to 5 minutes for provisioning. If still not visible, try refreshing the page or logging out and back in.",
            },
            {
              problem: "Trial ended but need more time",
              solution:
                "Contact support for a one-time 7-day trial extension. Extension is available once per organization.",
            },
          ],
        },
      ],
    },
    {
      id: "operations",
      title: "Cyber Operations",
      icon: "gauge",
      pages: [
        {
          id: "risk-register",
          title: "Risk Register",
          summary:
            "Centralized risk management with automated severity scoring, treatment planning, and framework linkage.",
          content: `### Risk Management Workflow

1. **Identify** — Log organizational risks with category and likelihood/impact
2. **Assess** — Automated risk scoring (likelihood × impact)
3. **Treat** — Select treatment strategy: Accept, Mitigate, Transfer, Avoid
4. **Link** — Connect risks to vendors, frameworks, and remediation tasks
5. **Monitor** — Track risk status and treatment progress

### Risk Categories

- **Operational** — Process failures, system outages
- **Legal** — Regulatory non-compliance, contractual violations
- **Technical** — Security vulnerabilities, architecture weaknesses
- **Financial** — Budget overruns, fraud exposure
- **Reputational** — Brand damage, customer trust erosion`,
        },
        {
          id: "incident-management",
          title: "Incident Management",
          summary:
            "Log, track, and resolve security and compliance incidents with automated regulatory mapping and notification timelines.",
          content: `### Incident Lifecycle

1. **Detection** — Log incident with type, severity, and affected systems
2. **Triage** — Automated severity classification and assignee routing
3. **Investigation** — Timeline tracking with evidence collection
4. **Containment** — Action tracking and stakeholder notification
5. **Resolution** — Root cause analysis and remediation documentation
6. **Closure** — Post-incident review and lessons learned

### Automated Regulatory Mapping

DJAC automatically maps incidents to affected regulations:
- Data breach in China → PIPL Art. 57 notification (72h to CAC)
- Data breach in EU → GDPR Art. 33 notification (72h to DPA)
- Security incident → Multiple framework implications identified`,
        },
      ],
    },
    {
      id: "case-studies",
      title: "Case Studies",
      icon: "star",
      pages: [
        {
          id: "enterprise-expansion",
          title: "Case Study: Enterprise Cross-Border Expansion",
          summary:
            "How a Fortune 500 manufacturer used DJAC to achieve simultaneous compliance in China, Saudi Arabia, and the EU for 50+ vendors.",
          content: `### Background

A global manufacturing company with $2B+ annual revenue needed to expand operations into China, Saudi Arabia, and the EU simultaneously. Their compliance team faced managing PIPL, PDPL, and GDPR requirements across 53 third-party vendors.

### Challenge

- 53 vendors in 12 countries with varying regulatory requirements
- 3 new jurisdictions with overlapping and conflicting obligations
- Tight 90-day deadline to achieve compliance before market entry
- Manual assessment would require 6+ months and $500K+ in consulting fees

### DJAC Solution

1. **Week 1-2**: Registered all 53 vendors in DJAC with jurisdiction tagging
2. **Week 2-3**: Ran automated AI assessments for PIPL, PDPL, and GDPR simultaneously
3. **Week 3-4**: Generated cross-framework gap analysis identifying 312 compliance gaps
4. **Week 4-8**: Used remediation planner to prioritize and track gap closure
5. **Week 8-12**: Continuous monitoring confirmed full compliance across all jurisdictions

### Results

- ✅ Achieved full compliance in 82 days (vs. 180-day estimate)
- ✅ Identified 312 gaps and closed 298 within 60 days
- ✅ Saved $380K in external consulting fees
- ✅ Reduced ongoing compliance monitoring cost by 70%
- ✅ Passed first regulatory audit in each jurisdiction with zero findings`,
        },
        {
          id: "saas-startup",
          title: "Case Study: SaaS Startup Rapid Compliance",
          summary:
            "How a 15-person SaaS startup achieved SOC 2 and GDPR readiness in 30 days using DJAC's automated compliance platform.",
          content: `### Background

A Series A SaaS startup with 15 employees needed to demonstrate SOC 2 Type II and GDPR compliance to close enterprise deals. With no dedicated compliance team and a limited budget, they needed an automated solution.

### Challenge

- No existing compliance program or documentation
- 7 cloud vendors and sub-processors to assess
- Enterprise prospects demanding SOC 2 attestation
- Budget limitation of $5K/month for compliance tools

### DJAC Solution

1. Onboarded the entire team and set up organization profile
2. Selected SOC 2 and GDPR frameworks with AI-recommended controls
3. Registered all 7 vendors and ran automated assessments
4. Generated policy templates from DJAC's policy manager
5. Ran continuous compliance checks during auditor review period

### Results

- ✅ SOC 2 Type II report delivered in 28 days
- ✅ GDPR compliance program established in 30 days
- ✅ Landed 3 enterprise contracts (total $480K ARR)
- ✅ Ongoing compliance cost under $250/month
- ✅ Team of 15 manages compliance with 2 hours/week total effort`,
        },
      ],
    },
  ],
};

function getDocSections(locale: string): DocSection[] {
  return docsData[locale] || docsData.en;
}

export default function DocsPortal() {
  usePageTitle("Documentation");
  const { locale, t } = useLocale();
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["getting-started"])
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const sections = useMemo(() => getDocSections(locale), [locale]);

  const currentPath = location.replace("/docs", "").replace(/^\/+/, "");
  const [currentSectionId, currentPageId] = currentPath
    ? currentPath.split("/")
    : [null, null];

  const currentSection = useMemo(() => {
    if (!currentSectionId) return sections[0];
    return sections.find(s => s.id === currentSectionId) || sections[0];
  }, [sections, currentSectionId]);

  const currentPage = useMemo(() => {
    if (!currentPageId) return currentSection.pages[0];
    return (
      currentSection.pages.find(p => p.id === currentPageId) ||
      currentSection.pages[0]
    );
  }, [currentSection, currentPageId]);

  const navigateToPage = useCallback(
    (sectionId: string, pageId: string) => {
      navigate(`/docs/${sectionId}/${pageId}`);
      setMobileSidebarOpen(false);
    },
    [navigate]
  );

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }, []);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections
      .map(s => ({
        ...s,
        pages: s.pages.filter(
          p =>
            p.title.toLowerCase().includes(q) ||
            p.summary.toLowerCase().includes(q) ||
            p.content.toLowerCase().includes(q)
        ),
      }))
      .filter(s => s.pages.length > 0);
  }, [sections, searchQuery]);

  useEffect(() => {
    if (currentSectionId) {
      setExpandedSections(prev => {
        if (prev.has(currentSectionId)) return prev;
        const next = new Set(prev);
        next.add(currentSectionId);
        return next;
      });
    }
  }, [currentSectionId]);

  const renderContent = (text: string) => {
    const lines = text.split("\n");

    return lines
      .map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-3" />;

        const boldify = (t: string) => {
          const parts = t.split(/(\*\*[^*]+\*\*)/g);
          return parts.map((part, pi) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={pi} className="font-semibold text-foreground">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          });
        };

        if (line.startsWith("### ")) {
          return (
            <h3
              key={i}
              className="djac-h3 text-foreground mt-8 mb-3 font-semibold"
            >
              {boldify(line.replace("### ", ""))}
            </h3>
          );
        }
        if (line.startsWith("#### ")) {
          return (
            <h4
              key={i}
              className="text-base font-semibold text-foreground mt-6 mb-2"
            >
              {boldify(line.replace("#### ", ""))}
            </h4>
          );
        }
        if (line.startsWith("- **")) {
          const match = line.match(/- \*\*(.+?)\*\*(.+)/);
          if (match) {
            return (
              <div
                key={i}
                className="flex items-start gap-2 ml-2 my-1 text-sm djac-body"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>
                  <strong>{match[1]}</strong>
                  {match[2]}
                </span>
              </div>
            );
          }
        }
        if (line.startsWith("- ")) {
          return (
            <div
              key={i}
              className="flex items-start gap-2 ml-2 my-0.5 text-sm djac-body"
            >
              <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
              <span>{boldify(line.replace("- ", ""))}</span>
            </div>
          );
        }
        if (line.startsWith("| ")) {
          const cells = line
            .split("|")
            .filter(Boolean)
            .map(c => c.trim());
          const isSeparator = cells.every(c => /^-{3,}$/.test(c));
          if (isSeparator) return null;
          return (
            <div
              key={i}
              className="grid text-sm djac-body gap-2 py-1.5 px-3 border-t border-border/50"
              style={{
                gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))`,
              }}
            >
              {cells.map((cell, ci) => (
                <span key={ci}>{boldify(cell)}</span>
              ))}
            </div>
          );
        }
        if (line.startsWith("1. ") || /^\d+\.\s/.test(line)) {
          const num = line.match(/^(\d+)\./)?.[1] || "";
          const rest = line.replace(/^\d+\.\s*/, "");
          return (
            <div
              key={i}
              className="flex items-start gap-2 ml-2 my-1 text-sm djac-body"
            >
              <span className="font-semibold text-primary w-5 shrink-0">
                {num}.
              </span>
              <span>{boldify(rest)}</span>
            </div>
          );
        }
        return (
          <p key={i} className="text-sm djac-body my-1">
            {boldify(line)}
          </p>
        );
      })
      .filter(el => el !== null);
  };

  const StatSectionIcon = ICONS[currentSection.icon] || BookOpen;

  return (
    <div className="djac-page djac-docs-portal">
      {/* ── Mobile sidebar toggle ──────────────────────────────────────── */}
      <div className="djac-docs-mobile-toggle">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          {mobileSidebarOpen
            ? t("docs.close_menu", "Close Menu")
            : t("docs.mobile_menu", "Documentation Menu")}
        </Button>
      </div>

      <div className="djac-docs-layout">
        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <aside
          className={`djac-docs-sidebar ${mobileSidebarOpen ? "djac-docs-sidebar-open" : ""}`}
        >
          <div className="djac-docs-sidebar-header">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm">
                {t("docs.sidebar_title", "Documentation")}
              </span>
            </div>
          </div>

          <div className="px-3 py-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={t("docs.search_placeholder", "Search docs...")}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>

          <nav className="djac-docs-nav">
            {filteredSections.map(section => {
              const isExpanded = expandedSections.has(section.id);
              const isActive = currentSectionId === section.id;
              const SecIcon = ICONS[section.icon] || BookOpen;

              return (
                <div key={section.id} className="mb-0.5">
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className={`djac-docs-section-btn ${isActive ? "djac-docs-section-active" : ""}`}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <SecIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{section.title}</span>
                  </button>
                  {isExpanded && (
                    <div className="ml-2">
                      {section.pages.map(page => {
                        const isPageActive =
                          currentPageId === page.id &&
                          currentSectionId === section.id;
                        return (
                          <button
                            key={page.id}
                            type="button"
                            onClick={() => navigateToPage(section.id, page.id)}
                            className={`djac-docs-page-btn ${isPageActive ? "djac-docs-page-active" : ""}`}
                          >
                            <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                            <span className="truncate text-xs">
                              {page.title}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="djac-docs-sidebar-footer">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Globe className="h-3 w-3" />
              <span>{locale.toUpperCase()}</span>
            </div>
          </div>
        </aside>

        {/* ── Content ───────────────────────────────────────────────────── */}
        <main className="djac-docs-content">
          {/* Section header */}
          <div className="djac-docs-section-header">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <StatSectionIcon className="h-4 w-4" />
              <span>{currentSection.title}</span>
            </div>
            <h1 className="djac-display text-2xl sm:text-3xl font-bold">
              {currentPage.title}
            </h1>
            <p className="text-sm djac-body text-muted-foreground mt-2 max-w-3xl">
              {currentPage.summary}
            </p>
          </div>

          {/* Main content */}
          <div className="djac-docs-article">
            {useMemo(
              () => renderContent(currentPage.content),
              [currentPage.content]
            )}
          </div>

          {/* Diagram */}
          {currentPage.diagram && (
            <div className="djac-docs-diagram">
              <div className="flex items-center gap-2 mb-3">
                <Network className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">
                  {t("docs.architecture_diagram", "Architecture Diagram")}
                </span>
              </div>
              <div className="djac-glass-card p-4 text-center text-sm font-mono text-foreground">
                {currentPage.diagram}
              </div>
            </div>
          )}

          {/* Case Study */}
          {currentPage.caseStudy && (
            <div className="djac-docs-casestudy">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-5 w-5 text-amber-500" />
                <h2 className="djac-h2 text-xl font-bold">
                  {t("docs.case_study", "Case Study")}
                </h2>
                <Badge variant="outline" className="ml-2">
                  {currentPage.caseStudy.company}
                </Badge>
              </div>
              <div className="djac-docs-casestudy-grid">
                <div className="djac-glass-card p-4">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    {t("docs.challenge", "Challenge")}
                  </h4>
                  <p className="text-sm djac-body">
                    {currentPage.caseStudy.challenge}
                  </p>
                </div>
                <div className="djac-glass-card p-4">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    {t("docs.solution", "Solution")}
                  </h4>
                  <p className="text-sm djac-body">
                    {currentPage.caseStudy.solution}
                  </p>
                </div>
                <div className="djac-glass-card p-4 md:col-span-2">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {t("docs.results", "Results")}
                  </h4>
                  <p className="text-sm djac-body">
                    {currentPage.caseStudy.results}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Demo Steps */}
          {currentPage.demoSteps && currentPage.demoSteps.length > 0 && (
            <div className="djac-docs-demo">
              <div className="flex items-center gap-2 mb-4">
                <Play className="h-5 w-5 text-primary" />
                <h2 className="djac-h2 text-xl font-bold">
                  {t("docs.demo_guide", "Interactive Demo Guide")}
                </h2>
              </div>
              <div className="space-y-3">
                {currentPage.demoSteps.map((step, i) => (
                  <div
                    key={i}
                    className="djac-glass-card p-4 flex items-start gap-3"
                  >
                    <div className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-sm djac-body pt-0.5">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Best Practices */}
          {currentPage.bestPractices &&
            currentPage.bestPractices.length > 0 && (
              <div className="djac-docs-best-practices">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <h2 className="djac-h2 text-xl font-bold">
                    {t("docs.best_practices", "Best Practices")}
                  </h2>
                </div>
                <div className="space-y-2">
                  {currentPage.bestPractices.map((bp, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-sm djac-body">{bp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Troubleshooting */}
          {currentPage.troubleshooting &&
            currentPage.troubleshooting.length > 0 && (
              <div className="djac-docs-troubleshoot">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <h2 className="djac-h2 text-xl font-bold">
                    {t("docs.troubleshooting", "Troubleshooting")}
                  </h2>
                </div>
                <div className="space-y-3">
                  {currentPage.troubleshooting.map((item, i) => (
                    <div key={i} className="djac-glass-card p-4 space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <span className="text-amber-500">
                          {t("docs.q", "Q")}:
                        </span>{" "}
                        {item.problem}
                      </h4>
                      <p className="text-sm djac-body flex items-start gap-2">
                        <span className="text-emerald-500 font-semibold">
                          {t("docs.a", "A")}:
                        </span>{" "}
                        {item.solution}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Page navigation */}
          <div className="djac-docs-page-nav">
            {currentSection.pages.map((page, i) => {
              const isActive = currentPageId === page.id;
              return (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => navigateToPage(currentSection.id, page.id)}
                  className={`djac-docs-page-nav-btn ${isActive ? "djac-docs-page-nav-active" : ""}`}
                >
                  <span className="text-xs text-muted-foreground">{i + 1}</span>
                  <span className="text-sm truncate">{page.title}</span>
                </button>
              );
            })}
          </div>

          {/* Next steps */}
          <div className="djac-docs-next">
            <h3 className="text-lg font-bold mb-3">
              {t("docs.cta_ready", "Ready to get started?")}
            </h3>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate("/signup")}>
                {t("docs.cta_trial", "Start Free Trial")}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button variant="outline" onClick={() => navigate("/pricing")}>
                {t("docs.cta_pricing", "View Pricing")}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/docs/getting-started/welcome`)}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                {t("docs.cta_guide", "Quick Start Guide")}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
