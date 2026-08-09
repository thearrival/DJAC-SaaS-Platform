/**
 * DJAC Documentation Portal — comprehensive product documentation
 * with multilingual support (EN/AR/ZH), enhanced UI, admonitions,
 * table of contents, breadcrumbs, keyboard shortcuts, and hero landing.
 *
 * Route: /docs and /docs/:section/:page
 */
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
  ChevronLeft,
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
  Layers,
  Home,
  Copy,
  Check,
  Info,
  X,
  List,
  Hash,
  ArrowUp,
  Sparkles,
  Users,
  Clock,
  DollarSign,
  Brain,
  ThumbsUp,
  ThumbsDown,
  ChevronsUpDown,
  Link2,
  Printer,
  HelpCircle,
} from "lucide-react";

/* ──────────────────────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────────────────────── */

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

interface TocEntry {
  level: number;
  text: string;
  id: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   Icon Map
   ────────────────────────────────────────────────────────────────────────── */

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
  layers: Layers,
  home: Home,
  brain: Brain,
  users: Users,
  clock: Clock,
  sparkles: Sparkles,
  dollar: DollarSign,
};

/* ──────────────────────────────────────────────────────────────────────────
   Home Page Feature Cards Data
   ────────────────────────────────────────────────────────────────────────── */

const homeFeatures = [
  {
    icon: "zap",
    title: "AI Compliance Engine",
    desc: "8-stage GPT-4o assessment pipeline with RAG context retrieval",
    link: "/docs/ai-engine/ai-overview",
  },
  {
    icon: "shield",
    title: "29+ Jurisdictions",
    desc: "PIPL, PDPL, GDPR, NCA-ECC, CSL, DSL and global standards",
    link: "/docs/frameworks/jurisdictions",
  },
  {
    icon: "building",
    title: "Vendor Risk",
    desc: "Automated third-party assessments across all frameworks",
    link: "/docs/vendor-risk/vendor-assessment",
  },
  {
    icon: "terminal",
    title: "API & Integration",
    desc: "200+ tRPC procedures with WebSocket streaming",
    link: "/docs/api-integration/api-reference",
  },
  {
    icon: "lock",
    title: "Security & RBAC",
    desc: "7 platform roles, 32 modules, 6 permission flags",
    link: "/docs/security-compliance/security-overview",
  },
  {
    icon: "code",
    title: "Developer Guide",
    desc: "Setup, architecture, testing, contributing",
    link: "/docs/developer-guide/dev-setup",
  },
];

const quickLinks = [
  { label: "Welcome & Overview", path: "/docs/getting-started/welcome" },
  { label: "Quick Start Guide", path: "/docs/getting-started/architecture" },
  { label: "API Reference", path: "/docs/api-integration/api-reference" },
  { label: "Pricing & Plans", path: "/docs/billing-plans/pricing-overview" },
  {
    label: "Security Overview",
    path: "/docs/security-compliance/security-overview",
  },
  { label: "Deployment Guide", path: "/docs/deployment-operations/deployment" },
];

/* ──────────────────────────────────────────────────────────────────────────
   Related Pages Map — for cross-discovery at bottom of each page
   ────────────────────────────────────────────────────────────────────────── */

const relatedPages: Record<string, { title: string; path: string }[]> = {
  welcome: [
    {
      title: "Platform Architecture",
      path: "/docs/getting-started/architecture",
    },
    { title: "AI Engine Overview", path: "/docs/ai-engine/ai-overview" },
    { title: "Pricing & Plans", path: "/docs/billing-plans/pricing-overview" },
  ],
  architecture: [
    { title: "Welcome to DJAC", path: "/docs/getting-started/welcome" },
    { title: "Developer Setup", path: "/docs/developer-guide/dev-setup" },
    {
      title: "Deployment Options",
      path: "/docs/deployment-operations/deployment",
    },
  ],
  "ai-overview": [
    { title: "RAG Context System", path: "/docs/ai-engine/rag-system" },
    { title: "Vendor Assessment", path: "/docs/vendor-risk/vendor-assessment" },
    { title: "WebSocket Streaming", path: "/docs/api-integration/websocket" },
  ],
  "vendor-assessment": [
    { title: "AI Engine Overview", path: "/docs/ai-engine/ai-overview" },
    { title: "Supplier Profiles", path: "/docs/vendor-risk/supplier-profiles" },
    { title: "Risk Register", path: "/docs/operations/risk-register" },
  ],
  "security-overview": [
    { title: "RBAC System", path: "/docs/security-compliance/rbac-system" },
    {
      title: "Data Protection",
      path: "/docs/security-compliance/data-protection",
    },
    { title: "Audit Logging", path: "/docs/security-compliance/audit-trail" },
  ],
  "dev-setup": [
    {
      title: "Platform Architecture",
      path: "/docs/getting-started/architecture",
    },
    { title: "Adding Features", path: "/docs/developer-guide/adding-features" },
    { title: "Testing Guide", path: "/docs/developer-guide/testing" },
  ],
  deployment: [
    { title: "Monitoring", path: "/docs/deployment-operations/monitoring" },
    {
      title: "Troubleshooting",
      path: "/docs/deployment-operations/troubleshooting",
    },
    { title: "Pricing Overview", path: "/docs/billing-plans/pricing-overview" },
  ],
};

