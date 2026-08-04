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
  const { locale } = useLocale();
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
          {mobileSidebarOpen ? "Close Menu" : "Documentation Menu"}
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
              <span className="font-semibold text-sm">Documentation</span>
            </div>
          </div>

          <div className="px-3 py-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search docs..."
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
            {renderContent(currentPage.content)}
          </div>

          {/* Diagram */}
          {currentPage.diagram && (
            <div className="djac-docs-diagram">
              <div className="flex items-center gap-2 mb-3">
                <Network className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">
                  Architecture Diagram
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
                <h2 className="djac-h2 text-xl font-bold">Case Study</h2>
                <Badge variant="outline" className="ml-2">
                  {currentPage.caseStudy.company}
                </Badge>
              </div>
              <div className="djac-docs-casestudy-grid">
                <div className="djac-glass-card p-4">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Challenge
                  </h4>
                  <p className="text-sm djac-body">
                    {currentPage.caseStudy.challenge}
                  </p>
                </div>
                <div className="djac-glass-card p-4">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    Solution
                  </h4>
                  <p className="text-sm djac-body">
                    {currentPage.caseStudy.solution}
                  </p>
                </div>
                <div className="djac-glass-card p-4 md:col-span-2">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Results
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
                  Interactive Demo Guide
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
                  <h2 className="djac-h2 text-xl font-bold">Best Practices</h2>
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
                  <h2 className="djac-h2 text-xl font-bold">Troubleshooting</h2>
                </div>
                <div className="space-y-3">
                  {currentPage.troubleshooting.map((item, i) => (
                    <div key={i} className="djac-glass-card p-4 space-y-2">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <span className="text-amber-500">Q:</span>{" "}
                        {item.problem}
                      </h4>
                      <p className="text-sm djac-body flex items-start gap-2">
                        <span className="text-emerald-500 font-semibold">
                          A:
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
            <h3 className="text-lg font-bold mb-3">Ready to get started?</h3>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate("/signup")}>
                Start Free Trial
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button variant="outline" onClick={() => navigate("/pricing")}>
                View Pricing
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/docs/getting-started/welcome`)}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Quick Start Guide
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
