# DJAC Tool — Complete End-User Guide

**Platform:** https://app.yalla-hack.ae/
**Product name:** DJAC Tool — _China–Saudi Compliance SaaS_ ("Intelligence Platform")
**Powered by:** Yalla-Hack · In partnership with DeHeng Law Offices (Est. 1993 · Global Practice)
**Support:** hello@yalla-hack.com
**Version scope:** Current production build

---

## Table of Contents

1. [What DJAC Is](#1-what-djac-is)
2. [Getting Started](#2-getting-started)
3. [Interface Tour](#3-interface-tour)
4. [Roles, Permissions & Plans](#4-roles-permissions--plans)
5. [Dashboard & Overview](#5-dashboard--overview)
6. [Global Intelligence](#6-global-intelligence)
7. [Intelligence & Analysis](#7-intelligence--analysis)
8. [Cyber Operations](#8-cyber-operations)
9. [Compliance Management](#9-compliance-management)
10. [Risk & Vendor Management](#10-risk--vendor-management)
11. [Analytics](#11-analytics)
12. [Reports](#12-reports)
13. [Platform & Onboarding](#13-platform--onboarding)
14. [Account, Team & Billing](#14-account-team--billing)
15. [Administration Consoles](#15-administration-consoles)
16. [End-to-End Workflows](#16-end-to-end-workflows)
17. [Pricing & Entitlements](#17-pricing--entitlements)
18. [Keyboard, Accessibility & Localization](#18-keyboard-accessibility--localization)
19. [Troubleshooting & FAQ](#19-troubleshooting--faq)
20. [Glossary](#20-glossary)

---

## 1. What DJAC Is

**DJAC** is a cross-border compliance intelligence SaaS. It helps organizations operating between **China, Saudi Arabia, the Gulf, the EU, the US, Brazil** and **31 jurisdictions worldwide** to:

- **Understand** which regulations apply to them (privacy, cybersecurity, AI, cloud, sector rules).
- **Analyze** framework obligations side-by-side and detect **conflicts, overlaps and harmonization opportunities**.
- **Assess** vendors and market-entry readiness using an **AI assessment engine**.
- **Track** gaps, risks, policies, incidents, audits, deadlines and data-subject requests.
- **Generate** board-ready **PDF / DOCX reports** in **English, Arabic and Chinese**.
- **Monitor** regulatory change and continuous cyber exposure (CTEM).

### 1.1 Core value proposition

| Capability             | What you get                                                                                                                              |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework registry** | 107 framework packs across 7 regions; 46 frameworks with full control-level detail in the database                                        |
| **Jurisdictions**      | 31 supported jurisdictions, from China & Saudi Arabia to Brazil, India, Nigeria and Vietnam                                               |
| **Conflict detection** | Framework↔framework relationships typed as `overlap`, `conflict`, `harmonization`, `coordination`, `gap`, `dependency`                   |
| **Simulation engine**  | Deterministic readiness / gap / cost / cross-border scenario modeling with per-framework maturity scores                                  |
| **AI pipeline**        | 8-stage agent pipeline (gatekeeper → intake → extractor → RAG context → judge → synthesizer → validator → reporter) + 18 domain AI agents |
| **Reporting**          | PDF, DOCX and Markdown output in en / ar / zh, with shareable links and email delivery                                                    |

### 1.2 What DJAC is _not_

- It is **not** legal advice. Outputs are intelligence to support human decision-making.
- It is **not** a substitute for a licensed DeHeng Law Offices engagement — use **Request Consultation** for that.
- Scores in the simulation engine are **deterministic estimates seeded from framework base scores**, not audits of your actual controls.

---

## 2. Getting Started

### 2.1 Create an account

1. Go to **https://app.yalla-hack.ae/**. If signed out you see the **Sign In / Register** screen.
2. Click **Create your account** (or go to `/signup`).
3. **Step 1 — choose your persona** (drives the profile form):
   - Compliance Officer / DPO
   - Lawyer / Legal Advisor
   - Enterprise / Company
   - Government / Regulator
   - Consultant / Advisor
   - Vendor / Supplier
   - Visitor / Researcher
4. **Step 2 — profile form**: full name, work email, optional phone, organization, job title, primary jurisdictions, industry. Persona-specific fields appear (Bar license, CR number, Ministry, vendor category, certifications, advisory areas…).
5. **Create a password** and accept the **Terms of Service** + **data-processing consent**.
6. A **6-digit verification code** is emailed to you → enter it → **Activate Account**.
   - Didn't receive it? Click **Send again**.

### 2.2 Sign in

- **Email + password**, or **Continue with Google**.
- **Continue with Organization SSO** appears only when your organization has configured an external identity provider.
- A live **database-readiness check** blocks submission if the backend is temporarily unavailable.

**Password recovery** (`/forgot-password`): enter email → **Send Reset Code** → enter the 6-digit code → set a new password (min. 8 characters) → back to sign in.

> Note: `/reset-password` is a legacy link that simply redirects to `/forgot-password`.

### 2.3 Onboarding wizard (new non-admin users)

New users are **automatically redirected** to the **7-step Onboarding Wizard** until it is completed. You can revisit it anytime under **Platform → Onboarding Wizard**.

| Step                                | What you provide                                                                                                                                                                                                      |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Organization Setup**           | Organization name, billing email, industry → **Create Organization**                                                                                                                                                  |
| **2. Jurisdiction Focus**           | Pick jurisdictions (Global / Both / China / Saudi Arabia / EU / US / Brazil / UK / Canada / Australia / Japan / South Korea / Singapore / India / South Africa / Mexico / UAE / Other) → shows a **Deadline Preview** |
| **3. Select Compliance Frameworks** | Choose frameworks (or _Skip for now_)                                                                                                                                                                                 |
| **4. Business Objectives**          | Goals (or _Skip for now_)                                                                                                                                                                                             |
| **5. Vendor Selection**             | Pick a vendor (or **Create Vendor**)                                                                                                                                                                                  |
| **6. Run Assessment**               | Launch the AI assessment                                                                                                                                                                                              |
| **7. Generate Report**              | **Generate JSON Report** / Export                                                                                                                                                                                     |

Stages tracked: `not_started → account_type_selected → org_created/org_joined → jurisdiction_set → completed`.

### 2.4 First-run product tour

On first load a **spotlight tour** walks you through the interface with **Skip / Back / Next / Got it**. Restart it anytime from **Account Settings → Preferences → Onboarding Tour**.

---

## 3. Interface Tour

### 3.1 Application shell

**Top bar (every page):**

- Breadcrumb: _App name → current page_
- Locale-aware **date**
- **"System Live"** status pill
- **Search button / ⌘K command palette**
- **Notification bell** with unread badge
- **Theme toggle** (dark / light)
- **Language switcher** (9 languages)

**Left sidebar** (resizable 200–480 px, collapsible to icons, RTL-aware, width remembered):

- Logo header with tagline **"Intelligence Platform"**
- Grouped menu (see §3.2)
- Footer **avatar menu → Sign out**

**Sign-out dialog** offers four choices: _Sign in again_, _Register new account_, _Switch account_, _Cancel_. Choosing any clears both OAuth and local sessions.

**Always present:**

- Skip-to-content link (keyboard users)
- Animated `ParticleField` / `CyberGrid` backgrounds
- Toast notifications (sonner)
- Per-route and per-query **Retry** error handling
- Trial banner (free-trial plans) and cookie-consent banner

### 3.2 Navigation groups

| Group                                   | Pages                                                                                                                                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Overview**                            | Dashboard                                                                                                                                                                             |
| **Global Intelligence**                 | Global Registry · Knowledge Graph · Industry Editions · AI Agent Network                                                                                                              |
| **Intelligence**                        | Framework Analysis · Client Workspace · Vendor Assessment · Pro Intelligence · Transfer Checker · AI Compliance Chat · Regulatory Changes · Cross-Border Data Flow                    |
| **Cyber Operations**                    | Service Requests · Asset Inventory · Threat Intel Feed · Security Maturity                                                                                                            |
| **Compliance**                          | Legal Library · Gap Tracker · Remediation Planner · Risk Register · Policy Manager · Incident Register · Audit Schedule · Compliance Simulation · Continuous Compliance · DSR Tracker |
| **Risk & Vendor**                       | Vendor Risk Dashboard · Vendor Compliance                                                                                                                                             |
| **Analytics**                           | Compliance Tracker · Compliance Scorecard · Compliance Calendar · Compliance Heatmap                                                                                                  |
| **Reports**                             | Report Center · Compliance Reports · Assessment History · Evidence Locker · Enhanced Comparison                                                                                       |
| **Platform**                            | SaaS Metrics · Operations · Onboarding Wizard · Notifications                                                                                                                         |
| **Account**                             | Billing & Plan · Team Members · Org Settings · Account Settings · API Keys                                                                                                            |
| **Resources**                           | Documentation · Interactive Demo                                                                                                                                                      |
| **Administration** _(role-conditional)_ | Company Dashboard · Admin Control Center · Audit Log · Manage Service Requests · Publish Threat Intel · Super Admin                                                                   |

### 3.3 Command palette

Press **⌘K** (Mac) or **Ctrl+K** (Windows) from anywhere to search and jump to every destination, grouped by the same categories as the sidebar.

### 3.4 Pages reachable by URL but not in the sidebar

| URL             | Purpose                             |
| --------------- | ----------------------------------- |
| `/home`         | In-app marketing / feature overview |
| `/market-entry` | Alias of Client Workspace           |
| `/vendor/:id`   | Individual vendor detail            |
| `/hero`         | Product hero page                   |
| `/admin/health` | Public operations health page       |
| `/404`          | Page-not-found                      |

### 3.5 Public pages (own chrome, no sidebar)

- **`/pricing`** — plans and checkout
- **`/docs`** — documentation portal with fuzzy search (EN/AR/ZH)
- **`/demo`** — gamified interactive demo
- **`/privacy`**, **`/terms`** — legal pages
- **`/verify-email`**, **`/invite-accept`**, **`/forgot-password`** — auth flows

---

## 4. Roles, Permissions & Plans

### 4.1 Platform roles (ascending privilege)

| Role                  | Level | What's visible                                                                                                     |
| --------------------- | ----- | ------------------------------------------------------------------------------------------------------------------ |
| `basic_user`          | 10    | Full standard sidebar                                                                                              |
| `professional_user`   | 20    | Full standard sidebar                                                                                              |
| `company_admin`       | 30    | + **Administration → Company Dashboard** (avatar shows **Co.** chip)                                               |
| `platform_admin`      | 40    | + **Admin Control Center, Audit Log, Manage Service Requests, Publish Threat Intel** (avatar shows **Admin** chip) |
| `yalla_hack_employee` | 45    | Operator-level access                                                                                              |
| `super_admin`         | 100   | + **Super Admin Dashboard** (avatar shows **Super** chip); exempt from onboarding enforcement                      |

Legacy aliases still accepted: `user` → 10, `admin` → 40.

### 4.2 Organization roles

`analyst` → `compliance_officer` → `admin` → `owner`

Each of **31 permission-gated modules** carries flags: `canView`, `canCreate`, `canEdit`, `canDelete`, `canExport`, `canInvite`.

Default behaviour:

- **Analyst** — largely **view-only**
- **Compliance Officer** — standard CRUD
- **Admin / Owner** — full rights plus API keys, team, org and billing management

Enforcement happens **server-side**; the UI surfaces the reference matrix under **Team Members → Role Permissions**.

### 4.3 Plan gating

Plans ascend: `free_trial < starter < professional < enterprise`.

| Feature                                | Minimum plan     |
| -------------------------------------- | ---------------- |
| Vendor Risk Dashboard (`/vendor-risk`) | **Professional** |
| SaaS Metrics (`/saas-metrics`)         | **Enterprise**   |

Users below the requirement see a lock card with **View Plans & Upgrade**. A **TrialBanner** appears on free-trial plans (expired / 1 day / N days left).

---

## 5. Dashboard & Overview

### 5.1 Dashboard (`/dashboard`) — your home base

- Welcome banner + **"DJAC TOOL"** header: _Monitor and detect compliance drift across global cross-border operations_.
- **Quick actions**: Framework Analysis · Run Assessment · Compliance Tracker · Law Library.
- **Module KPI cards**, each clickable: Gaps · Open Risks · Tasks Open · Active Policies · Incidents Open · Upcoming Audits.
- **Compliance posture / framework matrix cards**: Frameworks Active · Critical Conflicts · High-Risk Pairs · Conflicts · Assessments.
- **Activity feed** — top 9 items by risk level, _View all_.
- **System Health** widget and **Quick Actions** panel.
- **Reports** widget.
- On load failure, a **Retry** button refetches.

### 5.2 Home (`/home`)

Marketing/feature overview: _Every Compliance Rule. One Dashboard_, with CTAs (Open Dashboard, Analyze Frameworks, Get Started Free, **Request Access**, **Submit Consultation Request**), statistics (Frameworks Covered, Jurisdictions, Controls Mapped), feature sections (Side-by-Side Comparison, Conflict & Dependency Mapping, Market Entry Readiness), a three-step explanation, and a **frameworks-we-cover catalog** grouped by Asia-Pacific / Europe & Middle East / Americas.

### 5.3 Enhanced Comparison (`/dashboard-enhanced`)

Three tabs — **Comparison / Vulnerabilities / Matrix**. Select **Framework 1 vs Framework 2** (with **Swap**), and view controls, total relationships and critical windows. Includes _Selected Framework Profile_ and _Control Coverage Snapshot_ (shared vs unique control families) plus region packs (Global, China, Cross-border).

### 5.4 Pro Intelligence (`/pro-intelligence`)

"LIVE" command center: _Sino-Gulf data residency · AI pipeline transparency · Regulatory enforcement pulse._
Tabs: **Heatmap** (Regulatory Corridor Heatmap) · **Pipeline** (AI Orchestration Feed) · **Reg Pulse** (Regulatory Pulse Matrix).

---

## 6. Global Intelligence

### 6.1 Global Compliance Registry (`/global-registry`)

Browse and search the full framework catalog.

- **Tabs:** _Frameworks & Standards_ / _By Region_
- **Filters:** Region (North America · Middle East · Asia-Pacific · Latin America · Global Standards), Jurisdiction, Category
- **KPIs:** Regions · Jurisdictions · Frameworks · Categories · Authorities
- Jump-off links to Industry Editions and AI Agents

**Registry scope (107 framework packs):**

| Region                 | Examples                                                                                                                                                                                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **North America / US** | NIST CSF 2.0, SP 800-53, SP 800-171, SP 800-207 Zero Trust, NIST AI RMF, HIPAA, HITECH, GLBA, SOX, SEC Cyber Disclosure, FTC Safeguards, CMMC, FedRAMP, CJIS, PCI DSS, SOC 1/2/3, CIS v8, COBIT 2019, NERC CIP                                            |
| **Canada**             | PIPEDA, CCCS Guidance                                                                                                                                                                                                                                     |
| **Europe**             | GDPR, UK GDPR, NIS2, DORA, Cyber Resilience Act, **EU AI Act**, ePrivacy, PSD2, DSA, DMA, ENISA Guidance                                                                                                                                                  |
| **Global ISO**         | ISO/IEC 27001, 27017, 27018, 27701, 22301, 42001, 31000                                                                                                                                                                                                   |
| **Middle East**        | Saudi PDPL, NCA ECC, NCA CCC, ECC-1, KSA ECC, CST Cloud Regs, UAE PDPL, DESC ISR, UAE IA Standards, Qatar CBNF, Qatar NIA, Bahrain PDPL, Oman/Kuwait cyber regs                                                                                           |
| **Asia-Pacific**       | China MLPS 2.0, Cryptography Law, China AI Regs, Singapore PDPA, MAS TRM/Notices, Japan APPI, South Korea PIPA, Australia Essential Eight & ISM & Privacy Act, NZ Privacy Act, India DPDP & CERT-In, Malaysia/Indonesia/Thailand/Vietnam/Philippines PDPA |
| **Africa**             | POPIA (ZA), NDPA (NG), Kenya DPA, Egypt PDPL, AU Convention                                                                                                                                                                                               |
| **Latin America**      | LGPD (BR), Mexico DPA, Argentina PDPL, Chile DPF, Colombia Habeas Data                                                                                                                                                                                    |
| **Global Standards**   | MITRE ATT&CK/D3FEND, OWASP Top 10/ASVS/SAMM, CSA CCM/STAR, CIS Benchmarks, IEC 62443, FIPS 140-3, ISO/SAE 21434, TISAX, SWIFT CSCF, HITRUST, FAIR, SLSA, SPDX, CycloneDX                                                                                  |

### 6.2 Compliance Knowledge Graph (`/knowledge-graph`)

**Tabs:** _Graph View_ / _Entity List_. Interactive visualization of **regions ↔ frameworks ↔ industries** with node/edge counts (Nodes, Edges, Frameworks, Editions, Agents).

- **17 node types:** region, framework, standard, edition, agent, regulator, country, control, threat, vendor, certification, policy, technology, data_type, industry, risk_scenario
- **14 edge relations:** `contains`, `maps_to`, `requires`, `conflicts`, `governs`, `cross_border_to`, and others

### 6.3 Industry Editions (`/industry-editions`)

**Tabs:** _All Editions_ / _Edition Detail_ (detail unlocks after selection). 13 configuration-driven editions, each bundling default frameworks + default AI agents:

`finance` · `healthcare` · `government` · `ai` · `cloud` · `telecom` · `energy` · `manufacturing` · `retail` · `education` · `critical-infrastructure` · `defense` · `smart-cities`

### 6.4 AI Agent Network (`/ai-agents`)

Roster of **18 coordinated AI agents**:

`global-reg-intel`, `compliance-translation`, `ai-governance`, `security-architecture`, `vendor-risk`, `audit-readiness`, `policy-generation`, `evidence-collection`, `executive-reporting`, `continuous-monitoring`, `reg-change-detection`, `threat-intel`, `third-party-risk`, `dpo-agent`, `cloud-security`, `incident-response`, `board-advisory`, `compliance-copilot`

---

## 7. Intelligence & Analysis

### 7.1 Framework Analysis (`/analysis`)

1. **Pick a framework** (PIPL, NCA ECC, CCPA, ISO 27001, PCI DSS, …).
2. Read **Scope · Enforcement Authority · Maximum Penalty · Country**.
3. **Controls tab** — searchable, category-filterable control list with _Requirement_ and _Applicability_ columns and **Export CSV**.
4. **Relationships tab** — conflicts, harmonization and mitigation with other frameworks.

### 7.2 Client Workspace / Compliance Operating Hub (`/client-workspace`, alias `/market-entry`)

A four-step operating workflow:

| Step                            | Action                                                                                                                                                                             |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **01 Set Organization Profile** | Name, email, organization, type, job title, preferred locale → **Save Profile**                                                                                                    |
| **02 Register Vendor Stack**    | Vendor name, industry, description, business registration no., HQ, contacts, service type, hosting environment, service scope, criticality → **Add Component** for tech-stack rows |
| **03 Trigger AI Assessment**    | **Run Assessment** → queues an AI pipeline job                                                                                                                                     |
| **04 Request Consultation**     | **Submit Consultation** → routed to our team                                                                                                                                       |

Vendor list supports sorting (Name A–Z / Highest Risk First) and a **Compliance Preview** dialog.

### 7.3 Company Relocation & Market Entry Assessment (`/vendor-assessment`)

A long guided form with a completion-percentage bar and **Start Assessment / Analyze / Reset** buttons:

| Section                        | Fields                                                                                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Company Profile**            | Name, HQ country, target expansion country, industry, activities, size, operational model, cloud providers, data hosting, core systems                                   |
| **IT Infrastructure**          | Network architecture, hosting model, cloud providers                                                                                                                     |
| **Regulatory & Cybersecurity** | Data-residency status, cross-border transfer mechanism (SCC / BCR), security frameworks (ISO 27001, SOC 2, NIST, PCI DSS, CITC), encryption (AES-128 / AES-256 / custom) |
| **Gap Analysis**               | Critical / High / Medium / Low gap counts                                                                                                                                |
| **Assessment Results**         | Market Entry Readiness · Compliance Risk · Infrastructure Readiness · Overall Risk · Readiness Level (**Not / Partial / Ready / Fully Ready**) · Recommendations         |

### 7.4 Vendor Risk Dashboard (`/vendor-risk`) — _Professional plan required_

- KPIs: Total Vendors, criticality and risk counts
- **Register Vendor** · **Assess All** (batch AI assessment with _Queue Assessments_, Select/Deselect All) · **Export CSV**
- Filters by risk and jurisdiction
- Table columns: Vendor · Service · Risk Tier · Criticality · Added · Jurisdictions
- Row actions: **View Detail**, **Delete Vendor**

**Vendor Detail** (`/vendor/:id`) has tabs **Profile / Assessment / Tech Stack**, a global score overview, **Compliance Gaps** (critical/high badges), **Edit Vendor Profile** and **Delete Vendor**.

### 7.5 Data Transfer Compliance Checker (`/transfer-checker`)

A **3-step wizard**:

1. **Transfer Endpoints** — Source Jurisdiction, Destination Jurisdiction, Monthly Transfer Volume (Low < 10K · Medium 10K–1M · High 1M+)
2. **Classify the data** — data types
3. **Run Compliance Check** → result (e.g. `BLOCKED` plus a health rating)

Actions: **New Check**, **Edit Data Types**.

### 7.6 AI Compliance Assistant (`/compliance-chat`)

Chat interface with a message composer and **New Conversation**. Pick a jurisdiction scope: All Jurisdictions, China, Saudi Arabia, EU, Brazil, US, Global, UK, Canada, Australia, Japan, South Korea, Singapore, India, South Africa, Mexico, UAE.

- If AI is not configured for the environment, a placeholder _"AI is not configured"_ response is shown.
- Failures raise an error toast.

### 7.7 Regulatory Change Detection (`/regulatory-changes`)

Real-time intelligence on regulatory changes. KPIs: Total Changes · Enforcement Actions · New Regulations · In Effect · Pending. Filters: **Jurisdiction**, **Type**, **Status**.

Change types tracked: `amendment`, `new_regulation`, `repeal`, `guidance`, `enforcement`. Sources include EDPB, European Commission, EU Official Journal, Council of the EU, CPPA, California Legislature, ANPD, China CAC, SDAIA, NIST and ISO.

### 7.8 Cross-Border Data Flow (`/cross-border-data-flow`)

Analyze data transfer requirements, restrictions and risk levels.

- **Tabs:** _Matrix_ · _Heatmap_ · _Route Analyzer_
- Source → Target pairs with risk levels; same-jurisdiction transfers are handled explicitly.
- Requirement matrix covers **28 jurisdictions** with `analyzeRoute`.

### 7.9 Compliance Simulation (`/compliance-simulation`)

**Tabs: Preset / Custom / Digital Twin.**

**Six preset scenarios:**

| Scenario                      | Jurisdictions        | Frameworks                              |
| ----------------------------- | -------------------- | --------------------------------------- |
| Market Entry: EMEA            | SA / UAE / Qatar     | PDPL-KSA, NCA-ECC, GDPR                 |
| Market Entry: European Union  | EU                   | GDPR, NIS2, DORA, EU-AI-ACT             |
| Market Entry: United States   | US                   | NIST-CSF-2, HIPAA, SOX, PCI-DSS         |
| Cloud Migration: Multi-Region | Multi                | NCA-CCC, GDPR, FedRAMP, CSA-CCM, MLPS-2 |
| AI System Deployment          | Multi                | EU-AI-ACT, NIST-AI-RMF, CHINA-AI        |
| Cross-Border Merger           | SA / UAE / Singapore | PDPL-KSA, NCA-ECC, UAE-PDPL, PDPA-SG    |

**Custom simulations:** name your scenario, pick **1–10 jurisdictions** and up to **20 frameworks** across a 3-column configuration grid.

**Simulation types:** `readiness`, `gap_analysis`, `cost_estimate`, `cross_border`, `full`.

**Outputs:**

- `maturityScores` per framework (clamped 10–100)
- `gapCounts` per framework and `totalGaps`
- `costEstimateLow` / `costEstimateHigh` in USD
- `riskLevel` — `critical` (avg score < 30 or gaps/framework > 12) · `high` (< 50 or > 8) · `medium` (< 70 or > 4) · else `low`
- A narrative `summary`
- Cross-border conflict detection across 11 curated framework pairs (e.g. GDPR↔PIPL score 85 — _data localization vs free flow_; NIST-CSF-2↔ISO-27001 score 10 — _complementary_)

**Comparison mode** returns `scoreDeltas`, `gapDeltas`, `costDelta`, `riskDelta` and a `recommendation`.

**Scoring factors:** framework base score (e.g. ISO-27001 = 78, GDPR = 72, NIST SP 800-53 = 70, EU-AI-ACT = 35, CHINA-AI = 28) + industry modifier (Financial Services +5, Healthcare +3, Technology −2, Defense +3…) + size modifier (Enterprise +5, SME −3, Startup −5) − (frameworks − 1) × 3 + a **seeded variance** (no randomness — same inputs give the same result).

**Cost estimate bands:** $50–100K (maturity ≥ 70), $100–250K (≥ 50), $250–500K (< 50), × size multiplier (1.5 / 0.8 / 0.5) × (1 + gaps × 0.02).

---

## 8. Cyber Operations

### 8.1 Service Requests (`/service-requests`)

Request cybersecurity services from the Yalla-Hack team.

- **KPIs:** Total · Active · Pending Review
- **Submit Request** — Title, Description, then a **type**:
  Penetration Test · Red Team Exercise · Security Audit · SOC Support · Incident Response · Security Consulting · Phishing Simulation · Cloud Security Review · Vulnerability Assessment · Compliance Gap Assessment
- **Lifecycle:** `Draft → Submitted → Under Review → Scoping → Approved → In Progress → Completed` (also `Cancelled`, `On Hold`)
- **Cancel request** available while active

### 8.2 Asset Inventory (`/asset-inventory`)

Manage your IT/OT/Cloud asset register.

- **KPIs:** Total Assets · Critical Assets · Avg Risk Score
- **Add / Edit / Delete Asset** with:
  - **Type:** Server, Workstation, Network Device, Cloud Service, SaaS App, Database, API Endpoint, IoT, Mobile, Industrial OT, Web App, Source Code Repo, Third-Party Service
  - **Criticality**, **Exposure** (Internal / VPN Only / Partner Only / Internet Facing)
  - **Status:** Active / Decommissioned / Under Review / Unknown
- Filters available

### 8.3 Threat Intelligence Feed (`/threat-intel`)

Curated security bulletins from the Yalla-Hack intelligence team.

- **KPIs:** Total Bulletins · High Severity
- **Filters:** severity and category
- **Categories:** Malware, Ransomware, Phishing, Zero Day, Supply Chain, Data Breach, Vulnerability, Social Engineering, Insider Threat
- **TLP markings:** `TLP:WHITE` · `TLP:GREEN` · `TLP:AMBER` · `TLP:RED`

### 8.4 Security Maturity (`/security-maturity`)

Assess cybersecurity maturity across **10 domains**:

1. Governance & Policy
2. Asset Management
3. Access Control
4. Data Protection
5. Network Security
6. Vulnerability Management
7. Incident Response
8. Backup & Recovery
9. Third-Party Risk
10. Security Awareness

**Maturity levels:** Initial → Developing → Defined → Managed → Optimized
**Framework alignment:** ISO 27001 · NIST CSF · CIS Controls · SOC 2 · SAMA CSF · NCA ECC
**Actions:** Save / Edit / Delete Assessment

---

## 9. Compliance Management

### 9.1 Legal Knowledge Library (`/laws`)

Full-text **search** across laws, frameworks and articles.

- **Filters:** Articles · Frameworks · Sections · Jurisdictions
- **Framework codes:** PIPL, UK-GDPR, ISO-27001, NIST-CSF, PCI-DSS, EU-AI-ACT, HIPAA, PIPEDA, POPIA, PDPA-SG, DPDP-IN …
- **Jurisdictions covered:** Saudi Arabia, UK, South Korea, South Africa, UAE, China, EU, US, Brazil and more
- Article detail with **Copy citation** and **Bookmark article**

**Highlighted guides:** Saudi cybersecurity regime · Saudi ECC-1 · Saudi PDPL 2024 · China CSL/DSL/PIPL/MLPS 2.0 (+ CSL 2026 amendments) · China–Saudi cross-border checklist · EU GDPR · US CCPA · Brazil LGPD · UK GDPR/DPA 2018 · PIPEDA · Australia Privacy Act · Japan APPI · Korea PIPA · Singapore PDPA

### 9.2 Vendor Compliance Gap Tracker (`/gap-tracker`)

- **KPIs:** Total Gaps · Critical · High · Medium
- **Filters:** severity (critical / high / medium / All) and jurisdiction (`china`, `cross_border`, All)
- **Clear filters** button
- Progress state: _"Running gap analysis across all vendors…"_
- Empty state links to the **Vendor Risk Dashboard**

### 9.3 Remediation Planner (`/remediation-planner`)

- **KPIs:** Total, Overdue …
- **Create / Edit / Delete Remediation Task** — Title, Description, Severity, Status (**Open / In Progress / Resolved / Accepted Risk**), Gap Code, Vendor, **Assignee**, Due Date, Notes

### 9.4 Risk Register (`/risk-register`)

- **Risk Heat Map** — X = Likelihood (1–5), Y = Impact (1–5)
- **New / Edit / Delete Risk Entry** — Title, Description, Category (`operational | legal | technical | financial | reputational`), Treatment (**mitigate / avoid / accept**), Likelihood, Impact, auto-computed Score, Status, Risk Owner, Related Vendor, Gap Code, Control Reference, Next Review Date, Notes
- **Send to Remediation** hand-off action

### 9.5 Policy Manager (`/policy-manager`)

- **KPIs:** Total · Active · Draft · Under Review · Overdue Review
- **Add / Edit / Delete Policy** — Title, Policy Code, Version, Type (**policy / standard / procedure / guideline**, UI labels: standard / guideline / draft / under_review), Status, Review Cycle (months), Next Review Date, Frameworks, Control References, Document URL, Description, Notes
- Filters: type / status / framework, plus search

### 9.6 Incident Register (`/incident-register`)

- **KPIs:** Total · Active · Critical · **Overdue Notification**
- **Report / Edit / Delete Incident** — Title, Incident Code, Type (`data_breach | unauthorized_access | policy_violation | system_outage | third_party_breach | other`), Severity, Status (`under_investigation | resolved | closed`), Date Occurred/Detected, **Affected Data Subjects / Frameworks / Data Types**, Description, Root Cause, Lessons Learned, Notes
- **Regulatory notification** tracking — toast confirms _"Regulatory notification marked as sent"_

### 9.7 Audit Schedule (`/audit-schedule`)

- **KPIs:** Total · Upcoming · Overdue · Completed
- **Schedule / Edit / Delete Audit** — Title, Type (`internal | external | regulatory | certification`), Status, Scheduled Date, **Recurrence**, Scope (Frameworks), Description, Findings/Notes, Internal Notes
- **Complete Audit** flow captures Findings → _Mark Completed_
- **Export CSV**

### 9.8 Continuous Compliance & CTEM (`/continuous-compliance`)

- **Run Scan** (with _Scanning…_ state)
- **KPIs:** Assets · Vulnerabilities/exploitable · Avg Risk Score · Frameworks Impacted
- **Exposure Trend** · **Framework Exposure** · drift labels: _Compliance Drift_ / _Risk Increased_ / _Risk Improved_ / _No Change_
- **Register Asset** and **Log Vulnerability** dialogs
- Filters: Region, Severity, Exploitable only
- **Patch** action, **Assets-at-Risk** list, **Scan History** table

### 9.9 Data Subject Request Tracker (`/dsr-tracker`)

- **KPIs:** Total Requests · Open · Due This Week · Overdue
- **Log DSR Request** — Requester Name/Email, Request Type (`access`, `rectification`, `erasure`, `portability`, `restriction`, `objection`, `explanation`), Jurisdiction, Priority (`normal | high | urgent`), Status (`received | in_review | pending_info | completed | rejected | withdrawn`), Description, Internal Notes, Due Date
- Table columns: Requester · Type · Jurisdiction · Priority · Status · Due Date · Actions

### 9.10 Compliance Evidence Locker (`/evidence-locker`)

- **KPIs:** Total Evidence Items · Linked to Audits · Critical Sources · Last Added
- **Add Evidence** — Title, Source Type (`audit_schedule | policy | risk | gap | remediation | ctem_asset | incident | general`), Document URL, Source ID, Description, Tags
- Table (Title, Source Type, Added, Actions), filter by source, remove evidence

---

## 10. Risk & Vendor Management

### 10.1 Vendor Compliance (`/vendor-compliance`)

Lists vendor compliance profiles with drill-down to individual vendor profiles.

### 10.2 Working with vendors (summary)

1. **Register** a vendor (Client Workspace step 02 or Vendor Risk Dashboard).
2. **Add tech-stack components** to the vendor.
3. **Run Assessment** — queues an AI job; watch it under **Reports → Assessment History**.
4. Review **Compliance Gaps** on the vendor detail page.
5. **Export** to CSV or generate a **Vendor Assessment report**.

Assessment statuses per control: `compliant | partial | non_compliant | unknown`.

---

## 11. Analytics

### 11.1 Compliance Obligation Tracker (`/compliance-tracker`)

Jurisdiction tabs: **🇸🇦 Saudi Arabia · 🇨🇳 China · 🇪🇺 EU · 🇺🇸 US · 🇧🇷 Brazil · 🇬🇧 UK · 🌐 Global · ⇄ Side-by-Side**

- Per-tab summary cards (obligations counts, critical risk items, time-critical reports)
- Obligations split into **Critical** and **Other**, each expandable with _Show/Hide details_ and References
- **Side-by-side comparison table** (Topic | Saudi Arabia | China | Notes)
- **Export CSV**, load-error Retry

### 11.2 Compliance Scorecard (`/compliance-scorecard`)

- **KPIs:** Overall Score · Total Vendors · High/Critical vendors at risk · Frameworks · Open Gaps
- **Charts:** Risk Distribution · Compliance Status · Framework Avg Scores · Gap Severity
- **Recent Assessments** (last 5: Vendor, Framework, Score, Risk, Date)
- **Recent Reports** · **Framework Breakdown** (Code, Assessments, Avg Score, Health)
- **Refresh**

### 11.3 Compliance Calendar (`/compliance-calendar`)

- **Tabs:** All / Upcoming / Overdue / Completed (with count badges)
- **Add Deadline** — Framework (PDPL…), Jurisdiction (China, Saudi Arabia, Global, Both, UK, Canada, Australia, Japan, South Korea, Singapore, India, South Africa, Mexico, UAE, Qatar, Kuwait, Bahrain, Oman, Jordan, Egypt), Description, **Assign To**, Due Date, severity (**Critical / High / Medium**)
- **Mark Complete** action; status chips (_Waived_, _"Today!"_)

Deadlines also drive **email alerts** at the 30-day, 7-day and 1-day milestones.

### 11.4 Compliance Framework Heatmap (`/heatmap`)

- **KPIs:** Total Pairs · Critical · High · Medium
- Framework × framework severity grid with legend
- Click a cell → detail panel with **Relationship Types** and **Recommended Actions**

---

## 12. Reports

### 12.1 Report Center (`/report-center`)

Configure and generate a report:

| Setting             | Options                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------- |
| **Jurisdiction**    | Saudi Arabia · China · EU · US · Brazil · Global                                         |
| **Report Language** | English · Arabic · Chinese                                                               |
| **Report Type**     | Full Compliance · Gap Analysis · Vendor Assessment · Risk Assessment · Executive Summary |
| **Output Formats**  | Official DOCX · Markdown                                                                 |

**Generate Report** (progress state) then:

- **Download Official .docx**
- **Download .md** / **Copy markdown**
- **Download PDF**
- **Email PDF report** — enter recipient → _Send email_
- **Copy share link** (share links may expire or be invalidated)

A **Delivery workflow** panel shows progress. Content is localized in **en / ar / zh** (other UI languages fall back to English).

### 12.2 Compliance Reports (`/compliance-reports`)

Summary cards (Total / Critical / High / Open / Resolved / Active / Draft / Upcoming / Overdue / Completed / Vendors, with an "as of" timestamp) plus **Module Data Export**:

- Module selector: **Gap Findings · Risk Register · Remediation · Policies · Incidents · Vendors**
- Searchable table + **Export CSV**
- **Refresh**

### 12.3 AI Assessment History (`/assessment-history`)

- **KPIs:** Total Jobs · Completed · Failed · In Progress
- Table of AI jobs (vendor, region Overall/APAC/EMEA, status)
- **Refresh** · **Clear History** (with confirmation dialog)

### 12.4 Evidence Locker

See §9.10.

---

## 13. Platform & Onboarding

### 13.1 Operations Status (`/operations`)

Tracks runtime readiness, AI pipeline transport and recent assessment jobs.

- **System Healthy / Degraded** banner + **Refresh**
- **Queue Mode:** File-backed / Redis-backed / Memory only
- **WebSocket Path**, Running/Failed Jobs
- **Readiness Checks** table (Database, Redis, AI Orchestrator, Agent Swarm Configured, WebSocket) — auto-refreshed every 10 seconds
- **History Storage** diagnostics + **Clear Persisted History**

### 13.2 Onboarding Wizard

See §2.3.

### 13.3 Notifications (`/notifications`)

- Notification list with categories: **Compliance Deadline · Trial Expiring · System**
- **Mark all read**
- Empty state: _"You're all caught up!"_
- Trial-expiry cards with **Upgrade Now**
- Unread count badge appears on the sidebar entry and top-bar bell

### 13.4 SaaS Metrics (`/saas-metrics`) — _Enterprise plan required_

- **Live Compliance Health KPIs:** Compliance Posture % · Framework Adoption · Conflict Churn Rate · Obligation Coverage
- **Core Revenue Metrics:** MRR / ARR / Churn / LTV / CAC
- **Acquisition & Efficiency:** CAC · CAC Payback · CAC:LTV · NRR · GRR
- **Interactive SaaS Metric Calculators** — type numbers for instant results
- **Rule of 40 & Advanced Efficiency**
- **Advanced & Qualitative** — cohorts, engagement, customer health
- All calculations run **client-side**

---

## 14. Account, Team & Billing

### 14.1 Billing & Subscription (`/billing`)

**If you have no organization yet:**

- **Set Up Your Organization** — Organization Name, Billing Email, Primary Jurisdiction (full country list)
- **Start 7-Day Free Trial →**

**Once an organization exists:**

- Plan display (**Starter / Professional / Enterprise / Free Trial**)
- Status: `Active · Trial · Past Due · Cancelled · Incomplete · Paused · Unknown`
- Trial expiry countdown
- **View Plans** link
- **Billing History** table

Billing runs through **Stripe Checkout** and the **Stripe Customer Portal**.

### 14.2 Team Members (`/team-members`)

- **KPIs:** Total Members · Active · Invited · Seats Used (with _"Seat limit reached"_ warning)
- **Invite Member** — Email Address, Role → **Send Invitation**
- **Organization Members** table with search, status filters, per-member **role dropdown** (Admin / Compliance Officer / Analyst) and **Remove Member**
- **Role Permissions** reference panel
- **Export CSV**
- Shows _"Your role in this organization"_

Invited members land on `/invite-accept`, which shows _You've been invited! / You'll join as: {role}_ → **Accept & Join**.

### 14.3 Organization Settings (`/org-settings`)

| Section                   | Fields / Actions                                                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Organization Identity** | Slug · Max Seats ("upgrade plan to increase" → **Manage Plan**) · Trial Ends                              |
| **Organization Profile**  | Display Name · Billing Email · Industry · Primary Jurisdiction → **Save Changes** → _"All changes saved"_ |
| **Danger Zone**           | **Delete Organization** · Contact Support                                                                 |

### 14.4 Account Settings (`/account-settings`)

**Four tabs:**

| Tab             | Contents                                                                                                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Profile**     | Full Name · Email · Job Title · Company · Industry · Preferred Language → **Save Profile**                                                                                                                                     |
| **Password**    | Current / New / Confirm (min 8 chars + uppercase + number) → **Update Password**                                                                                                                                               |
| **Security**    | **Two-Factor Authentication** — _Set Up 2FA_ via QR code (Google Authenticator / Authy / TOTP) + 6-digit code → **Verify & Enable**; shows **one-time backup codes** with Copy; **Disable 2FA** requires password confirmation |
| **Preferences** | **UI Sound Effects** toggle · **Onboarding Tour** restart                                                                                                                                                                      |

### 14.5 API Keys (`/api-keys`)

- **New API Key** — Key Name, **Permissions/scopes**, Expiry → one-time secret display (_"Key Created!"_ → _"Done, I've saved it"_)
- Table: Name · Key Prefix · Scopes · Expires · Last Used · Expired
- **Revoke API Key?** confirmation
- Empty-state explainer for CI/CD tokens and integrations
- API access requires **Professional** plan or above

### 14.6 Audit Log (`/audit-log`)

- Filters: Action type, User ID, category, **Max rows**
- **Refresh** + last-refreshed timestamp
- Table: Timestamp · User · Category · Target · Payload
- **Export CSV**
- Categories: `auth`, `data_write`, `data_read`, `role_change`, `system`, `billing`

---

## 15. Administration Consoles

### 15.1 Admin Control Center (`/admin-control-center`) — _platform admins_

"Enterprise Governance Console." Non-admins see an **Access Restricted** card.

**Header KPIs:** Clients · Admins · Access Requests · Consultations · Vendors · Assessments · Critical Gaps · Unread Alerts (+ AI Stream / Refresh)

**Seven tabs:**

1. **Consultations** — respond to consultation requests (status + priority + admin response)
2. **Users** — list and manage
3. **Access Requests** — status workflow `new → reviewing → approved → archived`
4. **Assessments**
5. **Vendors**
6. **Local Users** — activate / suspend / delete
7. **Conversion Analytics** — funnel stats

**Interaction Privacy Controls (GDPR-style):**

- **Retention:** Total Logs · Older Than Retention · Cutoff Date · Retention Days → **Run Dry Run** → **Apply Retention** (range 7–365 days)
- **Right to Delete:** User/Org ID → delete interaction data (MFA-gated, validated with toasts)

> Note: `updateUserAccess` and `deleteInteractionData` are **MFA-gated** — you'll be challenged for a second factor.

### 15.2 Company Dashboard (`/company/dashboard`) — _company admins_

"Organisation compliance posture, vendors, and team roles."

- **KPIs:** Total Deadlines · Overdue · Completed · Saved Vendors
- **Upcoming Deadlines** · **Registered Vendors**
- **User Role Management** — search + **Assign Role** dropdown + role filter
- **Refresh / Retry**
- Non-`company_admin` users see a 403 card

### 15.3 Super Admin Dashboard (`/superadmin/dashboard`) — _super admins_

"Full platform visibility" with **four tabs:**

| Tab                 | Contents                                                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Audit Trail**     | Filter by category and outcome (Success / Failure / Blocked), Refresh, **Export CSV** (Timestamp, Action, Target, Actor Role) |
| **SaaS Metrics**    | Total Organisations · Active Trials · Paid Subscribers · Conversion Rate · Plan Breakdown                                     |
| **Role Management** | Search users → **Assign Role** (changes logged to audit trail)                                                                |
| **System Health**   | Overall Status · health checks                                                                                                |

### 15.4 Manage Service Requests (`/admin/service-requests`) — _platform admins_

Manage engagement requests across all client organizations, with status workflow management and **internal team notes**.

### 15.5 Threat Intelligence Publisher (`/admin/threat-intel`) — _platform admins_

Publish and manage threat bulletins visible to client organizations → **Publish New Bulletin**.

### 15.6 Yalla-Hack Owners' Console (`/yalla-hack-owners-console/…`)

A **separate operator shell** with its own login at `/yalla-admin/login` (or `/yalla-hack-owners-console/login`) and its own left navigation:

| Section                | Path             | Purpose                                                              |
| ---------------------- | ---------------- | -------------------------------------------------------------------- |
| Dashboard              | `/dashboard`     | "Yalla Hack Management Console" KPIs (incl. New Orgs Today)          |
| Users                  | `/users`         | User table, filters, **Delete user**, CSV export                     |
| User Detail            | `/users/:id`     | Single-user detail + actions                                         |
| Organizations          | `/organizations` | Org list + CSV export                                                |
| Subscriptions          | `/subscriptions` | Subscription records + export                                        |
| Platform Analytics     | `/analytics`     | Platform analytics                                                   |
| Engagement Insights    | `/insights`      | Engagement over users/orgs                                           |
| Reporting Center       | `/reports`       | Generated reports + **Download CSV**                                 |
| Live Activity & Alerts | `/live`          | Real-time activity/alert stream                                      |
| Platform Monitor       | `/monitor`       | System metrics, new signups                                          |
| Security Monitor       | `/security`      | Security monitoring, password change (min 12 chars, letter + number) |
| Two-Factor Auth        | `/security/mfa`  | **Enable / Disable 2FA** (TOTP)                                      |
| Audit Logs             | `/audit`         | Audit log table + **Export CSV**                                     |

---

## 16. End-to-End Workflows

### Workflow A — New organization, first 7 days

1. **Register** (§2.1) → verify email → activate.
2. **Onboarding Wizard**: create organization → pick jurisdictions → frameworks → goals.
3. **Billing**: confirm the 7-day free trial under **Billing & Plan**.
4. **Register a vendor** in the Client Workspace.
5. **Run Assessment** → watch the job in **Assessment History**.
6. **Generate a Report** in Report Center (jurisdiction + language + type).
7. Before day 7, **View Plans** and upgrade, or the trial expires and `activeOrgProcedure` blocks org-scoped actions.

### Workflow B — China ↔ Saudi market entry

1. **Global Registry** → filter by Middle East and Asia-Pacific; note Saudi PDPL, NCA ECC, China PIPL/CSL/DSL/MLPS.
2. **Framework Analysis** → open PIPL and then NCA ECC; export Controls CSV; read Relationships.
3. **Compliance Tracker → Side-by-Side** → compare Saudi Arabia vs China obligations by topic.
4. **Cross-Border Data Flow → Route Analyzer** → analyze China → Saudi Arabia transfers.
5. **Transfer Checker wizard** → set endpoints and volume → **Run Compliance Check**.
6. **Compliance Simulation → Preset → "Cross-Border Merger"** → read maturity scores, gap counts, cost estimate and the curated PIPL↔PDPL conflict (score 85: _data localization vs free flow_).
7. **Risk Register** → log the localization risk → **Send to Remediation**.
8. **Remediation Planner** → create tasks, assign owners and due dates.
9. **Calendar** → add regulatory deadlines (PDPL notification, annual NCA reporting).
10. **Report Center** → generate an Arabic **Full Compliance** report and email it.

### Workflow C — Vendor onboarding & continuous oversight

1. **Vendor Risk Dashboard** → **Register Vendor** (service, criticality, jurisdictions).
2. Add **tech-stack components** on the vendor detail page.
3. **Assess All** (or per-vendor **Run Assessment**) → monitor **Assessment History**.
4. Review **Compliance Gaps** → open tasks in **Remediation Planner**.
5. **Asset Inventory** → register the vendor's internet-facing assets.
6. **Continuous Compliance → Run Scan** → track **Exposure Trend** and **Framework Exposure** → **Patch**.
7. Export via **Compliance Reports → Module Data Export → Vendors → Export CSV**.

### Workflow D — Incident response

1. **Incident Register → Report Incident** — type, severity, dates, affected data subjects/frameworks/data types, description.
2. Record **Root Cause** and **Lessons Learned**; mark **regulatory notification** sent.
3. **Evidence Locker → Add Evidence** linking investigation artifacts.
4. **Risk Register** → update the risk score and treatment.
5. **Remediation Planner** → assign corrective tasks.
6. **Audit Schedule** → schedule a follow-up audit with recurrence.
7. Generate a **Gap Analysis** or **Risk Assessment** report for the board.

### Workflow E — Team rollout

1. **Team Members → Invite Member** → choose role (Admin / Compliance Officer / Analyst).
2. Invitee accepts at `/invite-accept`.
3. Adjust per-member roles from the table; review the **Role Permissions** matrix.
4. Set module-level overrides server-side as needed.
5. **Account Settings → Security → Set Up 2FA** for every admin.
6. Create scoped **API Keys** for CI/CD (Professional plan+).
7. Monitor everything in **Audit Log**.

---

## 17. Pricing & Entitlements

### 17.1 Plans

Published on `/pricing` with a **Monthly / Quarterly / 6 Months / Annual** interval switcher:

| Plan                             | Monthly   | Quarterly             | 6 Months               | Annual                   |
| -------------------------------- | --------- | --------------------- | ---------------------- | ------------------------ |
| **Starter**                      | $29       | $79 _(save 9%)_       | $149 _(save 14%)_      | $249 _(save 29%)_        |
| **Professional** ⭐ MOST POPULAR | $79       | $199 _(save 16%)_     | $379 _(save 20%)_      | $699 _(save 26%)_        |
| **Enterprise**                   | from $199 | from $549 _(save 8%)_ | from $999 _(save 16%)_ | from $2,000 _(save 16%)_ |

**Free trial:** 7 days on the `free_trial` plan.

### 17.2 Entitlement matrix

| Capability       | Starter | Professional | Enterprise |
| ---------------- | ------- | ------------ | ---------- |
| Max vendors      | 10      | 50           | 999        |
| Max frameworks   | 5       | 20           | 999        |
| Max seats        | 3       | 15           | 999        |
| AI reports / day | 3       | 20           | 200        |
| API access       | —       | ✓            | ✓          |
| Custom reports   | —       | ✓            | ✓          |
| Priority support | —       | —            | ✓          |
| White label      | —       | —            | ✓          |

### 17.3 Subscription states

`trialing` · `active:starter` · `active:professional` · `active:enterprise` · `past_due` · `canceled` · `expired_trial` · `incomplete`

Access remains available while trialing or while the subscription is `active` / `trialing`.

**Stripe webhooks handled:** `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`.

---

## 18. Keyboard, Accessibility & Localization

### 18.1 Keyboard

| Shortcut                 | Action                                            |
| ------------------------ | ------------------------------------------------- |
| **⌘K / Ctrl+K**          | Open the command palette                          |
| **Tab**                  | Reach the skip-to-content link, then page content |
| **Skip-to-content link** | Jumps past the sidebar to main content            |

### 18.2 Accessibility

- `aria-label` on all icon-only buttons
- `aria-live` announcements for toasts
- RTL-aware icon rotation
- `focus-visible` rings on interactive elements
- Route-level and component-level **error boundaries**

### 18.3 Localization

- **9 languages:** English, العربية (Arabic, full RTL), 中文 (Chinese), Français, Español, Deutsch, 日本語, 한국어, Português
- All UI strings use `t(key, fallback)`; locale is persisted
- Report **content** is fully localized in **en / ar / zh**; other UI locales fall back to English
- Dark / light themes with per-path default theme policies

---

## 19. Troubleshooting & FAQ

### 19.1 Common issues

| Symptom                                       | Fix                                                                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| _"DJAC is loading safely"_ on start           | Backend cold start — wait, then reload. The database-readiness check will unblock sign-in.                          |
| Sign-in button disabled                       | Database not ready. Retry after a few seconds.                                                                      |
| Redirected to Onboarding Wizard repeatedly    | Complete all 7 steps (or reach stage `completed`). Platform admins are exempt.                                      |
| _"Access Restricted"_ on Admin Control Center | Your role is below `platform_admin`.                                                                                |
| _"{feature} is a Premium Feature"_            | Plan too low — Vendor Risk needs **Professional**, SaaS Metrics needs **Enterprise**. Use **View Plans & Upgrade**. |
| _"trial_expired"_ error                       | Your 7-day trial ended — subscribe under **Billing & Plan**.                                                        |
| _Seat limit reached_                          | Upgrade the plan (Starter 3 / Professional 15 / Enterprise 999 seats).                                              |
| 2FA challenge on admin actions                | Expected — `updateUserAccess` and `deleteInteractionData` are MFA-gated.                                            |
| Email not arriving                            | SMTP must be configured (`SMTP_*` env). Check spam; OTPs expire — click **Send again**.                             |
| AI chat shows _"AI is not configured"_        | The LLM proxy key is not set in this environment.                                                                   |
| Report share link invalid/expired             | Generate a fresh share link.                                                                                        |
| Rate limited (429)                            | Protected endpoints allow ~60 requests/minute per user per path — wait a moment.                                    |
| Request times out                             | HTTP requests time out after 30 seconds; DB statements after 30 seconds. Retry heavy operations.                    |
| Assessment job stuck                          | Check **Operations** for queue mode (File / Redis / Memory) and readiness checks.                                   |

### 19.2 FAQ

**Q: Does DJAC give legal advice?**
A: No. DJAC produces compliance intelligence. For legal advice, use **Client Workspace → Request Consultation** to engage our partners.

**Q: Are simulation scores audited?**
A: No. Scores are deterministic estimates from framework base scores plus industry/size modifiers — useful for planning, not certification.

**Q: Which frameworks are deepest?**
A: 46 frameworks have full control-level data in the database (China: PIPL, CSL, DSL, MLPS2, NDSM, CIIP, VULN, CBDT; Saudi: PDPL, NCA baseline, M/117, ECC-1:2018, CCC-2:2024, CSCC-1, OTCC-1, DCC-1, TCC-1; plus UAE PDPL, GDPR, DORA, EU AI Act, CCPA, SOC 2, NIST CSF 2.0, HIPAA, PCI DSS, LGPD, ISO 27001/27701, UK-GDPR, PIPEDA and 17 national privacy laws).

**Q: How often does regulatory data update?**
A: The regulatory change feed is maintained continuously; scheduled jobs run daily at **06:00 UTC** (deadlines) and **08:00 UTC** (trial reminders).

**Q: Can I self-host?**
A: The platform runs on Vercel serverless + Supabase Postgres. Contact hello@yalla-hack.com for deployment options.

**Q: Where do intake forms go?**
A: Partnership, sponsorship, event applications, access requests, consultations and general inquiries are all delivered to **hello@yalla-hack.com** (reply-to = your address).

---

## 20. Glossary

| Term                 | Meaning                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------ |
| **DJAC**             | The platform name; "China–Saudi Compliance SaaS"                                                             |
| **CTEM**             | Continuous Threat Exposure Management — asset/vulnerability/exposure scoring loop                            |
| **DSR**              | Data Subject Request (GDPR/PIPL-style rights requests)                                                       |
| **Maturity Score**   | Per-framework readiness estimate 10–100 from the simulation engine                                           |
| **Risk Level**       | `critical / high / medium / low` derived from maturity scores and gap density                                |
| **Framework Pack**   | A curated bundle of controls and metadata for a standard or law (107 packs)                                  |
| **Industry Edition** | A framework + AI-agent bundle for a vertical (13 editions)                                                   |
| **Relationship**     | A typed link between frameworks: `overlap`, `conflict`, `harmonization`, `coordination`, `gap`, `dependency` |
| **TLP**              | Traffic Light Protocol — traffic-handling classification for threat intel (`WHITE/GREEN/AMBER/RED`)          |
| **MFA / 2FA**        | Time-based one-time password (TOTP) second factor with backup codes                                          |
| **RBAC**             | Role-Based Access Control across 31 permission-gated modules                                                 |
| **Assessment Job**   | A queued AI pipeline run with statuses `queued → running → completed/failed/cancelled`                       |
| **Evidence Locker**  | Repository of artifacts linked to audits, policies, risks, gaps, incidents                                   |
| **Owners' Console**  | The separate Yalla-Hack operator shell under `/yalla-hack-owners-console`                                    |

---

_Document generated for the DJAC Tool at https://app.yalla-hack.ae/ · Support: hello@yalla-hack.com_