/* ──────────────────────────────────────────────────────────────────────────
   Multi-language Doc Data
   ────────────────────────────────────────────────────────────────────────── */

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
            "DJAC is the world's first AI-powered cross-jurisdiction compliance intelligence platform. Deploy in minutes and achieve regulatory compliance across 29+ jurisdictions.",
          content: `### What is DJAC?
DJAC (De Jure Automated Compliance) is an enterprise SaaS platform that automates regulatory compliance across jurisdictions — China, Saudi Arabia, the GCC, the EU, North America, and APAC.

> **info** Built for compliance officers, legal teams, enterprise administrators, consultants, and government regulators.

### Why DJAC?
- **29+ Jurisdictions** — PIPL, PDPL, CSL, DSL, GDPR, ISO 27001, SOC 2, NIST CSF, HIPAA, and more
- **AI-Powered Analysis** — GPT-4o driven 8-stage compliance assessment pipeline
- **Real-Time Monitoring** — Continuous compliance tracking with automated gap detection
- **Cross-Border Intelligence** — Data transfer compliance checker and regulatory change monitoring
- **Vendor Risk Management** — Automated third-party assessments across all selected frameworks
- **Enterprise-Grade Security** — AES-256 encryption, RBAC, audit trails, SOC 2 ready

> **tip** DJAC supports 3 languages — English, Arabic, and Chinese — switch anytime from the header locale menu.

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
> **answer** 60+ frameworks across 29 jurisdictions — including GDPR, NIS2, DORA, PIPL, PDPL, ISO 27001, SOC 2, and more. The AI engine auto-recommends the relevant ones for your profile.
> **faq** Can DJAC run on our own infrastructure?
> **answer** Yes — besides Vercel cloud hosting, self-hosted Docker deployment is supported, and the platform can be extended with custom frameworks.`,
        },
        {
          id: "architecture",
          title: "Platform Architecture",
          summary:
            "DJAC runs on a cloud-native architecture with React 19, Express + tRPC, PostgreSQL on Supabase, Redis, and OpenAI GPT-4o.",
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
          diagram:
            "[User] → [Gatekeeper] → [Intake] → [Extractor] → [RAG] → [Judge (GPT-4o)] → [Synthesizer] → [Validator] → [Reporter] → [PDF / DOCX / JSON]",
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
            "DJAC's 8-stage AI pipeline uses GPT-4o to assess vendor compliance across multiple frameworks simultaneously.",
          content: `### The 8-Stage Pipeline
1. **Gatekeeper** — Input validation, injection detection, data sanitization
2. **Intake** — Document parsing, text normalization, language detection
3. **Extractor** — Structured fact extraction into key-value-evidence triples
4. **RAG Context** — Retrieval-Augmented Generation: pulls relevant compliance controls from PostgreSQL
5. **Judge (GPT-4o)** — Evaluates each fact against applicable control requirements
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
4. **Context Assembly** — Builds a focused context window for GPT-4o
5. **Grounded Response** — AI evaluates based ONLY on retrieved controls (no hallucination)

### Benefits
- Eliminates AI hallucinations in compliance advice
- Ensures framework-specific recommendations
- Maintains audit trail of control-to-finding mappings
- Supports 29+ jurisdictions with jurisdiction-specific controls

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
          summary:
            "DJAC covers 29+ jurisdictions across APAC, EMEA, North America, and Africa with comprehensive regulatory frameworks.",
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
};

/* ──────────────────────────────────────────────────────────────────────────
   Arabic (ar) Data — Key sections translated
   ────────────────────────────────────────────────────────────────────────── */

docsData.ar = [
  {
    id: "getting-started",
    title: "البدء",
    icon: "book",
    pages: [
      {
        id: "welcome",
        title: "مرحباً بك في DJAC",
        summary:
          "DJAC هي أول منصة ذكاء امتثال تنظيمي مدعومة بالذكاء الاصطناعي عبر 29+ ولاية قضائية.",
        content: `### ما هو DJAC؟
DJAC (الامتثال القانوني الآلي) هي منصة SaaS مؤسسية تعمل على أتمتة الامتثال التنظيمي عبر الصين والسعودية ودول الخليج والاتحاد الأوروبي وأمريكا الشمالية وآسيا والمحيط الهادئ.

### لماذا DJAC؟
- **29+ ولاية قضائية** — PIPL، PDPL، CSL، DSL، GDPR، ISO 27001، SOC 2 وغيرها
- **تحليل بالذكاء الاصطناعي** — تقييم امتثال من 8 مراحل مدعوم بـ GPT-4o
- **مراقبة مستمرة** — تتبع الامتثال مع اكتشاف الفجوات تلقائياً
- **ذكاء عابر للحدود** — فحص نقل البيانات ومراقبة التغييرات التنظيمية
- **إدارة مخاطر الموردين** — تقييمات تلقائية عبر جميع الأطر
- **أمان مؤسسي** — تشفير AES-256، RBAC، سجلات التدقيق

### البدء السريع (5 دقائق)
1. **إنشاء مؤسستك** — إعداد ملف الشركة والفوترة
2. **اختيار الولايات القضائية** — الصين، السعودية، الاتحاد الأوروبي أو أي مزيج
3. **اختيار الأطر** — الذكاء الاصطناعي يوصي باللوائح المناسبة
4. **تسجيل مورد** — أضف أول مورد خارجي
5. **تشغيل التقييم** — تقرير امتثال كامل في أقل من 60 ثانية

> **faq** كم يستغرق تقييم المورد بالذكاء الاصطناعي؟
> **answer** تكتمل معظم التقييمات في أقل من 60 ثانية، مع بث التقدم مباشرة عبر WebSocket أثناء إنهاء كل مرحلة من مراحل خط الأنابيب الثماني.
> **faq** ما هي اللوائح المدعومة افتراضياً؟
> **answer** أكثر من 60 إطاراً عبر 29 ولاية قضائية — بما في ذلك GDPR وNIS2 وDORA وPIPL وPDPL وISO 27001 وSOC 2 وغيرها. يوصي محرك الذكاء الاصطناعي تلقائياً بالأطر ذات الصلة بملفك.
> **faq** هل يمكن تشغيل DJAC على بنيتنا التحتية الخاصة؟
> **answer** نعم — بالإضافة إلى الاستضافة السحابية على Vercel، يتم دعم النشر الذاتي عبر Docker مع إمكانية توسيع المنصة بأطر مخصصة.`,
      },
      {
        id: "architecture",
        title: "معمارية المنصة",
        summary:
          "تعمل DJAC على معمارية سحابية أصلية مع React 19 و Express + tRPC و PostgreSQL على Supabase.",
        content: `### معمارية النظام
**الواجهة**: React 19 + TypeScript + Vite 7 + Tailwind CSS 4
**الخادم**: Express 4 + tRPC 11 (200+ إجراء API)
**قاعدة البيانات**: PostgreSQL 17 على Supabase
**محرك AI**: OpenAI GPT-4o مع 8 مراحل تقييم
**المصادقة**: ثلاثي المسار (Clerk OAuth + Supabase Auth + JWT محلي)
**الفوترة**: Stripe (5 خطط × 4 فترات)
**الاستضافة**: Vercel (بدون خادم) + Docker`,
      },
    ],
  },
  {
    id: "ai-engine",
    title: "محرك الامتثال الذكي",
    icon: "zap",
    pages: [
      {
        id: "ai-overview",
        title: "نظرة عامة على محرك AI",
        summary:
          "يستخدم خط أنابيب AI المكون من 8 مراحل GPT-4o لتقييم امتثال الموردين عبر أطر متعددة في وقت واحد.",
        content: `### خط الأنابيب ذو 8 مراحل
1. **البواب** — التحقق من المدخلات، كشف الحقن
2. **الاستيعاب** — تحليل المستندات، تطبيع النص
3. **المستخرج** — استخراج الحقائق المنظمة
4. **سياق RAG** — استرجاع ضوابط الامتثال ذات الصلة
5. **الحكم (GPT-4o)** — تقييم الحقائق مقابل الضوابط
6. **المركب** — دمج النتائج عبر الأطر
7. **المدقق** — التحقق من اتساق المخطط
8. **المراسل** — إخراج نهائي (PDF/DOCX/JSON)`,
      },
    ],
  },
  {
    id: "frameworks",
    title: "أطر الامتثال",
    icon: "shield",
    pages: [
      {
        id: "jurisdictions",
        title: "الولايات القضائية المدعومة",
        summary:
          "تغطي DJAC أكثر من 29 ولاية قضائية عبر آسيا والمحيط الهادئ وأوروبا والشرق الأوسط وأمريكا الشمالية وأفريقيا.",
        content: `### منطقة آسيا والمحيط الهادئ
- **الصين** — PIPL، CSL، DSL، MLPS 2.0
- **اليابان** — APPI
- **كوريا الجنوبية** — PIPA
- **سنغافورة** — PDPA
- **الهند** — DPDP Act
- **أستراليا** — Privacy Act 1988

### الشرق الأوسط / الخليج
- **السعودية** — PDPL، NCA ECC / CSCC / OCC
- **الإمارات** — UAE PDPL
- **قطر** — Qatar PDPPL
- **البحرين** — Bahrain PDPL
- **الكويت** — Kuwait DPA

### أوروبا
- **الاتحاد الأوروبي** — GDPR، NIS2، DORA
- **المملكة المتحدة** — UK GDPR / DPA 2018

### أمريكا الشمالية
- **الولايات المتحدة** — HIPAA، CCPA/CPRA، SOX، PCI DSS
- **كندا** — PIPEDA`,
      },
    ],
  },
  {
    id: "security-compliance",
    title: "الأمان والامتثال",
    icon: "lock",
    pages: [
      {
        id: "security-overview",
        title: "معمارية الأمان",
        summary:
          "تطبق DJAC دفاعاً متعدد الطبقات عبر المصادقة والترخيص وحماية البيانات والبنية التحتية.",
        content: `### دفاع متعدد الطبقات
**المصادقة:**
- كلمات مرور مشفرة بـ bcrypt (12 جولة)
- رموز JWT موقعة بـ HS256
- ملفات تعريف HTTP-only، Secure، SameSite
- TOTP MFA مع رموز احتياطية
- إعادة تعيين كلمة المرور بـ OTP (SHA-256، صلاحية 5 دقائق)

**الترخيص:**
- 7 أدوار منصة + 4 أدوار مؤسسة
- 32 وحدة بصلاحيات محددة
- أمان مستوى الصف على جميع جداول PostgreSQL

**حماية البيانات:**
- TLS 1.3 للنقل
- تشفير AES-256 في السكون
- الأسرار في Vercel + GitHub Actions`,
      },
    ],
  },
  {
    id: "developer-guide",
    title: "دليل المطور",
    icon: "code",
    pages: [
      {
        id: "dev-setup",
        title: "إعداد بيئة التطوير",
        summary:
          "إعداد بيئتك المحلية مع Node.js 20+ و pnpm 10+ و Docker لـ Supabase.",
        content: `### المتطلبات الأساسية
- Node.js 20+
- pnpm 10+ (\`npm install -g pnpm@10\`)
- Docker Desktop
- Supabase CLI

### الإعداد الأولي
\`\`\`bash
git clone <repo-url> djac && cd djac
pnpm install
cp .env.example .env
supabase start
pnpm db:push
pnpm seed:data
pnpm dev
\`\`\`

### تجاوز المصادقة للتطوير
\`\`\`env
DEV_AUTH_BYPASS=true
DEV_AUTH_EMAIL=dev@example.com
DEV_AUTH_ROLE=super_admin
\`\`\``,
      },
    ],
  },
  {
    id: "billing-plans",
    title: "الفوترة والخطط",
    icon: "card",
    pages: [
      {
        id: "pricing-overview",
        title: "نظرة عامة على الأسعار",
        summary:
          "خطط اشتراك مرنة للفرق من جميع الأحجام — من الشركات الناشئة إلى المؤسسات العالمية.",
        content: `### مقارنة الخطط
| الميزة | تجربة مجانية | Starter | Professional | Enterprise |
|---------|-----------|---------|-------------|------------|
| الولايات القضائية | 1 | 3 | 10 | غير محدود |
| الموردين | 5 | 25 | 100 | غير محدود |
| تقييمات AI/شهر | 3 | 20 | 100 | مخصص |
| أعضاء الفريق | 2 | 10 | 50 | غير محدود |
| وصول API | — | — | ✓ | ✓ |
| دعم متميز | — | — | ✓ | ✓ |
| SLA | — | 99.5% | 99.9% | 99.95% |

### تجربة مجانية
- 14 يوماً على خطة Starter
- لا حاجة لبطاقة ائتمان
- وصول كامل لجميع ميزات Starter`,
      },
    ],
  },
  {
    id: "vendor-risk",
    title: "إدارة مخاطر الموردين",
    icon: "building",
    pages: [
      {
        id: "vendor-assessment",
        title: "تقييم امتثال الموردين",
        summary:
          "تقييم تلقائي لامتثال الموردين الخارجيين عبر جميع الأطر المختارة.",
        content: `### تقييم تلقائي للموردين
1. **تسجيل المورد** — إضافة الاسم والصناعة والولاية القضائية
2. **اختيار الأطر** — اختيار الأطر التنظيمية المطبقة
3. **تحميل الأدلة** — إرفاق السياسات والشهادات
4. **تشغيل التقييم** — تحليل AI عبر جميع الأطر
5. **مراجعة النتائج** — تحليل مفصل للفجوات مع تقييم المخاطر (0-100)
6. **تصدير التقرير** — تقرير PDF/DOCX احترافي`,
      },
    ],
  },
  {
    id: "api-integration",
    title: "الواجهة البرمجية والتكامل",
    icon: "terminal",
    pages: [
      {
        id: "api-reference",
        title: "مرجع API",
        summary: "توفر DJAC واجهة برمجية آمنة مع 200+ إجراء عبر 42 موجه.",
        content: `### نظرة عامة على API\nتستخدم DJAC **tRPC** لعمليات API الآمنة.\n\n**طرق المصادقة:**\n| الطريقة | الاستخدام |\n|---------|----------|\n| ملف تعريف الجلسة | تطبيق الويب |\n| مفتاح API | الوصول البرمجي |\n| Clerk OAuth | OAuth خارجي |`,
      },
    ],
  },
  {
    id: "deployment-operations",
    title: "النشر والعمليات",
    icon: "server",
    pages: [
      {
        id: "deployment",
        title: "خيارات النشر",
        summary: "تدعم DJAC النشر على Vercel و Docker و VPS مع خطوط CI/CD.",
        content:
          "### نشر Vercel\n```bash\npnpm build && vercel --prod\nsupabase db push --linked\nsupabase functions deploy\n```\n\n### نشر Docker\n```bash\ndocker build -t djac:latest .\ndocker run -d -p 3000:3000 --env-file .env.production djac:latest\n```",
      },
    ],
  },
  {
    id: "operations",
    title: "العمليات السيبرانية",
    icon: "gauge",
    pages: [
      {
        id: "risk-register",
        title: "سجل المخاطر",
        summary: "إدارة مركزية للمخاطر مع تقييم تلقائي للشدة وتخطيط المعالجة.",
        content:
          "### سير إدارة المخاطر\n1. **تحديد** — تسجيل المخاطر مع الفئة والاحتمالية/التأثير\n2. **تقييم** — تقييم تلقائي (الاحتمالية × التأثير)\n3. **معالجة** — قبول، تخفيف، نقل، أو تجنب\n4. **ربط** — ربط المخاطر بالموردين والأطر",
      },
    ],
  },
  {
    id: "case-studies",
    title: "دراسات الحالة",
    icon: "star",
    pages: [
      {
        id: "enterprise-expansion",
        title: "توسع مؤسسي عبر الحدود",
        summary:
          "كيف استخدمت شركة عالمية DJAC للامتثال في الصين والسعودية والاتحاد الأوروبي.",
        content:
          "### النتائج\n- امتثال كامل في 82 يوماً\n- توفير 380 ألف دولار\n- تقليل تكاليف المراقبة 70%",
      },
    ],
  },
];

