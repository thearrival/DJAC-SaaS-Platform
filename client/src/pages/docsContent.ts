import { COVERAGE } from "@shared/coverage-claims";

export interface DocSection {
  id: string;
  title: string;
  icon: string;
  pages: DocPage[];
}

export interface DocPage {
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

export const docsData: Record<string, DocSection[]> = {
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
            "DJAC is the world's first AI-powered cross-jurisdiction compliance intelligence platform. Deploy in minutes and achieve regulatory compliance across ${COVERAGE.jurisdictions} jurisdictions.",
          content: `### What is DJAC?
DJAC (De Jure Automated Compliance) is an enterprise SaaS platform that automates regulatory compliance across jurisdictions — China, Saudi Arabia, the GCC, the EU, North America, and APAC.

> **info** Built for compliance officers, legal teams, enterprise administrators, consultants, and government regulators.

### Why DJAC?
- **${COVERAGE.jurisdictions} Jurisdictions** — PIPL, PDPL, CSL, DSL, GDPR, ISO 27001, SOC 2, NIST CSF, HIPAA, and more
- **AI-Powered Analysis** — DeepSeek driven 8-stage compliance assessment pipeline
- **Real-Time Monitoring** — Continuous compliance tracking with automated gap detection
- **Cross-Border Intelligence** — Data transfer compliance checker and regulatory change monitoring
- **Vendor Risk Management** — Automated third-party assessments across all selected frameworks
- **Enterprise-Grade Security** — AES-256 encryption, RBAC, audit trails, SOC 2 ready

> **tip** The DJAC interface is available in 9 languages — switch anytime from the header locale menu. This documentation is published in all 9 languages too.

### Quick Start (5 minutes)
1. **Create your organization** — Set up your company profile and billing
2. **Select jurisdictions** — Choose China, Saudi Arabia, EU, or any combination
3. **Pick frameworks** — AI auto-recommends relevant regulations
4. **Register a vendor** — Add your first third-party supplier
5. **Run assessment** — AI generates a complete compliance report in under 60 seconds

> **tip** The onboarding wizard guides you through this entire flow — look for it in your dashboard after signing up.

### Platform Tiers
| Tier | Monthly | Best For |
|------|---------|----------|
| Starter | From $99/mo | Small teams, single jurisdiction |
| Professional | From $249/mo | Multi-jurisdiction compliance |
| Enterprise | Custom | Global enterprises, API, dedicated support |

> **faq** How long does an AI vendor assessment take?
> **answer** Most assessments complete in under 60 seconds, streaming live progress over the WebSocket as each of the 8 pipeline stages finishes.
> **faq** Which regulations are supported out of the box?
> **answer** ${COVERAGE.controlFrameworks} frameworks with full control-level detail, plus ${COVERAGE.frameworkPacks} curated framework packs, across ${COVERAGE.jurisdictions} jurisdictions — including GDPR, NIS2, DORA, PIPL, PDPL, ISO 27001, SOC 2, and more. The AI engine auto-recommends the relevant ones for your profile.
> **faq** Can DJAC run on our own infrastructure?
> **answer** Yes — besides Vercel cloud hosting, self-hosted Docker deployment is supported, and the platform can be extended with custom frameworks.`,
        },
        {
          id: "architecture",
          title: "Platform Architecture",
          summary:
            "DJAC runs on a cloud-native architecture with React 19, Express + tRPC, PostgreSQL on Supabase, Redis, and Google DeepSeek.",
          content: `### System Architecture
DJAC employs a modern monorepo architecture:

**Frontend**: React 19 + TypeScript + Vite 7 + Tailwind CSS 4 + shadcn/ui  
**Backend**: Express 4 + tRPC 11 (200+ API procedures) + Drizzle ORM  
**Database**: PostgreSQL 17 on Supabase (AWS Tokyo, ap-northeast-2)  
**AI Engine**: Google DeepSeek with 8-stage assessment pipeline  
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
6. Judge (DeepSeek) evaluates compliance against controls
7. Synthesizer merges findings into cross-framework report
8. Validator ensures schema consistency and data integrity
9. Reporter generates final formatted output (PDF/DOCX/JSON)`,
          diagram:
            "[User] → [Gatekeeper] → [Intake] → [Extractor] → [RAG] → [Judge (DeepSeek)] → [Synthesizer] → [Validator] → [Reporter] → [PDF / DOCX / JSON]",
        },
        {
          id: "roles",
          title: "Roles & Permissions",
          summary:
            "DJAC provides granular role-based access control with 6 platform roles and 4 organization roles across 30+ modules.",
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

> **tip** You can customize permissions per module per role — the defaults are just starting points.

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
            "DJAC's 8-stage AI pipeline uses DeepSeek to assess vendor compliance across multiple frameworks simultaneously.",
          content: `### The 8-Stage Pipeline
1. **Gatekeeper** — Input validation, injection detection, data sanitization
2. **Intake** — Document parsing, text normalization, language detection
3. **Extractor** — Structured fact extraction into key-value-evidence triples
4. **RAG Context** — Retrieval-Augmented Generation: pulls relevant compliance controls from PostgreSQL
5. **Judge (DeepSeek)** — Evaluates each fact against applicable control requirements
6. **Synthesizer** — Merges findings, generates cross-framework comparison
7. **Validator** — Schema validation, cross-field consistency, retry on failure
8. **Reporter** — Final formatted output in PDF, DOCX, or JSON

> **info** Each stage logs its progress to the WebSocket channel so you can watch assessments happen in real-time.

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
            "The Retrieval-Augmented Generation system retrieves the most relevant compliance controls from the database before AI analysis.",
          content: `### How RAG Works
1. **Document Parsing** — Extracted facts from vendor documents
2. **Semantic Search** — Matches facts against 1,000+ compliance controls
3. **Relevance Scoring** — Ranks controls by jurisdictional and topical relevance
4. **Context Assembly** — Builds a focused context window for DeepSeek
5. **Grounded Response** — AI evaluates based ONLY on retrieved controls (no hallucination)

### Benefits
- Eliminates AI hallucinations in compliance advice
- Ensures framework-specific recommendations
- Maintains audit trail of control-to-finding mappings
- Supports ${COVERAGE.jurisdictions} jurisdictions with jurisdiction-specific controls

> **tip** The RAG system is what makes DJAC legally reliable — it never guesses about regulatory requirements.

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
          summary: `DJAC covers ${COVERAGE.jurisdictions} jurisdictions across APAC, EMEA, North America, and Africa with comprehensive regulatory frameworks.`,
          content: `### APAC Region
- **China** — PIPL, CSL, DSL, MLPS 2.0
- **Japan** — APPI
- **South Korea** — PIPA
- **Singapore** — PDPA
- **India** — DPDP Act
- **Australia** — Privacy Act 1988

### Middle East / GCC
- **Saudi Arabia** — PDPL, NCA ECC / CSCC / OCC
- **UAE** — UAE PDPL
- **Qatar** — Qatar PDPPL
- **Bahrain** — Bahrain PDPL
- **Kuwait** — Kuwait DPA
- **Oman** — Oman PDPL

### Europe
- **EU/EEA** — GDPR, NIS2 Directive, DORA
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
            "Comprehensive guide to China's Personal Information Protection Law (PIPL), including data localization and cross-border transfer rules.",
          content: `### PIPL Overview
China's Personal Information Protection Law (PIPL) took effect November 1, 2021. It regulates how organizations collect, use, store, and transfer personal information of individuals in China.

> **warning** PIPL violations can result in fines up to ¥50 million RMB (~$7M USD) or 5% of annual revenue.

### Key Requirements
1. **Consent** — Explicit, informed consent for data collection
2. **Data Minimization** — Collect only what is necessary
3. **Purpose Limitation** — Use data only for specified purposes
4. **Data Localization** — CIIOs must store data in China
5. **Cross-Border Transfer** — CAC security assessment required
6. **DPIAs** — Impact assessments before high-risk processing
7. **Data Subject Rights** — Access, correction, deletion, portability
8. **Breach Notification** — Report within 72 hours

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
            "Automate third-party vendor compliance assessments across all selected frameworks with AI-powered analysis and gap reports.",
          content: `### Automated Vendor Assessment
1. **Register Vendor** — Add vendor name, industry, jurisdiction, and tech stack
2. **Select Frameworks** — Choose applicable regulatory frameworks
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
DJAC automatically re-assesses vendors at configurable intervals and alerts you to:
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
            "DJAC exposes a type-safe tRPC API with 200+ procedures across 42 routers, plus REST endpoints for webhooks and health checks.",
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
| Clerk OAuth | Auto-managed | External OAuth |

### Router Categories
| Domain | Routers | Key Procedures |
|--------|---------|----------------|
| Auth | \`localAuth\`, \`auth\`, \`googleAuth\` | register, login, mfa |
| Organization | \`orgSettings\`, \`orgMembers\` | create, invite, updateRole |
| RBAC | \`role\`, \`rbac\` | getPermissions, setPermissions |
| Compliance | \`compliance\`, \`regulatoryChanges\` | frameworks.list, controls.get |
| Vendors | \`vendor\`, \`vendorCompliance\` | list, create, assess |
| Risk | \`riskRegister\`, \`remediation\` | list, create, update |
| AI | \`ai\` | startAssessment, getJob |
| Reports | \`complianceReport\` | generate, download, schedule |
| Billing | \`billing\` | getPlans, checkout |
| Admin | \`admin\`, \`system\` | getStats, getAuditLogs |

### Error Codes
| Code | Description |
|------|-------------|
| \`UNAUTHORIZED\` | Authentication required |
| \`FORBIDDEN\` | Insufficient permissions |
| \`NOT_FOUND\` | Resource not found |
| \`VALIDATION_ERROR\` | Input validation failed |
| \`RATE_LIMITED\` | Too many requests |`,
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
| \`job:complete\` | Server → Client | \`{ jobId, result }\` |
| \`job:error\` | Server → Client | \`{ jobId, error: string }\` |
| \`subscribe\` | Client → Server | \`{ jobId: string }\` |

### Example
\`\`\`typescript
const ws = new WebSocket("wss://app.yalla-hack.ae/ws/ai-jobs");
ws.onopen = () => ws.send(JSON.stringify({ type: "subscribe", jobId }));
ws.onmessage = (e) => {
  const { type, stage, message } = JSON.parse(e.data);
  if (type === "job:progress") updateUI(stage, message);
  if (type === "job:complete") showResults(data.result);
};
\`\`\``,
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
            "DJAC implements defense-in-depth across authentication, authorization, data protection, and infrastructure following OWASP Top 10.",
          content: `### Defense-in-Depth
**Authentication:**
- Passwords hashed with bcrypt (12 rounds)
- JWT tokens signed with HS256 (min 64-char secret)
- HTTP-only, Secure, SameSite cookies
- TOTP-based MFA with backup codes
- OTP-based password reset (SHA-256, 5-min expiry)

**Authorization:**
- 7 platform roles + 4 organization roles
- 32 permission-gated modules
- Row-Level Security on all PostgreSQL tables
- Organization-scoped data isolation

**Data Protection:**
- TLS 1.3 for all data in transit
- PostgreSQL encrypted at rest (Supabase)
- Secrets in Vercel env vars + GitHub Actions

### Security Headers
| Header | Value | Purpose |
|--------|-------|---------|
| Strict-Transport-Security | max-age=63072000 | Enforce HTTPS |
| X-Content-Type-Options | nosniff | MIME sniffing prevention |
| X-Frame-Options | DENY | Clickjacking prevention |
| Content-Security-Policy | Restricted per route | XSS mitigation |
| Referrer-Policy | strict-origin | Referrer leakage |

### CVE Patching
- Dependabot automated vulnerability alerts
- pnpm overrides for transitive dependency patches
- CodeQL security analysis in CI pipeline`,
        },
        {
          id: "rbac-system",
          title: "RBAC & Permission System",
          summary:
            "Granular permissions across 32 platform modules with custom role overrides per organization.",
          content: `### Permission Resolution Flow
1. Request arrives at tRPC procedure
2. Auth middleware extracts \`ctx.user\` and \`ctx.orgRole\`
3. System checks custom \`rolePermissions\` row
4. Falls back to \`DEFAULT_ORG_ROLE_PERMISSIONS\`
5. Compares action against PermissionFlags
6. Returns Allow or 403 FORBIDDEN

### Permission Flags
Each module has 6 flags:
- \`canView\` — Read access
- \`canCreate\` — Create new records
- \`canEdit\` — Modify existing records
- \`canDelete\` — Remove records
- \`canExport\` — Download/export data
- \`canInvite\` — Invite team members

### Default Templates
| Role | Default Pattern |
|------|----------------|
| Analyst | VIEW_ONLY on most modules |
| Compliance Officer | STANDARD on compliance |
| Admin | FULL on compliance, STANDARD on settings |
| Owner | FULL on everything |`,
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
          title: "Development Setup",
          summary:
            "Set up your local environment with Node.js 20+, pnpm 10+, Docker for Supabase, and all required services.",
          content: `### Prerequisites
- Node.js 20+
- pnpm 10+ (\`npm install -g pnpm@10\`)
- Docker Desktop (for Supabase)
- Supabase CLI (\`npm install -g supabase\`)

### First-Time Setup
\`\`\`bash
git clone <repo-url> djac && cd djac
pnpm install
cp .env.example .env
supabase start
pnpm db:push
pnpm seed:data
pnpm dev
# → http://localhost:3000
\`\`\`

### Dev Auth Bypass
\`\`\`env
DEV_AUTH_BYPASS=true
DEV_AUTH_EMAIL=dev@example.com
DEV_AUTH_ROLE=super_admin
\`\`\`

### Available Scripts
| Command | Purpose |
|---------|---------|
| \`pnpm dev\` | Start dev server |
| \`pnpm check\` | TypeScript type checking |
| \`pnpm lint\` | ESLint |
| \`pnpm test\` | Run tests (vitest) |
| \`pnpm build\` | Production build |
| \`pnpm verify:all\` | All checks + build |`,
          demoSteps: [
            "Clone the repository and install dependencies with 'pnpm install'",
            "Copy .env.example to .env and fill in required values",
            "Start Supabase locally with 'supabase start'",
            "Push database schema with 'pnpm db:push'",
            "Seed reference data with 'pnpm seed:data'",
            "Start dev server with 'pnpm dev' → http://localhost:3000",
          ],
        },
        {
          id: "adding-features",
          title: "Adding New Features",
          summary:
            "Follow DJAC's patterns for adding new tRPC routers, React pages, database tables, and tests.",
          content: `### Add a tRPC Router
\`\`\`typescript
// server/my-feature-router.ts
import { orgProcedure, router } from "./_core/trpc";
import { z } from "zod";

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
      const [rec] = await db.insert(myTable).values(input).returning();
      return rec;
    }),
});
\`\`\`

Register in \`server/routers.ts\`:
\`\`\`typescript
import { myFeatureRouter } from "./my-feature-router";
export const appRouter = router({ myFeature: myFeatureRouter });
\`\`\`

### API Design Rules
1. All mutations use tRPC with Zod validation
2. Use \`protectedProcedure\` for authenticated, \`orgProcedure\` for org-scoped
3. Check \`ctx.user.role\` for authorization
4. Never trust client input — always validate with Zod`,
        },
      ],
    },
    {
      id: "deployment-operations",
      title: "Deployment & Ops",
      icon: "server",
      pages: [
        {
          id: "deployment",
          title: "Deployment Options",
          summary:
            "DJAC supports Vercel (serverless), Docker, and manual VPS deployment. CI/CD pipelines automate staging and production.",
          content: `### Vercel (Recommended)
\`\`\`bash
pnpm build
vercel --prod
supabase db push --linked
supabase functions deploy
curl https://your-app.com/api/health
\`\`\`

### Docker
\`\`\`bash
docker build -t djac:latest .
docker run -d -p 3000:3000 --env-file .env.production --name djac-app djac:latest
\`\`\`

### CI/CD Pipeline
| Workflow | Trigger | Actions |
|----------|---------|---------|
| CI | Push/PR | Lint, Typecheck, Test, Build |
| Staging | Push to develop | Auto-deploy to Vercel preview |
| Production | Push to main | Deploy + DB migration + health check |

### Production Checklist
- [ ] JWT_SECRET ≥ 64 chars
- [ ] DEV_AUTH_BYPASS=false
- [ ] DB pool size: 25 connections
- [ ] Redis configured
- [ ] RLS policies enabled
- [ ] Sentry error tracking enabled`,
        },
        {
          id: "monitoring",
          title: "Monitoring & Observability",
          summary:
            "Sentry for error tracking, Pino for structured logging, health/readiness endpoints for operational monitoring.",
          content: `### Health Endpoints
| Endpoint | Purpose |
|----------|---------|
| \`/api/health\` | Health check (status, uptime) |
| \`/api/readyz\` | Readiness (DB, Redis, Stripe, AI) |

### Background Schedulers
| Scheduler | Interval | Purpose |
|-----------|----------|---------|
| Interaction Retention | 24h | Purge old logs |
| Trial Reminder | 6h | Expiring trial emails |
| Deadline Alert | 1h | Regulatory deadline notifications |
| Report Delivery | Config | Scheduled report generation |`,
        },
        {
          id: "troubleshooting",
          title: "Troubleshooting Common Issues",
          summary:
            "Solutions for common development, deployment, and operational issues.",
          content: `### Common Issues
**DB connection errors:** Verify \`DATABASE_URL\` in \`.env\`. Ensure Supabase is running.

**AI stuck in "queued":** Check Redis connectivity. In dev mode, confirm \`AI_QUEUE_MODE=in_memory\`.

**OpenAI 401:** Invalid \`OPENAI_API_KEY\`.

**Vercel build fails:** Check env vars. Ensure Node 20+. Test with \`pnpm build\`.

### Debugging
- Debug logs: \`LOG_LEVEL=debug pnpm dev\`
- Track requests: \`X-Request-ID\` header
- Check Sentry dashboard for errors`,
          troubleshooting: [
            {
              problem: "Login returns 'Authentication required (10001)'",
              solution:
                "Check JWT_SECRET in .env. Clear browser cookies. Verify COOKIE_DOMAIN.",
            },
            {
              problem: "pnpm db:push fails with migration errors",
              solution:
                "Check with 'supabase db status'. Use 'supabase db reset' for dev reset.",
            },
            {
              problem: "Vercel build fails with memory limit",
              solution:
                "Externalize large dependencies. Increase Node memory in Vercel settings.",
            },
            {
              problem: "Stripe webhook not receiving events",
              solution:
                "Verify STRIPE_WEBHOOK_SECRET. Use 'stripe listen' for local testing.",
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
            "Flexible subscription plans for teams of all sizes — from startups to global enterprises.",
          content: `### Plan Comparison
| Feature | Free Trial | Starter | Professional | Enterprise |
|---------|-----------|---------|-------------|------------|
| Jurisdictions | 1 | 3 | 10 | Unlimited |
| Vendors | 5 | 25 | 100 | Unlimited |
| AI Assessments/mo | 3 | 20 | 100 | Custom |
| Team Members | 2 | 10 | 50 | Unlimited |
| API Access | — | — | ✓ | ✓ |
| Priority Support | — | — | ✓ | ✓ |
| SLA | — | 99.5% | 99.9% | 99.95% |

### Billing Intervals
- **Monthly** — Standard rate
- **Quarterly** — 10% discount
- **Biannual** — 15% discount
- **Annual** — 20% discount

### Free Trial
- 14-day free trial on Starter plan
- No credit card required
- Full access to all Starter features`,
        },
        {
          id: "subscription-management",
          title: "Managing Your Subscription",
          summary:
            "Upgrade, downgrade, or cancel through the Stripe Customer Portal. View billing history and invoices.",
          content: `### Subscription Lifecycle
1. **Trial** → Automatic 14-day trial on signup
2. **Active** → Paid subscription
3. **Past Due** → Payment failed; grace period
4. **Canceled** → Data retained for 30 days

### Upgrade / Downgrade
- **Upgrade:** Immediate access. Prorated charges.
- **Downgrade:** Takes effect at end of billing period.

### Billing Portal
Access via: **Dashboard → Billing & Plan → Manage Subscription**
- Update payment method
- View billing history
- Download invoices
- Change/cancel plan`,
          troubleshooting: [
            {
              problem: "Payment failed but card is valid",
              solution:
                "Check for international transaction blocks. Try alternative card or contact support.",
            },
            {
              problem: "Upgrade not reflected in dashboard",
              solution:
                "Allow up to 5 minutes for provisioning. Try refreshing or logging out/in.",
            },
            {
              problem: "Trial ended but need more time",
              solution:
                "Contact support for a one-time 7-day extension (once per org).",
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
1. **Identify** — Log risks with category and likelihood/impact
2. **Assess** — Automated risk scoring (likelihood × impact)
3. **Treat** — Accept, Mitigate, Transfer, or Avoid
4. **Link** — Connect risks to vendors, frameworks, and tasks
5. **Monitor** — Track status and treatment progress

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
            "Log, track, and resolve security and compliance incidents with automated regulatory mapping.",
          content: `### Incident Lifecycle
1. **Detection** — Log incident with type, severity, affected systems
2. **Triage** — Automated severity classification
3. **Investigation** — Timeline tracking with evidence
4. **Containment** — Action tracking, notification
5. **Resolution** — Root cause analysis, remediation docs
6. **Closure** — Post-incident review

### Automated Regulatory Mapping
- Data breach in China → PIPL Art. 57 (72h to CAC)
- Data breach in EU → GDPR Art. 33 (72h to DPA)
- Security incident → Multi-framework implications identified`,
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
          title: "Enterprise Cross-Border Expansion",
          summary:
            "How a Fortune 500 manufacturer used DJAC to achieve compliance in China, Saudi Arabia, and EU for 50+ vendors.",
          content: `### Background
A global manufacturer with $2B+ revenue needed expansion into China, Saudi Arabia, and the EU with 53 vendors across 12 countries.

### Challenge
- 53 vendors, 3 new jurisdictions, 90-day deadline
- Manual assessment: 6+ months, $500K+ consulting fees

### DJAC Solution
1. **Week 1-2**: Registered all 53 vendors
2. **Week 2-3**: Ran AI assessments for PIPL, PDPL, GDPR
3. **Week 3-4**: Cross-framework gap analysis — 312 gaps found
4. **Week 4-8**: Remediation planner tracked gap closure
5. **Week 8-12**: Continuous monitoring confirmed full compliance

### Results
- ✅ Full compliance in 82 days (vs. 180-day estimate)
- ✅ 312 gaps identified, 298 closed in 60 days
- ✅ Saved $380K in consulting fees
- ✅ 70% reduction in ongoing monitoring costs
- ✅ Zero findings in first regulatory audits`,
        },
        {
          id: "saas-startup",
          title: "SaaS Startup Rapid Compliance",
          summary:
            "How a 15-person startup achieved SOC 2 and GDPR readiness in 30 days using DJAC.",
          content: `### Background
A Series A startup with 15 employees needed SOC 2 Type II and GDPR compliance to close enterprise deals.

### Challenge
- No existing compliance program
- 7 cloud vendors to assess
- $5K/month budget for compliance

### DJAC Solution
1. Onboarded team, set up org profile
2. Selected SOC 2 + GDPR with AI-recommended controls
3. Registered all 7 vendors, ran assessments
4. Generated policy templates from policy manager
5. Continuous checks during auditor review

### Results
- ✅ SOC 2 Type II delivered in 28 days
- ✅ GDPR program established in 30 days
- ✅ Landed 3 enterprise deals ($480K ARR)
- ✅ Ongoing compliance cost under $250/month`,
        },
      ],
    },
  ],
  ar: [],
  zh: [],
  fr: [
    {
      id: "getting-started",
      icon: "book",
      title: "Premiers pas",
      pages: [
        {
          id: "welcome",
          title: "Bienvenue sur DJAC",
          summary:
            "DJAC est la première plateforme mondiale d'intelligence de conformité multi-juridictionnelle propulsée par l'IA. Déployez en quelques minutes et atteignez la conformité réglementaire dans ${COVERAGE.jurisdictions} juridictions.",
          content:
            "### Qu'est-ce que DJAC ?\nDJAC (De Jure Automated Compliance) est une plateforme SaaS d'entreprise qui automatise la conformité réglementaire dans plusieurs juridictions — Chine, Arabie saoudite, CCG, UE, Amérique du Nord et APAC.\n\n> **info** Conçu pour les responsables de la conformité, les équipes juridiques, les administrateurs d'entreprise, les consultants et les régulateurs gouvernementaux.\n\n### Pourquoi DJAC ?\n- **30 juridictions** — PIPL, PDPL, CSL, DSL, GDPR, ISO 27001, SOC 2, NIST CSF, HIPAA, et plus encore\n- **Analyse propulsée par l'IA** — Pipeline d'évaluation de conformité en 8 étapes piloté par DeepSeek\n- **Surveillance en temps réel** — Suivi continu de la conformité avec détection automatisée des écarts\n- **Intelligence transfrontalière** — Vérificateur de conformité des transferts de données et surveillance des changements réglementaires\n- **Gestion des risques fournisseurs** — Évaluations automatisées de tiers sur tous les référentiels sélectionnés\n- **Sécurité de niveau entreprise** — Chiffrement AES-256, RBAC, pistes d'audit, prêt pour SOC 2\n\n> **tip** L'interface DJAC est disponible en 9 langues — changez à tout moment depuis le menu de langue de l'en-tête. Cette documentation est publiée en anglais, arabe et chinois ; les autres langues d'interface voient la version anglaise ici.\n\n### Démarrage rapide (5 minutes)\n1. **Créez votre organisation** — Configurez le profil de votre entreprise et la facturation\n2. **Sélectionnez les juridictions** — Choisissez la Chine, l'Arabie saoudite, l'UE ou toute combinaison\n3. **Choisissez les référentiels** — L'IA recommande automatiquement les réglementations pertinentes\n4. **Enregistrez un fournisseur** — Ajoutez votre premier fournisseur tiers\n5. **Lancez l'évaluation** — L'IA génère un rapport de conformité complet en moins de 60 secondes\n\n> **tip** L'assistant d'intégration vous guide tout au long de ce processus — recherchez-le dans votre tableau de bord après votre inscription.\n\n### Niveaux de la plateforme\n| Niveau | Mensuel | Idéal pour |\n|------|---------|----------|\n| Starter | À partir de 99 $/mois | Petites équipes, juridiction unique |\n| Professional | À partir de 249 $/mois | Conformité multi-juridictionnelle |\n| Enterprise | Sur mesure | Entreprises mondiales, API, support dédié |\n\n> **faq** Combien de temps prend une évaluation de fournisseur par IA ?\n> **answer** La plupart des évaluations se terminent en moins de 60 secondes, diffusant la progression en direct via le WebSocket à mesure que chacune des 8 étapes du pipeline se termine.\n> **faq** Quelles réglementations sont prises en charge nativement ?\n> **answer** 46 référentiels avec un détail complet au niveau des contrôles, plus 107 packs de référentiels sélectionnés, couvrant 30 juridictions — notamment GDPR, NIS2, DORA, PIPL, PDPL, ISO 27001, SOC 2, et plus encore. Le moteur d'IA recommande automatiquement ceux qui sont pertinents pour votre profil.\n> **faq** DJAC peut-il fonctionner sur notre propre infrastructure ?\n> **answer** Oui — outre l'hébergement cloud Vercel, le déploiement Docker auto-hébergé est pris en charge, et la plateforme peut être étendue avec des référentiels personnalisés.",
        },
        {
          id: "architecture",
          title: "Architecture de la plateforme",
          summary:
            "DJAC repose sur une architecture cloud-native avec React 19, Express + tRPC, PostgreSQL sur Supabase, Redis et Google DeepSeek.",
          content:
            "### Architecture système\nDJAC utilise une architecture monorepo moderne :\n\n**Frontend** : React 19 + TypeScript + Vite 7 + Tailwind CSS 4 + shadcn/ui  \n**Backend** : Express 4 + tRPC 11 (plus de 200 procédures API) + Drizzle ORM  \n**Base de données** : PostgreSQL 17 sur Supabase (AWS Tokyo, ap-northeast-2)  \n**Moteur d'IA** : Google DeepSeek avec pipeline d'évaluation en 8 étapes  \n**File d'attente** : En mémoire / Redis (compatible BullMQ)  \n**Authentification** : Triple voie (Clerk OAuth + Supabase Auth + JWT local)  \n**Facturation** : Stripe (5 forfaits × 4 intervalles)  \n**Hébergement** : Vercel (serverless) + Docker\n\n### Flux de données\n1. L'utilisateur soumet une demande d'évaluation de fournisseur\n2. Le Gatekeeper valide les entrées (détection d'injection)\n3. L'Intake analyse les documents et normalise le texte\n4. L'Extractor identifie les faits structurés (triplets clé-valeur-preuve)\n5. Le Contexte RAG récupère les contrôles de conformité pertinents depuis la base de données\n6. Le Judge (DeepSeek) évalue la conformité par rapport aux contrôles\n7. Le Synthesizer fusionne les résultats dans un rapport multi-référentiels\n8. Le Validator assure la cohérence du schéma et l'intégrité des données\n9. Le Reporter génère la sortie finale formatée (PDF/DOCX/JSON)",
          diagram:
            "[Utilisateur] → [Gatekeeper] → [Intake] → [Extractor] → [RAG] → [Judge (DeepSeek)] → [Synthesizer] → [Validator] → [Reporter] → [PDF / DOCX / JSON]",
        },
        {
          id: "roles",
          title: "Rôles et permissions",
          summary:
            "DJAC offre un contrôle d'accès granulaire basé sur les rôles avec 6 rôles de plateforme et 4 rôles d'organisation sur plus de 30 modules.",
          content:
            "### Rôles de la plateforme\n| Rôle | Niveau | Accès |\n|------|-------|--------|\n| Utilisateur de base | 10 | Accès en lecture seule aux modules assignés |\n| Utilisateur professionnel | 20 | Accès complet aux fonctionnalités de conformité |\n| Administrateur d'entreprise | 30 | Gestion de l'organisation + équipe |\n| Administrateur de plateforme | 40 | Supervision et configuration inter-organisations |\n| Employé Yalla Hack | 45 | Support interne et opérations |\n| Super administrateur | 100 | Accès complet et illimité à la plateforme |\n\n### Rôles d'organisation\n| Rôle | Niveau | Capacités |\n|------|-------|-------------|\n| Analyste | 10 | Consultation seule sur la plupart des modules |\n| Responsable de la conformité | 20 | Créer/Modifier les données de conformité |\n| Administrateur | 30 | Gestion d'équipe + clés API |\n| Propriétaire | 40 | Facturation + paramètres de l'organisation + accès complet |\n\n> **tip** Vous pouvez personnaliser les permissions par module et par rôle — les valeurs par défaut ne sont que des points de départ.\n\n### Modèle de permissions\nChacun des plus de 30 modules dispose de 6 indicateurs de permission :\n- `canView` — Accès en lecture\n- `canCreate` — Créer de nouveaux enregistrements\n- `canEdit` — Modifier les enregistrements existants\n- `canDelete` — Supprimer des enregistrements\n- `canExport` — Télécharger/exporter des données\n- `canInvite` — Inviter des membres d'équipe",
        },
      ],
    },
    {
      id: "ai-engine",
      icon: "zap",
      title: "Moteur de conformité IA",
      pages: [
        {
          id: "ai-overview",
          title: "Aperçu du moteur IA",
          summary:
            "Le pipeline IA en 8 étapes de DJAC utilise DeepSeek pour évaluer la conformité des fournisseurs sur plusieurs référentiels simultanément.",
          content:
            "### Le pipeline en 8 étapes\n1. **Gatekeeper** — Validation des entrées, détection d'injection, assainissement des données\n2. **Intake** — Analyse de documents, normalisation de texte, détection de langue\n3. **Extractor** — Extraction structurée de faits en triplets clé-valeur-preuve\n4. **RAG Context** — Génération augmentée par récupération : extrait les contrôles de conformité pertinents depuis PostgreSQL\n5. **Judge (DeepSeek)** — Évalue chaque fait par rapport aux exigences de contrôle applicables\n6. **Synthesizer** — Fusionne les constats, génère une comparaison inter-référentiels\n7. **Validator** — Validation de schéma, cohérence inter-champs, nouvelle tentative en cas d'échec\n8. **Reporter** — Sortie finale formatée en PDF, DOCX ou JSON\n\n> **info** Chaque étape journalise sa progression sur le canal WebSocket afin que vous puissiez suivre les évaluations en temps réel.\n\n### Fonctionnalités IA\n- **Analyse d'écart automatisée** — Identifie les contrôles manquants et les zones de non-conformité\n- **Score de risque (0-100)** — Scores de conformité par référentiel et agrégés\n- **Recommandations de remédiation** — Actions suggérées par l'IA classées par priorité\n- **Estimation des pénalités** — Calcule les amendes potentielles selon la juridiction\n- **Comparaison inter-juridictions** — Analyse comparative de la couverture des référentiels côte à côte\n- **Diffusion des tâches en temps réel** — Suivi de progression basé sur WebSocket pendant les évaluations",
        },
        {
          id: "rag-system",
          title: "Système de contexte RAG",
          summary:
            "Le système de génération augmentée par récupération extrait les contrôles de conformité les plus pertinents de la base de données avant l'analyse IA.",
          content:
            "### Comment fonctionne le RAG\n1. **Analyse de documents** — Faits extraits des documents du fournisseur\n2. **Recherche sémantique** — Met en correspondance les faits avec plus de 1 000 contrôles de conformité\n3. **Score de pertinence** — Classe les contrôles par pertinence juridictionnelle et thématique\n4. **Assemblage du contexte** — Construit une fenêtre de contexte ciblée pour DeepSeek\n5. **Réponse fondée** — L'IA évalue UNIQUEMENT sur la base des contrôles récupérés (aucune hallucination)\n\n### Avantages\n- Élimine les hallucinations de l'IA dans les conseils de conformité\n- Garantit des recommandations spécifiques au référentiel\n- Maintient une piste d'audit des mappages contrôle-constat\n- Prend en charge 30 juridictions avec des contrôles spécifiques à chaque juridiction\n\n> **tip** Le système RAG est ce qui rend DJAC juridiquement fiable — il ne devine jamais les exigences réglementaires.\n\n### Base de connaissances\n- 46 référentiels réglementaires\n- Plus de 1 000 contrôles de conformité\n- Plus de 14 types de relations inter-référentiels\n- Cluster de normes mondiales : ISO 27001, NIST CSF, SOC 2, HIPAA, PCI DSS",
        },
      ],
    },
    {
      id: "frameworks",
      icon: "shield",
      title: "Cadres de conformité",
      pages: [
        {
          id: "jurisdictions",
          title: "Juridictions prises en charge",
          summary:
            "DJAC couvre 30 juridictions à travers l'APAC, l'EMEA, l'Amérique du Nord et l'Afrique avec des cadres réglementaires complets.",
          content:
            "### Région APAC\n- **Chine** — PIPL, CSL, DSL, MLPS 2.0\n- **Japon** — APPI\n- **Corée du Sud** — PIPA\n- **Singapour** — PDPA\n- **Inde** — DPDP Act\n- **Australie** — Privacy Act 1988\n\n### Moyen-Orient / CCG\n- **Arabie saoudite** — PDPL, NCA ECC / CSCC / OCC\n- **Émirats arabes unis** — UAE PDPL\n- **Qatar** — Qatar PDPPL\n- **Bahreïn** — Bahrain PDPL\n- **Koweït** — Kuwait DPA\n- **Oman** — Oman PDPL\n\n### Europe\n- **UE/EEE** — GDPR, NIS2 Directive, DORA\n- **Royaume-Uni** — UK GDPR / DPA 2018\n\n### Amérique du Nord\n- **États-Unis** — HIPAA, CCPA/CPRA, SOX, PCI DSS\n- **Canada** — PIPEDA\n\n### Normes mondiales\n- ISO 27001 / 27002\n- NIST Cybersecurity Framework (CSF)\n- SOC 2 Type II\n- PCI DSS v4.0",
        },
        {
          id: "pipl-guide",
          title: "Guide de conformité PIPL",
          summary:
            "Guide complet sur la loi chinoise sur la protection des informations personnelles (PIPL), y compris la localisation des données et les règles de transfert transfrontalier.",
          content:
            "### Aperçu de la PIPL\nLa loi chinoise sur la protection des informations personnelles (PIPL) est entrée en vigueur le 1er novembre 2021. Elle régit la manière dont les organisations collectent, utilisent, stockent et transfèrent les informations personnelles des individus en Chine.\n\n> **avertissement** Les violations de la PIPL peuvent entraîner des amendes allant jusqu'à 50 millions de RMB (~7 millions USD) ou 5 % du chiffre d'affaires annuel.\n\n### Exigences clés\n1. **Consentement** — Consentement explicite et éclairé pour la collecte de données\n2. **Minimisation des données** — Ne collecter que ce qui est nécessaire\n3. **Limitation des finalités** — Utiliser les données uniquement aux fins spécifiées\n4. **Localisation des données** — Les CIIO doivent stocker les données en Chine\n5. **Transfert transfrontalier** — Évaluation de sécurité CAC requise\n6. **AIPD** — Analyses d'impact avant tout traitement à haut risque\n7. **Droits des personnes concernées** — Accès, rectification, suppression, portabilité\n8. **Notification des violations** — Signaler dans les 72 heures\n\n### Comment DJAC aide\n- Cartographie automatisée des contrôles PIPL (les 72 articles)\n- Évaluation des transferts transfrontaliers avec les orientations de la CAC\n- Notation des risques fournisseurs par rapport aux exigences PIPL\n- Surveillance continue des mises à jour réglementaires\n- Calculateur de pénalités basé sur le chiffre d'affaires et la gravité de la violation",
          caseStudy: {
            company: "Entreprise SaaS européenne",
            challenge:
              "Devait se lancer en Chine tout en maintenant la conformité au GDPR. Nécessitait une analyse des écarts PIPL pour 12 fournisseurs traitant des données d'utilisateurs chinois.",
            solution:
              "A utilisé le module PIPL de DJAC pour évaluer les 12 fournisseurs simultanément. A généré un rapport inter-cadres montrant les chevauchements et les écarts de couverture GDPR-PIPL.",
            results:
              "A identifié 47 écarts de conformité chez les fournisseurs. A atteint une conformité PIPL complète en 6 semaines. A réduit les coûts de consultation juridique de 60 %.",
          },
        },
      ],
    },
    {
      id: "vendor-risk",
      icon: "building",
      title: "Gestion des risques fournisseurs",
      pages: [
        {
          id: "vendor-assessment",
          title: "Évaluation de la conformité des fournisseurs",
          summary:
            "Automatisez les évaluations de conformité des fournisseurs tiers sur tous les référentiels sélectionnés grâce à une analyse assistée par IA et des rapports d'écarts.",
          content:
            "### Évaluation automatisée des fournisseurs\n1. **Enregistrer le fournisseur** — Ajoutez le nom du fournisseur, son secteur, sa juridiction et sa stack technique\n2. **Sélectionner les référentiels** — Choisissez les référentiels réglementaires applicables\n3. **Téléverser les preuves** — Joignez les politiques, certifications et rapports d'audit du fournisseur\n4. **Lancer l'évaluation** — L'IA analyse le fournisseur par rapport à tous les référentiels sélectionnés\n5. **Examiner les résultats** — Analyse détaillée des écarts avec score de risque (0-100)\n6. **Exporter le rapport** — Rapport professionnel PDF/DOCX pour les parties prenantes\n\n### Résultats de l'évaluation\n- **Score global** — Moyenne pondérée sur tous les référentiels (0-100)\n- **Scores par référentiel** — Scores de conformité individuels\n- **Niveau de risque** — Critique / Élevé / Moyen / Faible\n- **Analyse des écarts** — Contrôles non conformes spécifiques avec leur gravité\n- **Plan de remédiation** — Actions prioritaires avec échéances\n- **Contexte des pénalités** — Amendes applicables par juridiction pour chaque écart\n\n### Surveillance continue\nDJAC réévalue automatiquement les fournisseurs à intervalles configurables et vous alerte en cas de :\n- Nouvelles exigences réglementaires affectant les fournisseurs existants\n- Changements dans le profil de risque du fournisseur\n- Certifications ou rapports d'audit arrivant à expiration\n- Menaces émergentes liées aux juridictions des fournisseurs",
          bestPractices: [
            "Évaluez les fournisseurs AVANT la signature du contrat, pas après",
            "Établissez des calendriers de réévaluation trimestriels pour les fournisseurs à haut risque",
            "Utilisez la comparaison entre juridictions pour identifier les chevauchements entre référentiels",
            "Documentez toutes les réponses des fournisseurs aux conclusions de l'évaluation",
            "Reliez les écarts fournisseurs à votre registre des risques interne pour assurer la traçabilité",
          ],
        },
        {
          id: "supplier-profiles",
          title: "Profils de conformité des fournisseurs",
          summary:
            "Créez des profils fournisseurs complets avec des données spécifiques à la juridiction, une analyse de la stack technique et la gestion des contacts.",
          content:
            "### Composants du profil\n- **Informations de base** — Nom, secteur, site web, juridiction\n- **Stack technique** — Composants technologiques avec suivi des versions\n- **Contacts** — Personnel clé avec rôle et juridiction assignée\n- **Niveau de risque** — Classification automatisée des risques basée sur le traitement des données\n- **Historique des évaluations** — Chronologie complète de toutes les évaluations de conformité\n- **Référentiel documentaire** — Preuves, certifications, politiques\n\n### Classification des risques\nDJAC calcule automatiquement les niveaux de risque des fournisseurs :\n- **Critique** — Traite des données personnelles/sensibles, opère dans des juridictions fortement réglementées\n- **Élevé** — Traite des données réglementées, flux de données transfrontaliers\n- **Moyen** — Exposition limitée aux données, exigences réglementaires standard\n- **Faible** — Profil de risque minimal, aucun traitement de données sensibles",
        },
      ],
    },
    {
      id: "api-integration",
      icon: "terminal",
      title: "API et intégration",
      pages: [
        {
          id: "api-reference",
          title: "Référence API",
          summary:
            "DJAC expose une API tRPC typée avec plus de 200 procédures réparties sur 42 routeurs, ainsi que des points de terminaison REST pour les webhooks et les contrôles de santé.",
          content:
            "### Aperçu de l'API\nDJAC utilise **tRPC** pour des opérations API typées de bout en bout. Toutes les procédures passent par `POST /api/trpc` avec prise en charge des lots.\n\n**URL de base :**\n- Production : `https://app.yalla-hack.ae`\n- Local : `http://localhost:3000`\n\n### Méthodes d'authentification\n| Méthode | En-tête | Cas d'utilisation |\n|--------|--------|----------|\n| Cookie de session | Cookie `app_session_id` | Application web (par défaut) |\n| Clé API | `x-djac-api-key: djac_<hex>` | Accès programmatique |\n| Clerk OAuth | Géré automatiquement | OAuth externe |\n\n### Catégories de routeurs\n| Domaine | Routeurs | Procédures clés |\n|--------|---------|----------------|\n| Auth | `localAuth`, `auth`, `googleAuth` | register, login, mfa |\n| Organisation | `orgSettings`, `orgMembers` | create, invite, updateRole |\n| RBAC | `role`, `rbac` | getPermissions, setPermissions |\n| Conformité | `compliance`, `regulatoryChanges` | frameworks.list, controls.get |\n| Fournisseurs | `vendor`, `vendorCompliance` | list, create, assess |\n| Risque | `riskRegister`, `remediation` | list, create, update |\n| IA | `ai` | startAssessment, getJob |\n| Rapports | `complianceReport` | generate, download, schedule |\n| Facturation | `billing` | getPlans, checkout |\n| Admin | `admin`, `system` | getStats, getAuditLogs |\n\n### Codes d'erreur\n| Code | Description |\n|------|-------------|\n| `UNAUTHORIZED` | Authentification requise |\n| `FORBIDDEN` | Permissions insuffisantes |\n| `NOT_FOUND` | Ressource introuvable |\n| `VALIDATION_ERROR` | Échec de la validation des entrées |\n| `RATE_LIMITED` | Trop de requêtes |",
        },
        {
          id: "websocket",
          title: "Diffusion WebSocket",
          summary:
            "La progression de l'évaluation IA en temps réel est diffusée via WebSocket à l'adresse /ws/ai-jobs avec des événements de cycle de vie des tâches.",
          content:
            '### Point de terminaison WebSocket\n**URL :** `wss://app.yalla-hack.ae/ws/ai-jobs`\n\n### Types d\'événements\n| Événement | Direction | Charge utile |\n|-------|-----------|---------|\n| `job:progress` | Serveur → Client | `{ jobId, stage, message, progress }` |\n| `job:complete` | Serveur → Client | `{ jobId, result }` |\n| `job:error` | Serveur → Client | `{ jobId, error: string }` |\n| `subscribe` | Client → Serveur | `{ jobId: string }` |\n\n### Exemple\n```typescript\nconst ws = new WebSocket("wss://app.yalla-hack.ae/ws/ai-jobs");\nws.onopen = () => ws.send(JSON.stringify({ type: "subscribe", jobId }));\nws.onmessage = (e) => {\n  const { type, stage, message } = JSON.parse(e.data);\n  if (type === "job:progress") updateUI(stage, message);\n  if (type === "job:complete") showResults(data.result);\n};\n```',
        },
      ],
    },
    {
      id: "security-compliance",
      icon: "lock",
      title: "Sécurité et conformité",
      pages: [
        {
          id: "security-overview",
          title: "Architecture de sécurité",
          summary:
            "DJAC met en œuvre une défense en profondeur à travers l'authentification, l'autorisation, la protection des données et l'infrastructure, conformément à l'OWASP Top 10.",
          content:
            "### Défense en profondeur\n**Authentification :**\n- Mots de passe hachés avec bcrypt (12 tours)\n- Jetons JWT signés avec HS256 (secret d'au moins 64 caractères)\n- Cookies HTTP-only, Secure, SameSite\n- MFA basé sur TOTP avec codes de secours\n- Réinitialisation de mot de passe par OTP (SHA-256, expiration 5 min)\n\n**Autorisation :**\n- 7 rôles de plateforme + 4 rôles d'organisation\n- 32 modules protégés par des permissions\n- Sécurité au niveau des lignes sur toutes les tables PostgreSQL\n- Isolation des données par organisation\n\n**Protection des données :**\n- TLS 1.3 pour toutes les données en transit\n- PostgreSQL chiffré au repos (Supabase)\n- Secrets dans les variables d'environnement Vercel + GitHub Actions\n\n### En-têtes de sécurité\n| En-tête | Valeur | Objectif |\n|--------|-------|---------|\n| Strict-Transport-Security | max-age=63072000 | Imposer HTTPS |\n| X-Content-Type-Options | nosniff | Prévention de l'analyse MIME |\n| X-Frame-Options | DENY | Prévention du clickjacking |\n| Content-Security-Policy | Restreint par route | Atténuation XSS |\n| Referrer-Policy | strict-origin | Fuite de référent |\n\n### Correctifs CVE\n- Alertes de vulnérabilité automatisées Dependabot\n- Remplacements pnpm pour les correctifs des dépendances transitives\n- Analyse de sécurité CodeQL dans le pipeline CI",
        },
        {
          id: "rbac-system",
          title: "RBAC et système de permissions",
          summary:
            "Permissions granulaires sur 32 modules de plateforme avec des remplacements de rôles personnalisés par organisation.",
          content:
            "### Flux de résolution des permissions\n1. La requête arrive à la procédure tRPC\n2. Le middleware d'authentification extrait `ctx.user` et `ctx.orgRole`\n3. Le système vérifie la ligne personnalisée `rolePermissions`\n4. Revient à `DEFAULT_ORG_ROLE_PERMISSIONS`\n5. Compare l'action aux PermissionFlags\n6. Renvoie Allow ou 403 FORBIDDEN\n\n### Indicateurs de permission\nChaque module a 6 indicateurs :\n- `canView` — Accès en lecture\n- `canCreate` — Créer de nouveaux enregistrements\n- `canEdit` — Modifier les enregistrements existants\n- `canDelete` — Supprimer des enregistrements\n- `canExport` — Télécharger/exporter des données\n- `canInvite` — Inviter des membres de l'équipe\n\n### Modèles par défaut\n| Rôle | Modèle par défaut |\n|------|----------------|\n| Analyste | VIEW_ONLY sur la plupart des modules |\n| Responsable de la conformité | STANDARD sur la conformité |\n| Admin | FULL sur la conformité, STANDARD sur les paramètres |\n| Propriétaire | FULL sur tout |",
        },
      ],
    },
    {
      id: "developer-guide",
      icon: "code",
      title: "Guide du développeur",
      pages: [
        {
          id: "dev-setup",
          title: "Configuration de développement",
          summary:
            "Configurez votre environnement local avec Node.js 20+, pnpm 10+, Docker pour Supabase, et tous les services requis.",
          content:
            "### Prérequis\n- Node.js 20+\n- pnpm 10+ (`npm install -g pnpm@10`)\n- Docker Desktop (pour Supabase)\n- Supabase CLI (`npm install -g supabase`)\n\n### Configuration initiale\n```bash\ngit clone <repo-url> djac && cd djac\npnpm install\ncp .env.example .env\nsupabase start\npnpm db:push\npnpm seed:data\npnpm dev\n# → http://localhost:3000\n```\n\n### Contournement de l'authentification en développement\n```env\nDEV_AUTH_BYPASS=true\nDEV_AUTH_EMAIL=dev@example.com\nDEV_AUTH_ROLE=super_admin\n```\n\n### Scripts disponibles\n| Commande | Objectif |\n|---------|---------|\n| `pnpm dev` | Démarrer le serveur de développement |\n| `pnpm check` | Vérification des types TypeScript |\n| `pnpm lint` | ESLint |\n| `pnpm test` | Exécuter les tests (vitest) |\n| `pnpm build` | Build de production |\n| `pnpm verify:all` | Toutes les vérifications + build |",
          demoSteps: [
            "Clonez le dépôt et installez les dépendances avec 'pnpm install'",
            "Copiez .env.example vers .env et renseignez les valeurs requises",
            "Démarrez Supabase localement avec 'supabase start'",
            "Poussez le schéma de base de données avec 'pnpm db:push'",
            "Initialisez les données de référence avec 'pnpm seed:data'",
            "Démarrez le serveur de développement avec 'pnpm dev' → http://localhost:3000",
          ],
        },
        {
          id: "adding-features",
          title: "Ajout de nouvelles fonctionnalités",
          summary:
            "Suivez les patterns de DJAC pour ajouter de nouveaux routeurs tRPC, pages React, tables de base de données et tests.",
          content:
            '### Ajouter un routeur tRPC\n```typescript\n// server/my-feature-router.ts\nimport { orgProcedure, router } from "./_core/trpc";\nimport { z } from "zod";\n\nexport const myFeatureRouter = router({\n  list: orgProcedure\n    .input(z.object({ orgId: z.string() }))\n    .query(async ({ ctx, input }) => {\n      const db = getDb();\n      return db.select().from(myTable).where(eq(myTable.orgId, input.orgId));\n    }),\n  create: orgProcedure\n    .input(z.object({ orgId: z.string(), name: z.string() }))\n    .mutation(async ({ ctx, input }) => {\n      const [rec] = await db.insert(myTable).values(input).returning();\n      return rec;\n    }),\n});\n```\n\nEnregistrez dans `server/routers.ts` :\n```typescript\nimport { myFeatureRouter } from "./my-feature-router";\nexport const appRouter = router({ myFeature: myFeatureRouter });\n```\n\n### Règles de conception d\'API\n1. Toutes les mutations utilisent tRPC avec validation Zod\n2. Utilisez `protectedProcedure` pour l\'authentification, `orgProcedure` pour la portée organisationnelle\n3. Vérifiez `ctx.user.role` pour l\'autorisation\n4. Ne faites jamais confiance aux entrées client — validez toujours avec Zod',
        },
      ],
    },
    {
      id: "deployment-operations",
      icon: "server",
      title: "Déploiement et opérations",
      pages: [
        {
          id: "deployment",
          title: "Options de déploiement",
          summary:
            "DJAC prend en charge Vercel (serverless), Docker et le déploiement manuel sur VPS. Les pipelines CI/CD automatisent la préproduction et la production.",
          content:
            "### Vercel (recommandé)\n```bash\npnpm build\nvercel --prod\nsupabase db push --linked\nsupabase functions deploy\ncurl https://your-app.com/api/health\n```\n\n### Docker\n```bash\ndocker build -t djac:latest .\ndocker run -d -p 3000:3000 --env-file .env.production --name djac-app djac:latest\n```\n\n### Pipeline CI/CD\n| Workflow | Déclencheur | Actions |\n|----------|---------|---------|\n| CI | Push/PR | Lint, Typecheck, Test, Build |\n| Préproduction | Push vers develop | Déploiement automatique vers l'aperçu Vercel |\n| Production | Push vers main | Déploiement + migration DB + health check |\n\n### Liste de vérification pour la production\n- [ ] JWT_SECRET ≥ 64 caractères\n- [ ] DEV_AUTH_BYPASS=false\n- [ ] Taille du pool DB : 25 connexions\n- [ ] Redis configuré\n- [ ] Politiques RLS activées\n- [ ] Suivi des erreurs Sentry activé",
        },
        {
          id: "monitoring",
          title: "Surveillance et observabilité",
          summary:
            "Sentry pour le suivi des erreurs, Pino pour la journalisation structurée, points de terminaison health/readiness pour la surveillance opérationnelle.",
          content:
            "### Points de terminaison de santé\n| Point de terminaison | Objectif |\n|----------|---------|\n| `/api/health` | Vérification de santé (statut, disponibilité) |\n| `/api/readyz` | Préparation (DB, Redis, Stripe, AI) |\n\n### Planificateurs en arrière-plan\n| Planificateur | Intervalle | Objectif |\n|-----------|----------|---------|\n| Rétention des interactions | 24h | Purger les anciens journaux |\n| Rappel d'essai | 6h | E-mails d'essai expirant |\n| Alerte d'échéance | 1h | Notifications d'échéances réglementaires |\n| Livraison de rapports | Config | Génération de rapports planifiée |",
        },
        {
          id: "troubleshooting",
          title: "Dépannage des problèmes courants",
          summary:
            "Solutions pour les problèmes courants de développement, de déploiement et d'exploitation.",
          content:
            "### Problèmes courants\n**Erreurs de connexion DB :** Vérifiez `DATABASE_URL` dans `.env`. Assurez-vous que Supabase est en cours d'exécution.\n\n**AI bloqué en \"queued\" :** Vérifiez la connectivité Redis. En mode dev, confirmez `AI_QUEUE_MODE=in_memory`.\n\n**OpenAI 401 :** `OPENAI_API_KEY` invalide.\n\n**Échec de build Vercel :** Vérifiez les variables d'environnement. Assurez-vous d'avoir Node 20+. Testez avec `pnpm build`.\n\n### Débogage\n- Journaux de débogage : `LOG_LEVEL=debug pnpm dev`\n- Suivi des requêtes : en-tête `X-Request-ID`\n- Consultez le tableau de bord Sentry pour les erreurs",
          troubleshooting: [
            {
              problem: "La connexion renvoie 'Authentication required (10001)'",
              solution:
                "Vérifiez JWT_SECRET dans .env. Effacez les cookies du navigateur. Vérifiez COOKIE_DOMAIN.",
            },
            {
              problem: "pnpm db:push échoue avec des erreurs de migration",
              solution:
                "Vérifiez avec 'supabase db status'. Utilisez 'supabase db reset' pour réinitialiser l'environnement de développement.",
            },
            {
              problem: "Échec de build Vercel avec limite de mémoire",
              solution:
                "Externalisez les dépendances volumineuses. Augmentez la mémoire Node dans les paramètres Vercel.",
            },
            {
              problem: "Le webhook Stripe ne reçoit pas d'événements",
              solution:
                "Vérifiez STRIPE_WEBHOOK_SECRET. Utilisez 'stripe listen' pour les tests locaux.",
            },
          ],
        },
      ],
    },
    {
      id: "billing-plans",
      icon: "card",
      title: "Facturation et forfaits",
      pages: [
        {
          id: "pricing-overview",
          title: "Aperçu des tarifs et des forfaits",
          summary:
            "Des forfaits d'abonnement flexibles pour les équipes de toutes tailles — des startups aux entreprises mondiales.",
          content:
            "### Comparaison des forfaits\n| Fonctionnalité | Essai gratuit | Starter | Professionnel | Entreprise |\n|---------|-----------|---------|-------------|------------|\n| Juridictions | 1 | 3 | 10 | Illimité |\n| Fournisseurs | 5 | 25 | 100 | Illimité |\n| Évaluations IA/mois | 3 | 20 | 100 | Personnalisé |\n| Membres de l'équipe | 2 | 10 | 50 | Illimité |\n| Accès API | — | — | ✓ | ✓ |\n| Support prioritaire | — | — | ✓ | ✓ |\n| SLA | — | 99,5 % | 99,9 % | 99,95 % |\n\n### Intervalles de facturation\n- **Mensuel** — Tarif standard\n- **Trimestriel** — 10 % de réduction\n- **Semestriel** — 15 % de réduction\n- **Annuel** — 20 % de réduction\n\n### Essai gratuit\n- Essai gratuit de 14 jours sur le forfait Starter\n- Aucune carte de crédit requise\n- Accès complet à toutes les fonctionnalités Starter",
        },
        {
          id: "subscription-management",
          title: "Gestion de votre abonnement",
          summary:
            "Mettez à niveau, rétrogradez ou annulez via le portail client Stripe. Consultez l'historique de facturation et les factures.",
          content:
            "### Cycle de vie de l'abonnement\n1. **Essai** → Essai automatique de 14 jours à l'inscription\n2. **Actif** → Abonnement payant\n3. **En retard** → Échec du paiement ; période de grâce\n4. **Annulé** → Données conservées pendant 30 jours\n\n### Mise à niveau / Rétrogradation\n- **Mise à niveau :** Accès immédiat. Frais au prorata.\n- **Rétrogradation :** Prend effet à la fin de la période de facturation.\n\n### Portail de facturation\nAccès via : **Tableau de bord → Facturation et forfait → Gérer l'abonnement**\n- Mettre à jour le mode de paiement\n- Consulter l'historique de facturation\n- Télécharger les factures\n- Changer/annuler le forfait",
          troubleshooting: [
            {
              problem: "Le paiement a échoué mais la carte est valide",
              solution:
                "Vérifiez les blocages de transactions internationales. Essayez une autre carte ou contactez le support.",
            },
            {
              problem:
                "La mise à niveau n'est pas reflétée dans le tableau de bord",
              solution:
                "Laissez jusqu'à 5 minutes pour le provisionnement. Essayez d'actualiser ou de vous déconnecter/reconnecter.",
            },
            {
              problem:
                "L'essai est terminé mais vous avez besoin de plus de temps",
              solution:
                "Contactez le support pour une prolongation unique de 7 jours (une fois par organisation).",
            },
          ],
        },
      ],
    },
    {
      id: "operations",
      icon: "gauge",
      title: "Opérations Cyber",
      pages: [
        {
          id: "risk-register",
          title: "Registre des Risques",
          summary:
            "Gestion centralisée des risques avec notation automatisée de la gravité, planification du traitement et liaison au référentiel.",
          content:
            "### Flux de Gestion des Risques\n1. **Identifier** — Enregistrer les risques avec catégorie et probabilité/impact\n2. **Évaluer** — Notation automatisée des risques (probabilité × impact)\n3. **Traiter** — Accepter, Atténuer, Transférer ou Éviter\n4. **Lier** — Connecter les risques aux fournisseurs, référentiels et tâches\n5. **Surveiller** — Suivre l'état et la progression du traitement\n\n### Catégories de Risques\n- **Opérationnel** — Défaillances de processus, pannes système\n- **Juridique** — Non-conformité réglementaire, violations contractuelles\n- **Technique** — Vulnérabilités de sécurité, faiblesses d'architecture\n- **Financier** — Dépassements budgétaires, exposition à la fraude\n- **Réputationnel** — Atteinte à la marque, érosion de la confiance des clients",
        },
        {
          id: "incident-management",
          title: "Gestion des Incidents",
          summary:
            "Enregistrer, suivre et résoudre les incidents de sécurité et de conformité avec cartographie réglementaire automatisée.",
          content:
            "### Cycle de Vie des Incidents\n1. **Détection** — Enregistrer l'incident avec type, gravité, systèmes affectés\n2. **Triage** — Classification automatisée de la gravité\n3. **Investigation** — Suivi chronologique avec preuves\n4. **Confinement** — Suivi des actions, notification\n5. **Résolution** — Analyse des causes profondes, documentation de remédiation\n6. **Clôture** — Revue post-incident\n\n### Cartographie Réglementaire Automatisée\n- Violation de données en Chine → PIPL Art. 57 (72h au CAC)\n- Violation de données dans l'UE → GDPR Art. 33 (72h à la DPA)\n- Incident de sécurité → Implications multi-référentiels identifiées",
        },
      ],
    },
    {
      id: "case-studies",
      icon: "star",
      title: "Études de cas",
      pages: [
        {
          id: "enterprise-expansion",
          title: "Expansion transfrontalière d'entreprise",
          summary:
            "Comment un fabricant du Fortune 500 a utilisé DJAC pour atteindre la conformité en Chine, en Arabie saoudite et dans l'UE pour plus de 50 fournisseurs.",
          content:
            "### Contexte\nUn fabricant mondial avec plus de 2 milliards de dollars de chiffre d'affaires avait besoin de s'étendre en Chine, en Arabie saoudite et dans l'UE avec 53 fournisseurs répartis dans 12 pays.\n\n### Défi\n- 53 fournisseurs, 3 nouvelles juridictions, délai de 90 jours\n- Évaluation manuelle : plus de 6 mois, plus de 500 000 $ de frais de conseil\n\n### Solution DJAC\n1. **Semaine 1-2** : Enregistrement des 53 fournisseurs\n2. **Semaine 2-3** : Exécution des évaluations IA pour PIPL, PDPL, GDPR\n3. **Semaine 3-4** : Analyse des écarts entre référentiels — 312 écarts identifiés\n4. **Semaine 4-8** : Le planificateur de remédiation a suivi la clôture des écarts\n5. **Semaine 8-12** : La surveillance continue a confirmé la conformité totale\n\n### Résultats\n- ✅ Conformité totale en 82 jours (contre une estimation de 180 jours)\n- ✅ 312 écarts identifiés, 298 clôturés en 60 jours\n- ✅ 380 000 $ économisés en frais de conseil\n- ✅ Réduction de 70 % des coûts de surveillance continue\n- ✅ Aucune constatation lors des premiers audits réglementaires",
        },
        {
          id: "saas-startup",
          title: "Conformité rapide d'une startup SaaS",
          summary:
            "Comment une startup de 15 personnes a atteint la préparation SOC 2 et GDPR en 30 jours grâce à DJAC.",
          content:
            "### Contexte\nUne startup de série A avec 15 employés avait besoin de la conformité SOC 2 Type II et GDPR pour conclure des contrats d'entreprise.\n\n### Défi\n- Aucun programme de conformité existant\n- 7 fournisseurs cloud à évaluer\n- Budget de 5 000 $/mois pour la conformité\n\n### Solution DJAC\n1. Intégration de l'équipe, configuration du profil de l'organisation\n2. Sélection de SOC 2 + GDPR avec contrôles recommandés par IA\n3. Enregistrement des 7 fournisseurs, exécution des évaluations\n4. Génération de modèles de politiques à partir du gestionnaire de politiques\n5. Vérifications continues pendant l'examen de l'auditeur\n\n### Résultats\n- ✅ SOC 2 Type II livré en 28 jours\n- ✅ Programme GDPR établi en 30 jours\n- ✅ 3 contrats d'entreprise conclus (480 000 $ d'ARR)\n- ✅ Coût de conformité continu inférieur à 250 $/mois",
        },
      ],
    },
  ],
  es: [
    {
      id: "getting-started",
      icon: "book",
      title: "Primeros pasos",
      pages: [
        {
          id: "welcome",
          title: "Bienvenido a DJAC",
          summary:
            "DJAC es la primera plataforma de inteligencia de cumplimiento normativo transfronterizo impulsada por IA del mundo. Impleméntala en minutos y logra el cumplimiento normativo en ${COVERAGE.jurisdictions} jurisdicciones.",
          content:
            "### ¿Qué es DJAC?\nDJAC (De Jure Automated Compliance) es una plataforma SaaS empresarial que automatiza el cumplimiento normativo en distintas jurisdicciones — China, Arabia Saudita, el CCG, la UE, Norteamérica y APAC.\n\n> **info** Diseñada para responsables de cumplimiento, equipos legales, administradores empresariales, consultores y reguladores gubernamentales.\n\n### ¿Por qué DJAC?\n- **30 jurisdicciones** — PIPL, PDPL, CSL, DSL, GDPR, ISO 27001, SOC 2, NIST CSF, HIPAA y más\n- **Análisis impulsado por IA** — Canalización de evaluación de cumplimiento de 8 etapas basada en DeepSeek\n- **Monitoreo en tiempo real** — Seguimiento continuo del cumplimiento con detección automatizada de brechas\n- **Inteligencia transfronteriza** — Verificador de cumplimiento de transferencia de datos y monitoreo de cambios regulatorios\n- **Gestión de riesgos de proveedores** — Evaluaciones automatizadas de terceros en todos los marcos seleccionados\n- **Seguridad de nivel empresarial** — Cifrado AES-256, RBAC, registros de auditoría, listo para SOC 2\n\n> **tip** La interfaz de DJAC está disponible en 9 idiomas — cámbiala en cualquier momento desde el menú de configuración regional del encabezado. Esta documentación se publica en inglés, árabe y chino; otros idiomas de la interfaz ven la versión en inglés aquí.\n\n### Inicio rápido (5 minutos)\n1. **Crea tu organización** — Configura el perfil de tu empresa y la facturación\n2. **Selecciona jurisdicciones** — Elige China, Arabia Saudita, la UE o cualquier combinación\n3. **Elige marcos** — La IA recomienda automáticamente las regulaciones relevantes\n4. **Registra un proveedor** — Agrega tu primer proveedor externo\n5. **Ejecuta la evaluación** — La IA genera un informe de cumplimiento completo en menos de 60 segundos\n\n> **tip** El asistente de incorporación te guía por todo este flujo — búscalo en tu panel después de registrarte.\n\n### Niveles de la plataforma\n| Nivel | Mensual | Ideal para |\n|------|---------|----------|\n| Starter | Desde $99/mes | Equipos pequeños, una sola jurisdicción |\n| Professional | Desde $249/mes | Cumplimiento multijurisdiccional |\n| Enterprise | Personalizado | Empresas globales, API, soporte dedicado |\n\n> **faq** ¿Cuánto tarda una evaluación de proveedor con IA?\n> **answer** La mayoría de las evaluaciones se completan en menos de 60 segundos, transmitiendo el progreso en vivo a través del WebSocket a medida que finaliza cada una de las 8 etapas de la canalización.\n> **faq** ¿Qué regulaciones son compatibles de forma predeterminada?\n> **answer** 46 marcos con detalle completo a nivel de control, más 107 paquetes de marcos seleccionados, en 30 jurisdicciones — incluidos GDPR, NIS2, DORA, PIPL, PDPL, ISO 27001, SOC 2 y más. El motor de IA recomienda automáticamente los relevantes para tu perfil.\n> **faq** ¿DJAC puede ejecutarse en nuestra propia infraestructura?\n> **answer** Sí — además del alojamiento en la nube de Vercel, se admite la implementación autogestionada con Docker, y la plataforma se puede ampliar con marcos personalizados.",
        },
        {
          id: "architecture",
          title: "Arquitectura de la plataforma",
          summary:
            "DJAC se ejecuta sobre una arquitectura nativa de la nube con React 19, Express + tRPC, PostgreSQL en Supabase, Redis y Google DeepSeek.",
          content:
            "### Arquitectura del sistema\nDJAC emplea una arquitectura monorepo moderna:\n\n**Frontend**: React 19 + TypeScript + Vite 7 + Tailwind CSS 4 + shadcn/ui  \n**Backend**: Express 4 + tRPC 11 (más de 200 procedimientos de API) + Drizzle ORM  \n**Base de datos**: PostgreSQL 17 en Supabase (AWS Tokio, ap-northeast-2)  \n**Motor de IA**: Google DeepSeek con canalización de evaluación de 8 etapas  \n**Cola**: En memoria / Redis (listo para BullMQ)  \n**Autenticación**: Triple vía (Clerk OAuth + Supabase Auth + JWT local)  \n**Facturación**: Stripe (5 planes × 4 intervalos)  \n**Alojamiento**: Vercel (sin servidor) + Docker\n\n### Flujo de datos\n1. El usuario envía una solicitud de evaluación de proveedor\n2. El portero valida las entradas (detección de inyección)\n3. La admisión analiza los documentos y normaliza el texto\n4. El extractor identifica hechos estructurados (triples clave-valor-evidencia)\n5. El contexto RAG recupera los controles de cumplimiento relevantes de la base de datos\n6. El juez (DeepSeek) evalúa el cumplimiento frente a los controles\n7. El sintetizador fusiona los hallazgos en un informe entre marcos\n8. El validador garantiza la coherencia del esquema y la integridad de los datos\n9. El generador de informes produce la salida final formateada (PDF/DOCX/JSON)",
          diagram:
            "[Usuario] → [Portero] → [Admisión] → [Extractor] → [RAG] → [Juez (DeepSeek)] → [Sintetizador] → [Validador] → [Generador de informes] → [PDF / DOCX / JSON]",
        },
        {
          id: "roles",
          title: "Roles y permisos",
          summary:
            "DJAC proporciona control de acceso granular basado en roles con 6 roles de plataforma y 4 roles de organización en más de 30 módulos.",
          content:
            "### Roles de plataforma\n| Rol | Nivel | Acceso |\n|------|-------|--------|\n| Usuario básico | 10 | Acceso de solo lectura a los módulos asignados |\n| Usuario profesional | 20 | Acceso completo a las funciones de cumplimiento |\n| Administrador de empresa | 30 | Gestión de la organización + equipo |\n| Administrador de plataforma | 40 | Supervisión y configuración entre organizaciones |\n| Empleado de Yalla Hack | 45 | Soporte interno y operaciones |\n| Superadministrador | 100 | Acceso completo sin restricciones a la plataforma |\n\n### Roles de organización\n| Rol | Nivel | Capacidades |\n|------|-------|-------------|\n| Analista | 10 | Solo visualización en la mayoría de los módulos |\n| Responsable de cumplimiento | 20 | Crear/editar datos de cumplimiento |\n| Administrador | 30 | Gestión de equipos + claves de API |\n| Propietario | 40 | Facturación + configuración de la organización + acceso completo |\n\n> **tip** Puedes personalizar los permisos por módulo y por rol — los valores predeterminados son solo puntos de partida.\n\n### Modelo de permisos\nCada uno de los más de 30 módulos tiene 6 indicadores de permisos:\n- `canView` — Acceso de lectura\n- `canCreate` — Crear nuevos registros\n- `canEdit` — Modificar registros existentes\n- `canDelete` — Eliminar registros\n- `canExport` — Descargar/exportar datos\n- `canInvite` — Invitar a miembros del equipo",
        },
      ],
    },
    {
      id: "ai-engine",
      icon: "zap",
      title: "Motor de Cumplimiento de IA",
      pages: [
        {
          id: "ai-overview",
          title: "Descripción General del Motor de IA",
          summary:
            "El pipeline de IA de 8 etapas de DJAC utiliza DeepSeek para evaluar el cumplimiento de proveedores en múltiples marcos simultáneamente.",
          content:
            "### El Pipeline de 8 Etapas\n1. **Portero** — Validación de entrada, detección de inyección, sanitización de datos\n2. **Admisión** — Análisis de documentos, normalización de texto, detección de idioma\n3. **Extractor** — Extracción estructurada de hechos en tripletas clave-valor-evidencia\n4. **Contexto RAG** — Generación Aumentada por Recuperación: extrae controles de cumplimiento relevantes de PostgreSQL\n5. **Juez (DeepSeek)** — Evalúa cada hecho contra los requisitos de control aplicables\n6. **Sintetizador** — Fusiona hallazgos, genera comparación entre marcos\n7. **Validador** — Validación de esquema, consistencia entre campos, reintento en caso de fallo\n8. **Reportero** — Salida final formateada en PDF, DOCX o JSON\n\n> **info** Cada etapa registra su progreso en el canal WebSocket para que puedas ver las evaluaciones en tiempo real.\n\n### Características de IA\n- **Análisis Automatizado de Brechas** — Identifica controles faltantes y áreas de incumplimiento\n- **Puntuación de Riesgo (0-100)** — Puntuaciones de cumplimiento por marco y agregadas\n- **Recomendaciones de Remediación** — Acciones sugeridas por IA clasificadas por prioridad\n- **Estimación de Penalizaciones** — Calcula posibles multas según la jurisdicción\n- **Comparación entre Jurisdicciones** — Análisis comparativo de cobertura de marcos\n- **Transmisión de Trabajos en Tiempo Real** — Seguimiento de progreso basado en WebSocket durante las evaluaciones",
        },
        {
          id: "rag-system",
          title: "Sistema de Contexto RAG",
          summary:
            "El sistema de Generación Aumentada por Recuperación recupera los controles de cumplimiento más relevantes de la base de datos antes del análisis de IA.",
          content:
            "### Cómo Funciona RAG\n1. **Análisis de Documentos** — Hechos extraídos de documentos de proveedores\n2. **Búsqueda Semántica** — Coincide hechos con más de 1,000 controles de cumplimiento\n3. **Puntuación de Relevancia** — Clasifica controles por relevancia jurisdiccional y temática\n4. **Ensamblaje de Contexto** — Construye una ventana de contexto enfocada para DeepSeek\n5. **Respuesta Fundamentada** — La IA evalúa basándose ÚNICAMENTE en los controles recuperados (sin alucinaciones)\n\n### Beneficios\n- Elimina alucinaciones de IA en asesoramiento de cumplimiento\n- Asegura recomendaciones específicas del marco\n- Mantiene un registro de auditoría de mapeos de control a hallazgo\n- Soporta 30 jurisdicciones con controles específicos de jurisdicción\n\n> **tip** El sistema RAG es lo que hace que DJAC sea legalmente confiable — nunca adivina sobre requisitos regulatorios.\n\n### Base de Conocimiento\n- 46 marcos regulatorios\n- Más de 1,000 controles de cumplimiento\n- Más de 14 tipos de relaciones entre marcos\n- Grupo de estándares globales: ISO 27001, NIST CSF, SOC 2, HIPAA, PCI DSS",
        },
      ],
    },
    {
      id: "frameworks",
      icon: "shield",
      title: "Marcos de Cumplimiento",
      pages: [
        {
          id: "jurisdictions",
          title: "Jurisdicciones Compatibles",
          summary:
            "DJAC cubre 30 jurisdicciones en APAC, EMEA, América del Norte y África con marcos regulatorios integrales.",
          content:
            "### Región APAC\n- **China** — PIPL, CSL, DSL, MLPS 2.0\n- **Japón** — APPI\n- **Corea del Sur** — PIPA\n- **Singapur** — PDPA\n- **India** — DPDP Act\n- **Australia** — Privacy Act 1988\n\n### Oriente Medio / CCG\n- **Arabia Saudita** — PDPL, NCA ECC / CSCC / OCC\n- **EAU** — UAE PDPL\n- **Catar** — Qatar PDPPL\n- **Baréin** — Bahrain PDPL\n- **Kuwait** — Kuwait DPA\n- **Omán** — Oman PDPL\n\n### Europa\n- **UE/EEE** — GDPR, Directiva NIS2, DORA\n- **Reino Unido** — UK GDPR / DPA 2018\n\n### América del Norte\n- **Estados Unidos** — HIPAA, CCPA/CPRA, SOX, PCI DSS\n- **Canadá** — PIPEDA\n\n### Estándares Globales\n- ISO 27001 / 27002\n- Marco de Ciberseguridad del NIST (CSF)\n- SOC 2 Tipo II\n- PCI DSS v4.0",
        },
        {
          id: "pipl-guide",
          title: "Guía de Cumplimiento de PIPL",
          summary:
            "Guía completa de la Ley de Protección de Información Personal (PIPL) de China, incluida la localización de datos y las normas de transferencia transfronteriza.",
          content:
            "### Descripción General de PIPL\nLa Ley de Protección de Información Personal (PIPL) de China entró en vigor el 1 de noviembre de 2021. Regula cómo las organizaciones recopilan, utilizan, almacenan y transfieren información personal de personas en China.\n\n> **warning** Las violaciones de PIPL pueden resultar en multas de hasta ¥50 millones de RMB (~$7M USD) o el 5% de los ingresos anuales.\n\n### Requisitos Clave\n1. **Consentimiento** — Consentimiento explícito e informado para la recopilación de datos\n2. **Minimización de Datos** — Recopilar solo lo necesario\n3. **Limitación de Propósito** — Utilizar los datos solo para fines especificados\n4. **Localización de Datos** — Los CIIO deben almacenar datos en China\n5. **Transferencia Transfronteriza** — Se requiere evaluación de seguridad de la CAC\n6. **DPIAs** — Evaluaciones de impacto antes del procesamiento de alto riesgo\n7. **Derechos del Titular de los Datos** — Acceso, corrección, eliminación, portabilidad\n8. **Notificación de Brechas** — Informar dentro de las 72 horas\n\n### Cómo Ayuda DJAC\n- Mapeo automatizado de controles PIPL (los 72 artículos)\n- Evaluación de transferencia transfronteriza con orientación de la CAC\n- Puntuación de riesgo de proveedores según los requisitos de PIPL\n- Monitoreo continuo de actualizaciones regulatorias\n- Calculadora de penalizaciones basada en ingresos y gravedad de la infracción",
          caseStudy: {
            company: "Empresa SaaS Europea",
            challenge:
              "Necesitaba lanzarse en China manteniendo el cumplimiento del GDPR. Requería un análisis de brechas de PIPL para 12 proveedores que manejan datos de usuarios chinos.",
            solution:
              "Utilizó el módulo PIPL de DJAC para evaluar los 12 proveedores simultáneamente. Generó un informe entre marcos que muestra la superposición y las brechas de cobertura GDPR-PIPL.",
            results:
              "Identificó 47 brechas de cumplimiento entre proveedores. Logró el cumplimiento total de PIPL en 6 semanas. Redujo los costos de consultoría legal en un 60%.",
          },
        },
      ],
    },
    {
      id: "vendor-risk",
      icon: "building",
      title: "Gestión de Riesgos de Proveedores",
      pages: [
        {
          id: "vendor-assessment",
          title: "Evaluación de Cumplimiento de Proveedores",
          summary:
            "Automatice las evaluaciones de cumplimiento de proveedores externos en todos los marcos seleccionados con análisis impulsado por IA e informes de brechas.",
          content:
            "### Evaluación Automatizada de Proveedores\n1. **Registrar Proveedor** — Agregue nombre del proveedor, industria, jurisdicción y stack tecnológico\n2. **Seleccionar Marcos** — Elija los marcos regulatorios aplicables\n3. **Cargar Evidencia** — Adjunte políticas del proveedor, certificaciones, informes de auditoría\n4. **Ejecutar Evaluación** — La IA analiza al proveedor frente a todos los marcos seleccionados\n5. **Revisar Resultados** — Análisis detallado de brechas con puntuación de riesgo (0-100)\n6. **Exportar Informe** — Informe profesional en PDF/DOCX para las partes interesadas\n\n### Resultado de la Evaluación\n- **Puntuación General** — Promedio ponderado de todos los marcos (0-100)\n- **Puntuaciones por Marco** — Puntuaciones de cumplimiento individuales\n- **Nivel de Riesgo** — Crítico / Alto / Medio / Bajo\n- **Análisis de Brechas** — Controles no conformes específicos con severidad\n- **Plan de Remediación** — Acciones priorizadas con plazos\n- **Contexto de Penalizaciones** — Multas aplicables por jurisdicción por brecha\n\n### Monitoreo Continuo\nDJAC reevalúa automáticamente a los proveedores en intervalos configurables y le alerta sobre:\n- Nuevos requisitos regulatorios que afectan a proveedores existentes\n- Cambios en el perfil de riesgo del proveedor\n- Certificaciones o informes de auditoría que expiran\n- Amenazas emergentes relacionadas con las jurisdicciones de los proveedores",
          bestPractices: [
            "Evalúe a los proveedores ANTES de firmar el contrato, no después",
            "Establezca programas de reevaluación trimestral para proveedores de alto riesgo",
            "Utilice la comparación entre jurisdicciones para identificar superposiciones entre marcos",
            "Documente todas las respuestas de los proveedores a los hallazgos de la evaluación",
            "Vincule las brechas de los proveedores con su registro interno de riesgos para trazabilidad",
          ],
        },
        {
          id: "supplier-profiles",
          title: "Perfiles de Cumplimiento de Proveedores",
          summary:
            "Cree perfiles completos de proveedores con datos específicos de la jurisdicción, análisis del stack tecnológico y gestión de contactos.",
          content:
            "### Componentes del Perfil\n- **Información Básica** — Nombre, industria, sitio web, jurisdicción\n- **Stack Tecnológico** — Componentes tecnológicos con seguimiento de versiones\n- **Contactos** — Personal clave con rol y asignación de jurisdicción\n- **Nivel de Riesgo** — Clasificación automática de riesgo basada en el procesamiento de datos\n- **Historial de Evaluaciones** — Cronología completa de todas las evaluaciones de cumplimiento\n- **Repositorio de Documentos** — Evidencia, certificaciones, políticas\n\n### Clasificación de Riesgo\nDJAC calcula automáticamente los niveles de riesgo de los proveedores:\n- **Crítico** — Maneja datos personales/sensibles, opera en jurisdicciones altamente reguladas\n- **Alto** — Procesa datos regulados, flujos de datos transfronterizos\n- **Medio** — Exposición limitada de datos, requisitos regulatorios estándar\n- **Bajo** — Perfil de riesgo mínimo, sin procesamiento de datos sensibles",
        },
      ],
    },
    {
      id: "api-integration",
      icon: "terminal",
      title: "API e Integración",
      pages: [
        {
          id: "api-reference",
          title: "Referencia de la API",
          summary:
            "DJAC expone una API tRPC con tipado seguro y más de 200 procedimientos en 42 routers, además de endpoints REST para webhooks y verificaciones de estado.",
          content:
            "### Descripción general de la API\nDJAC utiliza **tRPC** para operaciones de API con tipado seguro de extremo a extremo. Todos los procedimientos pasan por `POST /api/trpc` con soporte por lotes.\n\n**URLs base:**\n- Producción: `https://app.yalla-hack.ae`\n- Local: `http://localhost:3000`\n\n### Métodos de autenticación\n| Método | Encabezado | Caso de uso |\n|--------|--------|----------|\n| Cookie de sesión | Cookie `app_session_id` | Aplicación web (predeterminado) |\n| Clave de API | `x-djac-api-key: djac_<hex>` | Acceso programático |\n| Clerk OAuth | Gestionado automáticamente | OAuth externo |\n\n### Categorías de routers\n| Dominio | Routers | Procedimientos clave |\n|--------|---------|----------------|\n| Autenticación | `localAuth`, `auth`, `googleAuth` | register, login, mfa |\n| Organización | `orgSettings`, `orgMembers` | create, invite, updateRole |\n| RBAC | `role`, `rbac` | getPermissions, setPermissions |\n| Cumplimiento | `compliance`, `regulatoryChanges` | frameworks.list, controls.get |\n| Proveedores | `vendor`, `vendorCompliance` | list, create, assess |\n| Riesgo | `riskRegister`, `remediation` | list, create, update |\n| IA | `ai` | startAssessment, getJob |\n| Informes | `complianceReport` | generate, download, schedule |\n| Facturación | `billing` | getPlans, checkout |\n| Administración | `admin`, `system` | getStats, getAuditLogs |\n\n### Códigos de error\n| Código | Descripción |\n|------|-------------|\n| `UNAUTHORIZED` | Se requiere autenticación |\n| `FORBIDDEN` | Permisos insuficientes |\n| `NOT_FOUND` | Recurso no encontrado |\n| `VALIDATION_ERROR` | Falló la validación de entrada |\n| `RATE_LIMITED` | Demasiadas solicitudes |",
        },
        {
          id: "websocket",
          title: "Transmisión por WebSocket",
          summary:
            "El progreso de la evaluación de IA en tiempo real se transmite mediante WebSocket en /ws/ai-jobs con eventos del ciclo de vida del trabajo.",
          content:
            '### Endpoint de WebSocket\n**URL:** `wss://app.yalla-hack.ae/ws/ai-jobs`\n\n### Tipos de eventos\n| Evento | Dirección | Carga útil |\n|-------|-----------|---------|\n| `job:progress` | Servidor → Cliente | `{ jobId, stage, message, progress }` |\n| `job:complete` | Servidor → Cliente | `{ jobId, result }` |\n| `job:error` | Servidor → Cliente | `{ jobId, error: string }` |\n| `subscribe` | Cliente → Servidor | `{ jobId: string }` |\n\n### Ejemplo\n```typescript\nconst ws = new WebSocket("wss://app.yalla-hack.ae/ws/ai-jobs");\nws.onopen = () => ws.send(JSON.stringify({ type: "subscribe", jobId }));\nws.onmessage = (e) => {\n  const { type, stage, message } = JSON.parse(e.data);\n  if (type === "job:progress") updateUI(stage, message);\n  if (type === "job:complete") showResults(data.result);\n};\n```',
        },
      ],
    },
    {
      id: "security-compliance",
      icon: "lock",
      title: "Seguridad y Cumplimiento",
      pages: [
        {
          id: "security-overview",
          title: "Arquitectura de Seguridad",
          summary:
            "DJAC implementa defensa en profundidad en autenticación, autorización, protección de datos e infraestructura siguiendo OWASP Top 10.",
          content:
            "### Defensa en Profundidad\n**Autenticación:**\n- Contraseñas hasheadas con bcrypt (12 rondas)\n- Tokens JWT firmados con HS256 (secreto mínimo de 64 caracteres)\n- Cookies HTTP-only, Secure, SameSite\n- MFA basado en TOTP con códigos de respaldo\n- Restablecimiento de contraseña basado en OTP (SHA-256, caducidad de 5 min)\n\n**Autorización:**\n- 7 roles de plataforma + 4 roles de organización\n- 32 módulos con permisos restringidos\n- Seguridad a nivel de fila en todas las tablas de PostgreSQL\n- Aislamiento de datos por organización\n\n**Protección de Datos:**\n- TLS 1.3 para todos los datos en tránsito\n- PostgreSQL cifrado en reposo (Supabase)\n- Secretos en variables de entorno de Vercel + GitHub Actions\n\n### Encabezados de Seguridad\n| Encabezado | Valor | Propósito |\n|--------|-------|---------|\n| Strict-Transport-Security | max-age=63072000 | Forzar HTTPS |\n| X-Content-Type-Options | nosniff | Prevención de sniffing MIME |\n| X-Frame-Options | DENY | Prevención de clickjacking |\n| Content-Security-Policy | Restringido por ruta | Mitigación de XSS |\n| Referrer-Policy | strict-origin | Fuga de referrer |\n\n### Parcheo de CVE\n- Alertas automatizadas de vulnerabilidades de Dependabot\n- Anulaciones de pnpm para parches de dependencias transitivas\n- Análisis de seguridad CodeQL en el pipeline de CI",
        },
        {
          id: "rbac-system",
          title: "Sistema RBAC y de Permisos",
          summary:
            "Permisos granulares en 32 módulos de plataforma con anulaciones de roles personalizados por organización.",
          content:
            "### Flujo de Resolución de Permisos\n1. La solicitud llega al procedimiento tRPC\n2. El middleware de autenticación extrae `ctx.user` y `ctx.orgRole`\n3. El sistema verifica la fila personalizada `rolePermissions`\n4. Recurre a `DEFAULT_ORG_ROLE_PERMISSIONS`\n5. Compara la acción con PermissionFlags\n6. Devuelve Permitir o 403 FORBIDDEN\n\n### Indicadores de Permiso\nCada módulo tiene 6 indicadores:\n- `canView` — Acceso de lectura\n- `canCreate` — Crear nuevos registros\n- `canEdit` — Modificar registros existentes\n- `canDelete` — Eliminar registros\n- `canExport` — Descargar/exportar datos\n- `canInvite` — Invitar a miembros del equipo\n\n### Plantillas Predeterminadas\n| Rol | Patrón Predeterminado |\n|------|----------------|\n| Analista | VIEW_ONLY en la mayoría de los módulos |\n| Oficial de Cumplimiento | STANDARD en cumplimiento |\n| Administrador | FULL en cumplimiento, STANDARD en configuración |\n| Propietario | FULL en todo |",
        },
      ],
    },
    {
      id: "developer-guide",
      icon: "code",
      title: "Guía para Desarrolladores",
      pages: [
        {
          id: "dev-setup",
          title: "Configuración de Desarrollo",
          summary:
            "Configura tu entorno local con Node.js 20+, pnpm 10+, Docker para Supabase y todos los servicios requeridos.",
          content:
            "### Requisitos previos\n- Node.js 20+\n- pnpm 10+ (`npm install -g pnpm@10`)\n- Docker Desktop (para Supabase)\n- Supabase CLI (`npm install -g supabase`)\n\n### Configuración inicial\n```bash\ngit clone <repo-url> djac && cd djac\npnpm install\ncp .env.example .env\nsupabase start\npnpm db:push\npnpm seed:data\npnpm dev\n# → http://localhost:3000\n```\n\n### Omisión de autenticación en desarrollo\n```env\nDEV_AUTH_BYPASS=true\nDEV_AUTH_EMAIL=dev@example.com\nDEV_AUTH_ROLE=super_admin\n```\n\n### Scripts disponibles\n| Comando | Propósito |\n|---------|---------|\n| `pnpm dev` | Iniciar servidor de desarrollo |\n| `pnpm check` | Verificación de tipos de TypeScript |\n| `pnpm lint` | ESLint |\n| `pnpm test` | Ejecutar pruebas (vitest) |\n| `pnpm build` | Compilación de producción |\n| `pnpm verify:all` | Todas las verificaciones + compilación |",
          demoSteps: [
            "Clona el repositorio e instala las dependencias con 'pnpm install'",
            "Copia .env.example a .env y completa los valores requeridos",
            "Inicia Supabase localmente con 'supabase start'",
            "Sube el esquema de la base de datos con 'pnpm db:push'",
            "Carga los datos de referencia con 'pnpm seed:data'",
            "Inicia el servidor de desarrollo con 'pnpm dev' → http://localhost:3000",
          ],
        },
        {
          id: "adding-features",
          title: "Agregar Nuevas Funcionalidades",
          summary:
            "Sigue los patrones de DJAC para agregar nuevos enrutadores tRPC, páginas de React, tablas de base de datos y pruebas.",
          content:
            '### Agregar un enrutador tRPC\n```typescript\n// server/my-feature-router.ts\nimport { orgProcedure, router } from "./_core/trpc";\nimport { z } from "zod";\n\nexport const myFeatureRouter = router({\n  list: orgProcedure\n    .input(z.object({ orgId: z.string() }))\n    .query(async ({ ctx, input }) => {\n      const db = getDb();\n      return db.select().from(myTable).where(eq(myTable.orgId, input.orgId));\n    }),\n  create: orgProcedure\n    .input(z.object({ orgId: z.string(), name: z.string() }))\n    .mutation(async ({ ctx, input }) => {\n      const [rec] = await db.insert(myTable).values(input).returning();\n      return rec;\n    }),\n});\n```\n\nRegistrar en `server/routers.ts`:\n```typescript\nimport { myFeatureRouter } from "./my-feature-router";\nexport const appRouter = router({ myFeature: myFeatureRouter });\n```\n\n### Reglas de diseño de API\n1. Todas las mutaciones usan tRPC con validación de Zod\n2. Usa `protectedProcedure` para autenticación, `orgProcedure` para alcance de organización\n3. Verifica `ctx.user.role` para autorización\n4. Nunca confíes en la entrada del cliente — siempre valida con Zod',
        },
      ],
    },
    {
      id: "deployment-operations",
      icon: "server",
      title: "Despliegue y Operaciones",
      pages: [
        {
          id: "deployment",
          title: "Opciones de Despliegue",
          summary:
            "DJAC admite Vercel (sin servidor), Docker y despliegue manual en VPS. Los pipelines de CI/CD automatizan staging y producción.",
          content:
            "### Vercel (Recomendado)\n```bash\npnpm build\nvercel --prod\nsupabase db push --linked\nsupabase functions deploy\ncurl https://your-app.com/api/health\n```\n\n### Docker\n```bash\ndocker build -t djac:latest .\ndocker run -d -p 3000:3000 --env-file .env.production --name djac-app djac:latest\n```\n\n### Pipeline de CI/CD\n| Flujo de trabajo | Disparador | Acciones |\n|----------|---------|---------|\n| CI | Push/PR | Lint, Typecheck, Test, Build |\n| Staging | Push a develop | Auto-despliegue a vista previa de Vercel |\n| Producción | Push a main | Despliegue + migración de BD + verificación de estado |\n\n### Lista de Verificación de Producción\n- [ ] JWT_SECRET ≥ 64 caracteres\n- [ ] DEV_AUTH_BYPASS=false\n- [ ] Tamaño del pool de BD: 25 conexiones\n- [ ] Redis configurado\n- [ ] Políticas RLS habilitadas\n- [ ] Seguimiento de errores de Sentry habilitado",
        },
        {
          id: "monitoring",
          title: "Monitoreo y Observabilidad",
          summary:
            "Sentry para seguimiento de errores, Pino para registro estructurado, endpoints de health/readiness para monitoreo operativo.",
          content:
            "### Endpoints de Estado\n| Endpoint | Propósito |\n|----------|---------|\n| `/api/health` | Verificación de estado (estado, tiempo de actividad) |\n| `/api/readyz` | Preparación (BD, Redis, Stripe, IA) |\n\n### Programadores en Segundo Plano\n| Programador | Intervalo | Propósito |\n|-----------|----------|---------|\n| Retención de Interacciones | 24h | Purgar registros antiguos |\n| Recordatorio de Prueba | 6h | Correos de prueba por vencer |\n| Alerta de Plazo | 1h | Notificaciones de plazos regulatorios |\n| Entrega de Informes | Config | Generación programada de informes |",
        },
        {
          id: "troubleshooting",
          title: "Solución de Problemas Comunes",
          summary:
            "Soluciones para problemas comunes de desarrollo, despliegue y operativos.",
          content:
            '### Problemas Comunes\n**Errores de conexión a BD:** Verifique `DATABASE_URL` en `.env`. Asegúrese de que Supabase esté en ejecución.\n\n**IA atascada en "queued":** Verifique la conectividad con Redis. En modo desarrollo, confirme `AI_QUEUE_MODE=in_memory`.\n\n**OpenAI 401:** `OPENAI_API_KEY` inválida.\n\n**Falla la compilación en Vercel:** Verifique las variables de entorno. Asegúrese de Node 20+. Pruebe con `pnpm build`.\n\n### Depuración\n- Registros de depuración: `LOG_LEVEL=debug pnpm dev`\n- Rastrear solicitudes: encabezado `X-Request-ID`\n- Consulte el panel de Sentry para errores',
          troubleshooting: [
            {
              problem:
                "El inicio de sesión devuelve 'Authentication required (10001)'",
              solution:
                "Verifique JWT_SECRET en .env. Borre las cookies del navegador. Verifique COOKIE_DOMAIN.",
            },
            {
              problem: "pnpm db:push falla con errores de migración",
              solution:
                "Verifique con 'supabase db status'. Use 'supabase db reset' para restablecer el entorno de desarrollo.",
            },
            {
              problem: "La compilación en Vercel falla por límite de memoria",
              solution:
                "Externalice dependencias grandes. Aumente la memoria de Node en la configuración de Vercel.",
            },
            {
              problem: "El webhook de Stripe no recibe eventos",
              solution:
                "Verifique STRIPE_WEBHOOK_SECRET. Use 'stripe listen' para pruebas locales.",
            },
          ],
        },
      ],
    },
    {
      id: "billing-plans",
      icon: "card",
      title: "Facturación y Planes",
      pages: [
        {
          id: "pricing-overview",
          title: "Resumen de Precios y Planes",
          summary:
            "Planes de suscripción flexibles para equipos de todos los tamaños, desde startups hasta empresas globales.",
          content:
            "### Comparación de Planes\n| Característica | Prueba Gratuita | Inicial | Profesional | Empresarial |\n|---------|-----------|---------|-------------|------------|\n| Jurisdicciones | 1 | 3 | 10 | Ilimitadas |\n| Proveedores | 5 | 25 | 100 | Ilimitados |\n| Evaluaciones de IA/mes | 3 | 20 | 100 | Personalizado |\n| Miembros del Equipo | 2 | 10 | 50 | Ilimitados |\n| Acceso a API | — | — | ✓ | ✓ |\n| Soporte Prioritario | — | — | ✓ | ✓ |\n| SLA | — | 99.5% | 99.9% | 99.95% |\n\n### Intervalos de Facturación\n- **Mensual** — Tarifa estándar\n- **Trimestral** — 10% de descuento\n- **Semestral** — 15% de descuento\n- **Anual** — 20% de descuento\n\n### Prueba Gratuita\n- Prueba gratuita de 14 días en el plan Inicial\n- No se requiere tarjeta de crédito\n- Acceso completo a todas las características del plan Inicial",
        },
        {
          id: "subscription-management",
          title: "Gestión de tu Suscripción",
          summary:
            "Actualiza, degrada o cancela a través del Portal de Clientes de Stripe. Consulta el historial de facturación y las facturas.",
          content:
            "### Ciclo de Vida de la Suscripción\n1. **Prueba** → Prueba automática de 14 días al registrarse\n2. **Activa** → Suscripción de pago\n3. **Vencida** → Pago fallido; período de gracia\n4. **Cancelada** → Datos retenidos durante 30 días\n\n### Actualizar / Degradar\n- **Actualizar:** Acceso inmediato. Cargos prorrateados.\n- **Degradar:** Entra en vigor al final del período de facturación.\n\n### Portal de Facturación\nAccede a través de: **Panel → Facturación y Plan → Gestionar Suscripción**\n- Actualizar método de pago\n- Ver historial de facturación\n- Descargar facturas\n- Cambiar/cancelar plan",
          troubleshooting: [
            {
              problem: "El pago falló pero la tarjeta es válida",
              solution:
                "Verifica si hay bloqueos de transacciones internacionales. Prueba con otra tarjeta o contacta a soporte.",
            },
            {
              problem: "La actualización no se refleja en el panel",
              solution:
                "Permite hasta 5 minutos para el aprovisionamiento. Intenta actualizar o cerrar y volver a iniciar sesión.",
            },
            {
              problem: "La prueba terminó pero necesitas más tiempo",
              solution:
                "Contacta a soporte para una extensión única de 7 días (una vez por organización).",
            },
          ],
        },
      ],
    },
    {
      id: "operations",
      icon: "gauge",
      title: "Operaciones Cibernéticas",
      pages: [
        {
          id: "risk-register",
          title: "Registro de Riesgos",
          summary:
            "Gestión centralizada de riesgos con puntuación automatizada de severidad, planificación de tratamiento y vinculación con marcos normativos.",
          content:
            "### Flujo de Trabajo de Gestión de Riesgos\n1. **Identificar** — Registrar riesgos con categoría y probabilidad/impacto\n2. **Evaluar** — Puntuación automatizada de riesgos (probabilidad × impacto)\n3. **Tratar** — Aceptar, Mitigar, Transferir o Evitar\n4. **Vincular** — Conectar riesgos con proveedores, marcos normativos y tareas\n5. **Monitorear** — Seguimiento del estado y del progreso del tratamiento\n\n### Categorías de Riesgos\n- **Operacional** — Fallos de procesos, interrupciones del sistema\n- **Legal** — Incumplimiento normativo, violaciones contractuales\n- **Técnico** — Vulnerabilidades de seguridad, debilidades de arquitectura\n- **Financiero** — Excesos presupuestarios, exposición al fraude\n- **Reputacional** — Daño a la marca, erosión de la confianza del cliente",
        },
        {
          id: "incident-management",
          title: "Gestión de Incidentes",
          summary:
            "Registrar, dar seguimiento y resolver incidentes de seguridad y cumplimiento con mapeo normativo automatizado.",
          content:
            "### Ciclo de Vida del Incidente\n1. **Detección** — Registrar incidente con tipo, severidad, sistemas afectados\n2. **Triaje** — Clasificación automatizada de severidad\n3. **Investigación** — Seguimiento de la línea de tiempo con evidencia\n4. **Contención** — Seguimiento de acciones, notificación\n5. **Resolución** — Análisis de causa raíz, documentos de remediación\n6. **Cierre** — Revisión posterior al incidente\n\n### Mapeo Normativo Automatizado\n- Brecha de datos en China → PIPL Art. 57 (72h a la CAC)\n- Brecha de datos en la UE → GDPR Art. 33 (72h a la DPA)\n- Incidente de seguridad → Implicaciones multi-marco identificadas",
        },
      ],
    },
    {
      id: "case-studies",
      icon: "star",
      title: "Casos de Estudio",
      pages: [
        {
          id: "enterprise-expansion",
          title: "Expansión Transfronteriza Empresarial",
          summary:
            "Cómo un fabricante Fortune 500 utilizó DJAC para lograr el cumplimiento en China, Arabia Saudita y la UE para más de 50 proveedores.",
          content:
            "### Antecedentes\nUn fabricante global con ingresos superiores a $2 mil millones necesitaba expandirse a China, Arabia Saudita y la UE con 53 proveedores en 12 países.\n\n### Desafío\n- 53 proveedores, 3 nuevas jurisdicciones, plazo de 90 días\n- Evaluación manual: más de 6 meses, más de $500K en honorarios de consultoría\n\n### Solución DJAC\n1. **Semana 1-2**: Registró los 53 proveedores\n2. **Semana 2-3**: Ejecutó evaluaciones de IA para PIPL, PDPL, GDPR\n3. **Semana 3-4**: Análisis de brechas entre marcos — se encontraron 312 brechas\n4. **Semana 4-8**: El planificador de remediación rastreó el cierre de brechas\n5. **Semana 8-12**: El monitoreo continuo confirmó el cumplimiento total\n\n### Resultados\n- ✅ Cumplimiento total en 82 días (vs. estimación de 180 días)\n- ✅ 312 brechas identificadas, 298 cerradas en 60 días\n- ✅ Ahorró $380K en honorarios de consultoría\n- ✅ Reducción del 70% en costos de monitoreo continuo\n- ✅ Cero hallazgos en las primeras auditorías regulatorias",
        },
        {
          id: "saas-startup",
          title: "Cumplimiento Rápido para Startup SaaS",
          summary:
            "Cómo una startup de 15 personas logró la preparación para SOC 2 y GDPR en 30 días usando DJAC.",
          content:
            "### Antecedentes\nUna startup Serie A con 15 empleados necesitaba SOC 2 Tipo II y cumplimiento de GDPR para cerrar acuerdos empresariales.\n\n### Desafío\n- Sin programa de cumplimiento existente\n- 7 proveedores de nube para evaluar\n- Presupuesto de $5K/mes para cumplimiento\n\n### Solución DJAC\n1. Incorporó al equipo, configuró el perfil de la organización\n2. Seleccionó SOC 2 + GDPR con controles recomendados por IA\n3. Registró los 7 proveedores, ejecutó evaluaciones\n4. Generó plantillas de políticas desde el gestor de políticas\n5. Verificaciones continuas durante la revisión del auditor\n\n### Resultados\n- ✅ SOC 2 Tipo II entregado en 28 días\n- ✅ Programa GDPR establecido en 30 días\n- ✅ Cerró 3 acuerdos empresariales ($480K ARR)\n- ✅ Costo de cumplimiento continuo por debajo de $250/mes",
        },
      ],
    },
  ],
  de: [
    {
      id: "getting-started",
      icon: "book",
      title: "Erste Schritte",
      pages: [
        {
          id: "welcome",
          title: "Willkommen bei DJAC",
          summary:
            "DJAC ist die weltweit erste KI-gestützte Compliance-Intelligence-Plattform für mehrere Jurisdiktionen. In Minuten bereitgestellt und regulatorische Compliance in ${COVERAGE.jurisdictions} Jurisdiktionen erreicht.",
          content:
            "### Was ist DJAC?\nDJAC (De Jure Automated Compliance) ist eine Enterprise-SaaS-Plattform, die regulatorische Compliance über Jurisdiktionen hinweg automatisiert — China, Saudi-Arabien, die GCC, die EU, Nordamerika und APAC.\n\n> **info** Entwickelt für Compliance-Beauftragte, Rechtsteams, Unternehmensadministratoren, Berater und staatliche Regulierungsbehörden.\n\n### Warum DJAC?\n- **30 Jurisdiktionen** — PIPL, PDPL, CSL, DSL, GDPR, ISO 27001, SOC 2, NIST CSF, HIPAA und mehr\n- **KI-gestützte Analyse** — DeepSeek-basierte 8-stufige Compliance-Bewertungspipeline\n- **Echtzeitüberwachung** — Kontinuierliche Compliance-Verfolgung mit automatisierter Lückenerkennung\n- **Grenzüberschreitende Intelligence** — Compliance-Prüfer für Datenübertragungen und Überwachung regulatorischer Änderungen\n- **Lieferantenrisikomanagement** — Automatisierte Bewertungen Dritter über alle ausgewählten Frameworks hinweg\n- **Sicherheit auf Unternehmensniveau** — AES-256-Verschlüsselung, RBAC, Audit-Trails, SOC 2 bereit\n\n> **tip** Die DJAC-Oberfläche ist in 9 Sprachen verfügbar — wechseln Sie jederzeit über das Sprachmenü in der Kopfzeile. Diese Dokumentation wird auf Englisch, Arabisch und Chinesisch veröffentlicht; andere Oberflächensprachen sehen hier die englische Version.\n\n### Schnellstart (5 Minuten)\n1. **Erstellen Sie Ihre Organisation** — Richten Sie Ihr Unternehmensprofil und Ihre Abrechnung ein\n2. **Wählen Sie Jurisdiktionen** — Wählen Sie China, Saudi-Arabien, EU oder eine beliebige Kombination\n3. **Wählen Sie Frameworks** — Die KI empfiehlt automatisch relevante Vorschriften\n4. **Registrieren Sie einen Lieferanten** — Fügen Sie Ihren ersten Drittanbieter hinzu\n5. **Führen Sie eine Bewertung durch** — Die KI erstellt in unter 60 Sekunden einen vollständigen Compliance-Bericht\n\n> **tip** Der Onboarding-Assistent führt Sie durch diesen gesamten Ablauf — suchen Sie ihn nach der Anmeldung in Ihrem Dashboard.\n\n### Plattform-Stufen\n| Stufe | Monatlich | Am besten für |\n|------|---------|----------|\n| Starter | Ab 99 $/Monat | Kleine Teams, einzelne Jurisdiktion |\n| Professional | Ab 249 $/Monat | Compliance in mehreren Jurisdiktionen |\n| Enterprise | Individuell | Globale Unternehmen, API, dedizierter Support |\n\n> **faq** Wie lange dauert eine KI-Lieferantenbewertung?\n> **answer** Die meisten Bewertungen sind in unter 60 Sekunden abgeschlossen und streamen den Live-Fortschritt über den WebSocket, während jede der 8 Pipeline-Stufen abgeschlossen wird.\n> **faq** Welche Vorschriften werden sofort unterstützt?\n> **answer** 46 Frameworks mit vollständigen Details auf Kontrollebene sowie 107 kuratierte Framework-Pakete in 30 Jurisdiktionen — darunter GDPR, NIS2, DORA, PIPL, PDPL, ISO 27001, SOC 2 und mehr. Die KI-Engine empfiehlt automatisch die für Ihr Profil relevanten.\n> **faq** Kann DJAC auf unserer eigenen Infrastruktur laufen?\n> **answer** Ja — neben dem Vercel-Cloud-Hosting wird auch ein selbstgehostetes Docker-Deployment unterstützt, und die Plattform kann mit benutzerdefinierten Frameworks erweitert werden.",
        },
        {
          id: "architecture",
          title: "Plattformarchitektur",
          summary:
            "DJAC läuft auf einer cloud-nativen Architektur mit React 19, Express + tRPC, PostgreSQL auf Supabase, Redis und Google DeepSeek.",
          content:
            "### Systemarchitektur\nDJAC verwendet eine moderne Monorepo-Architektur:\n\n**Frontend**: React 19 + TypeScript + Vite 7 + Tailwind CSS 4 + shadcn/ui  \n**Backend**: Express 4 + tRPC 11 (200+ API-Prozeduren) + Drizzle ORM  \n**Datenbank**: PostgreSQL 17 auf Supabase (AWS Tokio, ap-northeast-2)  \n**KI-Engine**: Google DeepSeek mit 8-stufiger Bewertungspipeline  \n**Warteschlange**: In-Memory / Redis (BullMQ-bereit)  \n**Authentifizierung**: Dreifacher Pfad (Clerk OAuth + Supabase Auth + Local JWT)  \n**Abrechnung**: Stripe (5 Pläne × 4 Intervalle)  \n**Hosting**: Vercel (serverlos) + Docker\n\n### Datenfluss\n1. Benutzer übermittelt Anfrage zur Lieferantenbewertung\n2. Gatekeeper validiert Eingaben (Injection-Erkennung)\n3. Intake parst Dokumente und normalisiert Text\n4. Extractor identifiziert strukturierte Fakten (Key-Value-Evidence-Triples)\n5. RAG Context ruft relevante Compliance-Kontrollen aus der DB ab\n6. Judge (DeepSeek) bewertet Compliance anhand der Kontrollen\n7. Synthesizer führt Ergebnisse zu einem frameworkübergreifenden Bericht zusammen\n8. Validator stellt Schema-Konsistenz und Datenintegrität sicher\n9. Reporter erzeugt die endgültige formatierte Ausgabe (PDF/DOCX/JSON)",
          diagram:
            "[User] → [Gatekeeper] → [Intake] → [Extractor] → [RAG] → [Judge (DeepSeek)] → [Synthesizer] → [Validator] → [Reporter] → [PDF / DOCX / JSON]",
        },
        {
          id: "roles",
          title: "Rollen & Berechtigungen",
          summary:
            "DJAC bietet granulare rollenbasierte Zugriffskontrolle mit 6 Plattformrollen und 4 Organisationsrollen über 30+ Module.",
          content:
            "### Plattformrollen\n| Rolle | Ebene | Zugriff |\n|------|-------|--------|\n| Basic User | 10 | Nur-Lese-Zugriff auf zugewiesene Module |\n| Professional User | 20 | Vollzugriff auf Compliance-Funktionen |\n| Company Admin | 30 | Organisationsverwaltung + Team |\n| Platform Admin | 40 | Organisationsübergreifende Aufsicht und Konfiguration |\n| Yalla Hack Employee | 45 | Interner Support und Betrieb |\n| Super Admin | 100 | Uneingeschränkter Vollzugriff auf die Plattform |\n\n### Organisationsrollen\n| Rolle | Ebene | Fähigkeiten |\n|------|-------|-------------|\n| Analyst | 10 | Nur Ansicht bei den meisten Modulen |\n| Compliance Officer | 20 | Compliance-Daten erstellen/bearbeiten |\n| Admin | 30 | Teamverwaltung + API-Schlüssel |\n| Owner | 40 | Abrechnung + Organisationseinstellungen + Vollzugriff |\n\n> **tip** Sie können Berechtigungen pro Modul und Rolle anpassen — die Standardwerte sind nur Ausgangspunkte.\n\n### Berechtigungsmodell\nJedes der 30+ Module hat 6 Berechtigungsflags:\n- `canView` — Lesezugriff\n- `canCreate` — Neue Datensätze erstellen\n- `canEdit` — Bestehende Datensätze ändern\n- `canDelete` — Datensätze entfernen\n- `canExport` — Daten herunterladen/exportieren\n- `canInvite` — Teammitglieder einladen",
        },
      ],
    },
    {
      id: "ai-engine",
      icon: "zap",
      title: "KI-Compliance-Engine",
      pages: [
        {
          id: "ai-overview",
          title: "Überblick über die KI-Engine",
          summary:
            "Die 8-stufige KI-Pipeline von DJAC nutzt DeepSeek, um die Compliance von Anbietern gleichzeitig über mehrere Frameworks hinweg zu bewerten.",
          content:
            "### Die 8-stufige Pipeline\n1. **Gatekeeper** — Eingabevalidierung, Injection-Erkennung, Datenbereinigung\n2. **Intake** — Dokumentenparsing, Textnormalisierung, Spracherkennung\n3. **Extractor** — Strukturierte Faktenextraktion in Schlüssel-Wert-Evidenz-Tripel\n4. **RAG-Kontext** — Retrieval-Augmented Generation: ruft relevante Compliance-Kontrollen aus PostgreSQL ab\n5. **Judge (DeepSeek)** — Bewertet jeden Fakt gegen die anwendbaren Kontrollanforderungen\n6. **Synthesizer** — Führt Ergebnisse zusammen, erstellt frameworkübergreifenden Vergleich\n7. **Validator** — Schema-Validierung, feldübergreifende Konsistenz, Wiederholung bei Fehler\n8. **Reporter** — Endgültige formatierte Ausgabe in PDF, DOCX oder JSON\n\n> **info** Jede Stufe protokolliert ihren Fortschritt im WebSocket-Kanal, sodass Sie Bewertungen in Echtzeit verfolgen können.\n\n### KI-Funktionen\n- **Automatisierte Gap-Analyse** — Identifiziert fehlende Kontrollen und Nicht-Compliance-Bereiche\n- **Risikobewertung (0-100)** — Framework-spezifische und aggregierte Compliance-Werte\n- **Empfehlungen zur Behebung** — KI-vorgeschlagene Maßnahmen, nach Priorität geordnet\n- **Strafenschätzung** — Berechnet mögliche Bußgelder basierend auf der Gerichtsbarkeit\n- **Gerichtsbarkeitsübergreifender Vergleich** — Side-by-Side-Analyse der Framework-Abdeckung\n- **Echtzeit-Job-Streaming** — WebSocket-basierte Fortschrittsverfolgung während der Bewertungen",
        },
        {
          id: "rag-system",
          title: "RAG-Kontextsystem",
          summary:
            "Das Retrieval-Augmented-Generation-System ruft die relevantesten Compliance-Kontrollen aus der Datenbank ab, bevor die KI-Analyse durchgeführt wird.",
          content:
            "### Wie RAG funktioniert\n1. **Dokumentenparsing** — Extrahierte Fakten aus Anbieterdokumenten\n2. **Semantische Suche** — Gleicht Fakten mit über 1.000 Compliance-Kontrollen ab\n3. **Relevanzbewertung** — Ordnet Kontrollen nach gerichtsbarkeits- und themenbezogener Relevanz\n4. **Kontextzusammenstellung** — Erstellt ein fokussiertes Kontextfenster für DeepSeek\n5. **Fundierte Antwort** — KI bewertet AUSSCHLIESSLICH auf Basis der abgerufenen Kontrollen (keine Halluzination)\n\n### Vorteile\n- Eliminiert KI-Halluzinationen in Compliance-Beratung\n- Stellt framework-spezifische Empfehlungen sicher\n- Führt Audit-Trail der Zuordnungen von Kontrollen zu Feststellungen\n- Unterstützt 30 Gerichtsbarkeiten mit gerichtsbarkeitsspezifischen Kontrollen\n\n> **tip** Das RAG-System macht DJAC rechtlich zuverlässig — es rät nie über regulatorische Anforderungen.\n\n### Wissensdatenbank\n- 46 regulatorische Frameworks\n- Über 1.000 Compliance-Kontrollen\n- Über 14 frameworkübergreifende Beziehungstypen\n- Globaler Standards-Cluster: ISO 27001, NIST CSF, SOC 2, HIPAA, PCI DSS",
        },
      ],
    },
    {
      id: "frameworks",
      icon: "shield",
      title: "Compliance-Frameworks",
      pages: [
        {
          id: "jurisdictions",
          title: "Unterstützte Jurisdiktionen",
          summary:
            "DJAC deckt 30 Jurisdiktionen in APAC, EMEA, Nordamerika und Afrika mit umfassenden regulatorischen Frameworks ab.",
          content:
            "### APAC-Region\n- **China** — PIPL, CSL, DSL, MLPS 2.0\n- **Japan** — APPI\n- **Südkorea** — PIPA\n- **Singapur** — PDPA\n- **Indien** — DPDP Act\n- **Australien** — Privacy Act 1988\n\n### Naher Osten / GCC\n- **Saudi-Arabien** — PDPL, NCA ECC / CSCC / OCC\n- **VAE** — UAE PDPL\n- **Katar** — Qatar PDPPL\n- **Bahrain** — Bahrain PDPL\n- **Kuwait** — Kuwait DPA\n- **Oman** — Oman PDPL\n\n### Europa\n- **EU/EWR** — GDPR, NIS2 Directive, DORA\n- **Vereinigtes Königreich** — UK GDPR / DPA 2018\n\n### Nordamerika\n- **Vereinigte Staaten** — HIPAA, CCPA/CPRA, SOX, PCI DSS\n- **Kanada** — PIPEDA\n\n### Globale Standards\n- ISO 27001 / 27002\n- NIST Cybersecurity Framework (CSF)\n- SOC 2 Type II\n- PCI DSS v4.0",
        },
        {
          id: "pipl-guide",
          title: "PIPL-Compliance-Leitfaden",
          summary:
            "Umfassender Leitfaden zum chinesischen Gesetz zum Schutz personenbezogener Daten (PIPL), einschließlich Datenlokalisierung und grenzüberschreitender Übermittlungsregeln.",
          content:
            "### PIPL-Überblick\nChinas Gesetz zum Schutz personenbezogener Daten (PIPL) trat am 1. November 2021 in Kraft. Es regelt, wie Organisationen personenbezogene Daten von Personen in China erheben, verwenden, speichern und übermitteln.\n\n> **warning** Verstöße gegen PIPL können mit Geldstrafen von bis zu 50 Millionen RMB (~7 Mio. USD) oder 5 % des Jahresumsatzes geahndet werden.\n\n### Wichtige Anforderungen\n1. **Einwilligung** — Ausdrückliche, informierte Einwilligung zur Datenerhebung\n2. **Datenminimierung** — Nur das erheben, was notwendig ist\n3. **Zweckbindung** — Daten nur für festgelegte Zwecke verwenden\n4. **Datenlokalisierung** — CIIOs müssen Daten in China speichern\n5. **Grenzüberschreitende Übermittlung** — CAC-Sicherheitsbewertung erforderlich\n6. **DPIAs** — Folgenabschätzungen vor risikoreicher Verarbeitung\n7. **Betroffenenrechte** — Auskunft, Berichtigung, Löschung, Übertragbarkeit\n8. **Meldung von Datenschutzverletzungen** — Meldung innerhalb von 72 Stunden\n\n### Wie DJAC hilft\n- Automatisierte PIPL-Kontrollzuordnung (alle 72 Artikel)\n- Bewertung grenzüberschreitender Übermittlungen mit CAC-Leitfaden\n- Lieferantenrisikobewertung gegen PIPL-Anforderungen\n- Kontinuierliche Überwachung regulatorischer Aktualisierungen\n- Strafrechner basierend auf Umsatz und Schwere des Verstoßes",
          caseStudy: {
            company: "Europäisches SaaS-Unternehmen",
            challenge:
              "Musste in China starten und gleichzeitig GDPR-Compliance aufrechterhalten. Benötigte PIPL-Lückenanalyse für 12 Lieferanten, die chinesische Nutzerdaten verarbeiten.",
            solution:
              "Verwendete das PIPL-Modul von DJAC, um alle 12 Lieferanten gleichzeitig zu bewerten. Erstellte einen frameworkübergreifenden Bericht, der Überschneidungen und Lücken zwischen GDPR- und PIPL-Abdeckung aufzeigt.",
            results:
              "Identifizierte 47 Compliance-Lücken bei Lieferanten. Erreichte vollständige PIPL-Compliance innerhalb von 6 Wochen. Reduzierte Rechtsberatungskosten um 60 %.",
          },
        },
      ],
    },
    {
      id: "vendor-risk",
      icon: "building",
      title: "Lieferantenrisikomanagement",
      pages: [
        {
          id: "vendor-assessment",
          title: "Lieferanten-Compliance-Bewertung",
          summary:
            "Automatisieren Sie Compliance-Bewertungen von Drittanbietern über alle ausgewählten Frameworks hinweg mit KI-gestützter Analyse und Gap-Berichten.",
          content:
            "### Automatisierte Lieferantenbewertung\n1. **Lieferant registrieren** — Fügen Sie Name, Branche, Gerichtsbarkeit und Tech-Stack des Lieferanten hinzu\n2. **Frameworks auswählen** — Wählen Sie anwendbare regulatorische Frameworks aus\n3. **Nachweise hochladen** — Fügen Sie Lieferantenrichtlinien, Zertifizierungen, Prüfberichte bei\n4. **Bewertung durchführen** — KI analysiert den Lieferanten anhand aller ausgewählten Frameworks\n5. **Ergebnisse überprüfen** — Detaillierte Gap-Analyse mit Risikobewertung (0-100)\n6. **Bericht exportieren** — Professioneller PDF/DOCX-Bericht für Stakeholder\n\n### Bewertungsergebnis\n- **Gesamtpunktzahl** — Gewichteter Durchschnitt über alle Frameworks (0-100)\n- **Punkte pro Framework** — Individuelle Compliance-Punkte\n- **Risikostufe** — Kritisch / Hoch / Mittel / Niedrig\n- **Gap-Analyse** — Spezifische nicht konforme Kontrollen mit Schweregrad\n- **Sanierungsplan** — Priorisierte Maßnahmen mit Fristen\n- **Strafkontext** — Anwendbare Bußgelder pro Gerichtsbarkeit pro Gap\n\n### Kontinuierliche Überwachung\nDJAC bewertet Lieferanten automatisch in konfigurierbaren Intervallen neu und benachrichtigt Sie über:\n- Neue regulatorische Anforderungen, die bestehende Lieferanten betreffen\n- Änderungen im Risikoprofil des Lieferanten\n- Ablaufende Zertifizierungen oder Prüfberichte\n- Neue Bedrohungen im Zusammenhang mit der Gerichtsbarkeit des Lieferanten",
          bestPractices: [
            "Bewerten Sie Lieferanten VOR der Vertragsunterzeichnung, nicht danach",
            "Richten Sie vierteljährliche Neubewertungspläne für Hochrisiko-Lieferanten ein",
            "Nutzen Sie den gerichtsbarkeitsübergreifenden Vergleich, um Framework-Überschneidungen zu identifizieren",
            "Dokumentieren Sie alle Lieferantenantworten auf Bewertungsergebnisse",
            "Verknüpfen Sie Lieferanten-Gaps mit Ihrem internen Risikoregister für Rückverfolgbarkeit",
          ],
        },
        {
          id: "supplier-profiles",
          title: "Lieferanten-Compliance-Profile",
          summary:
            "Erstellen Sie umfassende Lieferantenprofile mit gerichtsbarkeitsspezifischen Daten, Tech-Stack-Analyse und Kontaktverwaltung.",
          content:
            "### Profilkomponenten\n- **Basisinformationen** — Name, Branche, Website, Gerichtsbarkeit\n- **Tech-Stack** — Technologiekomponenten mit Versionsverfolgung\n- **Kontakte** — Schlüsselpersonal mit Rollen- und Gerichtsbarkeitszuweisung\n- **Risikostufe** — Automatisierte Risikoklassifizierung basierend auf Datenverarbeitung\n- **Bewertungsverlauf** — Vollständige Zeitleiste aller Compliance-Bewertungen\n- **Dokumenten-Repository** — Nachweise, Zertifizierungen, Richtlinien\n\n### Risikoeinstufung\nDJAC berechnet automatisch die Risikostufen von Lieferanten:\n- **Kritisch** — Verarbeitet personenbezogene/sensible Daten, tätig in stark regulierten Gerichtsbarkeiten\n- **Hoch** — Verarbeitet regulierte Daten, grenzüberschreitende Datenflüsse\n- **Mittel** — Begrenzte Datenexposition, standardmäßige regulatorische Anforderungen\n- **Niedrig** — Minimales Risikoprofil, keine Verarbeitung sensibler Daten",
        },
      ],
    },
    {
      id: "api-integration",
      icon: "terminal",
      title: "API & Integration",
      pages: [
        {
          id: "api-reference",
          title: "API-Referenz",
          summary:
            "DJAC stellt eine typsichere tRPC-API mit über 200 Prozeduren über 42 Router bereit, plus REST-Endpunkte für Webhooks und Health Checks.",
          content:
            "### API-Übersicht\nDJAC verwendet **tRPC** für durchgängig typsichere API-Operationen. Alle Prozeduren laufen über `POST /api/trpc` mit Batch-Unterstützung.\n\n**Basis-URLs:**\n- Produktion: `https://app.yalla-hack.ae`\n- Lokal: `http://localhost:3000`\n\n### Authentifizierungsmethoden\n| Methode | Header | Anwendungsfall |\n|--------|--------|----------|\n| Session-Cookie | `app_session_id`-Cookie | Web-App (Standard) |\n| API-Schlüssel | `x-djac-api-key: djac_<hex>` | Programmatischer Zugriff |\n| Clerk OAuth | Automatisch verwaltet | Externes OAuth |\n\n### Router-Kategorien\n| Domäne | Router | Wichtige Prozeduren |\n|--------|---------|----------------|\n| Auth | `localAuth`, `auth`, `googleAuth` | register, login, mfa |\n| Organisation | `orgSettings`, `orgMembers` | create, invite, updateRole |\n| RBAC | `role`, `rbac` | getPermissions, setPermissions |\n| Compliance | `compliance`, `regulatoryChanges` | frameworks.list, controls.get |\n| Anbieter | `vendor`, `vendorCompliance` | list, create, assess |\n| Risiko | `riskRegister`, `remediation` | list, create, update |\n| KI | `ai` | startAssessment, getJob |\n| Berichte | `complianceReport` | generate, download, schedule |\n| Abrechnung | `billing` | getPlans, checkout |\n| Admin | `admin`, `system` | getStats, getAuditLogs |\n\n### Fehlercodes\n| Code | Beschreibung |\n|------|-------------|\n| `UNAUTHORIZED` | Authentifizierung erforderlich |\n| `FORBIDDEN` | Unzureichende Berechtigungen |\n| `NOT_FOUND` | Ressource nicht gefunden |\n| `VALIDATION_ERROR` | Eingabevalidierung fehlgeschlagen |\n| `RATE_LIMITED` | Zu viele Anfragen |",
        },
        {
          id: "websocket",
          title: "WebSocket-Streaming",
          summary:
            "Der Echtzeit-Fortschritt der KI-Bewertung wird über WebSocket unter /ws/ai-jobs mit Job-Lebenszyklusereignissen gestreamt.",
          content:
            '### WebSocket-Endpunkt\n**URL:** `wss://app.yalla-hack.ae/ws/ai-jobs`\n\n### Ereignistypen\n| Ereignis | Richtung | Nutzlast |\n|-------|-----------|---------|\n| `job:progress` | Server → Client | `{ jobId, stage, message, progress }` |\n| `job:complete` | Server → Client | `{ jobId, result }` |\n| `job:error` | Server → Client | `{ jobId, error: string }` |\n| `subscribe` | Client → Server | `{ jobId: string }` |\n\n### Beispiel\n```typescript\nconst ws = new WebSocket("wss://app.yalla-hack.ae/ws/ai-jobs");\nws.onopen = () => ws.send(JSON.stringify({ type: "subscribe", jobId }));\nws.onmessage = (e) => {\n  const { type, stage, message } = JSON.parse(e.data);\n  if (type === "job:progress") updateUI(stage, message);\n  if (type === "job:complete") showResults(data.result);\n};\n```',
        },
      ],
    },
    {
      id: "security-compliance",
      icon: "lock",
      title: "Sicherheit & Compliance",
      pages: [
        {
          id: "security-overview",
          title: "Sicherheitsarchitektur",
          summary:
            "DJAC implementiert Defense-in-Depth über Authentifizierung, Autorisierung, Datenschutz und Infrastruktur gemäß OWASP Top 10.",
          content:
            "### Defense-in-Depth\n**Authentifizierung:**\n- Passwörter mit bcrypt gehasht (12 Runden)\n- JWT-Tokens mit HS256 signiert (mind. 64-Zeichen-Secret)\n- HTTP-only, Secure, SameSite Cookies\n- TOTP-basierte MFA mit Backup-Codes\n- OTP-basierter Passwort-Reset (SHA-256, 5-Min-Ablauf)\n\n**Autorisierung:**\n- 7 Plattformrollen + 4 Organisationsrollen\n- 32 berechtigungsgesteuerte Module\n- Row-Level Security auf allen PostgreSQL-Tabellen\n- Organisationsbezogene Datenisolierung\n\n**Datenschutz:**\n- TLS 1.3 für alle Daten während der Übertragung\n- PostgreSQL verschlüsselt im Ruhezustand (Supabase)\n- Secrets in Vercel env vars + GitHub Actions\n\n### Sicherheits-Header\n| Header | Wert | Zweck |\n|--------|-------|---------|\n| Strict-Transport-Security | max-age=63072000 | HTTPS erzwingen |\n| X-Content-Type-Options | nosniff | MIME-Sniffing verhindern |\n| X-Frame-Options | DENY | Clickjacking verhindern |\n| Content-Security-Policy | Eingeschränkt pro Route | XSS-Minderung |\n| Referrer-Policy | strict-origin | Referrer-Leakage |\n\n### CVE-Patching\n- Dependabot automatisierte Schwachstellenwarnungen\n- pnpm overrides für transitive Abhängigkeits-Patches\n- CodeQL-Sicherheitsanalyse in der CI-Pipeline",
        },
        {
          id: "rbac-system",
          title: "RBAC & Berechtigungssystem",
          summary:
            "Granulare Berechtigungen über 32 Plattformmodule mit benutzerdefinierten Rollenüberschreibungen pro Organisation.",
          content:
            "### Berechtigungsauflösungsablauf\n1. Anfrage erreicht tRPC-Prozedur\n2. Auth-Middleware extrahiert `ctx.user` und `ctx.orgRole`\n3. System prüft benutzerdefinierte `rolePermissions`-Zeile\n4. Fällt auf `DEFAULT_ORG_ROLE_PERMISSIONS` zurück\n5. Vergleicht Aktion mit PermissionFlags\n6. Gibt Allow oder 403 FORBIDDEN zurück\n\n### Berechtigungsflags\nJedes Modul hat 6 Flags:\n- `canView` — Lesezugriff\n- `canCreate` — Neue Datensätze erstellen\n- `canEdit` — Bestehende Datensätze ändern\n- `canDelete` — Datensätze entfernen\n- `canExport` — Daten herunterladen/exportieren\n- `canInvite` — Teammitglieder einladen\n\n### Standardvorlagen\n| Rolle | Standardmuster |\n|------|----------------|\n| Analyst | VIEW_ONLY auf den meisten Modulen |\n| Compliance Officer | STANDARD auf Compliance |\n| Admin | FULL auf Compliance, STANDARD auf Einstellungen |\n| Owner | FULL auf alles |",
        },
      ],
    },
    {
      id: "developer-guide",
      icon: "code",
      title: "Entwicklerhandbuch",
      pages: [
        {
          id: "dev-setup",
          title: "Entwicklungsumgebung einrichten",
          summary:
            "Richten Sie Ihre lokale Umgebung mit Node.js 20+, pnpm 10+, Docker für Supabase und allen erforderlichen Diensten ein.",
          content:
            "### Voraussetzungen\n- Node.js 20+\n- pnpm 10+ (`npm install -g pnpm@10`)\n- Docker Desktop (für Supabase)\n- Supabase CLI (`npm install -g supabase`)\n\n### Ersteinrichtung\n```bash\ngit clone <repo-url> djac && cd djac\npnpm install\ncp .env.example .env\nsupabase start\npnpm db:push\npnpm seed:data\npnpm dev\n# → http://localhost:3000\n```\n\n### Dev-Auth-Bypass\n```env\nDEV_AUTH_BYPASS=true\nDEV_AUTH_EMAIL=dev@example.com\nDEV_AUTH_ROLE=super_admin\n```\n\n### Verfügbare Skripte\n| Befehl | Zweck |\n|---------|---------|\n| `pnpm dev` | Entwicklungsserver starten |\n| `pnpm check` | TypeScript-Typprüfung |\n| `pnpm lint` | ESLint |\n| `pnpm test` | Tests ausführen (vitest) |\n| `pnpm build` | Produktions-Build |\n| `pnpm verify:all` | Alle Prüfungen + Build |",
          demoSteps: [
            "Klonen Sie das Repository und installieren Sie die Abhängigkeiten mit 'pnpm install'",
            "Kopieren Sie .env.example nach .env und füllen Sie die erforderlichen Werte aus",
            "Starten Sie Supabase lokal mit 'supabase start'",
            "Übertragen Sie das Datenbankschema mit 'pnpm db:push'",
            "Befüllen Sie Referenzdaten mit 'pnpm seed:data'",
            "Starten Sie den Entwicklungsserver mit 'pnpm dev' → http://localhost:3000",
          ],
        },
        {
          id: "adding-features",
          title: "Neue Funktionen hinzufügen",
          summary:
            "Folgen Sie den Mustern von DJAC, um neue tRPC-Router, React-Seiten, Datenbanktabellen und Tests hinzuzufügen.",
          content:
            '### Einen tRPC-Router hinzufügen\n```typescript\n// server/my-feature-router.ts\nimport { orgProcedure, router } from "./_core/trpc";\nimport { z } from "zod";\n\nexport const myFeatureRouter = router({\n  list: orgProcedure\n    .input(z.object({ orgId: z.string() }))\n    .query(async ({ ctx, input }) => {\n      const db = getDb();\n      return db.select().from(myTable).where(eq(myTable.orgId, input.orgId));\n    }),\n  create: orgProcedure\n    .input(z.object({ orgId: z.string(), name: z.string() }))\n    .mutation(async ({ ctx, input }) => {\n      const [rec] = await db.insert(myTable).values(input).returning();\n      return rec;\n    }),\n});\n```\n\nIn `server/routers.ts` registrieren:\n```typescript\nimport { myFeatureRouter } from "./my-feature-router";\nexport const appRouter = router({ myFeature: myFeatureRouter });\n```\n\n### API-Design-Regeln\n1. Alle Mutationen verwenden tRPC mit Zod-Validierung\n2. Verwenden Sie `protectedProcedure` für authentifizierte und `orgProcedure` für organisationsbezogene Vorgänge\n3. Prüfen Sie `ctx.user.role` für die Autorisierung\n4. Vertrauen Sie niemals Client-Eingaben — validieren Sie immer mit Zod',
        },
      ],
    },
    {
      id: "deployment-operations",
      icon: "server",
      title: "Bereitstellung & Betrieb",
      pages: [
        {
          id: "deployment",
          title: "Bereitstellungsoptionen",
          summary:
            "DJAC unterstützt Vercel (serverlos), Docker und manuelle VPS-Bereitstellung. CI/CD-Pipelines automatisieren Staging und Produktion.",
          content:
            "### Vercel (Empfohlen)\n```bash\npnpm build\nvercel --prod\nsupabase db push --linked\nsupabase functions deploy\ncurl https://your-app.com/api/health\n```\n\n### Docker\n```bash\ndocker build -t djac:latest .\ndocker run -d -p 3000:3000 --env-file .env.production --name djac-app djac:latest\n```\n\n### CI/CD-Pipeline\n| Workflow | Auslöser | Aktionen |\n|----------|---------|---------|\n| CI | Push/PR | Lint, Typecheck, Test, Build |\n| Staging | Push zu develop | Automatische Bereitstellung auf Vercel-Vorschau |\n| Produktion | Push zu main | Bereitstellung + DB-Migration + Health-Check |\n\n### Produktions-Checkliste\n- [ ] JWT_SECRET ≥ 64 Zeichen\n- [ ] DEV_AUTH_BYPASS=false\n- [ ] DB-Pool-Größe: 25 Verbindungen\n- [ ] Redis konfiguriert\n- [ ] RLS-Richtlinien aktiviert\n- [ ] Sentry-Fehlerverfolgung aktiviert",
        },
        {
          id: "monitoring",
          title: "Überwachung & Observability",
          summary:
            "Sentry zur Fehlerverfolgung, Pino für strukturiertes Logging, Health-/Readiness-Endpunkte für die betriebliche Überwachung.",
          content:
            "### Health-Endpunkte\n| Endpunkt | Zweck |\n|----------|---------|\n| `/api/health` | Health-Check (Status, Uptime) |\n| `/api/readyz` | Readiness (DB, Redis, Stripe, AI) |\n\n### Hintergrund-Scheduler\n| Scheduler | Intervall | Zweck |\n|-----------|----------|---------|\n| Interaction Retention | 24h | Alte Logs löschen |\n| Trial Reminder | 6h | E-Mails bei ablaufender Testphase |\n| Deadline Alert | 1h | Benachrichtigungen zu regulatorischen Fristen |\n| Report Delivery | Konfiguration | Geplante Berichterstellung |",
        },
        {
          id: "troubleshooting",
          title: "Fehlerbehebung bei häufigen Problemen",
          summary:
            "Lösungen für häufige Entwicklungs-, Bereitstellungs- und Betriebsprobleme.",
          content:
            '### Häufige Probleme\n**DB-Verbindungsfehler:** Überprüfen Sie `DATABASE_URL` in `.env`. Stellen Sie sicher, dass Supabase läuft.\n\n**AI hängt in "queued":** Überprüfen Sie die Redis-Konnektivität. Bestätigen Sie im Entwicklungsmodus `AI_QUEUE_MODE=in_memory`.\n\n**OpenAI 401:** Ungültiger `OPENAI_API_KEY`.\n\n**Vercel-Build schlägt fehl:** Überprüfen Sie die Umgebungsvariablen. Stellen Sie sicher, dass Node 20+ verwendet wird. Testen Sie mit `pnpm build`.\n\n### Debugging\n- Debug-Logs: `LOG_LEVEL=debug pnpm dev`\n- Anfragen verfolgen: `X-Request-ID`-Header\n- Überprüfen Sie das Sentry-Dashboard auf Fehler',
          troubleshooting: [
            {
              problem: "Login gibt 'Authentication required (10001)' zurück",
              solution:
                "Überprüfen Sie JWT_SECRET in .env. Löschen Sie Browser-Cookies. Überprüfen Sie COOKIE_DOMAIN.",
            },
            {
              problem: "pnpm db:push schlägt mit Migrationsfehlern fehl",
              solution:
                "Überprüfen Sie mit 'supabase db status'. Verwenden Sie 'supabase db reset' für einen Entwicklungs-Reset.",
            },
            {
              problem: "Vercel-Build schlägt aufgrund des Speicherlimits fehl",
              solution:
                "Lagern Sie große Abhängigkeiten aus. Erhöhen Sie den Node-Speicher in den Vercel-Einstellungen.",
            },
            {
              problem: "Stripe-Webhook empfängt keine Ereignisse",
              solution:
                "Überprüfen Sie STRIPE_WEBHOOK_SECRET. Verwenden Sie 'stripe listen' für lokale Tests.",
            },
          ],
        },
      ],
    },
    {
      id: "billing-plans",
      icon: "card",
      title: "Abrechnung & Tarife",
      pages: [
        {
          id: "pricing-overview",
          title: "Übersicht über Preise & Tarife",
          summary:
            "Flexible Abonnement-Tarife für Teams jeder Größe – von Start-ups bis hin zu globalen Unternehmen.",
          content:
            "### Tarifvergleich\n| Funktion | Kostenlose Testversion | Starter | Professional | Enterprise |\n|---------|-----------|---------|-------------|------------|\n| Jurisdiktionen | 1 | 3 | 10 | Unbegrenzt |\n| Anbieter | 5 | 25 | 100 | Unbegrenzt |\n| KI-Bewertungen/Monat | 3 | 20 | 100 | Individuell |\n| Teammitglieder | 2 | 10 | 50 | Unbegrenzt |\n| API-Zugriff | — | — | ✓ | ✓ |\n| Prioritäts-Support | — | — | ✓ | ✓ |\n| SLA | — | 99,5% | 99,9% | 99,95% |\n\n### Abrechnungsintervalle\n- **Monatlich** — Standardpreis\n- **Vierteljährlich** — 10% Rabatt\n- **Halbjährlich** — 15% Rabatt\n- **Jährlich** — 20% Rabatt\n\n### Kostenlose Testversion\n- 14-tägige kostenlose Testversion des Starter-Tarifs\n- Keine Kreditkarte erforderlich\n- Voller Zugriff auf alle Starter-Funktionen",
        },
        {
          id: "subscription-management",
          title: "Verwalten Ihres Abonnements",
          summary:
            "Upgrade, Downgrade oder Kündigung über das Stripe-Kundenportal. Abrechnungsverlauf und Rechnungen einsehen.",
          content:
            "### Abonnement-Lebenszyklus\n1. **Testphase** → Automatische 14-tägige Testphase bei Anmeldung\n2. **Aktiv** → Kostenpflichtiges Abonnement\n3. **Zahlungsverzug** → Zahlung fehlgeschlagen; Kulanzfrist\n4. **Gekündigt** → Daten werden 30 Tage lang aufbewahrt\n\n### Upgrade / Downgrade\n- **Upgrade:** Sofortiger Zugriff. Anteilige Berechnung.\n- **Downgrade:** Wird zum Ende des Abrechnungszeitraums wirksam.\n\n### Abrechnungsportal\nZugriff über: **Dashboard → Abrechnung & Tarif → Abonnement verwalten**\n- Zahlungsmethode aktualisieren\n- Abrechnungsverlauf anzeigen\n- Rechnungen herunterladen\n- Tarif ändern/kündigen",
          troubleshooting: [
            {
              problem: "Zahlung fehlgeschlagen, aber Karte ist gültig",
              solution:
                "Prüfen Sie auf Sperren für internationale Transaktionen. Versuchen Sie eine alternative Karte oder kontaktieren Sie den Support.",
            },
            {
              problem: "Upgrade wird im Dashboard nicht angezeigt",
              solution:
                "Warten Sie bis zu 5 Minuten auf die Bereitstellung. Versuchen Sie, die Seite neu zu laden oder sich ab- und wieder anzumelden.",
            },
            {
              problem: "Testphase beendet, aber Sie benötigen mehr Zeit",
              solution:
                "Kontaktieren Sie den Support für eine einmalige Verlängerung um 7 Tage (einmal pro Organisation).",
            },
          ],
        },
      ],
    },
    {
      id: "operations",
      icon: "gauge",
      title: "Cyber-Operationen",
      pages: [
        {
          id: "risk-register",
          title: "Risikoregister",
          summary:
            "Zentralisiertes Risikomanagement mit automatisierter Schweregradbewertung, Behandlungsplanung und Framework-Verknüpfung.",
          content:
            "### Risikomanagement-Workflow\n1. **Identifizieren** — Risiken mit Kategorie und Wahrscheinlichkeit/Auswirkung erfassen\n2. **Bewerten** — Automatisierte Risikobewertung (Wahrscheinlichkeit × Auswirkung)\n3. **Behandeln** — Akzeptieren, Mindern, Übertragen oder Vermeiden\n4. **Verknüpfen** — Risiken mit Anbietern, Frameworks und Aufgaben verbinden\n5. **Überwachen** — Status und Behandlungsfortschritt verfolgen\n\n### Risikokategorien\n- **Operativ** — Prozessfehler, Systemausfälle\n- **Rechtlich** — Regulatorische Nichteinhaltung, Vertragsverletzungen\n- **Technisch** — Sicherheitslücken, Architekturschwächen\n- **Finanziell** — Budgetüberschreitungen, Betrugsrisiko\n- **Reputation** — Markenschäden, Vertrauensverlust bei Kunden",
        },
        {
          id: "incident-management",
          title: "Incident-Management",
          summary:
            "Sicherheits- und Compliance-Vorfälle protokollieren, verfolgen und beheben mit automatisierter regulatorischer Zuordnung.",
          content:
            "### Incident-Lebenszyklus\n1. **Erkennung** — Vorfall mit Typ, Schweregrad, betroffenen Systemen erfassen\n2. **Triage** — Automatisierte Schweregradklassifizierung\n3. **Untersuchung** — Zeitlinienverfolgung mit Beweisen\n4. **Eindämmung** — Aktionsverfolgung, Benachrichtigung\n5. **Behebung** — Ursachenanalyse, Sanierungsdokumente\n6. **Abschluss** — Nachbereitung des Vorfalls\n\n### Automatisierte regulatorische Zuordnung\n- Datenpanne in China → PIPL Art. 57 (72h an CAC)\n- Datenpanne in der EU → GDPR Art. 33 (72h an DPA)\n- Sicherheitsvorfall → Auswirkungen auf mehrere Frameworks identifiziert",
        },
      ],
    },
    {
      id: "case-studies",
      icon: "star",
      title: "Fallstudien",
      pages: [
        {
          id: "enterprise-expansion",
          title: "Grenzüberschreitende Expansion für Unternehmen",
          summary:
            "Wie ein Fortune-500-Hersteller DJAC nutzte, um Compliance in China, Saudi-Arabien und der EU für über 50 Lieferanten zu erreichen.",
          content:
            "### Hintergrund\nEin globaler Hersteller mit über 2 Mrd. USD Umsatz benötigte eine Expansion nach China, Saudi-Arabien und in die EU mit 53 Lieferanten in 12 Ländern.\n\n### Herausforderung\n- 53 Lieferanten, 3 neue Jurisdiktionen, 90-Tage-Frist\n- Manuelle Bewertung: über 6 Monate, über 500.000 USD Beratungskosten\n\n### DJAC-Lösung\n1. **Woche 1-2**: Alle 53 Lieferanten registriert\n2. **Woche 2-3**: KI-Bewertungen für PIPL, PDPL, GDPR durchgeführt\n3. **Woche 3-4**: Rahmenübergreifende Gap-Analyse – 312 Lücken gefunden\n4. **Woche 4-8**: Remediation-Planer verfolgte die Schließung der Lücken\n5. **Woche 8-12**: Kontinuierliche Überwachung bestätigte vollständige Compliance\n\n### Ergebnisse\n- ✅ Vollständige Compliance in 82 Tagen (statt geschätzter 180 Tage)\n- ✅ 312 Lücken identifiziert, 298 in 60 Tagen geschlossen\n- ✅ 380.000 USD an Beratungskosten gespart\n- ✅ 70 % Reduzierung der laufenden Überwachungskosten\n- ✅ Keine Feststellungen bei den ersten behördlichen Audits",
        },
        {
          id: "saas-startup",
          title: "Schnelle Compliance für SaaS-Startup",
          summary:
            "Wie ein 15-köpfiges Startup mit DJAC in 30 Tagen SOC 2- und GDPR-Bereitschaft erreichte.",
          content:
            "### Hintergrund\nEin Series-A-Startup mit 15 Mitarbeitern benötigte SOC 2 Type II und GDPR-Compliance, um Unternehmensabschlüsse zu erzielen.\n\n### Herausforderung\n- Kein bestehendes Compliance-Programm\n- 7 Cloud-Anbieter zu bewerten\n- 5.000 USD/Monat Budget für Compliance\n\n### DJAC-Lösung\n1. Team eingebunden, Organisationsprofil eingerichtet\n2. SOC 2 + GDPR mit KI-empfohlenen Kontrollen ausgewählt\n3. Alle 7 Anbieter registriert, Bewertungen durchgeführt\n4. Richtlinienvorlagen aus dem Richtlinien-Manager generiert\n5. Kontinuierliche Prüfungen während der Prüferüberprüfung\n\n### Ergebnisse\n- ✅ SOC 2 Type II in 28 Tagen geliefert\n- ✅ GDPR-Programm in 30 Tagen eingerichtet\n- ✅ 3 Unternehmensabschlüsse erzielt (480.000 USD ARR)\n- ✅ Laufende Compliance-Kosten unter 250 USD/Monat",
        },
      ],
    },
  ],
  ja: [
    {
      id: "getting-started",
      icon: "book",
      title: "はじめに",
      pages: [
        {
          id: "welcome",
          title: "DJACへようこそ",
          summary:
            "DJACは、世界初のAIを活用したクロスジャリスディクション・コンプライアンス・インテリジェンス・プラットフォームです。数分で導入でき、${COVERAGE.jurisdictions}の管轄区域にわたる規制コンプライアンスを実現します。",
          content:
            "### DJACとは？\nDJAC（De Jure Automated Compliance）は、中国、サウジアラビア、GCC、EU、北米、APACといった管轄区域にわたる規制コンプライアンスを自動化するエンタープライズSaaSプラットフォームです。\n\n> **info** コンプライアンス担当者、法務チーム、エンタープライズ管理者、コンサルタント、政府規制当局向けに構築されています。\n\n### なぜDJACなのか？\n- **30の管轄区域** — PIPL、PDPL、CSL、DSL、GDPR、ISO 27001、SOC 2、NIST CSF、HIPAAなど\n- **AIを活用した分析** — DeepSeek駆動の8段階コンプライアンス評価パイプライン\n- **リアルタイム監視** — 自動ギャップ検出による継続的なコンプライアンス追跡\n- **クロスボーダー・インテリジェンス** — データ移転コンプライアンスチェッカーと規制変更モニタリング\n- **ベンダーリスク管理** — 選択したすべてのフレームワークにわたる自動第三者評価\n- **エンタープライズグレードのセキュリティ** — AES-256暗号化、RBAC、監査証跡、SOC 2対応\n\n> **tip** DJACのインターフェースは9言語で利用可能です — ヘッダーのロケールメニューからいつでも切り替えられます。このドキュメントは英語、アラビア語、中国語で公開されています。その他のインターフェース言語では、ここに英語版が表示されます。\n\n### クイックスタート（5分）\n1. **組織を作成** — 会社プロフィールと請求を設定\n2. **管轄区域を選択** — 中国、サウジアラビア、EU、または任意の組み合わせを選択\n3. **フレームワークを選択** — AIが関連規制を自動推奨\n4. **ベンダーを登録** — 最初の第三者サプライヤーを追加\n5. **評価を実行** — AIが60秒以内に完全なコンプライアンスレポートを生成\n\n> **tip** オンボーディングウィザードがこのフロー全体をガイドします — サインアップ後のダッシュボードで確認してください。\n\n### プラットフォーム階層\n| 階層 | 月額 | 最適な用途 |\n|------|---------|----------|\n| Starter | $99/月から | 小規模チーム、単一管轄区域 |\n| Professional | $249/月から | 複数管轄区域のコンプライアンス |\n| Enterprise | カスタム | グローバル企業、API、専用サポート |\n\n> **faq** AIベンダー評価にはどのくらい時間がかかりますか？\n> **answer** ほとんどの評価は60秒以内に完了し、8つのパイプラインステージがそれぞれ完了するたびにWebSocket経由でライブ進捗がストリーミングされます。\n> **faq** どの規制がすぐにサポートされていますか？\n> **answer** 30の管轄区域にわたる、完全なコントロールレベルの詳細を持つ46のフレームワークと、107の厳選されたフレームワークパック — GDPR、NIS2、DORA、PIPL、PDPL、ISO 27001、SOC 2などを含みます。AIエンジンがあなたのプロフィールに関連するものを自動推奨します。\n> **faq** DJACは自社インフラストラクチャで実行できますか？\n> **answer** はい — Vercelクラウドホスティングに加えて、セルフホスト型Dockerデプロイがサポートされており、プラットフォームはカスタムフレームワークで拡張できます。",
        },
        {
          id: "architecture",
          title: "プラットフォームアーキテクチャ",
          summary:
            "DJACは、React 19、Express + tRPC、Supabase上のPostgreSQL、Redis、Google DeepSeekを備えたクラウドネイティブアーキテクチャで動作します。",
          content:
            "### システムアーキテクチャ\nDJACはモダンなモノレポアーキテクチャを採用しています：\n\n**フロントエンド**: React 19 + TypeScript + Vite 7 + Tailwind CSS 4 + shadcn/ui  \n**バックエンド**: Express 4 + tRPC 11（200以上のAPIプロシージャ）+ Drizzle ORM  \n**データベース**: Supabase上のPostgreSQL 17（AWS東京、ap-northeast-2）  \n**AIエンジン**: Google DeepSeekと8段階評価パイプライン  \n**キュー**: インメモリ / Redis（BullMQ対応）  \n**認証**: トリプルパス（Clerk OAuth + Supabase Auth + ローカルJWT）  \n**請求**: Stripe（5プラン × 4インターバル）  \n**ホスティング**: Vercel（サーバーレス）+ Docker\n\n### データフロー\n1. ユーザーがベンダー評価リクエストを送信\n2. Gatekeeperが入力を検証（インジェクション検出）\n3. Intakeがドキュメントを解析しテキストを正規化\n4. Extractorが構造化された事実を識別（キー・バリュー・エビデンスのトリプル）\n5. RAG ContextがDBから関連するコンプライアンスコントロールを取得\n6. Judge（DeepSeek）がコントロールに対するコンプライアンスを評価\n7. Synthesizerが調査結果をクロスフレームワークレポートに統合\n8. Validatorがスキーマの一貫性とデータ整合性を保証\n9. Reporterが最終的なフォーマット済み出力を生成（PDF/DOCX/JSON）",
          diagram:
            "[User] → [Gatekeeper] → [Intake] → [Extractor] → [RAG] → [Judge (DeepSeek)] → [Synthesizer] → [Validator] → [Reporter] → [PDF / DOCX / JSON]",
        },
        {
          id: "roles",
          title: "ロールと権限",
          summary:
            "DJACは、30以上のモジュールにわたる6つのプラットフォームロールと4つの組織ロールを備えた、きめ細かなロールベースのアクセス制御を提供します。",
          content:
            "### プラットフォームロール\n| ロール | レベル | アクセス |\n|------|-------|--------|\n| Basic User | 10 | 割り当てられたモジュールへの読み取り専用アクセス |\n| Professional User | 20 | コンプライアンス機能へのフルアクセス |\n| Company Admin | 30 | 組織管理 + チーム |\n| Platform Admin | 40 | 組織横断的な監督と構成 |\n| Yalla Hack Employee | 45 | 内部サポートと運用 |\n| Super Admin | 100 | 無制限のフルプラットフォームアクセス |\n\n### 組織ロール\n| ロール | レベル | 機能 |\n|------|-------|-------------|\n| Analyst | 10 | ほとんどのモジュールで閲覧のみ |\n| Compliance Officer | 20 | コンプライアンスデータの作成/編集 |\n| Admin | 30 | チーム管理 + APIキー |\n| Owner | 40 | 請求 + 組織設定 + フルアクセス |\n\n> **tip** ロールごと、モジュールごとに権限をカスタマイズできます — デフォルトは単なる出発点です。\n\n### 権限モデル\n30以上の各モジュールには6つの権限フラグがあります：\n- `canView` — 読み取りアクセス\n- `canCreate` — 新規レコードの作成\n- `canEdit` — 既存レコードの変更\n- `canDelete` — レコードの削除\n- `canExport` — データのダウンロード/エクスポート\n- `canInvite` — チームメンバーの招待",
        },
      ],
    },
    {
      id: "ai-engine",
      icon: "zap",
      title: "AIコンプライアンスエンジン",
      pages: [
        {
          id: "ai-overview",
          title: "AIエンジンの概要",
          summary:
            "DJACの8段階AIパイプラインはDeepSeekを使用して、複数のフレームワークにわたるベンダーのコンプライアンスを同時に評価します。",
          content:
            "### 8段階のパイプライン\n1. **ゲートキーパー** — 入力検証、インジェクション検出、データサニタイズ\n2. **インテーク** — ドキュメント解析、テキスト正規化、言語検出\n3. **抽出器** — キー・バリュー・エビデンスの三つ組への構造化された事実抽出\n4. **RAGコンテキスト** — 検索拡張生成: PostgreSQLから関連するコンプライアンス管理策を取得\n5. **ジャッジ (DeepSeek)** — 適用可能な管理策要件に対して各事実を評価\n6. **シンセサイザー** — 調査結果を統合し、クロスフレームワーク比較を生成\n7. **バリデータ** — スキーマ検証、クロスフィールド整合性、失敗時の再試行\n8. **レポーター** — PDF、DOCX、またはJSONでの最終フォーマット出力\n\n> **info** 各段階は進捗をWebSocketチャネルに記録するため、評価がリアルタイムで行われるのを確認できます。\n\n### AI機能\n- **自動ギャップ分析** — 欠落している管理策と非準拠領域を特定\n- **リスクスコアリング (0-100)** — フレームワークごとおよび総合的なコンプライアンススコア\n- **是正勧告** — 優先度順にランク付けされたAI提案のアクション\n- **罰則推定** — 管轄区域に基づく潜在的な罰金を計算\n- **管轄区域間比較** — フレームワークカバレッジの並列分析\n- **リアルタイムジョブストリーミング** — 評価中のWebSocketベースの進捗追跡",
        },
        {
          id: "rag-system",
          title: "RAGコンテキストシステム",
          summary:
            "検索拡張生成システムは、AI分析の前にデータベースから最も関連性の高いコンプライアンス管理策を取得します。",
          content:
            "### RAGの仕組み\n1. **ドキュメント解析** — ベンダードキュメントから抽出された事実\n2. **セマンティック検索** — 1,000以上のコンプライアンス管理策に対して事実を照合\n3. **関連性スコアリング** — 管轄区域およびトピックの関連性で管理策をランク付け\n4. **コンテキストアセンブリ** — DeepSeek用の焦点を絞ったコンテキストウィンドウを構築\n5. **根拠に基づく応答** — AIは取得した管理策のみに基づいて評価（ハルシネーションなし）\n\n### 利点\n- コンプライアンスアドバイスにおけるAIのハルシネーションを排除\n- フレームワーク固有の推奨事項を保証\n- 管理策と調査結果のマッピングの監査証跡を維持\n- 管轄区域固有の管理策を持つ30の管轄区域をサポート\n\n> **tip** RAGシステムはDJACを法的に信頼できるものにしています — 規制要件について決して推測しません。\n\n### ナレッジベース\n- 46の規制フレームワーク\n- 1,000以上のコンプライアンス管理策\n- 14以上のクロスフレームワーク関係タイプ\n- グローバル標準クラスター: ISO 27001、NIST CSF、SOC 2、HIPAA、PCI DSS",
        },
      ],
    },
    {
      id: "frameworks",
      icon: "shield",
      title: "コンプライアンスフレームワーク",
      pages: [
        {
          id: "jurisdictions",
          title: "サポート対象の法域",
          summary:
            "DJACは、APAC、EMEA、北米、アフリカの30の法域を包括的な規制フレームワークでカバーしています。",
          content:
            "### APAC地域\n- **中国** — PIPL、CSL、DSL、MLPS 2.0\n- **日本** — APPI\n- **韓国** — PIPA\n- **シンガポール** — PDPA\n- **インド** — DPDP法\n- **オーストラリア** — 1988年プライバシー法\n\n### 中東 / GCC\n- **サウジアラビア** — PDPL、NCA ECC / CSCC / OCC\n- **UAE** — UAE PDPL\n- **カタール** — カタール PDPPL\n- **バーレーン** — バーレーン PDPL\n- **クウェート** — クウェート DPA\n- **オマーン** — オマーン PDPL\n\n### ヨーロッパ\n- **EU/EEA** — GDPR、NIS2指令、DORA\n- **イギリス** — UK GDPR / DPA 2018\n\n### 北米\n- **アメリカ合衆国** — HIPAA、CCPA/CPRA、SOX、PCI DSS\n- **カナダ** — PIPEDA\n\n### グローバル標準\n- ISO 27001 / 27002\n- NISTサイバーセキュリティフレームワーク (CSF)\n- SOC 2 Type II\n- PCI DSS v4.0",
        },
        {
          id: "pipl-guide",
          title: "PIPLコンプライアンスガイド",
          summary:
            "中国の個人情報保護法（PIPL）の包括的なガイド。データローカライゼーションと越境移転ルールを含みます。",
          content:
            "### PIPLの概要\n中国の個人情報保護法（PIPL）は2021年11月1日に発効しました。これは、組織が中国国内の個人の個人情報を収集、使用、保存、移転する方法を規制します。\n\n> **warning** PIPL違反は、最高5000万元（約700万米ドル）または年間売上高の5%の罰金が科される可能性があります。\n\n### 主な要件\n1. **同意** — データ収集に対する明示的で情報に基づいた同意\n2. **データ最小化** — 必要なもののみを収集\n3. **目的の制限** — 指定された目的にのみデータを使用\n4. **データローカライゼーション** — CIIOは中国国内にデータを保存する必要があります\n5. **越境移転** — CACのセキュリティ評価が必要\n6. **DPIA** — 高リスク処理の前に影響評価\n7. **データ主体の権利** — アクセス、訂正、削除、ポータビリティ\n8. **侵害通知** — 72時間以内に報告\n\n### DJACがどのように支援するか\n- 自動化されたPIPL管理マッピング（全72条）\n- CACガイダンスに基づく越境移転評価\n- PIPL要件に対するベンダーリスクスコアリング\n- 規制更新の継続的な監視\n- 収益と違反の重大性に基づく罰則計算ツール",
          caseStudy: {
            company: "欧州のSaaS企業",
            challenge:
              "GDPRコンプライアンスを維持しながら中国でサービスを開始する必要がありました。中国のユーザーデータを扱う12のベンダーに対してPIPLギャップ分析が必要でした。",
            solution:
              "DJACのPIPLモジュールを使用して、12のベンダーすべてを同時に評価しました。GDPR-PIPLのカバレッジの重複とギャップを示すクロスフレームワークレポートを生成しました。",
            results:
              "ベンダー全体で47のコンプライアンスギャップを特定しました。6週間以内に完全なPIPLコンプライアンスを達成しました。法的相談コストを60%削減しました。",
          },
        },
      ],
    },
    {
      id: "vendor-risk",
      icon: "building",
      title: "ベンダーリスク管理",
      pages: [
        {
          id: "vendor-assessment",
          title: "ベンダーコンプライアンス評価",
          summary:
            "AIを活用した分析とギャップレポートにより、選択したすべてのフレームワークにわたるサードパーティベンダーのコンプライアンス評価を自動化します。",
          content:
            "### 自動ベンダー評価\n1. **ベンダーを登録** — ベンダー名、業界、管轄区域、技術スタックを追加\n2. **フレームワークを選択** — 該当する規制フレームワークを選択\n3. **証拠をアップロード** — ベンダーのポリシー、認証、監査レポートを添付\n4. **評価を実行** — AIが選択したすべてのフレームワークに対してベンダーを分析\n5. **結果を確認** — リスクスコアリング（0〜100）を含む詳細なギャップ分析\n6. **レポートをエクスポート** — ステークホルダー向けのプロフェッショナルなPDF/DOCXレポート\n\n### 評価出力\n- **総合スコア** — すべてのフレームワークにわたる加重平均（0〜100）\n- **フレームワーク別スコア** — 個別のコンプライアンススコア\n- **リスクレベル** — クリティカル / 高 / 中 / 低\n- **ギャップ分析** — 重大度を含む具体的な非準拠コントロール\n- **是正計画** — 期限付きの優先順位付けされたアクション項目\n- **罰則のコンテキスト** — ギャップごとの管轄区域別の該当罰金\n\n### 継続的モニタリング\nDJACは設定可能な間隔でベンダーを自動的に再評価し、以下について通知します：\n- 既存のベンダーに影響を与える新しい規制要件\n- ベンダーのリスクプロファイルの変化\n- 期限切れが近い認証または監査レポート\n- ベンダーの管轄区域に関連する新たな脅威",
          bestPractices: [
            "契約署名の前にベンダーを評価する（後ではなく）",
            "高リスクベンダーには四半期ごとの再評価スケジュールを設定する",
            "管轄区域間の比較を使用してフレームワークの重複を特定する",
            "評価結果に対するすべてのベンダーの回答を文書化する",
            "トレーサビリティのためにベンダーのギャップを内部リスク登録簿にリンクする",
          ],
        },
        {
          id: "supplier-profiles",
          title: "サプライヤーコンプライアンスプロファイル",
          summary:
            "管轄区域固有のデータ、技術スタック分析、連絡先管理を備えた包括的なベンダープロファイルを構築します。",
          content:
            "### プロファイルの構成要素\n- **基本情報** — 名前、業界、ウェブサイト、管轄区域\n- **技術スタック** — バージョン追跡を含む技術コンポーネント\n- **連絡先** — 役割と管轄区域の割り当てを含む主要担当者\n- **リスク階層** — データ処理に基づく自動リスク分類\n- **評価履歴** — すべてのコンプライアンス評価の完全なタイムライン\n- **ドキュメントリポジトリ** — 証拠、認証、ポリシー\n\n### リスク階層化\nDJACはベンダーのリスク階層を自動的に計算します：\n- **クリティカル** — 個人/機密データを扱い、規制の厳しい管轄区域で事業を展開\n- **高** — 規制対象データを処理し、国境を越えたデータフローがある\n- **中** — 限定的なデータ露出、標準的な規制要件\n- **低** — 最小限のリスクプロファイル、機密データの処理なし",
        },
      ],
    },
    {
      id: "api-integration",
      icon: "terminal",
      title: "APIと統合",
      pages: [
        {
          id: "api-reference",
          title: "APIリファレンス",
          summary:
            "DJACは、42のルーターにわたる200以上のプロシージャを備えた型安全なtRPC APIを公開し、さらにWebhookとヘルスチェック用のRESTエンドポイントも提供します。",
          content:
            "### API概要\nDJACはエンドツーエンドの型安全なAPI操作に**tRPC**を使用しています。すべてのプロシージャはバッチサポート付きで`POST /api/trpc`を経由します。\n\n**ベースURL:**\n- 本番環境: `https://app.yalla-hack.ae`\n- ローカル: `http://localhost:3000`\n\n### 認証方法\n| 方法 | ヘッダー | ユースケース |\n|--------|--------|----------|\n| セッションCookie | `app_session_id` Cookie | Webアプリ（デフォルト） |\n| APIキー | `x-djac-api-key: djac_<hex>` | プログラムによるアクセス |\n| Clerk OAuth | 自動管理 | 外部OAuth |\n\n### ルーターカテゴリ\n| ドメイン | ルーター | 主要プロシージャ |\n|--------|---------|----------------|\n| 認証 | `localAuth`、`auth`、`googleAuth` | register、login、mfa |\n| 組織 | `orgSettings`、`orgMembers` | create、invite、updateRole |\n| RBAC | `role`、`rbac` | getPermissions、setPermissions |\n| コンプライアンス | `compliance`、`regulatoryChanges` | frameworks.list、controls.get |\n| ベンダー | `vendor`、`vendorCompliance` | list、create、assess |\n| リスク | `riskRegister`、`remediation` | list、create、update |\n| AI | `ai` | startAssessment、getJob |\n| レポート | `complianceReport` | generate、download、schedule |\n| 請求 | `billing` | getPlans、checkout |\n| 管理 | `admin`、`system` | getStats、getAuditLogs |\n\n### エラーコード\n| コード | 説明 |\n|------|-------------|\n| `UNAUTHORIZED` | 認証が必要です |\n| `FORBIDDEN` | 権限が不十分です |\n| `NOT_FOUND` | リソースが見つかりません |\n| `VALIDATION_ERROR` | 入力検証に失敗しました |\n| `RATE_LIMITED` | リクエストが多すぎます |",
        },
        {
          id: "websocket",
          title: "WebSocketストリーミング",
          summary:
            "リアルタイムのAI評価進捗は、/ws/ai-jobsのWebSocketを介してジョブライフサイクルイベントとともにストリーミングされます。",
          content:
            '### WebSocketエンドポイント\n**URL:** `wss://app.yalla-hack.ae/ws/ai-jobs`\n\n### イベントタイプ\n| イベント | 方向 | ペイロード |\n|-------|-----------|---------|\n| `job:progress` | サーバー → クライアント | `{ jobId, stage, message, progress }` |\n| `job:complete` | サーバー → クライアント | `{ jobId, result }` |\n| `job:error` | サーバー → クライアント | `{ jobId, error: string }` |\n| `subscribe` | クライアント → サーバー | `{ jobId: string }` |\n\n### 例\n```typescript\nconst ws = new WebSocket("wss://app.yalla-hack.ae/ws/ai-jobs");\nws.onopen = () => ws.send(JSON.stringify({ type: "subscribe", jobId }));\nws.onmessage = (e) => {\n  const { type, stage, message } = JSON.parse(e.data);\n  if (type === "job:progress") updateUI(stage, message);\n  if (type === "job:complete") showResults(data.result);\n};\n```',
        },
      ],
    },
    {
      id: "security-compliance",
      icon: "lock",
      title: "セキュリティとコンプライアンス",
      pages: [
        {
          id: "security-overview",
          title: "セキュリティアーキテクチャ",
          summary:
            "DJACは、OWASP Top 10に準拠し、認証、認可、データ保護、インフラストラクチャ全体にわたって多層防御を実装しています。",
          content:
            "### 多層防御\n**認証:**\n- パスワードはbcrypt（12ラウンド）でハッシュ化\n- JWTトークンはHS256（最低64文字のシークレット）で署名\n- HTTP-only、Secure、SameSite Cookie\n- TOTPベースのMFAとバックアップコード\n- OTPベースのパスワードリセット（SHA-256、5分で有効期限切れ）\n\n**認可:**\n- 7つのプラットフォームロール + 4つの組織ロール\n- 32の権限ゲート付きモジュール\n- すべてのPostgreSQLテーブルに対する行レベルセキュリティ\n- 組織スコープのデータ分離\n\n**データ保護:**\n- 転送中のすべてのデータにTLS 1.3\n- PostgreSQLは保存時に暗号化（Supabase）\n- シークレットはVercel環境変数 + GitHub Actionsに保存\n\n### セキュリティヘッダー\n| ヘッダー | 値 | 目的 |\n|--------|-------|---------|\n| Strict-Transport-Security | max-age=63072000 | HTTPSの強制 |\n| X-Content-Type-Options | nosniff | MIMEスニッフィングの防止 |\n| X-Frame-Options | DENY | クリックジャッキングの防止 |\n| Content-Security-Policy | ルートごとに制限 | XSSの緩和 |\n| Referrer-Policy | strict-origin | リファラー漏洩 |\n\n### CVEパッチ適用\n- Dependabotによる自動脆弱性アラート\n- 推移的依存関係のパッチに対するpnpmオーバーライド\n- CIパイプラインでのCodeQLセキュリティ分析",
        },
        {
          id: "rbac-system",
          title: "RBACと権限システム",
          summary:
            "32のプラットフォームモジュールにわたる詳細な権限と、組織ごとのカスタムロールオーバーライド。",
          content:
            "### 権限解決フロー\n1. リクエストがtRPCプロシージャに到達\n2. 認証ミドルウェアが`ctx.user`と`ctx.orgRole`を抽出\n3. システムがカスタム`rolePermissions`行をチェック\n4. `DEFAULT_ORG_ROLE_PERMISSIONS`にフォールバック\n5. アクションをPermissionFlagsと比較\n6. Allowまたは403 FORBIDDENを返す\n\n### 権限フラグ\n各モジュールには6つのフラグがあります:\n- `canView` — 読み取りアクセス\n- `canCreate` — 新規レコードの作成\n- `canEdit` — 既存レコードの変更\n- `canDelete` — レコードの削除\n- `canExport` — データのダウンロード/エクスポート\n- `canInvite` — チームメンバーの招待\n\n### デフォルトテンプレート\n| ロール | デフォルトパターン |\n|------|----------------|\n| アナリスト | ほとんどのモジュールでVIEW_ONLY |\n| コンプライアンスオフィサー | コンプライアンスでSTANDARD |\n| 管理者 | コンプライアンスでFULL、設定でSTANDARD |\n| オーナー | すべてでFULL |",
        },
      ],
    },
    {
      id: "developer-guide",
      icon: "code",
      title: "開発者ガイド",
      pages: [
        {
          id: "dev-setup",
          title: "開発環境のセットアップ",
          summary:
            "Node.js 20+、pnpm 10+、Supabase用のDocker、および必要なすべてのサービスを使用してローカル環境をセットアップします。",
          content:
            "### 前提条件\n- Node.js 20+\n- pnpm 10+ (`npm install -g pnpm@10`)\n- Docker Desktop (Supabase用)\n- Supabase CLI (`npm install -g supabase`)\n\n### 初回セットアップ\n```bash\ngit clone <repo-url> djac && cd djac\npnpm install\ncp .env.example .env\nsupabase start\npnpm db:push\npnpm seed:data\npnpm dev\n# → http://localhost:3000\n```\n\n### 開発用認証バイパス\n```env\nDEV_AUTH_BYPASS=true\nDEV_AUTH_EMAIL=dev@example.com\nDEV_AUTH_ROLE=super_admin\n```\n\n### 利用可能なスクリプト\n| コマンド | 目的 |\n|---------|---------|\n| `pnpm dev` | 開発サーバーを起動 |\n| `pnpm check` | TypeScriptの型チェック |\n| `pnpm lint` | ESLint |\n| `pnpm test` | テストを実行 (vitest) |\n| `pnpm build` | 本番ビルド |\n| `pnpm verify:all` | すべてのチェック + ビルド |",
          demoSteps: [
            "リポジトリをクローンし、'pnpm install' で依存関係をインストールする",
            ".env.example を .env にコピーし、必要な値を入力する",
            "'supabase start' で Supabase をローカルで起動する",
            "'pnpm db:push' でデータベーススキーマをプッシュする",
            "'pnpm seed:data' で参照データをシードする",
            "'pnpm dev' で開発サーバーを起動する → http://localhost:3000",
          ],
        },
        {
          id: "adding-features",
          title: "新機能の追加",
          summary:
            "新しい tRPC ルーター、React ページ、データベーステーブル、テストを追加するための DJAC のパターンに従ってください。",
          content:
            '### tRPC ルーターの追加\n```typescript\n// server/my-feature-router.ts\nimport { orgProcedure, router } from "./_core/trpc";\nimport { z } from "zod";\n\nexport const myFeatureRouter = router({\n  list: orgProcedure\n    .input(z.object({ orgId: z.string() }))\n    .query(async ({ ctx, input }) => {\n      const db = getDb();\n      return db.select().from(myTable).where(eq(myTable.orgId, input.orgId));\n    }),\n  create: orgProcedure\n    .input(z.object({ orgId: z.string(), name: z.string() }))\n    .mutation(async ({ ctx, input }) => {\n      const [rec] = await db.insert(myTable).values(input).returning();\n      return rec;\n    }),\n});\n```\n\n`server/routers.ts` に登録:\n```typescript\nimport { myFeatureRouter } from "./my-feature-router";\nexport const appRouter = router({ myFeature: myFeatureRouter });\n```\n\n### API 設計ルール\n1. すべてのミューテーションは Zod バリデーション付きの tRPC を使用する\n2. 認証済みには `protectedProcedure`、組織スコープには `orgProcedure` を使用する\n3. 認可のために `ctx.user.role` を確認する\n4. クライアント入力を決して信用しない — 常に Zod でバリデーションする',
        },
      ],
    },
    {
      id: "deployment-operations",
      icon: "server",
      title: "デプロイと運用",
      pages: [
        {
          id: "deployment",
          title: "デプロイオプション",
          summary:
            "DJACはVercel（サーバーレス）、Docker、手動VPSデプロイをサポートしています。CI/CDパイプラインがステージングと本番を自動化します。",
          content:
            "### Vercel（推奨）\n```bash\npnpm build\nvercel --prod\nsupabase db push --linked\nsupabase functions deploy\ncurl https://your-app.com/api/health\n```\n\n### Docker\n```bash\ndocker build -t djac:latest .\ndocker run -d -p 3000:3000 --env-file .env.production --name djac-app djac:latest\n```\n\n### CI/CDパイプライン\n| ワークフロー | トリガー | アクション |\n|----------|---------|---------|\n| CI | プッシュ/PR | リント、型チェック、テスト、ビルド |\n| ステージング | developへのプッシュ | Vercelプレビューへの自動デプロイ |\n| 本番 | mainへのプッシュ | デプロイ + DBマイグレーション + ヘルスチェック |\n\n### 本番チェックリスト\n- [ ] JWT_SECRET ≥ 64文字\n- [ ] DEV_AUTH_BYPASS=false\n- [ ] DBプールサイズ: 25接続\n- [ ] Redis設定済み\n- [ ] RLSポリシー有効\n- [ ] Sentryエラートラッキング有効",
        },
        {
          id: "monitoring",
          title: "モニタリングと可観測性",
          summary:
            "エラートラッキングにはSentry、構造化ログにはPino、運用モニタリングにはヘルス/レディネスエンドポイントを使用します。",
          content:
            "### ヘルスエンドポイント\n| エンドポイント | 目的 |\n|----------|---------|\n| `/api/health` | ヘルスチェック（ステータス、稼働時間） |\n| `/api/readyz` | レディネス（DB、Redis、Stripe、AI） |\n\n### バックグラウンドスケジューラ\n| スケジューラ | 間隔 | 目的 |\n|-----------|----------|---------|\n| インタラクション保持 | 24時間 | 古いログの削除 |\n| トライアルリマインダー | 6時間 | 期限切れトライアルのメール |\n| 期限アラート | 1時間 | 規制期限の通知 |\n| レポート配信 | 設定 | スケジュールされたレポート生成 |",
        },
        {
          id: "troubleshooting",
          title: "よくある問題のトラブルシューティング",
          summary: "開発、デプロイ、運用に関する一般的な問題の解決策。",
          content:
            "### よくある問題\n**DB接続エラー:** `.env`の`DATABASE_URL`を確認してください。Supabaseが実行中であることを確認してください。\n\n**AIが「queued」のまま:** Redis接続を確認してください。開発モードでは、`AI_QUEUE_MODE=in_memory`を確認してください。\n\n**OpenAI 401:** `OPENAI_API_KEY`が無効です。\n\n**Vercelビルド失敗:** 環境変数を確認してください。Node 20以上を確認してください。`pnpm build`でテストしてください。\n\n### デバッグ\n- デバッグログ: `LOG_LEVEL=debug pnpm dev`\n- リクエストの追跡: `X-Request-ID`ヘッダー\n- エラーについてはSentryダッシュボードを確認",
          troubleshooting: [
            {
              problem: "ログインが「Authentication required (10001)」を返す",
              solution:
                ".envのJWT_SECRETを確認してください。ブラウザのCookieをクリアしてください。COOKIE_DOMAINを確認してください。",
            },
            {
              problem: "pnpm db:pushがマイグレーションエラーで失敗する",
              solution:
                "'supabase db status'で確認してください。開発リセットには'supabase db reset'を使用してください。",
            },
            {
              problem: "Vercelビルドがメモリ制限で失敗する",
              solution:
                "大きな依存関係を外部化してください。Vercel設定でNodeメモリを増やしてください。",
            },
            {
              problem: "Stripe Webhookがイベントを受信しない",
              solution:
                "STRIPE_WEBHOOK_SECRETを確認してください。ローカルテストには'stripe listen'を使用してください。",
            },
          ],
        },
      ],
    },
    {
      id: "billing-plans",
      icon: "card",
      title: "請求とプラン",
      pages: [
        {
          id: "pricing-overview",
          title: "料金とプランの概要",
          summary:
            "あらゆる規模のチーム向けの柔軟なサブスクリプションプラン — スタートアップからグローバル企業まで。",
          content:
            "### プラン比較\n| 機能 | 無料トライアル | スターター | プロフェッショナル | エンタープライズ |\n|---------|-----------|---------|-------------|------------|\n| 管轄区域 | 1 | 3 | 10 | 無制限 |\n| ベンダー | 5 | 25 | 100 | 無制限 |\n| AI評価/月 | 3 | 20 | 100 | カスタム |\n| チームメンバー | 2 | 10 | 50 | 無制限 |\n| APIアクセス | — | — | ✓ | ✓ |\n| 優先サポート | — | — | ✓ | ✓ |\n| SLA | — | 99.5% | 99.9% | 99.95% |\n\n### 請求間隔\n- **月次** — 標準料金\n- **四半期** — 10%割引\n- **半年** — 15%割引\n- **年次** — 20%割引\n\n### 無料トライアル\n- スタータープランで14日間の無料トライアル\n- クレジットカード不要\n- すべてのスターター機能に完全アクセス",
        },
        {
          id: "subscription-management",
          title: "サブスクリプションの管理",
          summary:
            "Stripeカスタマーポータルを通じてアップグレード、ダウングレード、またはキャンセル。請求履歴と請求書を表示。",
          content:
            "### サブスクリプションのライフサイクル\n1. **トライアル** → サインアップ時に自動的に14日間のトライアル\n2. **アクティブ** → 有料サブスクリプション\n3. **支払い遅延** → 支払い失敗。猶予期間\n4. **キャンセル済み** → データは30日間保持\n\n### アップグレード / ダウングレード\n- **アップグレード:** 即時アクセス。日割り計算された料金。\n- **ダウングレード:** 請求期間の終了時に有効。\n\n### 請求ポータル\nアクセス方法: **ダッシュボード → 請求とプラン → サブスクリプションの管理**\n- 支払い方法の更新\n- 請求履歴の表示\n- 請求書のダウンロード\n- プランの変更/キャンセル",
          troubleshooting: [
            {
              problem: "支払いが失敗したがカードは有効",
              solution:
                "国際取引のブロックを確認してください。別のカードを試すか、サポートにお問い合わせください。",
            },
            {
              problem: "アップグレードがダッシュボードに反映されない",
              solution:
                "プロビジョニングには最大5分かかります。更新するか、ログアウト/ログインを試してください。",
            },
            {
              problem: "トライアルが終了したが、さらに時間が必要",
              solution:
                "1回限りの7日間延長についてサポートにお問い合わせください（組織ごとに1回）。",
            },
          ],
        },
      ],
    },
    {
      id: "operations",
      icon: "gauge",
      title: "サイバーオペレーション",
      pages: [
        {
          id: "risk-register",
          title: "リスク登録簿",
          summary:
            "自動重大度スコアリング、対応計画、フレームワーク連携を備えた集中リスク管理。",
          content:
            "### リスク管理ワークフロー\n1. **特定** — カテゴリと発生可能性/影響度を指定してリスクを記録\n2. **評価** — 自動リスクスコアリング（発生可能性 × 影響度）\n3. **対応** — 受容、軽減、移転、回避\n4. **連携** — リスクをベンダー、フレームワーク、タスクに接続\n5. **監視** — ステータスと対応の進捗を追跡\n\n### リスクカテゴリ\n- **運用** — プロセス障害、システム停止\n- **法務** — 規制違反、契約違反\n- **技術** — セキュリティ脆弱性、アーキテクチャの弱点\n- **財務** — 予算超過、不正リスク\n- **評判** — ブランド毀損、顧客信頼の低下",
        },
        {
          id: "incident-management",
          title: "インシデント管理",
          summary:
            "自動規制マッピングにより、セキュリティおよびコンプライアンスインシデントを記録、追跡、解決します。",
          content:
            "### インシデントライフサイクル\n1. **検知** — 種類、重大度、影響を受けるシステムを指定してインシデントを記録\n2. **トリアージ** — 自動重大度分類\n3. **調査** — 証拠を含むタイムライン追跡\n4. **封じ込め** — アクション追跡、通知\n5. **解決** — 根本原因分析、修復ドキュメント\n6. **クローズ** — インシデント後レビュー\n\n### 自動規制マッピング\n- 中国でのデータ侵害 → PIPL 第57条（CACへ72時間以内）\n- EUでのデータ侵害 → GDPR 第33条（DPAへ72時間以内）\n- セキュリティインシデント → 複数フレームワークへの影響を特定",
        },
      ],
    },
    {
      id: "case-studies",
      icon: "star",
      title: "ケーススタディ",
      pages: [
        {
          id: "enterprise-expansion",
          title: "エンタープライズの国境を越えた拡大",
          summary:
            "フォーチュン500の製造業者がDJACを使用して、50以上のベンダーに対して中国、サウジアラビア、EUでのコンプライアンスを達成した方法。",
          content:
            "### 背景\n売上高20億ドル以上のグローバル製造業者が、12カ国に53のベンダーを持つ中国、サウジアラビア、EUへの拡大を必要としていました。\n\n### 課題\n- 53のベンダー、3つの新しい管轄区域、90日の期限\n- 手動評価：6ヶ月以上、50万ドル以上のコンサルティング費用\n\n### DJACソリューション\n1. **第1〜2週**：53のベンダーをすべて登録\n2. **第2〜3週**：PIPL、PDPL、GDPRのAI評価を実行\n3. **第3〜4週**：フレームワーク間のギャップ分析 — 312のギャップを発見\n4. **第4〜8週**：修復プランナーがギャップの解消を追跡\n5. **第8〜12週**：継続的なモニタリングにより完全なコンプライアンスを確認\n\n### 結果\n- ✅ 82日で完全なコンプライアンスを達成（推定180日に対して）\n- ✅ 312のギャップを特定し、60日で298を解消\n- ✅ コンサルティング費用を38万ドル節約\n- ✅ 継続的なモニタリングコストを70%削減\n- ✅ 最初の規制監査で指摘事項ゼロ",
        },
        {
          id: "saas-startup",
          title: "SaaSスタートアップの迅速なコンプライアンス",
          summary:
            "15人のスタートアップがDJACを使用して30日でSOC 2とGDPRの準備を達成した方法。",
          content:
            "### 背景\n15人の従業員を持つシリーズAのスタートアップが、エンタープライズ契約を獲得するためにSOC 2 Type IIとGDPRコンプライアンスを必要としていました。\n\n### 課題\n- 既存のコンプライアンスプログラムなし\n- 評価すべき7つのクラウドベンダー\n- コンプライアンスのための月額5,000ドルの予算\n\n### DJACソリューション\n1. チームをオンボーディングし、組織プロファイルを設定\n2. AIが推奨するコントロールでSOC 2 + GDPRを選択\n3. 7つのベンダーをすべて登録し、評価を実行\n4. ポリシーマネージャーからポリシーテンプレートを生成\n5. 監査人のレビュー中に継続的なチェックを実施\n\n### 結果\n- ✅ SOC 2 Type IIを28日で提供\n- ✅ GDPRプログラムを30日で確立\n- ✅ 3つのエンタープライズ契約を獲得（ARR 48万ドル）\n- ✅ 継続的なコンプライアンスコストは月額250ドル未満",
        },
      ],
    },
  ],
  ko: [
    {
      id: "getting-started",
      icon: "book",
      title: "시작하기",
      pages: [
        {
          id: "welcome",
          title: "DJAC에 오신 것을 환영합니다",
          summary:
            "DJAC는 세계 최초의 AI 기반 관할권 간 컴플라이언스 인텔리전스 플랫폼입니다. 몇 분 만에 배포하고 ${COVERAGE.jurisdictions}개 관할권에서 규제 컴플라이언스를 달성하세요.",
          content:
            "### DJAC란 무엇인가요?\nDJAC(De Jure Automated Compliance)는 중국, 사우디아라비아, GCC, EU, 북미 및 APAC 전역의 규제 컴플라이언스를 자동화하는 엔터프라이즈 SaaS 플랫폼입니다.\n\n> **info** 컴플라이언스 담당자, 법무팀, 엔터프라이즈 관리자, 컨설턴트 및 정부 규제 기관을 위해 설계되었습니다.\n\n### DJAC를 선택하는 이유\n- **30개 관할권** — PIPL, PDPL, CSL, DSL, GDPR, ISO 27001, SOC 2, NIST CSF, HIPAA 등\n- **AI 기반 분석** — DeepSeek 기반 8단계 컴플라이언스 평가 파이프라인\n- **실시간 모니터링** — 자동화된 격차 감지를 통한 지속적인 컴플라이언스 추적\n- **국경 간 인텔리전스** — 데이터 이전 컴플라이언스 검사기 및 규제 변경 모니터링\n- **공급업체 리스크 관리** — 선택한 모든 프레임워크에 걸친 자동화된 제3자 평가\n- **엔터프라이즈급 보안** — AES-256 암호화, RBAC, 감사 추적, SOC 2 준비 완료\n\n> **tip** DJAC 인터페이스는 9개 언어로 제공됩니다 — 헤더의 로케일 메뉴에서 언제든지 전환할 수 있습니다. 이 문서는 영어, 아랍어, 중국어로 게시됩니다. 다른 인터페이스 언어에서는 여기에서 영어 버전을 볼 수 있습니다.\n\n### 빠른 시작 (5분)\n1. **조직 생성** — 회사 프로필 및 결제 설정\n2. **관할권 선택** — 중국, 사우디아라비아, EU 또는 원하는 조합 선택\n3. **프레임워크 선택** — AI가 관련 규정을 자동 추천\n4. **공급업체 등록** — 첫 번째 제3자 공급업체 추가\n5. **평가 실행** — AI가 60초 이내에 완전한 컴플라이언스 보고서 생성\n\n> **tip** 온보딩 마법사가 이 전체 흐름을 안내합니다 — 가입 후 대시보드에서 확인하세요.\n\n### 플랫폼 등급\n| 등급 | 월 요금 | 적합한 대상 |\n|------|---------|----------|\n| Starter | $99/월부터 | 소규모 팀, 단일 관할권 |\n| Professional | $249/월부터 | 다중 관할권 컴플라이언스 |\n| Enterprise | 맞춤형 | 글로벌 기업, API, 전담 지원 |\n\n> **faq** AI 공급업체 평가는 얼마나 걸리나요?\n> **answer** 대부분의 평가는 60초 이내에 완료되며, 8개 파이프라인 단계가 각각 완료될 때마다 WebSocket을 통해 실시간 진행 상황을 스트리밍합니다.\n> **faq** 기본적으로 지원되는 규정은 무엇인가요?\n> **answer** 30개 관할권에 걸쳐 전체 제어 수준 세부 정보가 포함된 46개 프레임워크와 107개의 엄선된 프레임워크 팩 — GDPR, NIS2, DORA, PIPL, PDPL, ISO 27001, SOC 2 등이 포함됩니다. AI 엔진이 귀하의 프로필에 맞는 관련 항목을 자동 추천합니다.\n> **faq** DJAC를 자체 인프라에서 실행할 수 있나요?\n> **answer** 예 — Vercel 클라우드 호스팅 외에도 자체 호스팅 Docker 배포가 지원되며, 플랫폼은 사용자 정의 프레임워크로 확장할 수 있습니다.",
        },
        {
          id: "architecture",
          title: "플랫폼 아키텍처",
          summary:
            "DJAC는 React 19, Express + tRPC, Supabase의 PostgreSQL, Redis 및 Google DeepSeek를 사용하는 클라우드 네이티브 아키텍처에서 실행됩니다.",
          content:
            "### 시스템 아키텍처\nDJAC는 현대적인 모노레포 아키텍처를 채택합니다:\n\n**프론트엔드**: React 19 + TypeScript + Vite 7 + Tailwind CSS 4 + shadcn/ui  \n**백엔드**: Express 4 + tRPC 11 (200개 이상의 API 프로시저) + Drizzle ORM  \n**데이터베이스**: Supabase의 PostgreSQL 17 (AWS 도쿄, ap-northeast-2)  \n**AI 엔진**: 8단계 평가 파이프라인이 포함된 Google DeepSeek  \n**큐**: 인메모리 / Redis (BullMQ 준비 완료)  \n**인증**: 삼중 경로 (Clerk OAuth + Supabase Auth + 로컬 JWT)  \n**결제**: Stripe (5개 플랜 × 4개 주기)  \n**호스팅**: Vercel (서버리스) + Docker\n\n### 데이터 흐름\n1. 사용자가 공급업체 평가 요청 제출\n2. Gatekeeper가 입력 검증 (인젝션 감지)\n3. Intake가 문서를 파싱하고 텍스트 정규화\n4. Extractor가 구조화된 사실 식별 (키-값-증거 트리플)\n5. RAG Context가 DB에서 관련 컴플라이언스 제어 항목 검색\n6. Judge (DeepSeek)가 제어 항목에 대해 컴플라이언스 평가\n7. Synthesizer가 결과를 프레임워크 간 보고서로 병합\n8. Validator가 스키마 일관성 및 데이터 무결성 보장\n9. Reporter가 최종 형식 출력 생성 (PDF/DOCX/JSON)",
          diagram:
            "[User] → [Gatekeeper] → [Intake] → [Extractor] → [RAG] → [Judge (DeepSeek)] → [Synthesizer] → [Validator] → [Reporter] → [PDF / DOCX / JSON]",
        },
        {
          id: "roles",
          title: "역할 및 권한",
          summary:
            "DJAC는 30개 이상의 모듈에 걸쳐 6개의 플랫폼 역할과 4개의 조직 역할을 갖춘 세분화된 역할 기반 액세스 제어를 제공합니다.",
          content:
            "### 플랫폼 역할\n| 역할 | 레벨 | 액세스 |\n|------|-------|--------|\n| Basic User | 10 | 할당된 모듈에 대한 읽기 전용 액세스 |\n| Professional User | 20 | 컴플라이언스 기능에 대한 전체 액세스 |\n| Company Admin | 30 | 조직 관리 + 팀 |\n| Platform Admin | 40 | 조직 간 감독 및 구성 |\n| Yalla Hack Employee | 45 | 내부 지원 및 운영 |\n| Super Admin | 100 | 제한 없는 전체 플랫폼 액세스 |\n\n### 조직 역할\n| 역할 | 레벨 | 기능 |\n|------|-------|-------------|\n| Analyst | 10 | 대부분의 모듈에서 보기 전용 |\n| Compliance Officer | 20 | 컴플라이언스 데이터 생성/편집 |\n| Admin | 30 | 팀 관리 + API 키 |\n| Owner | 40 | 결제 + 조직 설정 + 전체 액세스 |\n\n> **tip** 역할별 모듈별 권한을 사용자 정의할 수 있습니다 — 기본값은 시작점일 뿐입니다.\n\n### 권한 모델\n30개 이상의 각 모듈에는 6개의 권한 플래그가 있습니다:\n- `canView` — 읽기 액세스\n- `canCreate` — 새 레코드 생성\n- `canEdit` — 기존 레코드 수정\n- `canDelete` — 레코드 삭제\n- `canExport` — 데이터 다운로드/내보내기\n- `canInvite` — 팀 구성원 초대",
        },
      ],
    },
    {
      id: "ai-engine",
      icon: "zap",
      title: "AI 컴플라이언스 엔진",
      pages: [
        {
          id: "ai-overview",
          title: "AI 엔진 개요",
          summary:
            "DJAC의 8단계 AI 파이프라인은 DeepSeek를 사용하여 여러 프레임워크에 걸쳐 공급업체 컴플라이언스를 동시에 평가합니다.",
          content:
            "### 8단계 파이프라인\n1. **게이트키퍼** — 입력 검증, 인젝션 탐지, 데이터 정제\n2. **인테이크** — 문서 파싱, 텍스트 정규화, 언어 감지\n3. **추출기** — 키-값-증거 트리플로 구조화된 사실 추출\n4. **RAG 컨텍스트** — 검색 증강 생성: PostgreSQL에서 관련 컴플라이언스 통제 항목을 가져옴\n5. **판정자 (DeepSeek)** — 적용 가능한 통제 요구사항에 대해 각 사실을 평가\n6. **합성기** — 결과를 병합하고 교차 프레임워크 비교 생성\n7. **검증기** — 스키마 검증, 교차 필드 일관성, 실패 시 재시도\n8. **리포터** — PDF, DOCX 또는 JSON 형식의 최종 출력\n\n> **info** 각 단계는 WebSocket 채널에 진행 상황을 기록하므로 평가가 실시간으로 진행되는 것을 확인할 수 있습니다.\n\n### AI 기능\n- **자동 격차 분석** — 누락된 통제 항목 및 비준수 영역 식별\n- **위험 점수 (0-100)** — 프레임워크별 및 종합 컴플라이언스 점수\n- **개선 권장사항** — 우선순위에 따라 순위가 매겨진 AI 제안 조치\n- **벌금 추정** — 관할권에 따른 잠재적 과징금 계산\n- **교차 관할권 비교** — 프레임워크 적용 범위 나란히 분석\n- **실시간 작업 스트리밍** — 평가 중 WebSocket 기반 진행 상황 추적",
        },
        {
          id: "rag-system",
          title: "RAG 컨텍스트 시스템",
          summary:
            "검색 증강 생성 시스템은 AI 분석 전에 데이터베이스에서 가장 관련성 높은 컴플라이언스 통제 항목을 검색합니다.",
          content:
            "### RAG 작동 방식\n1. **문서 파싱** — 공급업체 문서에서 추출된 사실\n2. **의미 검색** — 1,000개 이상의 컴플라이언스 통제 항목과 사실을 매칭\n3. **관련성 점수** — 관할권 및 주제 관련성에 따라 통제 항목 순위 지정\n4. **컨텍스트 구성** — DeepSeek를 위한 집중된 컨텍스트 윈도우 구축\n5. **근거 기반 응답** — AI는 검색된 통제 항목에만 기반하여 평가 (환각 없음)\n\n### 이점\n- 컴플라이언스 조언에서 AI 환각 제거\n- 프레임워크별 권장사항 보장\n- 통제 항목-발견 매핑의 감사 추적 유지\n- 관할권별 통제 항목을 갖춘 30개 관할권 지원\n\n> **tip** RAG 시스템은 DJAC를 법적으로 신뢰할 수 있게 만드는 핵심입니다 — 규제 요구사항에 대해 절대 추측하지 않습니다.\n\n### 지식 베이스\n- 46개 규제 프레임워크\n- 1,000개 이상의 컴플라이언스 통제 항목\n- 14개 이상의 교차 프레임워크 관계 유형\n- 글로벌 표준 클러스터: ISO 27001, NIST CSF, SOC 2, HIPAA, PCI DSS",
        },
      ],
    },
    {
      id: "frameworks",
      icon: "shield",
      title: "컴플라이언스 프레임워크",
      pages: [
        {
          id: "jurisdictions",
          title: "지원 관할 지역",
          summary:
            "DJAC는 APAC, EMEA, 북미, 아프리카 전역의 30개 관할 지역을 포괄적인 규제 프레임워크와 함께 지원합니다.",
          content:
            "### APAC 지역\n- **중국** — PIPL, CSL, DSL, MLPS 2.0\n- **일본** — APPI\n- **대한민국** — PIPA\n- **싱가포르** — PDPA\n- **인도** — DPDP Act\n- **호주** — Privacy Act 1988\n\n### 중동 / GCC\n- **사우디아라비아** — PDPL, NCA ECC / CSCC / OCC\n- **UAE** — UAE PDPL\n- **카타르** — Qatar PDPPL\n- **바레인** — Bahrain PDPL\n- **쿠웨이트** — Kuwait DPA\n- **오만** — Oman PDPL\n\n### 유럽\n- **EU/EEA** — GDPR, NIS2 Directive, DORA\n- **영국** — UK GDPR / DPA 2018\n\n### 북미\n- **미국** — HIPAA, CCPA/CPRA, SOX, PCI DSS\n- **캐나다** — PIPEDA\n\n### 글로벌 표준\n- ISO 27001 / 27002\n- NIST Cybersecurity Framework (CSF)\n- SOC 2 Type II\n- PCI DSS v4.0",
        },
        {
          id: "pipl-guide",
          title: "PIPL 컴플라이언스 가이드",
          summary:
            "중국의 개인정보 보호법(PIPL)에 대한 포괄적인 가이드로, 데이터 현지화 및 국경 간 이전 규칙을 포함합니다.",
          content:
            "### PIPL 개요\n중국의 개인정보 보호법(PIPL)은 2021년 11월 1일부터 시행되었습니다. 이 법은 조직이 중국 내 개인의 개인정보를 수집, 사용, 저장 및 이전하는 방법을 규제합니다.\n\n> **warning** PIPL 위반 시 최대 5천만 위안(RMB) (약 7백만 달러) 또는 연간 매출의 5%에 달하는 벌금이 부과될 수 있습니다.\n\n### 주요 요구사항\n1. **동의** — 데이터 수집에 대한 명시적이고 정보에 입각한 동의\n2. **데이터 최소화** — 필요한 정보만 수집\n3. **목적 제한** — 명시된 목적으로만 데이터 사용\n4. **데이터 현지화** — CIIO는 중국 내에 데이터를 저장해야 함\n5. **국경 간 이전** — CAC 보안 평가 필요\n6. **DPIA** — 고위험 처리 전 영향 평가\n7. **정보주체 권리** — 접근, 정정, 삭제, 이동성\n8. **침해 통지** — 72시간 이내 보고\n\n### DJAC가 지원하는 방법\n- 자동화된 PIPL 통제 매핑 (전체 72개 조항)\n- CAC 지침을 포함한 국경 간 이전 평가\n- PIPL 요구사항에 대한 공급업체 위험 점수 산정\n- 규제 업데이트에 대한 지속적인 모니터링\n- 매출 및 위반 심각도에 기반한 벌금 계산기",
          caseStudy: {
            company: "유럽 SaaS 기업",
            challenge:
              "GDPR 준수을 유지하면서 중국에 진출해야 했습니다. 중국 사용자 데이터를 처리하는 12개 공급업체에 대한 PIPL 격차 분석이 필요했습니다.",
            solution:
              "DJAC의 PIPL 모듈을 사용하여 12개 공급업체를 동시에 평가했습니다. GDPR-PIPL 적용 범위 중복 및 격차를 보여주는 교차 프레임워크 보고서를 생성했습니다.",
            results:
              "공급업체 전반에 걸쳐 47개의 컴플라이언스 격차를 식별했습니다. 6주 이내에 완전한 PIPL 컴플라이언스를 달성했습니다. 법률 자문 비용을 60% 절감했습니다.",
          },
        },
      ],
    },
    {
      id: "vendor-risk",
      icon: "building",
      title: "공급업체 위험 관리",
      pages: [
        {
          id: "vendor-assessment",
          title: "공급업체 규정 준수 평가",
          summary:
            "AI 기반 분석 및 격차 보고서를 통해 선택한 모든 프레임워크에 걸쳐 제3자 공급업체 규정 준수 평가를 자동화합니다.",
          content:
            "### 자동화된 공급업체 평가\n1. **공급업체 등록** — 공급업체 이름, 산업, 관할권 및 기술 스택 추가\n2. **프레임워크 선택** — 적용 가능한 규제 프레임워크 선택\n3. **증거 업로드** — 공급업체 정책, 인증서, 감사 보고서 첨부\n4. **평가 실행** — AI가 선택한 모든 프레임워크에 대해 공급업체 분석\n5. **결과 검토** — 위험 점수(0-100)가 포함된 상세 격차 분석\n6. **보고서 내보내기** — 이해관계자를 위한 전문 PDF/DOCX 보고서\n\n### 평가 출력\n- **종합 점수** — 모든 프레임워크에 걸친 가중 평균(0-100)\n- **프레임워크별 점수** — 개별 규정 준수 점수\n- **위험 수준** — 심각 / 높음 / 중간 / 낮음\n- **격차 분석** — 심각도가 포함된 특정 비준수 통제 항목\n- **개선 계획** — 마감 기한이 포함된 우선순위별 조치 항목\n- **제재 맥락** — 격차별 관할권에 적용되는 벌금\n\n### 지속적 모니터링\nDJAC는 구성 가능한 간격으로 공급업체를 자동으로 재평가하고 다음 사항을 알려줍니다:\n- 기존 공급업체에 영향을 미치는 새로운 규제 요구사항\n- 공급업체 위험 프로필의 변경\n- 만료 예정인 인증서 또는 감사 보고서\n- 공급업체 관할권과 관련된 새로운 위협",
          bestPractices: [
            "계약 체결 후가 아닌 체결 전에 공급업체를 평가하세요",
            "고위험 공급업체에 대해 분기별 재평가 일정을 설정하세요",
            "관할권 간 비교를 사용하여 프레임워크 중복을 식별하세요",
            "평가 결과에 대한 모든 공급업체 응답을 문서화하세요",
            "추적성을 위해 공급업체 격차를 내부 위험 등록부에 연결하세요",
          ],
        },
        {
          id: "supplier-profiles",
          title: "공급업체 규정 준수 프로필",
          summary:
            "관할권별 데이터, 기술 스택 분석 및 연락처 관리를 포함한 포괄적인 공급업체 프로필을 구축합니다.",
          content:
            "### 프로필 구성 요소\n- **기본 정보** — 이름, 산업, 웹사이트, 관할권\n- **기술 스택** — 버전 추적이 포함된 기술 구성 요소\n- **연락처** — 역할 및 관할권이 지정된 주요 담당자\n- **위험 등급** — 데이터 처리에 기반한 자동 위험 분류\n- **평가 이력** — 모든 규정 준수 평가의 전체 타임라인\n- **문서 저장소** — 증거, 인증서, 정책\n\n### 위험 등급 분류\nDJAC는 공급업체 위험 등급을 자동으로 계산합니다:\n- **심각** — 개인/민감 데이터를 처리하며, 규제가 엄격한 관할권에서 운영\n- **높음** — 규제 대상 데이터를 처리하며, 국경 간 데이터 흐름 존재\n- **중간** — 제한적인 데이터 노출, 표준 규제 요구사항\n- **낮음** — 최소한의 위험 프로필, 민감 데이터 처리 없음",
        },
      ],
    },
    {
      id: "api-integration",
      icon: "terminal",
      title: "API 및 통합",
      pages: [
        {
          id: "api-reference",
          title: "API 레퍼런스",
          summary:
            "DJAC는 42개 라우터에 걸쳐 200개 이상의 프로시저를 갖춘 타입 안전 tRPC API와 웹훅 및 상태 확인을 위한 REST 엔드포인트를 제공합니다.",
          content:
            "### API 개요\nDJAC는 엔드투엔드 타입 안전 API 작업을 위해 **tRPC**를 사용합니다. 모든 프로시저는 배치 지원과 함께 `POST /api/trpc`를 통해 처리됩니다.\n\n**기본 URL:**\n- 프로덕션: `https://app.yalla-hack.ae`\n- 로컬: `http://localhost:3000`\n\n### 인증 방법\n| 방법 | 헤더 | 사용 사례 |\n|--------|--------|----------|\n| 세션 쿠키 | `app_session_id` 쿠키 | 웹 앱 (기본) |\n| API 키 | `x-djac-api-key: djac_<hex>` | 프로그래밍 방식 접근 |\n| Clerk OAuth | 자동 관리 | 외부 OAuth |\n\n### 라우터 카테고리\n| 도메인 | 라우터 | 주요 프로시저 |\n|--------|---------|----------------|\n| 인증 | `localAuth`, `auth`, `googleAuth` | register, login, mfa |\n| 조직 | `orgSettings`, `orgMembers` | create, invite, updateRole |\n| RBAC | `role`, `rbac` | getPermissions, setPermissions |\n| 컴플라이언스 | `compliance`, `regulatoryChanges` | frameworks.list, controls.get |\n| 벤더 | `vendor`, `vendorCompliance` | list, create, assess |\n| 리스크 | `riskRegister`, `remediation` | list, create, update |\n| AI | `ai` | startAssessment, getJob |\n| 보고서 | `complianceReport` | generate, download, schedule |\n| 결제 | `billing` | getPlans, checkout |\n| 관리자 | `admin`, `system` | getStats, getAuditLogs |\n\n### 오류 코드\n| 코드 | 설명 |\n|------|-------------|\n| `UNAUTHORIZED` | 인증 필요 |\n| `FORBIDDEN` | 권한 부족 |\n| `NOT_FOUND` | 리소스를 찾을 수 없음 |\n| `VALIDATION_ERROR` | 입력 유효성 검사 실패 |\n| `RATE_LIMITED` | 요청이 너무 많음 |",
        },
        {
          id: "websocket",
          title: "WebSocket 스트리밍",
          summary:
            "실시간 AI 평가 진행 상황은 /ws/ai-jobs에서 WebSocket을 통해 작업 수명 주기 이벤트와 함께 스트리밍됩니다.",
          content:
            '### WebSocket 엔드포인트\n**URL:** `wss://app.yalla-hack.ae/ws/ai-jobs`\n\n### 이벤트 유형\n| 이벤트 | 방향 | 페이로드 |\n|-------|-----------|---------|\n| `job:progress` | 서버 → 클라이언트 | `{ jobId, stage, message, progress }` |\n| `job:complete` | 서버 → 클라이언트 | `{ jobId, result }` |\n| `job:error` | 서버 → 클라이언트 | `{ jobId, error: string }` |\n| `subscribe` | 클라이언트 → 서버 | `{ jobId: string }` |\n\n### 예제\n```typescript\nconst ws = new WebSocket("wss://app.yalla-hack.ae/ws/ai-jobs");\nws.onopen = () => ws.send(JSON.stringify({ type: "subscribe", jobId }));\nws.onmessage = (e) => {\n  const { type, stage, message } = JSON.parse(e.data);\n  if (type === "job:progress") updateUI(stage, message);\n  if (type === "job:complete") showResults(data.result);\n};\n```',
        },
      ],
    },
    {
      id: "security-compliance",
      icon: "lock",
      title: "보안 및 규정 준수",
      pages: [
        {
          id: "security-overview",
          title: "보안 아키텍처",
          summary:
            "DJAC는 OWASP Top 10에 따라 인증, 권한 부여, 데이터 보호 및 인프라 전반에 걸쳐 심층 방어를 구현합니다.",
          content:
            "### 심층 방어\n**인증:**\n- bcrypt(12 라운드)로 해시된 비밀번호\n- HS256(최소 64자 비밀 키)으로 서명된 JWT 토큰\n- HTTP-only, Secure, SameSite 쿠키\n- 백업 코드를 사용하는 TOTP 기반 MFA\n- OTP 기반 비밀번호 재설정(SHA-256, 5분 만료)\n\n**권한 부여:**\n- 7개 플랫폼 역할 + 4개 조직 역할\n- 32개 권한 제어 모듈\n- 모든 PostgreSQL 테이블에 행 수준 보안(Row-Level Security)\n- 조직 범위 데이터 격리\n\n**데이터 보호:**\n- 전송 중인 모든 데이터에 TLS 1.3\n- 저장 시 PostgreSQL 암호화(Supabase)\n- Vercel 환경 변수 + GitHub Actions에 비밀 정보 저장\n\n### 보안 헤더\n| 헤더 | 값 | 목적 |\n|--------|-------|---------|\n| Strict-Transport-Security | max-age=63072000 | HTTPS 강제 |\n| X-Content-Type-Options | nosniff | MIME 스니핑 방지 |\n| X-Frame-Options | DENY | 클릭재킹 방지 |\n| Content-Security-Policy | 경로별 제한 | XSS 완화 |\n| Referrer-Policy | strict-origin | 리퍼러 유출 방지 |\n\n### CVE 패치\n- Dependabot 자동 취약점 경고\n- 전이적 종속성 패치를 위한 pnpm overrides\n- CI 파이프라인의 CodeQL 보안 분석",
        },
        {
          id: "rbac-system",
          title: "RBAC 및 권한 시스템",
          summary:
            "조직별 사용자 정의 역할 재정의를 통해 32개 플랫폼 모듈 전반에 걸친 세분화된 권한.",
          content:
            "### 권한 확인 흐름\n1. 요청이 tRPC 프로시저에 도착\n2. 인증 미들웨어가 `ctx.user` 및 `ctx.orgRole` 추출\n3. 시스템이 사용자 정의 `rolePermissions` 행 확인\n4. `DEFAULT_ORG_ROLE_PERMISSIONS`로 대체\n5. 작업을 PermissionFlags와 비교\n6. 허용 또는 403 FORBIDDEN 반환\n\n### 권한 플래그\n각 모듈에는 6개의 플래그가 있습니다:\n- `canView` — 읽기 액세스\n- `canCreate` — 새 레코드 생성\n- `canEdit` — 기존 레코드 수정\n- `canDelete` — 레코드 삭제\n- `canExport` — 데이터 다운로드/내보내기\n- `canInvite` — 팀 구성원 초대\n\n### 기본 템플릿\n| 역할 | 기본 패턴 |\n|------|----------------|\n| Analyst | 대부분의 모듈에서 VIEW_ONLY |\n| Compliance Officer | 규정 준수에 STANDARD |\n| Admin | 규정 준수에 FULL, 설정에 STANDARD |\n| Owner | 모든 항목에 FULL |",
        },
      ],
    },
    {
      id: "developer-guide",
      icon: "code",
      title: "개발자 가이드",
      pages: [
        {
          id: "dev-setup",
          title: "개발 환경 설정",
          summary:
            "Node.js 20+, pnpm 10+, Supabase용 Docker 및 필요한 모든 서비스를 사용하여 로컬 환경을 설정합니다.",
          content:
            "### 사전 요구 사항\n- Node.js 20+\n- pnpm 10+ (`npm install -g pnpm@10`)\n- Docker Desktop (Supabase용)\n- Supabase CLI (`npm install -g supabase`)\n\n### 최초 설정\n```bash\ngit clone <repo-url> djac && cd djac\npnpm install\ncp .env.example .env\nsupabase start\npnpm db:push\npnpm seed:data\npnpm dev\n# → http://localhost:3000\n```\n\n### 개발 인증 우회\n```env\nDEV_AUTH_BYPASS=true\nDEV_AUTH_EMAIL=dev@example.com\nDEV_AUTH_ROLE=super_admin\n```\n\n### 사용 가능한 스크립트\n| 명령어 | 목적 |\n|---------|---------|\n| `pnpm dev` | 개발 서버 시작 |\n| `pnpm check` | TypeScript 타입 검사 |\n| `pnpm lint` | ESLint |\n| `pnpm test` | 테스트 실행 (vitest) |\n| `pnpm build` | 프로덕션 빌드 |\n| `pnpm verify:all` | 모든 검사 + 빌드 |",
          demoSteps: [
            "저장소를 복제하고 'pnpm install'로 종속성을 설치합니다",
            "'.env.example'을 '.env'로 복사하고 필요한 값을 입력합니다",
            "'supabase start'로 로컬에서 Supabase를 시작합니다",
            "'pnpm db:push'로 데이터베이스 스키마를 푸시합니다",
            "'pnpm seed:data'로 참조 데이터를 시드합니다",
            "'pnpm dev'로 개발 서버를 시작합니다 → http://localhost:3000",
          ],
        },
        {
          id: "adding-features",
          title: "새 기능 추가",
          summary:
            "새로운 tRPC 라우터, React 페이지, 데이터베이스 테이블 및 테스트를 추가하기 위한 DJAC의 패턴을 따르세요.",
          content:
            '### tRPC 라우터 추가\n```typescript\n// server/my-feature-router.ts\nimport { orgProcedure, router } from "./_core/trpc";\nimport { z } from "zod";\n\nexport const myFeatureRouter = router({\n  list: orgProcedure\n    .input(z.object({ orgId: z.string() }))\n    .query(async ({ ctx, input }) => {\n      const db = getDb();\n      return db.select().from(myTable).where(eq(myTable.orgId, input.orgId));\n    }),\n  create: orgProcedure\n    .input(z.object({ orgId: z.string(), name: z.string() }))\n    .mutation(async ({ ctx, input }) => {\n      const [rec] = await db.insert(myTable).values(input).returning();\n      return rec;\n    }),\n});\n```\n\n`server/routers.ts`에 등록:\n```typescript\nimport { myFeatureRouter } from "./my-feature-router";\nexport const appRouter = router({ myFeature: myFeatureRouter });\n```\n\n### API 설계 규칙\n1. 모든 변경(mutation)은 Zod 유효성 검사를 사용하는 tRPC를 사용합니다\n2. 인증된 경우 `protectedProcedure`, 조직 범위의 경우 `orgProcedure`를 사용합니다\n3. 권한 부여를 위해 `ctx.user.role`을 확인합니다\n4. 클라이언트 입력을 절대 신뢰하지 마세요 — 항상 Zod로 유효성을 검사하세요',
        },
      ],
    },
    {
      id: "deployment-operations",
      icon: "server",
      title: "배포 및 운영",
      pages: [
        {
          id: "deployment",
          title: "배포 옵션",
          summary:
            "DJAC은 Vercel(서버리스), Docker, 수동 VPS 배포를 지원합니다. CI/CD 파이프라인은 스테이징과 프로덕션을 자동화합니다.",
          content:
            "### Vercel (권장)\n```bash\npnpm build\nvercel --prod\nsupabase db push --linked\nsupabase functions deploy\ncurl https://your-app.com/api/health\n```\n\n### Docker\n```bash\ndocker build -t djac:latest .\ndocker run -d -p 3000:3000 --env-file .env.production --name djac-app djac:latest\n```\n\n### CI/CD 파이프라인\n| 워크플로우 | 트리거 | 작업 |\n|----------|---------|---------|\n| CI | Push/PR | Lint, Typecheck, Test, Build |\n| 스테이징 | develop에 Push | Vercel 프리뷰로 자동 배포 |\n| 프로덕션 | main에 Push | 배포 + DB 마이그레이션 + 헬스 체크 |\n\n### 프로덕션 체크리스트\n- [ ] JWT_SECRET ≥ 64자\n- [ ] DEV_AUTH_BYPASS=false\n- [ ] DB 풀 크기: 25 연결\n- [ ] Redis 구성됨\n- [ ] RLS 정책 활성화됨\n- [ ] Sentry 오류 추적 활성화됨",
        },
        {
          id: "monitoring",
          title: "모니터링 및 관측성",
          summary:
            "오류 추적을 위한 Sentry, 구조화된 로깅을 위한 Pino, 운영 모니터링을 위한 헬스/레디니스 엔드포인트.",
          content:
            "### 헬스 엔드포인트\n| 엔드포인트 | 목적 |\n|----------|---------|\n| `/api/health` | 헬스 체크 (상태, 가동 시간) |\n| `/api/readyz` | 레디니스 (DB, Redis, Stripe, AI) |\n\n### 백그라운드 스케줄러\n| 스케줄러 | 간격 | 목적 |\n|-----------|----------|---------|\n| 상호작용 보존 | 24시간 | 오래된 로그 제거 |\n| 체험판 알림 | 6시간 | 만료 예정 체험판 이메일 |\n| 마감 알림 | 1시간 | 규제 마감 알림 |\n| 보고서 전달 | 구성 | 예약된 보고서 생성 |",
        },
        {
          id: "troubleshooting",
          title: "일반적인 문제 해결",
          summary: "일반적인 개발, 배포 및 운영 문제에 대한 해결책.",
          content:
            '### 일반적인 문제\n**DB 연결 오류:** `.env`의 `DATABASE_URL`을 확인하세요. Supabase가 실행 중인지 확인하세요.\n\n**AI가 "queued" 상태에 멈춤:** Redis 연결을 확인하세요. 개발 모드에서는 `AI_QUEUE_MODE=in_memory`를 확인하세요.\n\n**OpenAI 401:** 유효하지 않은 `OPENAI_API_KEY`입니다.\n\n**Vercel 빌드 실패:** 환경 변수를 확인하세요. Node 20+인지 확인하세요. `pnpm build`로 테스트하세요.\n\n### 디버깅\n- 디버그 로그: `LOG_LEVEL=debug pnpm dev`\n- 요청 추적: `X-Request-ID` 헤더\n- 오류는 Sentry 대시보드에서 확인하세요',
          troubleshooting: [
            {
              problem: "로그인이 'Authentication required (10001)'를 반환함",
              solution:
                ".env의 JWT_SECRET을 확인하세요. 브라우저 쿠키를 지우세요. COOKIE_DOMAIN을 확인하세요.",
            },
            {
              problem: "pnpm db:push가 마이그레이션 오류로 실패함",
              solution:
                "'supabase db status'로 확인하세요. 개발 초기화에는 'supabase db reset'을 사용하세요.",
            },
            {
              problem: "Vercel 빌드가 메모리 제한으로 실패함",
              solution:
                "큰 종속성을 외부화하세요. Vercel 설정에서 Node 메모리를 늘리세요.",
            },
            {
              problem: "Stripe 웹훅이 이벤트를 수신하지 못함",
              solution:
                "STRIPE_WEBHOOK_SECRET을 확인하세요. 로컬 테스트에는 'stripe listen'을 사용하세요.",
            },
          ],
        },
      ],
    },
    {
      id: "billing-plans",
      icon: "card",
      title: "청구 및 요금제",
      pages: [
        {
          id: "pricing-overview",
          title: "가격 및 요금제 개요",
          summary:
            "스타트업부터 글로벌 기업까지 모든 규모의 팀을 위한 유연한 구독 요금제.",
          content:
            "### 요금제 비교\n| 기능 | 무료 체험 | 스타터 | 프로페셔널 | 엔터프라이즈 |\n|---------|-----------|---------|-------------|------------|\n| 관할 구역 | 1 | 3 | 10 | 무제한 |\n| 공급업체 | 5 | 25 | 100 | 무제한 |\n| 월별 AI 평가 | 3 | 20 | 100 | 맞춤형 |\n| 팀 멤버 | 2 | 10 | 50 | 무제한 |\n| API 액세스 | — | — | ✓ | ✓ |\n| 우선 지원 | — | — | ✓ | ✓ |\n| SLA | — | 99.5% | 99.9% | 99.95% |\n\n### 청구 주기\n- **월간** — 표준 요금\n- **분기** — 10% 할인\n- **반기** — 15% 할인\n- **연간** — 20% 할인\n\n### 무료 체험\n- 스타터 요금제에서 14일 무료 체험\n- 신용 카드 필요 없음\n- 모든 스타터 기능에 대한 전체 액세스",
        },
        {
          id: "subscription-management",
          title: "구독 관리",
          summary:
            "Stripe 고객 포털을 통해 업그레이드, 다운그레이드 또는 취소하세요. 청구 내역 및 인보이스를 확인하세요.",
          content:
            "### 구독 수명 주기\n1. **체험** → 가입 시 자동 14일 체험\n2. **활성** → 유료 구독\n3. **연체** → 결제 실패; 유예 기간\n4. **취소됨** → 30일 동안 데이터 보존\n\n### 업그레이드 / 다운그레이드\n- **업그레이드:** 즉시 액세스. 일할 계산된 요금.\n- **다운그레이드:** 청구 기간 종료 시 적용.\n\n### 청구 포털\n액세스 방법: **대시보드 → 청구 및 요금제 → 구독 관리**\n- 결제 방법 업데이트\n- 청구 내역 보기\n- 인보이스 다운로드\n- 요금제 변경/취소",
          troubleshooting: [
            {
              problem: "결제가 실패했지만 카드는 유효함",
              solution:
                "해외 거래 차단 여부를 확인하세요. 다른 카드를 시도하거나 지원팀에 문의하세요.",
            },
            {
              problem: "업그레이드가 대시보드에 반영되지 않음",
              solution:
                "프로비저닝에 최대 5분이 소요될 수 있습니다. 새로 고치거나 로그아웃/로그인을 시도하세요.",
            },
            {
              problem: "체험이 종료되었지만 시간이 더 필요함",
              solution:
                "일회성 7일 연장을 위해 지원팀에 문의하세요 (조직당 1회).",
            },
          ],
        },
      ],
    },
    {
      id: "operations",
      icon: "gauge",
      title: "사이버 운영",
      pages: [
        {
          id: "risk-register",
          title: "위험 등록부",
          summary:
            "자동화된 심각도 점수 산정, 처리 계획, 프레임워크 연계를 통한 중앙 집중식 위험 관리.",
          content:
            "### 위험 관리 워크플로\n1. **식별** — 카테고리 및 발생 가능성/영향도와 함께 위험 기록\n2. **평가** — 자동화된 위험 점수 산정(발생 가능성 × 영향도)\n3. **처리** — 수용, 완화, 전가 또는 회피\n4. **연계** — 위험을 공급업체, 프레임워크 및 작업과 연결\n5. **모니터링** — 상태 및 처리 진행 상황 추적\n\n### 위험 카테고리\n- **운영** — 프로세스 실패, 시스템 중단\n- **법률** — 규제 미준수, 계약 위반\n- **기술** — 보안 취약점, 아키텍처 약점\n- **재무** — 예산 초과, 사기 노출\n- **평판** — 브랜드 손상, 고객 신뢰 침식",
        },
        {
          id: "incident-management",
          title: "사고 관리",
          summary:
            "자동화된 규제 매핑을 통해 보안 및 컴플라이언스 사고를 기록, 추적 및 해결합니다.",
          content:
            "### 사고 라이프사이클\n1. **탐지** — 유형, 심각도, 영향을 받은 시스템과 함께 사고 기록\n2. **분류** — 자동화된 심각도 분류\n3. **조사** — 증거와 함께 타임라인 추적\n4. **격리** — 조치 추적, 알림\n5. **해결** — 근본 원인 분석, 교정 문서\n6. **종료** — 사후 검토\n\n### 자동화된 규제 매핑\n- 중국 내 데이터 침해 → PIPL 제57조 (CAC에 72시간 이내)\n- EU 내 데이터 침해 → GDPR 제33조 (DPA에 72시간 이내)\n- 보안 사고 → 다중 프레임워크 영향 식별",
        },
      ],
    },
    {
      id: "case-studies",
      icon: "star",
      title: "사례 연구",
      pages: [
        {
          id: "enterprise-expansion",
          title: "엔터프라이즈 국경 간 확장",
          summary:
            "포춘 500대 제조업체가 DJAC를 사용하여 50개 이상의 공급업체에 대해 중국, 사우디아라비아 및 EU에서 규정 준수를 달성한 방법.",
          content:
            "### 배경\n매출 20억 달러 이상의 글로벌 제조업체가 12개국에 걸쳐 53개 공급업체와 함께 중국, 사우디아라비아 및 EU로 확장해야 했습니다.\n\n### 과제\n- 53개 공급업체, 3개 신규 관할권, 90일 기한\n- 수동 평가: 6개월 이상, 컨설팅 비용 50만 달러 이상\n\n### DJAC 솔루션\n1. **1-2주차**: 53개 공급업체 모두 등록\n2. **2-3주차**: PIPL, PDPL, GDPR에 대한 AI 평가 실행\n3. **3-4주차**: 프레임워크 간 격차 분석 — 312개 격차 발견\n4. **4-8주차**: 개선 계획자가 격차 해소 추적\n5. **8-12주차**: 지속적 모니터링으로 완전한 규정 준수 확인\n\n### 결과\n- ✅ 82일 만에 완전한 규정 준수 달성 (예상 180일 대비)\n- ✅ 312개 격차 식별, 60일 내 298개 해소\n- ✅ 컨설팅 비용 38만 달러 절감\n- ✅ 지속적 모니터링 비용 70% 절감\n- ✅ 첫 규제 감사에서 발견 사항 없음",
        },
        {
          id: "saas-startup",
          title: "SaaS 스타트업 신속한 규정 준수",
          summary:
            "15명 규모의 스타트업이 DJAC를 사용하여 30일 만에 SOC 2 및 GDPR 준비를 달성한 방법.",
          content:
            "### 배경\n15명의 직원을 둔 시리즈 A 스타트업이 엔터프라이즈 계약을 성사시키기 위해 SOC 2 Type II 및 GDPR 규정 준수가 필요했습니다.\n\n### 과제\n- 기존 규정 준수 프로그램 없음\n- 평가해야 할 7개 클라우드 공급업체\n- 규정 준수를 위한 월 5,000달러 예산\n\n### DJAC 솔루션\n1. 팀 온보딩, 조직 프로필 설정\n2. AI 추천 통제로 SOC 2 + GDPR 선택\n3. 7개 공급업체 모두 등록, 평가 실행\n4. 정책 관리자에서 정책 템플릿 생성\n5. 감사인 검토 중 지속적 점검\n\n### 결과\n- ✅ 28일 만에 SOC 2 Type II 제공\n- ✅ 30일 만에 GDPR 프로그램 구축\n- ✅ 3건의 엔터프라이즈 계약 성사 (연간 반복 매출 48만 달러)\n- ✅ 지속적 규정 준수 비용 월 250달러 미만",
        },
      ],
    },
  ],
  pt: [
    {
      id: "getting-started",
      icon: "book",
      title: "Primeiros Passos",
      pages: [
        {
          id: "welcome",
          title: "Bem-vindo ao DJAC",
          summary:
            "O DJAC é a primeira plataforma de inteligência de conformidade entre jurisdições do mundo com IA. Implante em minutos e alcance a conformidade regulatória em ${COVERAGE.jurisdictions} jurisdições.",
          content:
            "### O que é o DJAC?\nO DJAC (De Jure Automated Compliance) é uma plataforma SaaS empresarial que automatiza a conformidade regulatória entre jurisdições — China, Arábia Saudita, CCG, UE, América do Norte e APAC.\n\n> **info** Criado para responsáveis pela conformidade, equipes jurídicas, administradores empresariais, consultores e reguladores governamentais.\n\n### Por que o DJAC?\n- **30 Jurisdições** — PIPL, PDPL, CSL, DSL, GDPR, ISO 27001, SOC 2, NIST CSF, HIPAA e mais\n- **Análise com IA** — Pipeline de avaliação de conformidade em 8 etapas impulsionado pelo DeepSeek\n- **Monitoramento em Tempo Real** — Acompanhamento contínuo de conformidade com detecção automatizada de lacunas\n- **Inteligência Transfronteiriça** — Verificador de conformidade de transferência de dados e monitoramento de mudanças regulatórias\n- **Gestão de Risco de Fornecedores** — Avaliações automatizadas de terceiros em todos os frameworks selecionados\n- **Segurança de Nível Empresarial** — Criptografia AES-256, RBAC, trilhas de auditoria, pronto para SOC 2\n\n> **tip** A interface do DJAC está disponível em 9 idiomas — alterne a qualquer momento no menu de localidade do cabeçalho. Esta documentação é publicada em inglês, árabe e chinês; outros idiomas da interface veem a versão em inglês aqui.\n\n### Início Rápido (5 minutos)\n1. **Crie sua organização** — Configure o perfil da sua empresa e o faturamento\n2. **Selecione jurisdições** — Escolha China, Arábia Saudita, UE ou qualquer combinação\n3. **Escolha frameworks** — A IA recomenda automaticamente as regulamentações relevantes\n4. **Registre um fornecedor** — Adicione seu primeiro fornecedor terceirizado\n5. **Execute a avaliação** — A IA gera um relatório de conformidade completo em menos de 60 segundos\n\n> **tip** O assistente de integração orienta você por todo esse fluxo — procure-o no seu painel após se inscrever.\n\n### Níveis da Plataforma\n| Nível | Mensal | Ideal Para |\n|------|---------|----------|\n| Starter | A partir de $99/mês | Equipes pequenas, jurisdição única |\n| Professional | A partir de $249/mês | Conformidade multi-jurisdicional |\n| Enterprise | Personalizado | Empresas globais, API, suporte dedicado |\n\n> **faq** Quanto tempo leva uma avaliação de fornecedor por IA?\n> **answer** A maioria das avaliações é concluída em menos de 60 segundos, transmitindo o progresso ao vivo via WebSocket conforme cada uma das 8 etapas do pipeline é finalizada.\n> **faq** Quais regulamentações são suportadas nativamente?\n> **answer** 46 frameworks com detalhamento completo em nível de controle, além de 107 pacotes de frameworks selecionados, em 30 jurisdições — incluindo GDPR, NIS2, DORA, PIPL, PDPL, ISO 27001, SOC 2 e mais. O motor de IA recomenda automaticamente os relevantes para o seu perfil.\n> **faq** O DJAC pode ser executado na nossa própria infraestrutura?\n> **answer** Sim — além da hospedagem em nuvem na Vercel, a implantação auto-hospedada com Docker é suportada, e a plataforma pode ser estendida com frameworks personalizados.",
        },
        {
          id: "architecture",
          title: "Arquitetura da Plataforma",
          summary:
            "O DJAC é executado em uma arquitetura nativa da nuvem com React 19, Express + tRPC, PostgreSQL no Supabase, Redis e Google DeepSeek.",
          content:
            "### Arquitetura do Sistema\nO DJAC emprega uma arquitetura moderna de monorepo:\n\n**Frontend**: React 19 + TypeScript + Vite 7 + Tailwind CSS 4 + shadcn/ui  \n**Backend**: Express 4 + tRPC 11 (mais de 200 procedimentos de API) + Drizzle ORM  \n**Banco de Dados**: PostgreSQL 17 no Supabase (AWS Tóquio, ap-northeast-2)  \n**Motor de IA**: Google DeepSeek com pipeline de avaliação em 8 etapas  \n**Fila**: Em memória / Redis (pronto para BullMQ)  \n**Autenticação**: Três caminhos (Clerk OAuth + Supabase Auth + JWT Local)  \n**Faturamento**: Stripe (5 planos × 4 intervalos)  \n**Hospedagem**: Vercel (serverless) + Docker\n\n### Fluxo de Dados\n1. O usuário envia uma solicitação de avaliação de fornecedor\n2. O Gatekeeper valida as entradas (detecção de injeção)\n3. O Intake analisa documentos e normaliza o texto\n4. O Extractor identifica fatos estruturados (triplas chave-valor-evidência)\n5. O RAG Context recupera controles de conformidade relevantes do banco de dados\n6. O Judge (DeepSeek) avalia a conformidade em relação aos controles\n7. O Synthesizer mescla as descobertas em um relatório entre frameworks\n8. O Validator garante a consistência do esquema e a integridade dos dados\n9. O Reporter gera a saída final formatada (PDF/DOCX/JSON)",
          diagram:
            "[Usuário] → [Gatekeeper] → [Intake] → [Extractor] → [RAG] → [Judge (DeepSeek)] → [Synthesizer] → [Validator] → [Reporter] → [PDF / DOCX / JSON]",
        },
        {
          id: "roles",
          title: "Funções e Permissões",
          summary:
            "O DJAC oferece controle de acesso granular baseado em funções com 6 funções de plataforma e 4 funções de organização em mais de 30 módulos.",
          content:
            "### Funções da Plataforma\n| Função | Nível | Acesso |\n|------|-------|--------|\n| Usuário Básico | 10 | Acesso somente leitura aos módulos atribuídos |\n| Usuário Profissional | 20 | Acesso total aos recursos de conformidade |\n| Administrador da Empresa | 30 | Gestão da organização + equipe |\n| Administrador da Plataforma | 40 | Supervisão e configuração entre organizações |\n| Funcionário da Yalla Hack | 45 | Suporte interno e operações |\n| Super Administrador | 100 | Acesso irrestrito total à plataforma |\n\n### Funções da Organização\n| Função | Nível | Capacidades |\n|------|-------|-------------|\n| Analista | 10 | Somente visualização na maioria dos módulos |\n| Responsável pela Conformidade | 20 | Criar/Editar dados de conformidade |\n| Administrador | 30 | Gestão de equipe + chaves de API |\n| Proprietário | 40 | Faturamento + configurações da organização + acesso total |\n\n> **tip** Você pode personalizar as permissões por módulo por função — os padrões são apenas pontos de partida.\n\n### Modelo de Permissões\nCada um dos mais de 30 módulos tem 6 sinalizadores de permissão:\n- `canView` — Acesso de leitura\n- `canCreate` — Criar novos registros\n- `canEdit` — Modificar registros existentes\n- `canDelete` — Remover registros\n- `canExport` — Baixar/exportar dados\n- `canInvite` — Convidar membros da equipe",
        },
      ],
    },
    {
      id: "ai-engine",
      icon: "zap",
      title: "Motor de Conformidade com IA",
      pages: [
        {
          id: "ai-overview",
          title: "Visão Geral do Motor de IA",
          summary:
            "O pipeline de IA de 8 estágios do DJAC usa o DeepSeek para avaliar a conformidade do fornecedor em vários frameworks simultaneamente.",
          content:
            "### O Pipeline de 8 Estágios\n1. **Gatekeeper** — Validação de entrada, detecção de injeção, sanitização de dados\n2. **Intake** — Análise de documentos, normalização de texto, detecção de idioma\n3. **Extractor** — Extração estruturada de fatos em triplas chave-valor-evidência\n4. **RAG Context** — Geração Aumentada por Recuperação: extrai controles de conformidade relevantes do PostgreSQL\n5. **Judge (DeepSeek)** — Avalia cada fato em relação aos requisitos de controle aplicáveis\n6. **Synthesizer** — Mescla descobertas, gera comparação entre frameworks\n7. **Validator** — Validação de esquema, consistência entre campos, nova tentativa em caso de falha\n8. **Reporter** — Saída final formatada em PDF, DOCX ou JSON\n\n> **info** Cada estágio registra seu progresso no canal WebSocket para que você possa acompanhar as avaliações em tempo real.\n\n### Recursos de IA\n- **Análise Automatizada de Lacunas** — Identifica controles ausentes e áreas de não conformidade\n- **Pontuação de Risco (0-100)** — Pontuações de conformidade por framework e agregadas\n- **Recomendações de Remediação** — Ações sugeridas pela IA classificadas por prioridade\n- **Estimativa de Penalidades** — Calcula multas potenciais com base na jurisdição\n- **Comparação entre Jurisdições** — Análise lado a lado da cobertura de frameworks\n- **Streaming de Tarefas em Tempo Real** — Acompanhamento de progresso via WebSocket durante as avaliações",
        },
        {
          id: "rag-system",
          title: "Sistema de Contexto RAG",
          summary:
            "O sistema de Geração Aumentada por Recuperação recupera os controles de conformidade mais relevantes do banco de dados antes da análise de IA.",
          content:
            "### Como o RAG Funciona\n1. **Análise de Documentos** — Fatos extraídos de documentos do fornecedor\n2. **Busca Semântica** — Compara fatos com mais de 1.000 controles de conformidade\n3. **Pontuação de Relevância** — Classifica controles por relevância jurisdicional e tópica\n4. **Montagem de Contexto** — Constrói uma janela de contexto focada para o DeepSeek\n5. **Resposta Fundamentada** — A IA avalia com base APENAS nos controles recuperados (sem alucinação)\n\n### Benefícios\n- Elimina alucinações de IA em aconselhamento de conformidade\n- Garante recomendações específicas para cada framework\n- Mantém trilha de auditoria de mapeamentos de controle para descoberta\n- Suporta 30 jurisdições com controles específicos por jurisdição\n\n> **tip** O sistema RAG é o que torna o DJAC legalmente confiável — ele nunca adivinha sobre requisitos regulatórios.\n\n### Base de Conhecimento\n- 46 frameworks regulatórios\n- Mais de 1.000 controles de conformidade\n- Mais de 14 tipos de relacionamentos entre frameworks\n- Cluster de padrões globais: ISO 27001, NIST CSF, SOC 2, HIPAA, PCI DSS",
        },
      ],
    },
    {
      id: "frameworks",
      icon: "shield",
      title: "Estruturas de Conformidade",
      pages: [
        {
          id: "jurisdictions",
          title: "Jurisdições Suportadas",
          summary:
            "O DJAC abrange 30 jurisdições na APAC, EMEA, América do Norte e África com estruturas regulatórias abrangentes.",
          content:
            "### Região APAC\n- **China** — PIPL, CSL, DSL, MLPS 2.0\n- **Japão** — APPI\n- **Coreia do Sul** — PIPA\n- **Singapura** — PDPA\n- **Índia** — DPDP Act\n- **Austrália** — Privacy Act 1988\n\n### Oriente Médio / GCC\n- **Arábia Saudita** — PDPL, NCA ECC / CSCC / OCC\n- **EAU** — UAE PDPL\n- **Catar** — Qatar PDPPL\n- **Bahrein** — Bahrain PDPL\n- **Kuwait** — Kuwait DPA\n- **Omã** — Oman PDPL\n\n### Europa\n- **UE/EEE** — GDPR, Diretiva NIS2, DORA\n- **Reino Unido** — UK GDPR / DPA 2018\n\n### América do Norte\n- **Estados Unidos** — HIPAA, CCPA/CPRA, SOX, PCI DSS\n- **Canadá** — PIPEDA\n\n### Padrões Globais\n- ISO 27001 / 27002\n- NIST Cybersecurity Framework (CSF)\n- SOC 2 Type II\n- PCI DSS v4.0",
        },
        {
          id: "pipl-guide",
          title: "Guia de Conformidade com a PIPL",
          summary:
            "Guia abrangente da Lei de Proteção de Informações Pessoais da China (PIPL), incluindo localização de dados e regras de transferência transfronteiriça.",
          content:
            "### Visão Geral da PIPL\nA Lei de Proteção de Informações Pessoais da China (PIPL) entrou em vigor em 1º de novembro de 2021. Ela regula como as organizações coletam, usam, armazenam e transferem informações pessoais de indivíduos na China.\n\n> **warning** Violações da PIPL podem resultar em multas de até ¥50 milhões RMB (~$7M USD) ou 5% da receita anual.\n\n### Requisitos Principais\n1. **Consentimento** — Consentimento explícito e informado para coleta de dados\n2. **Minimização de Dados** — Coletar apenas o necessário\n3. **Limitação de Finalidade** — Usar dados apenas para finalidades especificadas\n4. **Localização de Dados** — CIIOs devem armazenar dados na China\n5. **Transferência Transfronteiriça** — Avaliação de segurança da CAC necessária\n6. **DPIAs** — Avaliações de impacto antes de processamento de alto risco\n7. **Direitos do Titular dos Dados** — Acesso, correção, exclusão, portabilidade\n8. **Notificação de Violação** — Reportar em até 72 horas\n\n### Como o DJAC Ajuda\n- Mapeamento automatizado de controles PIPL (todos os 72 artigos)\n- Avaliação de transferência transfronteiriça com orientação da CAC\n- Pontuação de risco de fornecedores em relação aos requisitos da PIPL\n- Monitoramento contínuo para atualizações regulatórias\n- Calculadora de penalidades baseada em receita e gravidade da violação",
          caseStudy: {
            company: "Empresa Europeia de SaaS",
            challenge:
              "Precisava lançar na China mantendo a conformidade com o GDPR. Exigia análise de lacunas da PIPL para 12 fornecedores que lidam com dados de usuários chineses.",
            solution:
              "Usou o módulo PIPL do DJAC para avaliar todos os 12 fornecedores simultaneamente. Gerou relatório entre estruturas mostrando sobreposição e lacunas de cobertura GDPR-PIPL.",
            results:
              "Identificou 47 lacunas de conformidade entre fornecedores. Alcançou conformidade total com a PIPL em 6 semanas. Reduziu custos de consultoria jurídica em 60%.",
          },
        },
      ],
    },
    {
      id: "vendor-risk",
      icon: "building",
      title: "Gestão de Risco de Fornecedores",
      pages: [
        {
          id: "vendor-assessment",
          title: "Avaliação de Conformidade de Fornecedores",
          summary:
            "Automatize avaliações de conformidade de fornecedores terceiros em todos os frameworks selecionados com análise alimentada por IA e relatórios de lacunas.",
          content:
            "### Avaliação Automatizada de Fornecedores\n1. **Registrar Fornecedor** — Adicione nome do fornecedor, setor, jurisdição e stack tecnológico\n2. **Selecionar Frameworks** — Escolha os frameworks regulatórios aplicáveis\n3. **Carregar Evidências** — Anexe políticas, certificações e relatórios de auditoria do fornecedor\n4. **Executar Avaliação** — A IA analisa o fornecedor em relação a todos os frameworks selecionados\n5. **Revisar Resultados** — Análise detalhada de lacunas com pontuação de risco (0-100)\n6. **Exportar Relatório** — Relatório profissional em PDF/DOCX para as partes interessadas\n\n### Resultado da Avaliação\n- **Pontuação Geral** — Média ponderada em todos os frameworks (0-100)\n- **Pontuações por Framework** — Pontuações individuais de conformidade\n- **Nível de Risco** — Crítico / Alto / Médio / Baixo\n- **Análise de Lacunas** — Controles específicos não conformes com severidade\n- **Plano de Remediação** — Itens de ação priorizados com prazos\n- **Contexto de Penalidades** — Multas aplicáveis por jurisdição por lacuna\n\n### Monitoramento Contínuo\nO DJAC reavalia automaticamente os fornecedores em intervalos configuráveis e alerta você sobre:\n- Novos requisitos regulatórios que afetam fornecedores existentes\n- Mudanças no perfil de risco do fornecedor\n- Certificações ou relatórios de auditoria expirando\n- Ameaças emergentes relacionadas às jurisdições dos fornecedores",
          bestPractices: [
            "Avalie os fornecedores ANTES da assinatura do contrato, não depois",
            "Configure cronogramas de reavaliação trimestral para fornecedores de alto risco",
            "Use a comparação entre jurisdições para identificar sobreposições de frameworks",
            "Documente todas as respostas dos fornecedores às conclusões da avaliação",
            "Vincule as lacunas do fornecedor ao seu registro interno de riscos para rastreabilidade",
          ],
        },
        {
          id: "supplier-profiles",
          title: "Perfis de Conformidade de Fornecedores",
          summary:
            "Crie perfis abrangentes de fornecedores com dados específicos da jurisdição, análise de stack tecnológico e gestão de contatos.",
          content:
            "### Componentes do Perfil\n- **Informações Básicas** — Nome, setor, site, jurisdição\n- **Stack Tecnológico** — Componentes de tecnologia com rastreamento de versão\n- **Contatos** — Pessoal-chave com função e atribuição de jurisdição\n- **Nível de Risco** — Classificação automatizada de risco com base no processamento de dados\n- **Histórico de Avaliações** — Linha do tempo completa de todas as avaliações de conformidade\n- **Repositório de Documentos** — Evidências, certificações, políticas\n\n### Classificação de Risco\nO DJAC calcula automaticamente os níveis de risco do fornecedor:\n- **Crítico** — Lida com dados pessoais/sensíveis, opera em jurisdições de alta regulamentação\n- **Alto** — Processa dados regulamentados, fluxos de dados transfronteiriços\n- **Médio** — Exposição limitada a dados, requisitos regulatórios padrão\n- **Baixo** — Perfil de risco mínimo, sem processamento de dados sensíveis",
        },
      ],
    },
    {
      id: "api-integration",
      icon: "terminal",
      title: "API e Integração",
      pages: [
        {
          id: "api-reference",
          title: "Referência da API",
          summary:
            "O DJAC expõe uma API tRPC com segurança de tipos e mais de 200 procedimentos em 42 roteadores, além de endpoints REST para webhooks e verificações de integridade.",
          content:
            "### Visão Geral da API\nO DJAC usa **tRPC** para operações de API com segurança de tipos de ponta a ponta. Todos os procedimentos passam por `POST /api/trpc` com suporte a lotes.\n\n**URLs Base:**\n- Produção: `https://app.yalla-hack.ae`\n- Local: `http://localhost:3000`\n\n### Métodos de Autenticação\n| Método | Cabeçalho | Caso de Uso |\n|--------|--------|----------|\n| Cookie de Sessão | cookie `app_session_id` | Aplicativo Web (padrão) |\n| Chave de API | `x-djac-api-key: djac_<hex>` | Acesso programático |\n| Clerk OAuth | Gerenciado automaticamente | OAuth Externo |\n\n### Categorias de Roteadores\n| Domínio | Roteadores | Procedimentos Principais |\n|--------|---------|----------------|\n| Autenticação | `localAuth`, `auth`, `googleAuth` | register, login, mfa |\n| Organização | `orgSettings`, `orgMembers` | create, invite, updateRole |\n| RBAC | `role`, `rbac` | getPermissions, setPermissions |\n| Conformidade | `compliance`, `regulatoryChanges` | frameworks.list, controls.get |\n| Fornecedores | `vendor`, `vendorCompliance` | list, create, assess |\n| Risco | `riskRegister`, `remediation` | list, create, update |\n| IA | `ai` | startAssessment, getJob |\n| Relatórios | `complianceReport` | generate, download, schedule |\n| Faturamento | `billing` | getPlans, checkout |\n| Administração | `admin`, `system` | getStats, getAuditLogs |\n\n### Códigos de Erro\n| Código | Descrição |\n|------|-------------|\n| `UNAUTHORIZED` | Autenticação necessária |\n| `FORBIDDEN` | Permissões insuficientes |\n| `NOT_FOUND` | Recurso não encontrado |\n| `VALIDATION_ERROR` | Falha na validação de entrada |\n| `RATE_LIMITED` | Muitas solicitações |",
        },
        {
          id: "websocket",
          title: "Streaming via WebSocket",
          summary:
            "O progresso da avaliação de IA em tempo real é transmitido via WebSocket em /ws/ai-jobs com eventos do ciclo de vida do trabalho.",
          content:
            '### Endpoint WebSocket\n**URL:** `wss://app.yalla-hack.ae/ws/ai-jobs`\n\n### Tipos de Eventos\n| Evento | Direção | Payload |\n|-------|-----------|---------|\n| `job:progress` | Servidor → Cliente | `{ jobId, stage, message, progress }` |\n| `job:complete` | Servidor → Cliente | `{ jobId, result }` |\n| `job:error` | Servidor → Cliente | `{ jobId, error: string }` |\n| `subscribe` | Cliente → Servidor | `{ jobId: string }` |\n\n### Exemplo\n```typescript\nconst ws = new WebSocket("wss://app.yalla-hack.ae/ws/ai-jobs");\nws.onopen = () => ws.send(JSON.stringify({ type: "subscribe", jobId }));\nws.onmessage = (e) => {\n  const { type, stage, message } = JSON.parse(e.data);\n  if (type === "job:progress") updateUI(stage, message);\n  if (type === "job:complete") showResults(data.result);\n};\n```',
        },
      ],
    },
    {
      id: "security-compliance",
      icon: "lock",
      title: "Segurança e Conformidade",
      pages: [
        {
          id: "security-overview",
          title: "Arquitetura de Segurança",
          summary:
            "O DJAC implementa defesa em profundidade em autenticação, autorização, proteção de dados e infraestrutura, seguindo o OWASP Top 10.",
          content:
            "### Defesa em Profundidade\n**Autenticação:**\n- Senhas com hash bcrypt (12 rounds)\n- Tokens JWT assinados com HS256 (segredo de no mínimo 64 caracteres)\n- Cookies HTTP-only, Secure, SameSite\n- MFA baseado em TOTP com códigos de backup\n- Redefinição de senha baseada em OTP (SHA-256, expiração de 5 min)\n\n**Autorização:**\n- 7 funções de plataforma + 4 funções de organização\n- 32 módulos com controle de permissões\n- Row-Level Security em todas as tabelas PostgreSQL\n- Isolamento de dados por escopo de organização\n\n**Proteção de Dados:**\n- TLS 1.3 para todos os dados em trânsito\n- PostgreSQL criptografado em repouso (Supabase)\n- Segredos em variáveis de ambiente da Vercel + GitHub Actions\n\n### Cabeçalhos de Segurança\n| Cabeçalho | Valor | Finalidade |\n|--------|-------|---------|\n| Strict-Transport-Security | max-age=63072000 | Forçar HTTPS |\n| X-Content-Type-Options | nosniff | Prevenção de sniffing de MIME |\n| X-Frame-Options | DENY | Prevenção de clickjacking |\n| Content-Security-Policy | Restrito por rota | Mitigação de XSS |\n| Referrer-Policy | strict-origin | Vazamento de referrer |\n\n### Correção de CVEs\n- Alertas automatizados de vulnerabilidade do Dependabot\n- Overrides do pnpm para patches de dependências transitivas\n- Análise de segurança CodeQL no pipeline de CI",
        },
        {
          id: "rbac-system",
          title: "RBAC e Sistema de Permissões",
          summary:
            "Permissões granulares em 32 módulos da plataforma com substituições de funções personalizadas por organização.",
          content:
            "### Fluxo de Resolução de Permissões\n1. A requisição chega ao procedimento tRPC\n2. O middleware de autenticação extrai `ctx.user` e `ctx.orgRole`\n3. O sistema verifica a linha personalizada `rolePermissions`\n4. Recorre a `DEFAULT_ORG_ROLE_PERMISSIONS`\n5. Compara a ação com PermissionFlags\n6. Retorna Allow ou 403 FORBIDDEN\n\n### Flags de Permissão\nCada módulo tem 6 flags:\n- `canView` — Acesso de leitura\n- `canCreate` — Criar novos registros\n- `canEdit` — Modificar registros existentes\n- `canDelete` — Remover registros\n- `canExport` — Baixar/exportar dados\n- `canInvite` — Convidar membros da equipe\n\n### Modelos Padrão\n| Função | Padrão Predefinido |\n|------|----------------|\n| Analista | VIEW_ONLY na maioria dos módulos |\n| Compliance Officer | STANDARD em conformidade |\n| Admin | FULL em conformidade, STANDARD em configurações |\n| Owner | FULL em tudo |",
        },
      ],
    },
    {
      id: "developer-guide",
      icon: "code",
      title: "Guia do Desenvolvedor",
      pages: [
        {
          id: "dev-setup",
          title: "Configuração de Desenvolvimento",
          summary:
            "Configure seu ambiente local com Node.js 20+, pnpm 10+, Docker para Supabase e todos os serviços necessários.",
          content:
            "### Pré-requisitos\n- Node.js 20+\n- pnpm 10+ (`npm install -g pnpm@10`)\n- Docker Desktop (para Supabase)\n- Supabase CLI (`npm install -g supabase`)\n\n### Configuração Inicial\n```bash\ngit clone <repo-url> djac && cd djac\npnpm install\ncp .env.example .env\nsupabase start\npnpm db:push\npnpm seed:data\npnpm dev\n# → http://localhost:3000\n```\n\n### Bypass de Autenticação em Desenvolvimento\n```env\nDEV_AUTH_BYPASS=true\nDEV_AUTH_EMAIL=dev@example.com\nDEV_AUTH_ROLE=super_admin\n```\n\n### Scripts Disponíveis\n| Comando | Finalidade |\n|---------|---------|\n| `pnpm dev` | Iniciar servidor de desenvolvimento |\n| `pnpm check` | Verificação de tipos do TypeScript |\n| `pnpm lint` | ESLint |\n| `pnpm test` | Executar testes (vitest) |\n| `pnpm build` | Build de produção |\n| `pnpm verify:all` | Todas as verificações + build |",
          demoSteps: [
            "Clone o repositório e instale as dependências com 'pnpm install'",
            "Copie .env.example para .env e preencha os valores necessários",
            "Inicie o Supabase localmente com 'supabase start'",
            "Envie o esquema do banco de dados com 'pnpm db:push'",
            "Popule os dados de referência com 'pnpm seed:data'",
            "Inicie o servidor de desenvolvimento com 'pnpm dev' → http://localhost:3000",
          ],
        },
        {
          id: "adding-features",
          title: "Adicionando Novos Recursos",
          summary:
            "Siga os padrões do DJAC para adicionar novos roteadores tRPC, páginas React, tabelas de banco de dados e testes.",
          content:
            '### Adicionar um Roteador tRPC\n```typescript\n// server/my-feature-router.ts\nimport { orgProcedure, router } from "./_core/trpc";\nimport { z } from "zod";\n\nexport const myFeatureRouter = router({\n  list: orgProcedure\n    .input(z.object({ orgId: z.string() }))\n    .query(async ({ ctx, input }) => {\n      const db = getDb();\n      return db.select().from(myTable).where(eq(myTable.orgId, input.orgId));\n    }),\n  create: orgProcedure\n    .input(z.object({ orgId: z.string(), name: z.string() }))\n    .mutation(async ({ ctx, input }) => {\n      const [rec] = await db.insert(myTable).values(input).returning();\n      return rec;\n    }),\n});\n```\n\nRegistre em `server/routers.ts`:\n```typescript\nimport { myFeatureRouter } from "./my-feature-router";\nexport const appRouter = router({ myFeature: myFeatureRouter });\n```\n\n### Regras de Design de API\n1. Todas as mutações usam tRPC com validação Zod\n2. Use `protectedProcedure` para autenticado, `orgProcedure` para escopo de organização\n3. Verifique `ctx.user.role` para autorização\n4. Nunca confie na entrada do cliente — sempre valide com Zod',
        },
      ],
    },
    {
      id: "deployment-operations",
      icon: "server",
      title: "Implantação e Operações",
      pages: [
        {
          id: "deployment",
          title: "Opções de Implantação",
          summary:
            "O DJAC suporta Vercel (serverless), Docker e implantação manual em VPS. Pipelines de CI/CD automatizam staging e produção.",
          content:
            "### Vercel (Recomendado)\n```bash\npnpm build\nvercel --prod\nsupabase db push --linked\nsupabase functions deploy\ncurl https://your-app.com/api/health\n```\n\n### Docker\n```bash\ndocker build -t djac:latest .\ndocker run -d -p 3000:3000 --env-file .env.production --name djac-app djac:latest\n```\n\n### Pipeline de CI/CD\n| Workflow | Gatilho | Ações |\n|----------|---------|---------|\n| CI | Push/PR | Lint, Typecheck, Test, Build |\n| Staging | Push para develop | Auto-deploy para Vercel preview |\n| Produção | Push para main | Deploy + Migração de BD + health check |\n\n### Checklist de Produção\n- [ ] JWT_SECRET ≥ 64 caracteres\n- [ ] DEV_AUTH_BYPASS=false\n- [ ] Tamanho do pool de BD: 25 conexões\n- [ ] Redis configurado\n- [ ] Políticas de RLS habilitadas\n- [ ] Rastreamento de erros do Sentry habilitado",
        },
        {
          id: "monitoring",
          title: "Monitoramento e Observabilidade",
          summary:
            "Sentry para rastreamento de erros, Pino para logging estruturado, endpoints de health/readiness para monitoramento operacional.",
          content:
            "### Endpoints de Health\n| Endpoint | Propósito |\n|----------|---------|\n| `/api/health` | Verificação de saúde (status, uptime) |\n| `/api/readyz` | Prontidão (BD, Redis, Stripe, IA) |\n\n### Agendadores em Segundo Plano\n| Agendador | Intervalo | Propósito |\n|-----------|----------|---------|\n| Retenção de Interações | 24h | Limpar logs antigos |\n| Lembrete de Teste | 6h | E-mails de teste expirando |\n| Alerta de Prazo | 1h | Notificações de prazos regulatórios |\n| Entrega de Relatórios | Config | Geração agendada de relatórios |",
        },
        {
          id: "troubleshooting",
          title: "Solução de Problemas Comuns",
          summary:
            "Soluções para problemas comuns de desenvolvimento, implantação e operacionais.",
          content:
            '### Problemas Comuns\n**Erros de conexão com o BD:** Verifique `DATABASE_URL` em `.env`. Certifique-se de que o Supabase está em execução.\n\n**IA presa em "queued":** Verifique a conectividade com o Redis. No modo de desenvolvimento, confirme `AI_QUEUE_MODE=in_memory`.\n\n**OpenAI 401:** `OPENAI_API_KEY` inválida.\n\n**Falha no build da Vercel:** Verifique as variáveis de ambiente. Certifique-se de que o Node 20+ está em uso. Teste com `pnpm build`.\n\n### Depuração\n- Logs de depuração: `LOG_LEVEL=debug pnpm dev`\n- Rastreie requisições: cabeçalho `X-Request-ID`\n- Verifique o painel do Sentry para erros',
          troubleshooting: [
            {
              problem: "Login retorna 'Authentication required (10001)'",
              solution:
                "Verifique JWT_SECRET em .env. Limpe os cookies do navegador. Verifique COOKIE_DOMAIN.",
            },
            {
              problem: "pnpm db:push falha com erros de migração",
              solution:
                "Verifique com 'supabase db status'. Use 'supabase db reset' para reset de desenvolvimento.",
            },
            {
              problem: "Build da Vercel falha com limite de memória",
              solution:
                "Externalize dependências grandes. Aumente a memória do Node nas configurações da Vercel.",
            },
            {
              problem: "Webhook do Stripe não está recebendo eventos",
              solution:
                "Verifique STRIPE_WEBHOOK_SECRET. Use 'stripe listen' para testes locais.",
            },
          ],
        },
      ],
    },
    {
      id: "billing-plans",
      icon: "card",
      title: "Faturamento e Planos",
      pages: [
        {
          id: "pricing-overview",
          title: "Visão Geral de Preços e Planos",
          summary:
            "Planos de assinatura flexíveis para equipes de todos os tamanhos — de startups a empresas globais.",
          content:
            "### Comparação de Planos\n| Recurso | Teste Gratuito | Starter | Professional | Enterprise |\n|---------|-----------|---------|-------------|------------|\n| Jurisdições | 1 | 3 | 10 | Ilimitado |\n| Fornecedores | 5 | 25 | 100 | Ilimitado |\n| Avaliações de IA/mês | 3 | 20 | 100 | Personalizado |\n| Membros da Equipe | 2 | 10 | 50 | Ilimitado |\n| Acesso à API | — | — | ✓ | ✓ |\n| Suporte Prioritário | — | — | ✓ | ✓ |\n| SLA | — | 99,5% | 99,9% | 99,95% |\n\n### Intervalos de Faturamento\n- **Mensal** — Taxa padrão\n- **Trimestral** — 10% de desconto\n- **Semestral** — 15% de desconto\n- **Anual** — 20% de desconto\n\n### Teste Gratuito\n- Teste gratuito de 14 dias no plano Starter\n- Não é necessário cartão de crédito\n- Acesso completo a todos os recursos do Starter",
        },
        {
          id: "subscription-management",
          title: "Gerenciando Sua Assinatura",
          summary:
            "Faça upgrade, downgrade ou cancele através do Portal do Cliente Stripe. Visualize o histórico de faturamento e faturas.",
          content:
            "### Ciclo de Vida da Assinatura\n1. **Teste** → Teste automático de 14 dias no cadastro\n2. **Ativo** → Assinatura paga\n3. **Em Atraso** → Falha no pagamento; período de carência\n4. **Cancelado** → Dados retidos por 30 dias\n\n### Upgrade / Downgrade\n- **Upgrade:** Acesso imediato. Cobranças proporcionais.\n- **Downgrade:** Entra em vigor no final do período de faturamento.\n\n### Portal de Faturamento\nAcesse via: **Painel → Faturamento e Plano → Gerenciar Assinatura**\n- Atualizar método de pagamento\n- Visualizar histórico de faturamento\n- Baixar faturas\n- Alterar/cancelar plano",
          troubleshooting: [
            {
              problem: "Falha no pagamento, mas o cartão é válido",
              solution:
                "Verifique bloqueios de transações internacionais. Tente um cartão alternativo ou entre em contato com o suporte.",
            },
            {
              problem: "Upgrade não refletido no painel",
              solution:
                "Aguarde até 5 minutos para o provisionamento. Tente atualizar ou sair e entrar novamente.",
            },
            {
              problem: "Teste encerrado, mas preciso de mais tempo",
              solution:
                "Entre em contato com o suporte para uma extensão única de 7 dias (uma vez por organização).",
            },
          ],
        },
      ],
    },
    {
      id: "operations",
      icon: "gauge",
      title: "Operações Cibernéticas",
      pages: [
        {
          id: "risk-register",
          title: "Registro de Riscos",
          summary:
            "Gestão centralizada de riscos com pontuação automatizada de severidade, planejamento de tratamento e vinculação a frameworks.",
          content:
            "### Fluxo de Trabalho de Gestão de Riscos\n1. **Identificar** — Registrar riscos com categoria e probabilidade/impacto\n2. **Avaliar** — Pontuação automatizada de risco (probabilidade × impacto)\n3. **Tratar** — Aceitar, Mitigar, Transferir ou Evitar\n4. **Vincular** — Conectar riscos a fornecedores, frameworks e tarefas\n5. **Monitorar** — Acompanhar status e progresso do tratamento\n\n### Categorias de Risco\n- **Operacional** — Falhas de processo, indisponibilidade de sistemas\n- **Legal** — Não conformidade regulatória, violações contratuais\n- **Técnico** — Vulnerabilidades de segurança, fraquezas de arquitetura\n- **Financeiro** — Estouros de orçamento, exposição a fraudes\n- **Reputacional** — Danos à marca, erosão da confiança do cliente",
        },
        {
          id: "incident-management",
          title: "Gestão de Incidentes",
          summary:
            "Registrar, acompanhar e resolver incidentes de segurança e conformidade com mapeamento regulatório automatizado.",
          content:
            "### Ciclo de Vida do Incidente\n1. **Detecção** — Registrar incidente com tipo, severidade, sistemas afetados\n2. **Triagem** — Classificação automatizada de severidade\n3. **Investigação** — Acompanhamento de linha do tempo com evidências\n4. **Contenção** — Acompanhamento de ações, notificação\n5. **Resolução** — Análise de causa raiz, documentos de remediação\n6. **Encerramento** — Revisão pós-incidente\n\n### Mapeamento Regulatório Automatizado\n- Violação de dados na China → PIPL Art. 57 (72h para CAC)\n- Violação de dados na UE → GDPR Art. 33 (72h para DPA)\n- Incidente de segurança → Implicações multi-framework identificadas",
        },
      ],
    },
    {
      id: "case-studies",
      icon: "star",
      title: "Estudos de Caso",
      pages: [
        {
          id: "enterprise-expansion",
          title: "Expansão Transfronteiriça Empresarial",
          summary:
            "Como uma fabricante Fortune 500 usou o DJAC para alcançar conformidade na China, Arábia Saudita e UE para mais de 50 fornecedores.",
          content:
            "### Contexto\nUm fabricante global com receita superior a US$ 2 bilhões precisava expandir para a China, Arábia Saudita e UE com 53 fornecedores em 12 países.\n\n### Desafio\n- 53 fornecedores, 3 novas jurisdições, prazo de 90 dias\n- Avaliação manual: mais de 6 meses, mais de US$ 500 mil em honorários de consultoria\n\n### Solução DJAC\n1. **Semana 1-2**: Registrou todos os 53 fornecedores\n2. **Semana 2-3**: Executou avaliações de IA para PIPL, PDPL, GDPR\n3. **Semana 3-4**: Análise de lacunas entre frameworks — 312 lacunas encontradas\n4. **Semana 4-8**: Planejador de remediação acompanhou o fechamento das lacunas\n5. **Semana 8-12**: Monitoramento contínuo confirmou conformidade total\n\n### Resultados\n- ✅ Conformidade total em 82 dias (vs. estimativa de 180 dias)\n- ✅ 312 lacunas identificadas, 298 fechadas em 60 dias\n- ✅ Economia de US$ 380 mil em honorários de consultoria\n- ✅ Redução de 70% nos custos de monitoramento contínuo\n- ✅ Zero achados nas primeiras auditorias regulatórias",
        },
        {
          id: "saas-startup",
          title: "Conformidade Rápida para Startup SaaS",
          summary:
            "Como uma startup de 15 pessoas alcançou prontidão SOC 2 e GDPR em 30 dias usando o DJAC.",
          content:
            "### Contexto\nUma startup Série A com 15 funcionários precisava de conformidade SOC 2 Tipo II e GDPR para fechar negócios empresariais.\n\n### Desafio\n- Nenhum programa de conformidade existente\n- 7 fornecedores de nuvem para avaliar\n- Orçamento de US$ 5 mil/mês para conformidade\n\n### Solução DJAC\n1. Integrou a equipe, configurou o perfil da organização\n2. Selecionou SOC 2 + GDPR com controles recomendados por IA\n3. Registrou todos os 7 fornecedores, executou avaliações\n4. Gerou modelos de políticas a partir do gerenciador de políticas\n5. Verificações contínuas durante a revisão do auditor\n\n### Resultados\n- ✅ SOC 2 Tipo II entregue em 28 dias\n- ✅ Programa GDPR estabelecido em 30 dias\n- ✅ Fechou 3 negócios empresariais (US$ 480 mil em ARR)\n- ✅ Custo de conformidade contínua abaixo de US$ 250/mês",
        },
      ],
    },
  ],
};