/* ──────────────────────────────────────────────────────────────────────────
   Chinese (zh) Data — Key sections translated
   ────────────────────────────────────────────────────────────────────────── */

docsData.zh = [
  {
    id: "getting-started",
    title: "入门指南",
    icon: "book",
    pages: [
      {
        id: "welcome",
        title: "欢迎使用 DJAC",
        summary:
          "DJAC 是全球首个AI驱动的跨司法管辖区合规智能平台，覆盖29+个司法管辖区。",
        content: `### 什么是 DJAC？
DJAC（法定自动化合规）是一个企业级SaaS平台，可自动化处理中国、沙特、海湾合作委员会、欧盟、北美和亚太地区的监管合规。

### 为什么选择 DJAC？
- **29+ 司法管辖区** — PIPL、PDPL、CSL、DSL、GDPR、ISO 27001、SOC 2等
- **AI驱动分析** — GPT-4o驱动的8阶段合规评估流程
- **实时监控** — 持续合规跟踪，自动检测差距
- **跨境智能** — 数据传输合规检查器和监管变化监控
- **供应商风险管理** — 跨所有选定框架的自动第三方评估
- **企业级安全** — AES-256加密、RBAC、审计跟踪、SOC 2就绪

### 快速开始（5分钟）
1. **创建您的组织** — 设置公司资料和账单
2. **选择司法管辖区** — 中国、沙特、欧盟或任意组合
3. **选择框架** — AI自动推荐相关法规
4. **注册供应商** — 添加您的第一个第三方供应商
5. **运行评估** — AI在60秒内生成完整的合规报告

> **faq** AI供应商评估需要多长时间？
> **answer** 大多数评估在60秒内完成，并会通过WebSocket实时流式展示8个流水线阶段中每个阶段的进度。
> **faq** 开箱即用支持哪些法规？
> **answer** 覆盖29个司法管辖区的60多个框架——包括GDPR、NIS2、DORA、PIPL、PDPL、ISO 27001、SOC 2等。AI引擎会根据您的资料自动推荐相关法规。
> **faq** DJAC可以在我们自己的基础设施上运行吗？
> **answer** 可以——除了Vercel云托管，还支持基于Docker的自托管部署，并且平台可扩展自定义框架。`,
      },
      {
        id: "architecture",
        title: "平台架构",
        summary:
          "DJAC在云原生架构上运行，使用React 19、Express + tRPC、PostgreSQL（Supabase）、Redis和OpenAI GPT-4o。",
        content: `### 系统架构
**前端**: React 19 + TypeScript + Vite 7 + Tailwind CSS 4
**后端**: Express 4 + tRPC 11（200+ API程序）
**数据库**: PostgreSQL 17 on Supabase
**AI引擎**: OpenAI GPT-4o，8阶段评估流程
**身份验证**: 三路径（Clerk OAuth + Supabase Auth + 本地JWT）
**计费**: Stripe（5个计划 × 4个周期）
**托管**: Vercel（无服务器）+ Docker`,
      },
    ],
  },
  {
    id: "ai-engine",
    title: "AI合规引擎",
    icon: "zap",
    pages: [
      {
        id: "ai-overview",
        title: "AI引擎概述",
        summary: "DJAC的8阶段AI流程使用GPT-4o同时评估多个框架的供应商合规性。",
        content: `### 8阶段流程
1. **守门人** — 输入验证、注入检测
2. **摄入** — 文档解析、文本规范化
3. **提取器** — 结构化事实提取
4. **RAG上下文** — 检索增强生成：从PostgreSQL提取相关合规控制
5. **法官（GPT-4o）** — 评估事实与适用控制要求
6. **合成器** — 合并发现结果，生成跨框架比较
7. **验证器** — 模式验证、跨字段一致性
8. **报告器** — 最终格式化输出（PDF/DOCX/JSON）`,
      },
    ],
  },
  {
    id: "frameworks",
    title: "合规框架",
    icon: "shield",
    pages: [
      {
        id: "jurisdictions",
        title: "支持的司法管辖区",
        summary:
          "DJAC覆盖亚太、欧洲、中东、北美和非洲29+个司法管辖区的综合监管框架。",
        content: `### 亚太地区
- **中国** — PIPL、CSL、DSL、MLPS 2.0
- **日本** — APPI
- **韩国** — PIPA
- **新加坡** — PDPA
- **印度** — DPDP Act
- **澳大利亚** — Privacy Act 1988

### 中东/海湾地区
- **沙特阿拉伯** — PDPL、NCA ECC / CSCC / OCC
- **阿联酋** — UAE PDPL
- **卡塔尔** — Qatar PDPPL
- **巴林** — Bahrain PDPL
- **科威特** — Kuwait DPA

### 欧洲
- **欧盟/欧洲经济区** — GDPR、NIS2、DORA
- **英国** — UK GDPR / DPA 2018

### 北美
- **美国** — HIPAA、CCPA/CPRA、SOX、PCI DSS
- **加拿大** — PIPEDA`,
      },
    ],
  },
  {
    id: "security-compliance",
    title: "安全与合规",
    icon: "lock",
    pages: [
      {
        id: "security-overview",
        title: "安全架构",
        summary:
          "DJAC实施深度防御，覆盖身份验证、授权、数据保护和基础设施层面。",
        content: `### 深度防御
**身份验证：**
- bcrypt密码哈希（12轮）
- HS256签名的JWT令牌
- HTTP-only、Secure、SameSite Cookies
- 基于TOTP的MFA及备份码
- 基于OTP的密码重置（SHA-256，5分钟有效期）

**授权：**
- 7个平台角色 + 4个组织角色
- 32个权限控制模块
- 所有PostgreSQL表的行级安全

**数据保护：**
- 传输中TLS 1.3
- 静态AES-256加密
- 密钥存储于Vercel + GitHub Actions`,
      },
    ],
  },
  {
    id: "developer-guide",
    title: "开发者指南",
    icon: "code",
    pages: [
      {
        id: "dev-setup",
        title: "开发环境设置",
        summary:
          "使用Node.js 20+、pnpm 10+、Docker for Supabase设置本地开发环境。",
        content: `### 前提条件
- Node.js 20+
- pnpm 10+ (\`npm install -g pnpm@10\`)
- Docker Desktop
- Supabase CLI

### 首次设置
\`\`\`bash
git clone <repo-url> djac && cd djac
pnpm install
cp .env.example .env
supabase start
pnpm db:push
pnpm seed:data
pnpm dev
\`\`\`

### 开发认证绕过
\`\`\`env
DEV_AUTH_BYPASS=true
DEV_AUTH_EMAIL=dev@example.com
DEV_AUTH_ROLE=super_admin
\`\`\``,
      },
    ],
  },
  {
    id: "billing-plans",
    title: "计费与计划",
    icon: "card",
    pages: [
      {
        id: "pricing-overview",
        title: "定价概览",
        summary: "为各规模团队提供灵活的订阅计划——从初创公司到全球企业。",
        content: `### 计划对比
| 功能 | 免费试用 | Starter | Professional | Enterprise |
|---------|-----------|---------|-------------|------------|
| 司法管辖区 | 1 | 3 | 10 | 无限制 |
| 供应商 | 5 | 25 | 100 | 无限制 |
| AI评估/月 | 3 | 20 | 100 | 定制 |
| 团队成员 | 2 | 10 | 50 | 无限制 |
| API访问 | — | — | ✓ | ✓ |
| 优先支持 | — | — | ✓ | ✓ |
| SLA | — | 99.5% | 99.9% | 99.95% |

### 免费试用
- Starter计划14天免费试用
- 无需信用卡
- 完整访问所有Starter功能`,
      },
    ],
  },
  {
    id: "vendor-risk",
    title: "供应商风险管理",
    icon: "building",
    pages: [
      {
        id: "vendor-assessment",
        title: "供应商合规评估",
        summary: "跨所有选定框架自动进行第三方供应商合规评估。",
        content:
          "### 自动供应商评估\n1. **注册供应商** — 添加名称、行业、司法管辖区\n2. **选择框架** — 选择适用的监管框架\n3. **上传证据** — 附加供应商政策、认证\n4. **运行评估** — AI跨所有框架分析\n5. **查看结果** — 详细差距分析及风险评分（0-100）\n6. **导出报告** — 专业PDF/DOCX报告",
      },
    ],
  },
  {
    id: "api-integration",
    title: "API与集成",
    icon: "terminal",
    pages: [
      {
        id: "api-reference",
        title: "API参考",
        summary: "DJAC通过42个路由器提供200+个类型安全的tRPC API程序。",
        content:
          "### API概述\nDJAC使用**tRPC**实现端到端类型安全的API操作。\n\n**认证方法：**\n| 方法 | 用例 |\n|--------|----------|\n| 会话Cookie | Web应用 |\n| API密钥 | 编程访问 |\n| Clerk OAuth | 外部OAuth |",
      },
    ],
  },
  {
    id: "deployment-operations",
    title: "部署与运维",
    icon: "server",
    pages: [
      {
        id: "deployment",
        title: "部署选项",
        summary: "DJAC支持Vercel、Docker和VPS部署。",
        content:
          "### Vercel\n```bash\npnpm build && vercel --prod\nsupabase db push --linked\n```\n\n### Docker\n```bash\ndocker build -t djac:latest .\ndocker run -d -p 3000:3000 --env-file .env.production djac:latest\n```",
      },
    ],
  },
  {
    id: "operations",
    title: "网络运营",
    icon: "gauge",
    pages: [
      {
        id: "risk-register",
        title: "风险登记册",
        summary: "集中风险管理，自动严重性评分和处理计划。",
        content:
          "### 风险管理流程\n1. **识别** — 记录风险\n2. **评估** — 自动评分\n3. **处理** — 接受、缓解、转移或避免\n4. **关联** — 关联供应商和框架",
      },
    ],
  },
  {
    id: "case-studies",
    title: "案例研究",
    icon: "star",
    pages: [
      {
        id: "enterprise-expansion",
        title: "企业跨境扩展案例",
        summary: "全球制造商使用DJAC在中国、沙特和欧盟实现合规。",
        content:
          "### 成果\n- 82天实现完全合规\n- 节省38万美元\n- 监控成本降低70%",
      },
    ],
  },
];

/* ──────────────────────────────────────────────────────────────────────────
   Helper: Extract TOC from content
   ────────────────────────────────────────────────────────────────────────── */

function extractToc(content: string): TocEntry[] {
  const entries: TocEntry[] = [];
  const lines = content.split("\n");
  for (const line of lines) {
    const h3 = line.match(/^### (.+)/);
    const h4 = line.match(/^#### (.+)/);
    if (h3)
      entries.push({
        level: 3,
        text: h3[1],
        id: h3[1]
          .toLowerCase()
          .replace(/[^a-z0-9\u0600-\u06FF\u4e00-\u9fff]+/g, "-")
          .replace(/^-|-$/g, ""),
      });
    else if (h4)
      entries.push({
        level: 4,
        text: h4[1],
        id: h4[1]
          .toLowerCase()
          .replace(/[^a-z0-9\u0600-\u06FF\u4e00-\u9fff]+/g, "-")
          .replace(/^-|-$/g, ""),
      });
  }
  return entries;
}

function getDocSections(locale: string): DocSection[] {
  return docsData[locale] || docsData.en;
}

/* ──────────────────────────────────────────────────────────────────────────
   Search helpers: highlight matched text + content snippet
   ────────────────────────────────────────────────────────────────────────── */

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const q = query.toLowerCase();
  const idx = text.toLowerCase().indexOf(q);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="djac-docs-mark">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

function contentSnippet(content: string, query: string): string | null {
  if (!query) return null;
  const q = query.toLowerCase();
  const idx = content.toLowerCase().indexOf(q);
  if (idx === -1) return null;
  const start = Math.max(0, idx - 35);
  const end = Math.min(content.length, idx + q.length + 55);
  return `${start > 0 ? "…" : ""}${content
    .slice(start, end)
    .replace(/\s+/g, " ")}${end < content.length ? "…" : ""}`;
}

/* ──────────────────────────────────────────────────────────────────────────
   Sub-component: SidebarPageRow — shared page link with search highlights
   ────────────────────────────────────────────────────────────────────────── */

function SidebarPageRow({
  page,
  query,
  active,
  onClick,
}: {
  page: DocPage;
  query: string;
  active: boolean;
  onClick: () => void;
}) {
  const titleMatches = query && page.title.toLowerCase().includes(query);
  const summaryMatches =
    query && !titleMatches && page.summary.toLowerCase().includes(query);
  const snippet = contentSnippet(page.content, query);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`djac-docs-page-btn ${active ? "djac-docs-page-active" : ""}`}
    >
      <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
      <div className="min-w-0 flex-1">
        <span className="truncate text-xs block">
          {highlightMatch(page.title, query)}
        </span>
        {query && (titleMatches || summaryMatches || snippet) && (
          <span className="block truncate text-[10px] text-muted-foreground/80">
            {snippet || page.summary}
          </span>
        )}
      </div>
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Glossary — hover tooltips on technical terms (trilingual)
   ────────────────────────────────────────────────────────────────────────── */

const GLOSSARY: Record<string, { en: string; ar: string; zh: string }> = {
  tRPC: {
    en: "Type-safe RPC framework — API calls are fully typed end-to-end (used for DJAC's 200+ API procedures).",
    ar: "إطار RPC آمن الأنواع — استدعاءات API مكتوبة بالكامل من طرف إلى طرف (200+ إجراء في DJAC).",
    zh: "类型安全RPC框架 — API调用端到端完全类型化（DJAC 200+个API程序）。",
  },
  RAG: {
    en: "Retrieval-Augmented Generation — retrieves relevant compliance controls before evaluating or answering.",
    ar: "التوليد المعزز بالاسترجاع — استرجاع ضوابط الامتثال ذات الصلة قبل التقييم أو الإجابة.",
    zh: "检索增强生成 — 在评估或回答前先检索相关合规控制项。",
  },
  RBAC: {
    en: "Role-Based Access Control — permissions are granted by role instead of per user.",
    ar: "التحكم في الوصول القائم على الأدوار — صلاحيات حسب الدور بدلاً من المستخدم.",
    zh: "基于角色的访问控制 — 按角色而非按用户授权。",
  },
  JWT: {
    en: "JSON Web Token — a signed token used for stateless authentication sessions.",
    ar: "رمز ويب JSON — رمز موقّع لجلسات مصادقة بدون حالة.",
    zh: "JSON Web令牌 — 用于无状态认证会话的签名令牌。",
  },
  MFA: {
    en: "Multi-Factor Authentication — requires two or more proof factors when signing in.",
    ar: "المصادقة متعددة العوامل — تتطلب عاملين أو أكثر عند تسجيل الدخول.",
    zh: "多因素认证 — 登录需要两个或更多验证因素。",
  },
  TOTP: {
    en: "Time-based One-Time Password — 6-digit codes that rotate every 30 seconds.",
    ar: "كلمة مرور لمرة واحدة زمنية — رموز من 6 أرقام تتغير كل 30 ثانية.",
    zh: "基于时间的动态口令 — 每30秒轮换的6位验证码。",
  },
  RLS: {
    en: "Row-Level Security — the database enforces that queries only see authorized rows (tenant isolation).",
    ar: "أمان مستوى الصفوف — قاعدة البيانات تمنع الوصول لصفوف غير مصرح بها (عزل المستأجرين).",
    zh: "行级安全 — 数据库只允许查询授权的行（多租户隔离）。",
  },
  OAuth: {
    en: "Open Authorization — a delegated login protocol (e.g., sign in with Google).",
    ar: "التفويض المفتوح — بروتوكول تسجيل دخول مفوض (مثل الدخول بحساب Google).",
    zh: "开放授权 — 委托登录协议（例如使用Google登录）。",
  },
  webhook: {
    en: "HTTP callback — the platform calls your URL when events happen (e.g., assessment complete).",
    ar: "رد اتصال HTTP — المنصة تستدعي عنوانك عند حدوث أحداث (مثل اكتمال التقييم).",
    zh: "HTTP回调 — 平台在事件发生时调用您的URL（如评估完成）。",
  },
  Zod: {
    en: "Schema validation library — guarantees pipeline outputs match the expected shape.",
    ar: "مكتبة التحقق من المخططات — تضمن تطابق مخرجات خط الأنابيب مع الشكل المتوقع.",
    zh: "模式验证库 — 确保流水线输出符合预期结构。",
  },
  Redis: {
    en: "In-memory data store — used for job queues, rate limiting, and caching.",
    ar: "مخزن بيانات في الذاكرة — يستخدم للطوابير وتحديد المعدل والتخزين المؤقت.",
    zh: "内存数据存储 — 用于队列、限流和缓存。",
  },
  BullMQ: {
    en: "Redis-backed job queue — processes AI assessment jobs reliably.",
    ar: "طابور مهام يعتمد على Redis — يعالج مهام تقييم AI بشكل موثوق.",
    zh: "基于Redis的任务队列 — 可靠地处理AI评估任务。",
  },
  Supabase: {
    en: "Managed Postgres + Auth platform — hosts DJAC's database with RLS and backups.",
    ar: "منصة Postgres مُدارة — تستضيف قاعدة بيانات DJAC مع RLS والنسخ الاحتياطي.",
    zh: "托管的Postgres+认证平台 — 托管DJAC数据库，支持RLS和备份。",
  },
  PostgreSQL: {
    en: "Open-source relational database — DJAC's primary data store.",
    ar: "قاعدة بيانات علائقية مفتوحة المصدر — مخزن البيانات الرئيسي لـ DJAC.",
    zh: "开源关系型数据库 — DJAC的主要数据存储。",
  },
  Stripe: {
    en: "Payment platform — handles subscriptions, checkout, and billing events.",
    ar: "منصة دفع — تدير الاشتراكات والدفع وأحداث الفوترة.",
    zh: "支付平台 — 处理订阅、结账和账单事件。",
  },
  Vercel: {
    en: "Serverless hosting platform — deploys DJAC's frontend and API.",
    ar: "منصة استضافة بدون خادم — تنشر واجهة DJAC وواجهة API.",
    zh: "无服务器托管平台 — 部署DJAC前端和API。",
  },
};

const GLOSSARY_TERMS = Object.keys(GLOSSARY).sort(
  (a, b) => b.length - a.length
);

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function glossifyText(text: string, locale: string): React.ReactNode[] {
  if (!GLOSSARY_TERMS.length || !text) return [text];
  const pattern = new RegExp(
    `(^|[^\\p{L}\\p{N}])(${GLOSSARY_TERMS.map(escapeRegExp).join("|")})(?=[^\\p{L}\\p{N}]|$)`,
    "giu"
  );
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(text))) {
    if (m.index > lastIndex) nodes.push(text.slice(lastIndex, m.index));
    if (m[1]) nodes.push(m[1]);
    const term = m[2];
    const def =
      GLOSSARY[term]?.[locale as "en" | "ar" | "zh"] ||
      GLOSSARY[term]?.en ||
      "";
    nodes.push(
      <span
        key={`t-${m.index}`}
        className="djac-docs-term"
        tabIndex={0}
        data-term={def}
      >
        {term}
      </span>
    );
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

/* ──────────────────────────────────────────────────────────────────────────
   Fuzzy search: typo-tolerant token matching with Levenshtein distance
   ────────────────────────────────────────────────────────────────────────── */

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 1) return 2;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = cur;
  }
  return prev[n];
}

/* ──────────────────────────────────────────────────────────────────────────
   Sub-component: FaqAccordion — collapsible Q&A blocks
   ────────────────────────────────────────────────────────────────────────── */

function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="djac-docs-faq">
      {items.map((item, i) => (
        <details key={i} className="djac-docs-faq-item">
          <summary className="djac-docs-faq-q">
            <HelpCircle className="h-4 w-4 text-primary shrink-0" />
            <span className="min-w-0 flex-1">{item.q}</span>
            <ChevronDown className="djac-docs-faq-chevron h-4 w-4 text-muted-foreground shrink-0" />
          </summary>
          <p className="djac-docs-faq-a">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Sub-component: CodeBlock
   ────────────────────────────────────────────────────────────────────────── */

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);
  const lines = code.split("\n");
  return (
    <div className="relative my-4 rounded-lg border bg-zinc-950 dark:bg-zinc-900 overflow-hidden group">
      {lang && (
        <div className="flex items-center justify-between px-4 py-1.5 border-b border-zinc-800">
          <span className="text-xs font-mono text-zinc-400">{lang}</span>
          <button
            onClick={copy}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      )}
      <pre
        dir="ltr"
        className="p-4 overflow-x-auto overflow-y-auto text-sm leading-relaxed max-h-96"
      >
        <code className="font-mono text-zinc-200">
          {lines.map((line, i) => (
            <span key={i} className="djac-docs-code-line">
              <span className="djac-docs-code-lineno">{i + 1}</span>
              {line || " "}
            </span>
          ))}
        </code>
      </pre>
      {!lang && (
        <button
          onClick={copy}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-zinc-800/80 text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Sub-component: Admonition
   ────────────────────────────────────────────────────────────────────────── */

function Admonition({ type, children }: { type: string; children: string }) {
  const labels: Record<string, string> = {
    tip: "Tip",
    info: "Info",
    warning: "Warning",
    danger: "Danger",
  };
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    tip: Lightbulb,
    info: Info,
    warning: AlertTriangle,
    danger: X,
  };
  const Icon = icons[type] || Info;
  return (
    <div className={`djac-docs-admon admon-${type}`}>
      <div className="djac-docs-admon-header">
        <Icon className="h-4 w-4" />
        <span>{labels[type] || "Note"}</span>
      </div>
      <p>{children}</p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Sub-component: BreadcrumbNav
   ────────────────────────────────────────────────────────────────────────── */

function BreadcrumbNav({
  section,
  page,
}: {
  section: DocSection | null;
  page: DocPage | null;
}) {
  const [, navigate] = useLocation();
  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 flex-wrap">
      <button
        onClick={() => navigate("/docs")}
        className="hover:text-foreground transition-colors flex items-center gap-1"
      >
        <Home className="h-3.5 w-3.5" />
        <span>Docs</span>
      </button>
      {section && (
        <>
          <ChevronRight className="h-3.5 w-3.5" />
          <button
            onClick={() => navigate(`/docs/${section.id}`)}
            className="hover:text-foreground transition-colors"
          >
            {section.title}
          </button>
        </>
      )}
      {page && (
        <>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">{page.title}</span>
        </>
      )}
    </nav>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Main Component
   ────────────────────────────────────────────────────────────────────────── */

export default function DocsPortal() {
  usePageTitle("Documentation");
  const { locale, t } = useLocale();
  const [location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["getting-started"])
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTocId, setActiveTocId] = useState<string>("");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackTop, setShowBackTop] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [expandAll, setExpandAll] = useState(false);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isRTL = locale === "ar";

  const sections = useMemo(() => getDocSections(locale), [locale]);

  const currentPath = location.replace("/docs", "").replace(/^\/+/, "");
  const [currentSectionId, currentPageId] = currentPath
    ? currentPath.split("/")
    : [null, null];
  const isHome = !currentSectionId && !currentPageId;

  const currentSection = useMemo(() => {
    if (!currentSectionId) return null;
    return sections.find(s => s.id === currentSectionId) || null;
  }, [sections, currentSectionId]);

  const currentPage = useMemo(() => {
    if (!currentSection || !currentPageId)
      return currentSection?.pages[0] || null;
    return (
      currentSection.pages.find(p => p.id === currentPageId) ||
      currentSection.pages[0]
    );
  }, [currentSection, currentPageId]);

  const toc = useMemo(
    () => (currentPage ? extractToc(currentPage.content) : []),
    [currentPage]
  );

  // Prev / Next navigation
  const { prevPage, nextPage, prevSection, nextSection } = useMemo(() => {
    if (!currentSection || !currentPage)
      return {
        prevPage: null,
        nextPage: null,
        prevSection: null,
        nextSection: null,
      };
    const secIdx = sections.indexOf(currentSection);
    const pageIdx = currentSection.pages.indexOf(currentPage);
    let prevPage: { sectionId: string; pageId: string; title: string } | null =
      null;
    let nextPage: { sectionId: string; pageId: string; title: string } | null =
      null;
    let prevSection: { id: string; title: string } | null = null;
    let nextSection: { id: string; title: string } | null = null;

    if (pageIdx > 0) {
      const p = currentSection.pages[pageIdx - 1];
      prevPage = { sectionId: currentSection.id, pageId: p.id, title: p.title };
    } else if (secIdx > 0) {
      const prevSec = sections[secIdx - 1];
      const lastPage = prevSec.pages[prevSec.pages.length - 1];
      prevPage = {
        sectionId: prevSec.id,
        pageId: lastPage.id,
        title: lastPage.title,
      };
      prevSection = { id: prevSec.id, title: prevSec.title };
    }

    if (pageIdx < currentSection.pages.length - 1) {
      const p = currentSection.pages[pageIdx + 1];
      nextPage = { sectionId: currentSection.id, pageId: p.id, title: p.title };
    } else if (secIdx < sections.length - 1) {
      const nextSec = sections[secIdx + 1];
      nextPage = {
        sectionId: nextSec.id,
        pageId: nextSec.pages[0].id,
        title: nextSec.pages[0].title,
      };
      nextSection = { id: nextSec.id, title: nextSec.title };
    }

    return { prevPage, nextPage, prevSection, nextSection };
  }, [currentSection, currentPage, sections]);

  const navigateToPage = useCallback(
    (sectionId: string, pageId: string) => {
      navigate(`/docs/${sectionId}/${pageId}`);
      setMobileSidebarOpen(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
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
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sections;
    const tokens = query.split(/\s+/).filter(Boolean);

    const wordCache = new Map<string, Set<string>>();
    const wordsOf = (content: string): Set<string> => {
      let set = wordCache.get(content);
      if (!set) {
        set = new Set(content.toLowerCase().match(/[a-z0-9]{3,}/g) || []);
        wordCache.set(content, set);
      }
      return set;
    };

    const pageScore = (
      title: string,
      summary: string,
      content: string
    ): number => {
      const tl = title.toLowerCase();
      const sl = summary.toLowerCase();
      const cl = content.toLowerCase();
      let score = 0;
      for (const tk of tokens) {
        if (tl.includes(tk)) score += 3;
        else if (sl.includes(tk)) score += 2;
        else if (cl.includes(tk)) score += 1;
        else {
          let fuzzyFound = false;
          if (tk.length >= 4) {
            for (const w of wordsOf(content)) {
              if (
                Math.abs(w.length - tk.length) <= 1 &&
                levenshtein(tk, w) <= 1
              ) {
                fuzzyFound = true;
                break;
              }
            }
          }
          if (!fuzzyFound) return 0;
          score += 1;
        }
      }
      return score;
    };

    return sections
      .map(s => {
        const scored = s.pages
          .map(p => ({ p, score: pageScore(p.title, p.summary, p.content) }))
          .filter(x => x.score > 0)
          .sort((a, b) => b.score - a.score)
          .map(x => x.p);
        return scored.length ? { ...s, pages: scored } : null;
      })
      .filter((s): s is DocSection => s !== null);
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

  // Persist per-page feedback votes + reset transient UI on navigation
  useEffect(() => {
    setShowShortcuts(false);
    setMobileTocOpen(false);
    setCopiedLink(false);
    try {
      const saved = localStorage.getItem(
        `djac-doc-feedback:${currentPath || "home"}`
      );
      setFeedback(saved === "up" || saved === "down" ? saved : null);
    } catch {
      setFeedback(null);
    }
    if (currentPath) {
      try {
        const savedPos = Number(
          localStorage.getItem(`djac-doc-scroll:${currentPath}`) || "0"
        );
        if (savedPos > 300) {
          requestAnimationFrame(() => {
            window.scrollTo({
              top: savedPos,
              behavior: "instant" as ScrollBehavior,
            });
          });
        }
      } catch {
        /* storage unavailable */
      }
    }
  }, [currentPath]);

  const voteFeedback = useCallback(
    (v: "up" | "down") => {
      setFeedback(v);
      try {
        localStorage.setItem(`djac-doc-feedback:${currentPath || "home"}`, v);
      } catch {
        /* storage unavailable */
      }
    },
    [currentPath]
  );

  const copyPageLink = useCallback(() => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      })
      .catch(() => {});
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        setMobileSidebarOpen(false);
        setShowShortcuts(false);
        setMobileTocOpen(false);
        searchRef.current?.blur();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Arrow key navigation between pages
  useEffect(() => {
    if (isHome) return;
    function handleArrows(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.closest("input,textarea,[contenteditable]")) return;
      if (e.key === "ArrowRight" && nextPage)
        navigateToPage(nextPage.sectionId, nextPage.pageId);
      if (e.key === "ArrowLeft" && prevPage)
        navigateToPage(prevPage.sectionId, prevPage.pageId);
    }
    window.addEventListener("keydown", handleArrows);
    return () => window.removeEventListener("keydown", handleArrows);
  }, [isHome, nextPage, prevPage, navigateToPage]);

  // Scroll progress + back-to-top + last-read position save
  const saveScrollTimer = useRef<number | undefined>(undefined);
  const currentPathRef = useRef(currentPath);
  currentPathRef.current = currentPath;

  useEffect(() => {
    function handleScroll() {
      const h = document.documentElement;
      const scrollTop = h.scrollTop || document.body.scrollTop;
      const scrollHeight = h.scrollHeight || document.body.scrollHeight;
      const clientHeight = h.clientHeight;
      const pct =
        scrollHeight > clientHeight
          ? Math.min(100, (scrollTop / (scrollHeight - clientHeight)) * 100)
          : 0;
      setScrollProgress(pct);
      setShowBackTop(scrollTop > 400);
      if (currentPathRef.current) {
        window.clearTimeout(saveScrollTimer.current);
        saveScrollTimer.current = window.setTimeout(() => {
          try {
            localStorage.setItem(
              `djac-doc-scroll:${currentPathRef.current}`,
              String(window.scrollY)
            );
          } catch {
            /* storage unavailable */
          }
        }, 400);
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.clearTimeout(saveScrollTimer.current);
    };
  }, []);

  // Scroll-based active TOC tracking
  useEffect(() => {
    if (toc.length === 0) return;
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting);
        if (visible.length > 0) setActiveTocId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );
    toc.forEach(entry => {
      const el = document.getElementById(entry.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [toc, currentPage]);

  /* ── Content Renderer ────────────────────────────────────────────────── */

  const renderContent = useCallback(
    (text: string) => {
      const lines = text.split("\n");
      const faqPattern = /^> \*\*(faq|answer)\*\* (.+)/;
      const blocks: (string | { faq: { q: string; a: string }[] })[] = [];
      let faqGroup: { q: string; a: string }[] = [];
      let inCode = false;
      for (const line of lines) {
        if (line.startsWith("```")) {
          inCode = !inCode;
          if (faqGroup.length) {
            blocks.push({ faq: faqGroup });
            faqGroup = [];
          }
          blocks.push(line);
          continue;
        }
        if (inCode) {
          blocks.push(line);
          continue;
        }
        const fm = line.match(faqPattern);
        if (fm) {
          if (fm[1] === "faq") {
            if (faqGroup.length) blocks.push({ faq: faqGroup });
            faqGroup = [{ q: fm[2], a: "" }];
          } else if (faqGroup.length) {
            const last = faqGroup[faqGroup.length - 1];
            last.a += (last.a ? " " : "") + fm[2];
          } else {
            faqGroup = [{ q: "", a: fm[2] }];
          }
          continue;
        }
        if (faqGroup.length) {
          blocks.push({ faq: faqGroup });
          faqGroup = [];
        }
        blocks.push(line);
      }
      if (faqGroup.length) blocks.push({ faq: faqGroup });

      const elements: React.ReactNode[] = [];
      let i = 0;
      let inCodeBlock = false;
      let codeBlockLines: string[] = [];
      let codeBlockLang = "";

      const flushCodeBlock = () => {
        if (codeBlockLines.length > 0) {
          elements.push(
            <CodeBlock
              key={`code-${i}`}
              code={codeBlockLines.join("\n")}
              lang={codeBlockLang || undefined}
            />
          );
          codeBlockLines = [];
          codeBlockLang = "";
        }
        inCodeBlock = false;
      };

      const boldify = (t: string): React.ReactNode => {
        const parts = t.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
        return parts.map((part, pi) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={pi} className="font-semibold text-foreground">
                {part.slice(2, -2)}
              </strong>
            );
          }
          if (part.startsWith("`") && part.endsWith("`")) {
            return (
              <code
                key={pi}
                className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[0.85em] font-mono text-foreground"
              >
                {part.slice(1, -1)}
              </code>
            );
          }
          return <span key={pi}>{glossifyText(part, locale)}</span>;
        });
      };

      for (; i < blocks.length; i++) {
        const block = blocks[i];
        if (typeof block !== "string") {
          elements.push(<FaqAccordion key={`faq-${i}`} items={block.faq} />);
          continue;
        }
        const line = block;

        // Code blocks
        if (line.startsWith("```")) {
          if (inCodeBlock) {
            flushCodeBlock();
          } else {
            inCodeBlock = true;
            codeBlockLang = line.slice(3).trim();
          }
          continue;
        }
        if (inCodeBlock) {
          codeBlockLines.push(line);
          continue;
        }

        if (!line.trim()) {
          elements.push(<div key={i} className="h-3" />);
          continue;
        }

        // Admonitions
        const admonMatch = line.match(
          /^> \*\*(tip|info|warning|danger)\*\* (.+)/
        );
        if (admonMatch) {
          elements.push(
            <Admonition key={i} type={admonMatch[1]}>
              {admonMatch[2]}
            </Admonition>
          );
          continue;
        }

        // Headings with anchor IDs
        const h3Match = line.match(/^### (.+)/);
        const h4Match = line.match(/^#### (.+)/);
        if (h3Match) {
          const text = h3Match[1];
          const id = text
            .toLowerCase()
            .replace(/[^a-z0-9\u0600-\u06FF\u4e00-\u9fff]+/g, "-")
            .replace(/^-|-$/g, "");
          elements.push(
            <h3
              key={i}
              id={id}
              className="djac-docs-h3 text-foreground mt-10 mb-3 font-semibold text-lg group"
            >
              <a
                href={`#${id}`}
                className="djac-docs-heading-anchor"
                aria-label={`Link to ${text}`}
              >
                {boldify(text)}
                <Hash className="djac-docs-heading-hash" />
              </a>
            </h3>
          );
          continue;
        }
        if (h4Match) {
          const text = h4Match[1];
          const id = text
            .toLowerCase()
            .replace(/[^a-z0-9\u0600-\u06FF\u4e00-\u9fff]+/g, "-")
            .replace(/^-|-$/g, "");
          elements.push(
            <h4
              key={i}
              id={id}
              className="text-base font-semibold text-foreground mt-8 mb-2 group"
            >
              <a
                href={`#${id}`}
                className="djac-docs-heading-anchor"
                aria-label={`Link to ${text}`}
              >
                {boldify(text)}
                <Hash className="djac-docs-heading-hash" />
              </a>
            </h4>
          );
          continue;
        }

        // Bold list items with checkmark
        if (line.startsWith("- **")) {
          const match = line.match(/- \*\*(.+?)\*\*(.+)/);
          if (match) {
            elements.push(
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
            continue;
          }
        }

        // Regular list items
        if (line.startsWith("- ")) {
          elements.push(
            <div
              key={i}
              className="flex items-start gap-2 ml-2 my-0.5 text-sm djac-body"
            >
              <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
              <span>{boldify(line.replace("- ", ""))}</span>
            </div>
          );
          continue;
        }

        // Tables
        if (line.startsWith("| ")) {
          const cells = line
            .split("|")
            .filter(Boolean)
            .map(c => c.trim());
          const isSep = cells.every(c => /^-{3,}$/.test(c));
          if (isSep) continue;
          elements.push(
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
          continue;
        }

        // Numbered lists
        if (/^\d+\.\s/.test(line)) {
          const num = line.match(/^(\d+)\./)?.[1] || "";
          const rest = line.replace(/^\d+\.\s*/, "");
          elements.push(
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
          continue;
        }

        elements.push(
          <p key={i} className="text-sm djac-body my-1">
            {boldify(line)}
          </p>
        );
      }

      flushCodeBlock();
      return elements;
    },
    [locale]
  );

  /* ────────────────────────────────────────────────────────────────────────
     Home Landing Page
     ──────────────────────────────────────────────────────────────────────── */

  if (isHome) {
    return (
      <div className="djac-page djac-docs-portal">
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
          {/* Home Sidebar */}
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
              {searchQuery && (
                <Badge variant="secondary" className="text-[10px] h-5">
                  {filteredSections.reduce((s, sec) => s + sec.pages.length, 0)}
                </Badge>
              )}
            </div>
            <div className="px-3 py-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  placeholder={t("docs.search_placeholder", "Search docs...")}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
                <kbd className="absolute right-2 top-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono text-muted-foreground bg-muted border hidden sm:block">
                  ⌘K
                </kbd>
              </div>
            </div>
            <nav className="djac-docs-nav">
              {filteredSections.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Search className="h-6 w-6 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground mb-1">
                    No results found
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setExpandAll(false);
                      setExpandedSections(new Set(["getting-started"]));
                    }}
                  >
                    Clear search
                  </Button>
                </div>
              ) : (
                filteredSections.map(section => {
                  const isExpanded =
                    expandAll || expandedSections.has(section.id);
                  const SecIcon = ICONS[section.icon] || BookOpen;
                  return (
                    <div key={section.id} className="mb-0.5">
                      <button
                        type="button"
                        onClick={() => toggleSection(section.id)}
                        className="djac-docs-section-btn"
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
                          {section.pages.map(page => (
                            <SidebarPageRow
                              key={page.id}
                              page={page}
                              query={searchQuery}
                              active={false}
                              onClick={() =>
                                navigateToPage(section.id, page.id)
                              }
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </nav>
            <div className="djac-docs-sidebar-footer">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Globe className="h-3 w-3" />
                <span>{locale.toUpperCase()}</span>
              </div>
            </div>
          </aside>

          {/* Home Content */}
          <main className="djac-docs-content">
            <div className="max-w-4xl">
              {/* Hero */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {locale.toUpperCase()}
                  </Badge>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
                  DJAC Documentation
                </h1>
                <p className="text-base text-muted-foreground max-w-2xl">
                  Everything you need to deploy, configure, and master the DJAC
                  compliance intelligence platform. From quick-start guides to
                  deep API references and security architecture.
                </p>
                <div className="flex flex-wrap gap-6 mt-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                      <Layers className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="font-bold text-foreground">11</span>{" "}
                      <span className="text-muted-foreground">Sections</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="font-bold text-foreground">28+</span>{" "}
                      <span className="text-muted-foreground">Pages</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                      <Globe className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="font-bold text-foreground">3</span>{" "}
                      <span className="text-muted-foreground">Languages</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                      <Code className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="font-bold text-foreground">200+</span>{" "}
                      <span className="text-muted-foreground">
                        API Procedures
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-6">
                  <Button
                    onClick={() => navigate("/docs/getting-started/welcome")}
                  >
                    Get Started
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate("/docs/api-integration/api-reference")
                    }
                  >
                    <Terminal className="h-4 w-4 mr-2" />
                    API Reference
                  </Button>
                </div>
              </div>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                {homeFeatures.map(f => {
                  const FIcon = ICONS[f.icon] || BookOpen;
                  return (
                    <button
                      key={f.title}
                      onClick={() => navigate(f.link)}
                      className="djac-glass-card p-5 text-left hover:border-primary/40 transition-all hover:shadow-lg group cursor-pointer"
                    >
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 mb-3 group-hover:bg-primary/20 transition-colors">
                        <FIcon className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-sm mb-1.5">
                        {f.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {f.desc}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Quick Links */}
              <div className="mb-12">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <List className="h-5 w-5 text-primary" />
                  Quick Links
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {quickLinks.map(link => (
                    <button
                      key={link.path}
                      onClick={() => navigate(link.path)}
                      className="flex items-center gap-2 p-3 rounded-lg border hover:border-primary/40 hover:bg-accent transition-all text-sm"
                    >
                      <ChevronRight className="h-4 w-4 text-primary shrink-0" />
                      <span>{link.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Guided Path */}
              <div className="mb-12">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-primary" />
                  New to DJAC? Start here
                </h2>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate("/docs/getting-started/welcome")}
                    className="w-full text-left flex items-start gap-4 p-4 rounded-xl border hover:border-primary/30 hover:bg-accent/50 transition-all group"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0 mt-0.5">
                      1
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        Read the Welcome Guide
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        What DJAC does and who it's for — 2 min read
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary shrink-0 self-center" />
                  </button>
                  <button
                    onClick={() => navigate("/docs/ai-engine/ai-overview")}
                    className="w-full text-left flex items-start gap-4 p-4 rounded-xl border hover:border-primary/30 hover:bg-accent/50 transition-all group"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0 mt-0.5">
                      2
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        Explore the AI Engine
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        How the 8-stage compliance pipeline works — 3 min read
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary shrink-0 self-center" />
                  </button>
                  <button
                    onClick={() =>
                      navigate("/docs/vendor-risk/vendor-assessment")
                    }
                    className="w-full text-left flex items-start gap-4 p-4 rounded-xl border hover:border-primary/30 hover:bg-accent/50 transition-all group"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0 mt-0.5">
                      3
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        Try a Vendor Assessment
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Step-by-step guide to run your first compliance check
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary shrink-0 self-center" />
                  </button>
                </div>
              </div>

              {/* CTA */}
              <div className="djac-docs-next">
                <h3 className="text-lg font-bold mb-3">
                  {t("docs.cta_ready", "Ready to get started?")}
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => navigate("/signup")}>
                    {t("docs.cta_trial", "Start Free Trial")}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/pricing")}
                  >
                    {t("docs.cta_pricing", "View Pricing")}
                  </Button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  /* ────────────────────────────────────────────────────────────────────────
     Content Page
     ──────────────────────────────────────────────────────────────────────── */

  if (!currentSection || !currentPage) {
    return null;
  }

  return (
    <div className="djac-page djac-docs-portal" dir={isRTL ? "rtl" : "ltr"}>
      {/* Scroll Progress Bar */}
      <div
        className="djac-docs-progress-bar"
        style={{ width: `${scrollProgress}%` }}
      />

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

      {/* Mobile Sidebar Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="djac-docs-mobile-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div className="djac-docs-layout">
        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <aside
          className={`djac-docs-sidebar ${mobileSidebarOpen ? "djac-docs-sidebar-open" : ""}`}
        >
          <div className="djac-docs-sidebar-header">
            <button
              onClick={() => navigate("/docs")}
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm">
                {t("docs.sidebar_title", "Documentation")}
              </span>
            </button>
            {searchQuery && (
              <Badge variant="secondary" className="text-[10px] h-5">
                {filteredSections.reduce((s, sec) => s + sec.pages.length, 0)}
              </Badge>
            )}
          </div>
          <div className="px-3 py-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                ref={searchRef}
                placeholder={t("docs.search_placeholder", "Search docs...")}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
              <kbd className="absolute right-2 top-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono text-muted-foreground bg-muted border hidden sm:block">
                ⌘K
              </kbd>
            </div>
          </div>
          {filteredSections.length > 1 && (
            <button
              onClick={() => {
                setExpandAll(!expandAll);
                if (!expandAll)
                  setExpandedSections(new Set(sections.map(s => s.id)));
                else setExpandedSections(new Set());
              }}
              className="w-full px-3 py-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 justify-center"
              aria-label={
                expandAll ? "Collapse all sections" : "Expand all sections"
              }
            >
              <ChevronsUpDown className="h-3 w-3" />
              {expandAll ? "Collapse all" : "Expand all"}
            </button>
          )}
          <nav className="djac-docs-nav">
            {filteredSections.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Search className="h-6 w-6 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground mb-1">
                  No results found
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  Try different keywords or browse the sections
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setExpandAll(false);
                    setExpandedSections(new Set(["getting-started"]));
                  }}
                >
                  Clear search
                </Button>
              </div>
            ) : (
              filteredSections.map(section => {
                const isExpanded =
                  expandAll || expandedSections.has(section.id);
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
                        {section.pages.map(page => (
                          <SidebarPageRow
                            key={page.id}
                            page={page}
                            query={searchQuery}
                            active={
                              currentPageId === page.id &&
                              currentSectionId === section.id
                            }
                            onClick={() => navigateToPage(section.id, page.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </nav>
          <div className="djac-docs-sidebar-footer">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Globe className="h-3 w-3" />
              <span>{locale.toUpperCase()}</span>
            </div>
          </div>
        </aside>

        {/* ── Content ─────────────────────────────────────────────────── */}
        <main className="djac-docs-content" ref={contentRef}>
          <article className="djac-docs-page-wrapper">
            {/* Breadcrumbs */}
            <BreadcrumbNav section={currentSection} page={currentPage} />

            {/* Header */}
            <div className="djac-docs-section-header">
              <h1 className="djac-display text-2xl sm:text-3xl font-bold">
                {currentPage.title}
              </h1>
              <p className="text-sm djac-body text-muted-foreground mt-2 max-w-3xl">
                {currentPage.summary}
              </p>
              <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {Math.max(
                    1,
                    Math.ceil(currentPage.content.split(/\s+/).length / 200)
                  )}{" "}
                  min read
                </span>
              </div>
              <div className="relative flex flex-wrap items-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={copyPageLink}
                  className="djac-docs-action-btn"
                >
                  {copiedLink ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Link2 className="h-3.5 w-3.5" />
                  )}
                  {copiedLink ? "Link copied" : "Copy link"}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="djac-docs-action-btn"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print page
                </button>
                <button
                  type="button"
                  onClick={() => setShowShortcuts(s => !s)}
                  className="djac-docs-action-btn"
                  aria-expanded={showShortcuts}
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  Shortcuts
                </button>
                {showShortcuts && (
                  <div className="djac-docs-shortcuts">
                    <table>
                      <tbody>
                        <tr>
                          <td>
                            <kbd>⌘/Ctrl</kbd> + <kbd>K</kbd>
                          </td>
                          <td>Focus search</td>
                        </tr>
                        <tr>
                          <td>
                            <kbd>→</kbd> / <kbd>←</kbd>
                          </td>
                          <td>Next / previous page</td>
                        </tr>
                        <tr>
                          <td>
                            <kbd>Esc</kbd>
                          </td>
                          <td>Close menus &amp; search</td>
                        </tr>
                        <tr>
                          <td>
                            <kbd>#</kbd> anchor links
                          </td>
                          <td>Jump to section</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile TOC (below xl) */}
            {toc.length >= 3 && (
              <div className="djac-docs-toc-mobile xl:hidden">
                <button
                  type="button"
                  onClick={() => setMobileTocOpen(o => !o)}
                  className="djac-docs-toc-mobile-toggle"
                  aria-expanded={mobileTocOpen}
                >
                  <span className="flex items-center gap-2">
                    <List className="h-3.5 w-3.5" />
                    On this page
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${mobileTocOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {mobileTocOpen && (
                  <ul>
                    {toc.map(entry => (
                      <li key={entry.id}>
                        <a
                          href={`#${entry.id}`}
                          className={
                            activeTocId === entry.id ? "toc-active" : ""
                          }
                          style={{
                            paddingLeft: entry.level === 3 ? 8 : 20,
                          }}
                          onClick={e => {
                            e.preventDefault();
                            setMobileTocOpen(false);
                            document
                              .getElementById(entry.id)
                              ?.scrollIntoView({ behavior: "smooth" });
                          }}
                        >
                          {entry.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Body + TOC Grid */}
            <div className="djac-docs-body-grid">
              {/* Article */}
              <div className="djac-docs-article">
                {useMemo(
                  () => renderContent(currentPage.content),
                  [currentPage.content, renderContent]
                )}
              </div>

              {/* Right TOC (desktop) */}
              {toc.length >= 3 && (
                <nav className="djac-docs-toc hidden xl:block">
                  <div className="sticky top-24">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Hash className="h-3 w-3" />
                      On this page
                    </h4>
                    <ul className="space-y-0.5">
                      {toc.map(entry => (
                        <li key={entry.id}>
                          <a
                            href={`#${entry.id}`}
                            onClick={e => {
                              e.preventDefault();
                              document
                                .getElementById(entry.id)
                                ?.scrollIntoView({ behavior: "smooth" });
                            }}
                            className={`block text-xs py-1 transition-colors border-l-2 ${
                              entry.level === 3 ? "pl-3" : "pl-6"
                            } ${
                              activeTocId === entry.id
                                ? "text-primary border-primary font-medium"
                                : "text-muted-foreground border-transparent hover:text-foreground hover:border-border"
                            }`}
                          >
                            {entry.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() =>
                        window.scrollTo({ top: 0, behavior: "smooth" })
                      }
                      className="flex items-center gap-1 mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ArrowUp className="h-3 w-3" />
                      Back to top
                    </button>
                  </div>
                </nav>
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

            {/* ── Prev / Next Navigation ───────────────────────────────── */}
            <div className="djac-docs-prevnext">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                {prevPage ? (
                  <button
                    onClick={() =>
                      navigateToPage(prevPage!.sectionId, prevPage!.pageId)
                    }
                    className="flex items-start gap-2 p-3 rounded-lg border hover:border-primary/40 hover:bg-accent transition-all text-left group flex-1 min-w-0"
                  >
                    <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground mb-0.5">
                        Previous{prevSection ? ` (${prevSection?.title})` : ""}
                      </div>
                      <div className="text-sm font-medium truncate">
                        {prevPage.title}
                      </div>
                    </div>
                  </button>
                ) : (
                  <div />
                )}
                {nextPage && (
                  <button
                    onClick={() =>
                      navigateToPage(nextPage!.sectionId, nextPage!.pageId)
                    }
                    className="flex items-start gap-2 p-3 rounded-lg border hover:border-primary/40 hover:bg-accent transition-all text-right group flex-1 min-w-0 justify-end"
                  >
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground mb-0.5">
                        Next{nextSection ? ` (${nextSection?.title})` : ""}
                      </div>
                      <div className="text-sm font-medium truncate">
                        {nextPage.title}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary mt-0.5 shrink-0" />
                  </button>
                )}
              </div>
            </div>

            {/* Page Nav Tabs */}
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
                    <span className="text-xs text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="text-sm truncate">{page.title}</span>
                  </button>
                );
              })}
            </div>

            {/* CTA */}
            <div className="djac-docs-next">
              <div className="djac-docs-feedback">
                <span className="text-sm text-muted-foreground mr-3">
                  Was this page helpful?
                </span>
                <button
                  onClick={() => voteFeedback("up")}
                  className={`djac-docs-feedback-btn ${feedback === "up" ? "djac-docs-feedback-active bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700" : ""}`}
                  aria-label="Yes, this page was helpful"
                >
                  <ThumbsUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => voteFeedback("down")}
                  className={`djac-docs-feedback-btn ${feedback === "down" ? "djac-docs-feedback-active bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-700" : ""}`}
                  aria-label="No, this page needs improvement"
                >
                  <ThumbsDown className="h-4 w-4" />
                </button>
                {feedback && (
                  <span className="text-xs text-muted-foreground ml-3">
                    {feedback === "up"
                      ? "Thanks for your feedback!"
                      : "Thanks! We'll improve this page."}
                  </span>
                )}
              </div>
              {currentPageId && relatedPages[currentPageId] ? (
                <div className="mt-6 pt-5 border-t">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-primary" />
                    Related pages
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {relatedPages[currentPageId].map(
                      (r: { title: string; path: string }) => (
                        <button
                          key={r.path}
                          onClick={() => navigate(r.path)}
                          className="text-xs px-3 py-1.5 rounded-full border hover:border-primary/40 hover:bg-accent transition-all text-muted-foreground hover:text-foreground"
                        >
                          {r.title}
                        </button>
                      )
                    )}
                  </div>
                </div>
              ) : null}
              <h3 className="text-lg font-bold mb-3 mt-5">
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
                  onClick={() => navigate("/docs/getting-started/welcome")}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  {t("docs.cta_guide", "Quick Start Guide")}
                </Button>
              </div>
            </div>
          </article>
        </main>
      </div>

      {/* Back to top FAB */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`djac-docs-backtop ${showBackTop ? "djac-docs-backtop-visible" : ""}`}
        aria-label="Back to top"
      >
        <ArrowUp className="h-4 w-4" />
      </button>
    </div>
  );
}
