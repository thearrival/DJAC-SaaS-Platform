type LawJurisdiction = "China" | "Saudi Arabia" | "Cross-border";

type LawSection = {
    title: string;
    excerpt: string;
    keywords: string[];
};

export type LawKnowledgeEntry = {
    slug: string;
    title: string;
    jurisdiction: LawJurisdiction;
    frameworkCodes: string[];
    summary: string;
    keyTopics: string[];
    sections: LawSection[];
    sources: string[];
    updatedAt: string;
};

export type LawKnowledgeSearchResult = {
    slug: string;
    title: string;
    jurisdiction: LawJurisdiction;
    frameworkCodes: string[];
    summary: string;
    keyTopics: string[];
    matchedTopics: string[];
    highlights: Array<{
        title: string;
        excerpt: string;
    }>;
    score: number;
};

const LAW_KNOWLEDGE_BASE: LawKnowledgeEntry[] = [
    {
        slug: "saudi-cybersecurity-regime",
        title: "Saudi Cybersecurity Regulatory Framework",
        jurisdiction: "Saudi Arabia",
        frameworkCodes: ["NCA", "PDPL"],
        summary:
            "Saudi cybersecurity obligations combine NCA Essential Cybersecurity Controls, data-protection duties under PDPL, and criminal enforcement under anti-cybercrime laws.",
        keyTopics: [
            "NCA Essential Cybersecurity Controls",
            "PDPL security safeguards",
            "incident reporting",
            "critical infrastructure",
            "anti-cybercrime enforcement",
        ],
        sections: [
            {
                title: "Governance and control baseline",
                excerpt:
                    "Organizations should implement governance, asset management, access control, and incident-management controls aligned with NCA Essential Cybersecurity Controls.",
                keywords: ["nca", "ecc", "governance", "access control", "incident management"],
            },
            {
                title: "Data protection and privacy overlap",
                excerpt:
                    "Security controls should support PDPL requirements for confidentiality, integrity, breach mitigation, and accountable personal-data handling.",
                keywords: ["pdpl", "personal data", "confidentiality", "integrity", "privacy"],
            },
            {
                title: "Cybercrime and legal exposure",
                excerpt:
                    "Failing to secure systems can increase legal exposure where cyber offenses, unauthorized access, or data misuse trigger enforcement actions.",
                keywords: ["cybercrime", "enforcement", "unauthorized access", "penalties"],
            },
            {
                title: "Reference document",
                excerpt:
                    "Imported legal reference: Cybersecurity law in Saudi Arabia (attached project source document).",
                keywords: ["cybersecurity law in saudi arabia", "reference document", "saudi law"],
            },
        ],
        sources: [
            "Cybersecurity law in saudi arabia.pdf",
            "NCA Essential Cybersecurity Controls",
            "Saudi PDPL",
        ],
        updatedAt: "2026-03-16",
    },
    {
        slug: "saudi-cybersecurity-framework-detailed",
        title: "Saudi Cyber Security Framework - Detailed Legal and Control Index",
        jurisdiction: "Saudi Arabia",
        frameworkCodes: ["NCA", "PDPL"],
        summary:
            "Detailed searchable index of Saudi cybersecurity framework obligations, mapping governance, technical safeguards, incident handling, third-party risk, and personal-data duties for implementation and audit readiness.",
        keyTopics: [
            "NCA Essential Cybersecurity Controls domains",
            "cyber governance and risk management",
            "asset management and data classification",
            "identity and access management",
            "security operations and monitoring",
            "incident response and reporting",
            "business continuity and disaster recovery",
            "PDPL-aligned personal-data safeguards",
            "third-party and cloud security assurance",
        ],
        sections: [
            {
                title: "Governance and accountability structure",
                excerpt:
                    "Organizations should establish cybersecurity governance with clear executive ownership, defined responsibilities, policy hierarchy, and periodic board-level oversight of cyber risk posture.",
                keywords: [
                    "governance",
                    "ownership",
                    "policy",
                    "board oversight",
                    "saudi cybersecurity framework",
                ],
            },
            {
                title: "Risk management and control planning",
                excerpt:
                    "A risk-based methodology should identify critical services, threat scenarios, and control priorities, with documented treatment plans and periodic reassessment cycles.",
                keywords: [
                    "risk management",
                    "threat scenarios",
                    "risk treatment",
                    "control planning",
                ],
            },
            {
                title: "Asset inventory and data classification",
                excerpt:
                    "Maintain a complete inventory of information assets, classify data by sensitivity, and assign handling/protection requirements for storage, transmission, and retention.",
                keywords: [
                    "asset inventory",
                    "data classification",
                    "sensitive data",
                    "retention",
                    "handling requirements",
                ],
            },
            {
                title: "Identity, access, and privileged controls",
                excerpt:
                    "Implement least-privilege access, strong authentication, segregation of duties, periodic access recertification, and stricter controls for privileged and remote access paths.",
                keywords: [
                    "identity",
                    "access control",
                    "least privilege",
                    "mfa",
                    "privileged access",
                ],
            },
            {
                title: "System hardening, patching, and vulnerability management",
                excerpt:
                    "Use secure baseline configurations, timely patch deployment, vulnerability scanning, and remediation tracking with severity-based deadlines and exception handling.",
                keywords: [
                    "hardening",
                    "patch management",
                    "vulnerability scanning",
                    "remediation",
                    "severity",
                ],
            },
            {
                title: "Data protection and cryptographic safeguards",
                excerpt:
                    "Apply encryption, key-management governance, data loss prevention measures, and secure backup controls to preserve confidentiality, integrity, and availability of critical information.",
                keywords: [
                    "encryption",
                    "key management",
                    "data protection",
                    "backup",
                    "confidentiality integrity availability",
                ],
            },
            {
                title: "Security operations and monitoring",
                excerpt:
                    "Operate continuous log collection, anomaly detection, and alert triage workflows, supported by incident prioritization and evidence preservation for investigations and audits.",
                keywords: [
                    "soc",
                    "monitoring",
                    "logs",
                    "alert triage",
                    "evidence preservation",
                ],
            },
            {
                title: "Incident response, forensics, and reporting",
                excerpt:
                    "Maintain tested incident-response playbooks, escalation paths, forensic procedures, and post-incident lessons-learned to strengthen resilience and regulatory readiness.",
                keywords: [
                    "incident response",
                    "forensics",
                    "escalation",
                    "reporting",
                    "lessons learned",
                ],
            },
            {
                title: "Business continuity and disaster recovery",
                excerpt:
                    "Document continuity requirements for critical services, validate recovery strategies through drills, and maintain recovery objectives aligned with business and legal risk.",
                keywords: [
                    "business continuity",
                    "disaster recovery",
                    "drills",
                    "recovery objectives",
                    "critical services",
                ],
            },
            {
                title: "Third-party and cloud risk management",
                excerpt:
                    "Vendor and cloud engagements should include cybersecurity due diligence, contractual security obligations, ongoing assurance checks, and risk-based remediation tracking.",
                keywords: [
                    "third party",
                    "vendor risk",
                    "cloud security",
                    "contractual obligations",
                    "assurance",
                ],
            },
            {
                title: "PDPL and personal-data protection overlap",
                excerpt:
                    "Technical and organizational cybersecurity controls should support personal-data obligations such as lawful processing, data minimization, protection of data-subject rights, and breach-readiness capabilities.",
                keywords: [
                    "pdpl",
                    "personal data",
                    "data minimization",
                    "data subject rights",
                    "breach readiness",
                ],
            },
            {
                title: "Compliance evidence and audit package",
                excerpt:
                    "Maintain structured evidence including policies, risk registers, architecture diagrams, access reviews, vulnerability closure records, incident reports, and control-test outputs for audits.",
                keywords: [
                    "audit evidence",
                    "risk register",
                    "access review",
                    "control testing",
                    "compliance package",
                ],
            },
            {
                title: "Source integrity note",
                excerpt:
                    "This detailed entry is indexed from the project-supplied source file titled Cyber Security saudi arabia  Framework.pdf and is intended for compliance search assistance.",
                keywords: [
                    "cyber security saudi arabia framework",
                    "saudi framework pdf",
                    "project source document",
                    "reference index",
                ],
            },
        ],
        sources: [
            "Cyber Security saudi arabia  Framework.pdf",
            "NCA Essential Cybersecurity Controls",
            "Saudi Personal Data Protection Law (PDPL)",
        ],
        updatedAt: "2026-03-16",
    },
    {
        slug: "china-data-protection-stack",
        title: "China Data Protection and Cybersecurity Stack (CSL / DSL / PIPL)",
        jurisdiction: "China",
        frameworkCodes: ["CSL", "DSL", "PIPL"],
        summary:
            "China compliance typically requires simultaneous alignment with CSL (network security), DSL (data classification/security), and PIPL (personal information protection).",
        keyTopics: [
            "critical information infrastructure",
            "data localization",
            "cross-border transfer",
            "personal information protection",
            "security assessment",
        ],
        sections: [
            {
                title: "Cybersecurity Law (CSL)",
                excerpt:
                    "CSL focuses on network operators, baseline cyber controls, and special duties for critical information infrastructure operators.",
                keywords: ["csl", "network operators", "critical infrastructure"],
            },
            {
                title: "Data Security Law (DSL)",
                excerpt:
                    "DSL introduces graded data classification and risk-based data-security obligations for processing activities.",
                keywords: ["dsl", "data classification", "data security"],
            },
            {
                title: "Personal Information Protection Law (PIPL)",
                excerpt:
                    "PIPL governs lawful personal-data processing, purpose limitation, consent/legal basis, and transfer constraints.",
                keywords: ["pipl", "personal information", "consent", "transfer"],
            },
        ],
        sources: ["CSL", "DSL", "PIPL"],
        updatedAt: "2026-03-16",
    },
    {
        slug: "china-cybersecurity-law-2017-detailed",
        title: "Cybersecurity Law of the PRC (CSL) - Detailed Article Index",
        jurisdiction: "China",
        frameworkCodes: ["CSL"],
        summary:
            "Detailed searchable digest of the Cybersecurity Law of the People's Republic of China (effective 2017-06-01), indexed by key articles, obligations, CIIO controls, personal-information rules, and penalties.",
        keyTopics: [
            "Article 21 multi-level cybersecurity protection system",
            "Article 37 data localization and outbound transfer assessment",
            "critical information infrastructure (CIIO)",
            "personal information protection Articles 40-44",
            "incident response and early warning",
            "network operator obligations and penalties",
        ],
        sections: [
            {
                title: "Articles 1-4: Legislative purpose, scope, and national strategy",
                excerpt:
                    "The CSL protects cybersecurity, cyberspace sovereignty, national security, and lawful rights. It applies to network construction/operation/use and cybersecurity administration in China, and requires continuous strategy improvement with security-by-design principles.",
                keywords: [
                    "article 1",
                    "article 2",
                    "article 3",
                    "article 4",
                    "scope",
                    "national strategy",
                    "cyberspace sovereignty",
                ],
            },
            {
                title: "Articles 5-8: State protection model and competent authorities",
                excerpt:
                    "The State must monitor, prevent, and handle domestic/foreign cybersecurity threats, protect critical information infrastructure, and assign coordination to national cyberspace authorities with telecom/public-security departments sharing supervisory duties.",
                keywords: [
                    "article 5",
                    "article 8",
                    "cyberspace authorities",
                    "public security",
                    "critical information infrastructure",
                ],
            },
            {
                title: "Articles 9-12: Network operator and user conduct obligations",
                excerpt:
                    "Network operators must operate lawfully and in good faith, adopt technical/organizational measures for CIA of data, and users must not use networks for activities endangering national security or public order.",
                keywords: [
                    "article 9",
                    "article 10",
                    "article 12",
                    "confidentiality",
                    "integrity",
                    "availability",
                    "operator duties",
                ],
            },
            {
                title: "Articles 13-14: Minors' protection and reporting rights",
                excerpt:
                    "The law supports a safe online environment for minors and gives individuals/organizations the right to report cybersecurity-endangering conduct to competent authorities, which must process reports promptly and confidentially.",
                keywords: [
                    "article 13",
                    "article 14",
                    "report",
                    "informant confidentiality",
                    "minor protection",
                ],
            },
            {
                title: "Articles 15-20: Standards, investment, ecosystem, and talent",
                excerpt:
                    "China establishes cybersecurity standards, funds core technologies, supports certification/testing/risk-assessment services, promotes secure data use innovation, and mandates ongoing cybersecurity education and workforce development.",
                keywords: [
                    "article 15",
                    "article 16",
                    "article 17",
                    "article 18",
                    "article 19",
                    "article 20",
                    "standards",
                    "training",
                ],
            },
            {
                title: "Article 21: Multi-level protection baseline (MLPS)",
                excerpt:
                    "Network operators must implement internal governance, anti-malware/anti-intrusion controls, operation and incident monitoring, and retain relevant network logs for at least six months, plus backup/classification/encryption measures.",
                keywords: [
                    "article 21",
                    "mlps",
                    "six months logs",
                    "network logs",
                    "data classification",
                    "backup",
                    "encryption",
                ],
            },
            {
                title: "Articles 22-23: Product security, vulnerabilities, and certification",
                excerpt:
                    "Network products/services must meet mandatory standards, avoid malware, patch vulnerabilities promptly, notify users, report incidents, and provide maintenance. Critical equipment/specialized cybersecurity products require qualified certification or security inspection.",
                keywords: [
                    "article 22",
                    "article 23",
                    "vulnerability disclosure",
                    "security maintenance",
                    "critical network equipment",
                    "certification",
                ],
            },
            {
                title: "Article 24: Real-identity requirements",
                excerpt:
                    "Operators offering access, domain registration, publishing, or instant messaging services must collect identity details; services cannot be provided when identity details are not supplied.",
                keywords: [
                    "article 24",
                    "real name registration",
                    "identity verification",
                    "network access",
                ],
            },
            {
                title: "Articles 25-30: Incident response, cooperation, and data-use limits",
                excerpt:
                    "Operators must maintain incident-response plans, remediate vulnerabilities quickly, and report incidents. The law forbids offensive tooling/support activities and requires cooperation with public/national security. Data collected by authorities during supervision is restricted to cybersecurity purposes.",
                keywords: [
                    "article 25",
                    "article 26",
                    "article 27",
                    "article 28",
                    "article 29",
                    "article 30",
                    "incident response",
                    "technical support",
                ],
            },
            {
                title: "Articles 31-33: CIIO scope and protection planning",
                excerpt:
                    "Critical information infrastructure includes sectors such as communications, energy, transport, finance, public services, and e-government where failures could seriously harm national/public interests. Relevant departments must implement sector-specific security plans.",
                keywords: [
                    "article 31",
                    "article 32",
                    "article 33",
                    "ciio",
                    "critical infrastructure sectors",
                ],
            },
            {
                title: "Article 34: Enhanced CIIO operator obligations",
                excerpt:
                    "CIIO operators must establish dedicated security management, vet key personnel, run periodic training/assessments, maintain disaster recovery for important systems/databases, and conduct regular incident drills.",
                keywords: [
                    "article 34",
                    "ciio obligations",
                    "background checks",
                    "disaster recovery",
                    "security drills",
                ],
            },
            {
                title: "Articles 35-37: Security review and data localization",
                excerpt:
                    "CIIO operators must undergo security review for purchases affecting national security, sign security/confidentiality agreements, and store personal information and important data generated in mainland operations within China. Outbound transfers require security assessment unless another law provides otherwise.",
                keywords: [
                    "article 35",
                    "article 36",
                    "article 37",
                    "security review",
                    "localization",
                    "cross-border transfer",
                    "mainland china",
                ],
            },
            {
                title: "Articles 38-39: Annual CIIO risk assessment and state support",
                excerpt:
                    "CIIO operators must perform at least annual cybersecurity risk assessments and submit findings plus remediation actions. National cyberspace authorities can conduct random risk testing, organize emergency drills, and coordinate threat intelligence sharing.",
                keywords: [
                    "article 38",
                    "article 39",
                    "annual assessment",
                    "remediation",
                    "intelligence sharing",
                ],
            },
            {
                title: "Articles 40-44: Personal information governance framework",
                excerpt:
                    "Operators must keep user information confidential, process personal information lawfully/properly/necessarily, disclose processing rules and purpose, obtain consent, and support deletion/correction requests. Unauthorized sale, theft, or illegal provision of personal information is prohibited.",
                keywords: [
                    "article 40",
                    "article 41",
                    "article 42",
                    "article 43",
                    "article 44",
                    "consent",
                    "delete and correct",
                    "personal information",
                ],
            },
            {
                title: "Articles 45-50: Content and platform information-security controls",
                excerpt:
                    "Supervisory personnel must protect confidentiality of personal/private/trade-secret information. Operators and distribution platforms must block prohibited content, keep records, cooperate with investigations, and handle complaints/reporting channels.",
                keywords: [
                    "article 45",
                    "article 46",
                    "article 47",
                    "article 48",
                    "article 49",
                    "article 50",
                    "content moderation",
                    "complaint reporting",
                ],
            },
            {
                title: "Articles 51-58: Monitoring, early warning, and emergency powers",
                excerpt:
                    "China establishes cybersecurity monitoring, warning, and reporting systems. Authorities and sectors must maintain response plans and drills. In major emergencies, temporary network communication restrictions may be imposed in specified regions with proper approval.",
                keywords: [
                    "article 51",
                    "article 52",
                    "article 53",
                    "article 54",
                    "article 55",
                    "article 56",
                    "article 58",
                    "early warning",
                    "temporary network restrictions",
                ],
            },
            {
                title: "Articles 59-71: Administrative penalties and enforcement",
                excerpt:
                    "The CSL provides escalating penalties for non-compliance, including warnings, corrective orders, confiscation of unlawful gains, fines, suspension of operations, website shutdown, and permit/license revocation. Serious personal-information, CIIO, and prohibited-content violations carry higher penalties.",
                keywords: [
                    "article 59",
                    "article 60",
                    "article 61",
                    "article 64",
                    "article 65",
                    "article 66",
                    "article 68",
                    "penalties",
                    "license revocation",
                ],
            },
            {
                title: "Articles 72-79: Liability, definitions, and implementation date",
                excerpt:
                    "The law imposes accountability on state entities and supervisors, allows civil/public-order/criminal liability where applicable, defines key terms (network, cybersecurity, network operator, network data, personal information), and took effect on June 1, 2017.",
                keywords: [
                    "article 72",
                    "article 73",
                    "article 74",
                    "article 75",
                    "article 76",
                    "article 79",
                    "effective date",
                    "definitions",
                ],
            },
            {
                title: "Source integrity note",
                excerpt:
                    "This indexed entry is based on the user-provided unofficial translation text (reference only) attributed to China Securities Regulatory Commission website material.",
                keywords: [
                    "unofficial translation",
                    "reference only",
                    "china securities regulatory commission",
                    "csrc",
                ],
            },
        ],
        sources: [
            "Cybersecurity Law of the PRC - unofficial translation provided by project stakeholder",
            "China Securities Regulatory Commission (translation source reference)",
        ],
        updatedAt: "2026-03-16",
    },
    {
        slug: "saudi-ecc-1-2018-detailed",
        title: "Saudi Essential Cybersecurity Controls (ECC-1:2018) — Full Domain Index",
        jurisdiction: "Saudi Arabia",
        frameworkCodes: ["NCA", "ECC"],
        summary:
            "The ECC-1:2018 is the mandatory baseline cybersecurity framework issued by the NCA, covering 5 domains, 29 sub-domains, and 114 controls applicable to all Saudi government entities and critical infrastructure operators.",
        keyTopics: [
            "Domain 1: Cybersecurity Governance (strategy, management, policy, risk, HR)",
            "Domain 2: Cybersecurity Defense (asset management, IAM, network, mobile)",
            "Domain 3: Cybersecurity Resilience (BCP, disaster recovery, backup)",
            "Domain 4: Third-Party and Cloud Security (vendor risk, cloud adoption)",
            "Domain 5: ICS/OT Cybersecurity (industrial control systems, SCADA)",
            "NCA Haseen self-assessment tool",
            "annual internal audit obligations",
            "mandatory incident reporting to NCA",
        ],
        sections: [
            {
                title: "1-1 Cybersecurity Strategy",
                excerpt:
                    "Organizations must align cybersecurity strategy with business objectives and the national cybersecurity strategy. The strategy should be reviewed and updated periodically to address changes in the threat landscape.",
                keywords: ["strategy", "national strategy", "business alignment", "periodic review"],
            },
            {
                title: "1-2 Cybersecurity Management",
                excerpt:
                    "Clear roles, responsibilities, and organizational structures for cybersecurity must be established. A designated cybersecurity function or officer must be accountable for cybersecurity outcomes and board reporting.",
                keywords: ["management", "roles", "responsibilities", "ciso", "organizational structure"],
            },
            {
                title: "1-3 Cybersecurity Policies and Procedures",
                excerpt:
                    "Formal cybersecurity policies must be documented, approved by senior management, communicated to all relevant staff, and reviewed annually or after significant changes.",
                keywords: ["policy", "procedures", "documentation", "approval", "annual review"],
            },
            {
                title: "1-4 Cybersecurity Risk Management",
                excerpt:
                    "Organizations must conduct regular cybersecurity risk assessments, document risk treatment plans, and track remediation of identified security risks in alignment with organizational risk tolerance.",
                keywords: ["risk assessment", "risk treatment", "risk tolerance", "remediation tracking"],
            },
            {
                title: "1-5 Cybersecurity in Human Resources",
                excerpt:
                    "Background checks for key personnel, security awareness training for all staff, role-specific training for security teams, and clear offboarding procedures are required.",
                keywords: ["background checks", "awareness training", "security culture", "offboarding"],
            },
            {
                title: "2-1 Asset Management",
                excerpt:
                    "A complete and maintained inventory of hardware, software, data, and network assets is required. Assets must be classified by criticality and ownership assigned. Unauthorized assets must be detected and managed.",
                keywords: ["asset inventory", "hardware", "software", "data assets", "asset classification", "ownership"],
            },
            {
                title: "2-2 Identity and Access Management (IAM)",
                excerpt:
                    "Controls include MFA for privileged and remote access, least-privilege principles, periodic access recertification, user lifecycle management (provisioning/de-provisioning), and separation of duties.",
                keywords: ["iam", "mfa", "least privilege", "access review", "provisioning", "separation of duties"],
            },
            {
                title: "2-3 Information Systems and Assets Protection",
                excerpt:
                    "Encryption for data at rest and in transit, secure configuration baselines, patch management with SLA-based deadlines, and anti-malware controls are required for all systems.",
                keywords: ["encryption", "secure configuration", "patch management", "anti-malware", "hardening"],
            },
            {
                title: "2-4 Network Security Management",
                excerpt:
                    "Network segmentation, perimeter defenses (firewalls, IDS/IPS), secure remote access (VPN), and traffic monitoring are mandatory. DMZ architectures are required for externally exposed services.",
                keywords: ["network segmentation", "firewall", "ids ips", "vpn", "dmz", "perimeter security"],
            },
            {
                title: "2-5 Mobile Devices and Portable Media Security",
                excerpt:
                    "Mobile Device Management (MDM) must control corporate devices. Portable media must be encrypted and usage restricted by policy. BYOD policies must define security requirements for personal devices accessing corporate data.",
                keywords: ["mdm", "mobile security", "portable media", "byod", "encryption"],
            },
            {
                title: "3-1 Business Continuity and Disaster Recovery",
                excerpt:
                    "Organizations must document BCP/DR plans, define RTO/RPO for critical systems, maintain tested backups, and conduct regular drills to validate recovery capabilities. Plans must be reviewed annually.",
                keywords: ["bcp", "disaster recovery", "rto", "rpo", "backup", "drills", "resilience"],
            },
            {
                title: "4-1 Third-Party Cybersecurity",
                excerpt:
                    "Vendor risk assessments are required before onboarding. Contracts must include security clauses, audit rights, and breach notification obligations. Ongoing assurance reviews must be conducted for high-risk suppliers.",
                keywords: ["vendor risk", "third party", "contract security clauses", "audit rights", "supplier assurance"],
            },
            {
                title: "4-2 Cloud Computing Cybersecurity",
                excerpt:
                    "Cloud adoption must follow NCA Cloud Cybersecurity Controls (CCC-2:2024). Data classification determines permissible cloud deployment models. Government and sensitive data must reside within Saudi Arabia.",
                keywords: ["cloud security", "ccc", "data localization", "cloud deployment", "saas paas iaas"],
            },
            {
                title: "5-1 ICS/OT Cybersecurity",
                excerpt:
                    "Industrial control systems and OT environments require specialized controls from the OTCC-1:2022 framework, including network isolation from corporate IT, firmware validation, and OT-specific incident response plans.",
                keywords: ["ics", "ot", "scada", "otcc", "industrial cybersecurity", "network isolation", "firmware"],
            },
            {
                title: "ECC Compliance and Audit Requirements",
                excerpt:
                    "Entities must submit annual ECC self-assessments via the NCA's Haseen tool. Internal audits are mandatory. The NCA may conduct external audits of critical entities. Non-compliance can result in enforcement actions under the NCA's legal powers (Royal Decree M/117, 2024).",
                keywords: ["haseen", "self-assessment", "annual audit", "nca enforcement", "m/117", "compliance submission"],
            },
        ],
        sources: [
            "NCA Essential Cybersecurity Controls (ECC-1:2018)",
            "NCA Cloud Cybersecurity Controls (CCC-2:2024)",
            "NCA Operational Technology Cybersecurity Controls (OTCC-1:2022)",
            "Legal Powers of the NCA (Royal Decree M/117, 2024)",
            "Saudi Arabia Cybersecurity Compliance Database (DJAC project reference)",
        ],
        updatedAt: "2026-03-16",
    },
    {
        slug: "saudi-pdpl-2024-detailed",
        title: "Saudi Personal Data Protection Law (PDPL) — Enforcement Guide",
        jurisdiction: "Saudi Arabia",
        frameworkCodes: ["PDPL", "SDAIA"],
        summary:
            "The PDPL (issued 2021, fully enforced September 14, 2024) is Saudi Arabia's comprehensive personal data privacy law administered by SDAIA. It governs data collection, processing, retention, and cross-border transfer of personal information.",
        keyTopics: [
            "lawful basis for data processing and consent",
            "data subject rights (access, correction, deletion, objection)",
            "cross-border personal data transfer restrictions",
            "data localization requirements",
            "data breach notification obligations",
            "Data Protection Officer (DPO) appointment",
            "privacy impact assessments (PIA)",
            "enforcement by SDAIA with fines up to SAR 5 million",
        ],
        sections: [
            {
                title: "Scope and Applicability",
                excerpt:
                    "The PDPL applies to all controllers and processors operating in Saudi Arabia or processing personal data of Saudi residents, regardless of the data processor's location. It covers both digital and paper-based personal records.",
                keywords: ["pdpl scope", "applicability", "controller", "processor", "saudi residents", "extraterritorial"],
            },
            {
                title: "Lawful Basis for Processing",
                excerpt:
                    "Personal data processing requires a lawful basis: consent, contractual necessity, legal obligation, vital interests, public task, or legitimate interests. Consent must be explicit, informed, and freely given. Special categories (health, biometric, financial) require explicit consent.",
                keywords: ["consent", "lawful basis", "explicit consent", "special categories", "health data", "biometric"],
            },
            {
                title: "Data Subject Rights",
                excerpt:
                    "Data subjects have rights to: access their personal data, request correction of inaccurate data, request deletion ('right to be forgotten'), object to processing, and request restriction of processing. Controllers must respond within defined timelines.",
                keywords: ["data subject rights", "right to access", "right to deletion", "right to correction", "objection", "restriction"],
            },
            {
                title: "Data Minimization and Purpose Limitation",
                excerpt:
                    "Data collection must be limited to what is necessary for the stated purpose. Personal data must not be used for purposes incompatible with the original collection purpose without a new lawful basis.",
                keywords: ["data minimization", "purpose limitation", "collection purpose", "proportionality"],
            },
            {
                title: "Cross-Border Data Transfers",
                excerpt:
                    "Transfer of personal data outside Saudi Arabia requires SDAIA approval and adequate protection in the receiving country. Transfer is permitted based on adequacy decisions, binding corporate rules, standard contractual clauses, or SDAIA approval.",
                keywords: ["cross-border transfer", "data transfer", "sdaia approval", "standard contractual clauses", "bcr", "adequacy"],
            },
            {
                title: "Data Localization",
                excerpt:
                    "Certain categories of personal data linked to government and sensitive sectors must be stored within Saudi Arabia. Cloud providers processing such data must use Saudi-based data centers.",
                keywords: ["data localization", "saudi data centers", "cloud storage", "government data", "in-kingdom"],
            },
            {
                title: "Security Safeguards",
                excerpt:
                    "Controllers must implement appropriate technical and organizational measures to protect personal data against unauthorized access, alteration, disclosure, or destruction. Security measures must be proportionate to the risk.",
                keywords: ["security safeguards", "technical measures", "organizational measures", "data protection", "breach prevention"],
            },
            {
                title: "Data Breach Notification",
                excerpt:
                    "Controllers must notify SDAIA of data breaches that affect personal data within 72 hours of becoming aware. Data subjects must be notified if the breach is likely to result in harm to their rights and freedoms.",
                keywords: ["breach notification", "72 hours", "sdaia notification", "data subjects notification", "incident reporting"],
            },
            {
                title: "Data Protection Officer (DPO)",
                excerpt:
                    "Controllers engaged in large-scale processing, processing of special categories, or systematic monitoring of data subjects must appoint a qualified DPO. The DPO advises on compliance, monitors PDPL adherence, and acts as contact for SDAIA.",
                keywords: ["dpo", "data protection officer", "large scale processing", "sdaia contact", "compliance advisory"],
            },
            {
                title: "Privacy Impact Assessment (PIA)",
                excerpt:
                    "A PIA is required before initiating high-risk processing activities, including new technologies, large-scale profiling, or systematic processing of sensitive data. The PIA must document risks and mitigation measures.",
                keywords: ["pia", "privacy impact assessment", "high risk processing", "profiling", "new technology"],
            },
            {
                title: "Enforcement and Penalties",
                excerpt:
                    "SDAIA enforces the PDPL with fines up to SAR 5 million for violations of personal data protection standards, and up to SAR 3 million for technical violations. The NCA's Royal Decree M/117 (2024) establishes additional penalties for cybersecurity-related personal data failures.",
                keywords: ["pdpl penalties", "sar 5 million", "sdaia enforcement", "fines", "royal decree m/117", "violations"],
            },
        ],
        sources: [
            "Saudi Personal Data Protection Law (PDPL) — SDAIA 2021, enforced 2024",
            "SDAIA Implementing Regulations",
            "NCA Legal Powers (Royal Decree M/117, 2024)",
            "Saudi Arabia Cybersecurity Compliance Database (DJAC project reference)",
        ],
        updatedAt: "2026-03-16",
    },
    {
        slug: "china-mlps-2-detailed",
        title: "China Multi-Level Protection Scheme 2.0 (MLPS 2.0 / GB/T 22239-2019)",
        jurisdiction: "China",
        frameworkCodes: ["MLPS", "CSL"],
        summary:
            "MLPS 2.0 is China's foundational cybersecurity standard (effective December 2019), mandatory for all network operators. It classifies systems into five protection levels and prescribes technical and administrative controls for each level.",
        keyTopics: [
            "MLPS Level 1-5 classification and grading process",
            "Technical controls: physical, network, host, application, data",
            "Administrative controls: institutional, organizational, personnel, construction, operations",
            "Level 3 annual external assessment by licensed agency",
            "Level 4 semi-annual external assessment",
            "six-month log retention requirement",
            "supervised by MPS (Ministry of Public Security)",
            "registration with local MPS bureau",
        ],
        sections: [
            {
                title: "MLPS Grading (Levels 1-5)",
                excerpt:
                    "Systems are classified into five levels based on potential harm to national security, social order, and public interests. Level 1 (lowest) applies to small systems; Level 5 (highest) covers national core systems. Most commercial organizations operate at Level 2 or Level 3.",
                keywords: ["mlps grading", "level 1", "level 2", "level 3", "level 4", "level 5", "classification", "grading criteria"],
            },
            {
                title: "Registration with MPS",
                excerpt:
                    "Organizations must register their systems with the local MPS bureau after self-grading. Third-party expert assessment confirms the grade for Level 2+ systems. Registration certificates must be maintained and updated when systems change significantly.",
                keywords: ["mps registration", "local mps bureau", "expert assessment", "registration certificate", "system change"],
            },
            {
                title: "Physical and Environmental Security",
                excerpt:
                    "Data centers and equipment rooms must implement physical access controls, environmental monitoring (temperature, humidity, power), fire protection, and anti-flooding measures. Physical access logs must be maintained.",
                keywords: ["physical security", "data center", "access control", "environmental monitoring", "power protection"],
            },
            {
                title: "Network and Communications Security",
                excerpt:
                    "Boundary protection (firewalls, IDS/IPS), network segmentation, encrypted transmission for sensitive data, and traffic auditing are required. Unauthorized connections and rogue devices must be detected and blocked.",
                keywords: ["network security", "boundary protection", "segmentation", "encrypted transmission", "traffic auditing", "ids ips"],
            },
            {
                title: "Host and Device Security",
                excerpt:
                    "Host-based controls include multi-factor authentication, role-based access control, intrusion detection, anti-malware, security logging, and secure configuration management. Remote access to hosts must use encrypted channels.",
                keywords: ["host security", "mfa", "rbac", "intrusion detection", "anti-malware", "security logging", "configurations"],
            },
            {
                title: "Application and Data Security",
                excerpt:
                    "Applications must implement input validation, session management, secure coding practices, and permission management. Data at rest must be encrypted for sensitive/important data. Regular backups with tested restoration are mandatory.",
                keywords: ["application security", "input validation", "session management", "data encryption", "backup restore"],
            },
            {
                title: "Security Management — Institutional",
                excerpt:
                    "Organizations must establish a cybersecurity management system including responsibilities, policies, management processes, and review mechanisms. Internal audit of cybersecurity management is required periodically.",
                keywords: ["security policy", "management system", "responsibilities", "internal audit", "management review"],
            },
            {
                title: "Security Management — Personnel",
                excerpt:
                    "Background checks for staff with access to sensitive systems, mandatory cybersecurity training, confidentiality agreements, and controlled access revocation upon departure are all required.",
                keywords: ["personnel security", "background checks", "training", "confidentiality agreement", "access revocation"],
            },
            {
                title: "Security Management — Operations",
                excerpt:
                    "Continuous monitoring, vulnerability management, patch deployment within defined SLAs, incident response procedures, and change management processes are required for daily operations. Security event logs must be retained for six months minimum.",
                keywords: ["security operations", "monitoring", "vulnerability management", "patch sla", "incident response", "change management", "six months logs"],
            },
            {
                title: "Level 3 Annual Assessment",
                excerpt:
                    "Systems graded at Level 3 must undergo annual third-party security assessment by a qualified MLPS evaluation agency. Assessment results must be submitted to MPS. Non-conformities must be remediated within defined timelines.",
                keywords: ["level 3 assessment", "annual assessment", "third party evaluation", "mps submission", "non-conformity", "qualified agency"],
            },
            {
                title: "MLPS 2.0 vs. MLPS 1.0 Key Changes",
                excerpt:
                    "MLPS 2.0 expanded scope to cover cloud computing, mobile internet, IoT, big data, and industrial control systems. It strengthened the role of MPS in enforcement and introduced clearer penalties aligned with the CSL.",
                keywords: ["mlps 2.0 changes", "cloud computing", "iot", "big data", "industrial control", "csl alignment"],
            },
        ],
        sources: [
            "GB/T 22239-2019 Multi-Level Protection Scheme (MLPS 2.0)",
            "China Cybersecurity Law (CSL) — Articles 21, 31",
            "MPS MLPS Administration Guidelines",
            "China Cybersecurity Compliance Database (DJAC project reference)",
        ],
        updatedAt: "2026-03-16",
    },
    {
        slug: "china-dsl-detailed",
        title: "China Data Security Law (DSL) — Compliance Guide",
        jurisdiction: "China",
        frameworkCodes: ["DSL", "CAC"],
        summary:
            "The DSL (effective September 1, 2021) establishes China's national data security management framework. It introduces data classification, important data identification, security obligations for data processors, and cross-border rules.",
        keyTopics: [
            "data classification into General / Important / Core tiers",
            "important data catalog and handler obligations",
            "annual important data security report",
            "cross-border transfer of important data requires CAC security assessment",
            "data security incident response",
            "data trading and transaction security platform",
            "national data security review mechanism",
        ],
        sections: [
            {
                title: "Data Classification Framework",
                excerpt:
                    "The DSL establishes a three-tier data classification: General Data, Important Data, and Core Data. Each tier carries increasingly stringent protection requirements. Sectoral authorities define classification catalogs for their industries.",
                keywords: ["data classification", "general data", "important data", "core data", "classification tiers", "sectoral catalog"],
            },
            {
                title: "Important Data Obligations",
                excerpt:
                    "Entities that handle 'important data' must designate a data security officer, maintain a data processing activity record, conduct regular security assessments, and submit annual security reports to their sectoral regulator.",
                keywords: ["important data", "data security officer", "processing records", "annual report", "risk assessment"],
            },
            {
                title: "Core Data Protection",
                excerpt:
                    "Core data (relating to national security, economic security, or critical people's livelihoods) receives the highest protection level. Processing requires stricter oversight, and any export is generally prohibited without State approval.",
                keywords: ["core data", "national security", "economic security", "export prohibition", "state approval"],
            },
            {
                title: "Cross-Border Data Transfers",
                excerpt:
                    "Important data cannot be transferred outside China without completing a CAC data security assessment. The assessment evaluates necessity, legality, impact on national security, and safeguards in the recipient country.",
                keywords: ["cross-border transfer", "important data export", "cac assessment", "data security assessment", "national security review"],
            },
            {
                title: "Data Security Management System",
                excerpt:
                    "Organizations must establish an internal data security management system covering data classification, access controls, monitoring, incident response, and regular staff training on data security responsibilities.",
                keywords: ["data security management", "classification controls", "access controls", "staff training", "incident response"],
            },
            {
                title: "National Data Security Review",
                excerpt:
                    "China's data security review mechanism allows authorities to review data activities that may affect national security. Activities subject to review cannot proceed until clearance is obtained.",
                keywords: ["national security review", "data activity review", "clearance", "cam review mechanism"],
            },
            {
                title: "Penalties for Non-Compliance",
                excerpt:
                    "Violations can result in rectification orders, warnings, fines of up to RMB 10 million, suspension of services, revocation of business licenses, and criminal liability for responsible persons in severe cases.",
                keywords: ["dsl penalties", "rmb 10 million", "rectification", "license revocation", "criminal liability", "data security violations"],
            },
        ],
        sources: [
            "Data Security Law of the PRC (DSL) — effective September 1, 2021",
            "CAC Data Security Assessment Rules",
            "China Cybersecurity Compliance Database (DJAC project reference)",
        ],
        updatedAt: "2026-03-16",
    },
    {
        slug: "china-pipl-detailed",
        title: "China Personal Information Protection Law (PIPL) — Compliance Guide",
        jurisdiction: "China",
        frameworkCodes: ["PIPL", "CAC"],
        summary:
            "The PIPL (effective November 1, 2021) is China's comprehensive personal information privacy law, analogous to GDPR. It governs PI collection, processing, use, and cross-border transfer with strong consent and rights provisions.",
        keyTopics: [
            "lawful basis for PI processing (consent, contract, legal duty, public interest)",
            "separate consent for sensitive PI (health, biometric, finance, minors)",
            "data subject rights: access, copy, correct, delete, portability",
            "automated decision-making rules and opt-out rights",
            "cross-border PI transfer: CAC assessment / BCR / standard contracts",
            "personal information protection officer (PIPO) appointment",
            "personal information impact assessment (PIIA)",
            "liability: up to RMB 50 million or 5% of annual turnover",
        ],
        sections: [
            {
                title: "Scope and Extraterritorial Application",
                excerpt:
                    "The PIPL applies to processing of personal information of individuals in China, even if the processor is outside China. Overseas processors serving the Chinese market must establish a local representative or dedicated agency.",
                keywords: ["pipl scope", "extraterritorial", "overseas processor", "local representative", "chinese market"],
            },
            {
                title: "Lawful Bases for PI Processing",
                excerpt:
                    "The PIPL requires a lawful basis: individual consent (most common), necessity for contract performance, legal obligation, vital interests, public interest, or other bases specified by law. Consent must be specific, informed, voluntary, and unambiguous.",
                keywords: ["lawful basis", "consent", "contract necessity", "legal obligation", "voluntary consent", "informed consent"],
            },
            {
                title: "Sensitive Personal Information",
                excerpt:
                    "Sensitive PI includes biometric data, religious beliefs, medical/health information, financial accounts, location tracking, and personal information of minors under 14. Processing requires explicit separate consent and is limited to 'specific purposes.'",
                keywords: ["sensitive pi", "biometric", "health information", "financial data", "minors under 14", "separate consent", "specific purpose"],
            },
            {
                title: "Individual Rights",
                excerpt:
                    "Individuals have rights to: know and decide how their PI is processed; access and copy their PI; correct inaccurate data; delete data where basis no longer exists; portability of PI to other platforms; withdraw consent; restrict automated decisions.",
                keywords: ["individual rights", "right to access", "right to portability", "right to delete", "right to correct", "withdraw consent", "automated decisions"],
            },
            {
                title: "Automated Decision-Making",
                excerpt:
                    "Entities using automated decision-making must ensure transparency, offer explanatory mechanisms, and allow individuals to opt out of automated decisions that significantly affect their interests. Personalized push of commercial information requires consent.",
                keywords: ["automated decisions", "transparency", "opt out", "explainability", "profiling", "personalized content"],
            },
            {
                title: "Cross-Border Personal Information Transfer",
                excerpt:
                    "PI transfer outside China requires one of: CAC security assessment (mandatory for Critical Information Infrastructure Operators or large-scale transfers), CAC-approved standard contract, or CAC certification. Data subjects must be informed and give separate consent.",
                keywords: ["cross-border pi transfer", "cac security assessment", "standard contract", "cac certification", "separate consent", "ciio transfer"],
            },
            {
                title: "Personal Information Protection Impact Assessment (PIIA)",
                excerpt:
                    "A PIIA is required before processing sensitive PI, automated decision-making affecting significant interests, providing PI to third parties, and overseas transfers. PIIA records must be kept for at least three years.",
                keywords: ["piia", "impact assessment", "sensitive pi assessment", "third party disclosure", "three year record"],
            },
            {
                title: "Personal Information Protection Officer (PIPO)",
                excerpt:
                    "Processors handling PI above regulatory thresholds or processing sensitive PI must appoint a qualified PIPO. The PIPO oversees internal compliance, staff training, and acts as the principal contact for CAC enforcement queries.",
                keywords: ["pipo", "protection officer", "regulatory threshold", "internal compliance", "cac contact"],
            },
            {
                title: "Minors' Data Protection",
                excerpt:
                    "Processing PI of minors under 14 requires explicit consent from their parents or guardians. Entities must establish dedicated protection rules and present minors-specific policies. Annual minors' data compliance reports are due by January 31 each year.",
                keywords: ["minors data", "under 14", "parental consent", "guardian consent", "annual report", "january 31"],
            },
            {
                title: "Penalties and Enforcement",
                excerpt:
                    "Violations can result in fines up to RMB 50 million or 5% of annual turnover (whichever is higher), suspension of PI processing activities, revocation of operating licenses, and personal liability for executives including bans from industry positions.",
                keywords: ["pipl penalties", "rmb 50 million", "5 percent turnover", "license revocation", "executive liability", "industry ban"],
            },
        ],
        sources: [
            "Personal Information Protection Law of the PRC (PIPL) — effective November 1, 2021",
            "CAC Standard Contract for Cross-Border PI Transfer (2022)",
            "CAC Regulations on Network Data Security Management (2024/2025)",
            "China Cybersecurity Compliance Database (DJAC project reference)",
        ],
        updatedAt: "2026-03-16",
    },
    {
        slug: "china-csl-2026-amendments",
        title: "China CSL 2026 Amendments — Key Changes Effective January 1, 2026",
        jurisdiction: "China",
        frameworkCodes: ["CSL", "CAC"],
        summary:
            "The amended Cybersecurity Law takes effect January 1, 2026, introducing significantly higher penalties (up to 10% of annual revenue), expanded personal liability for executives, and stronger enforcement powers for the CAC.",
        keyTopics: [
            "penalty increase: up to 10% of annual turnover for serious violations",
            "personal executive liability: industry bans for responsible persons",
            "expanded CAC enforcement and investigative powers",
            "stricter obligations for critical information infrastructure operators",
            "enhanced minors' online protection requirements",
            "tighter vulnerability disclosure reporting timeline",
            "effective date: January 1, 2026",
        ],
        sections: [
            {
                title: "Major Penalty Increase",
                excerpt:
                    "The 2026 amendments dramatically increased penalties for serious CSL violations. Organizations face fines up to 10% of annual turnover (up from fixed maximum amounts). This aligns CSL penalties with the PIPL framework.",
                keywords: ["penalty increase", "10 percent turnover", "serious violations", "csl 2026", "fine increase"],
            },
            {
                title: "Personal Liability for Executives",
                excerpt:
                    "Responsible persons (executives, compliance officers) face personal fines and may be banned from serving in senior roles in the industry for periods up to 10 years following serious cybersecurity violations.",
                keywords: ["personal liability", "executive liability", "industry ban", "10 year ban", "responsible persons"],
            },
            {
                title: "Expanded CAC Powers",
                excerpt:
                    "The CAC gains enhanced investigative authority including on-site inspections, data and system access orders, and the ability to impose business suspension on non-compliant organizations during investigations.",
                keywords: ["cac powers", "on-site inspection", "business suspension", "investigative authority", "system access order"],
            },
            {
                title: "CIIO Obligations Strengthened",
                excerpt:
                    "Critical information infrastructure operators face stricter security review requirements for procurement, enhanced data localization enforcement, and mandatory security assessments before operational system changes.",
                keywords: ["ciio", "security review", "procurement review", "data localization enforcement", "pre-change assessment"],
            },
            {
                title: "Vulnerability Disclosure Tightened",
                excerpt:
                    "Organizations must report discovered vulnerabilities to MIIT/CAC within 48 hours of discovery. Delayed or undisclosed vulnerabilities now attract significantly higher fines under the 2026 penalty schedule.",
                keywords: ["vulnerability disclosure", "48 hours", "miit reporting", "cac reporting", "vulnerability fines"],
            },
            {
                title: "Compliance Action Items for January 2026",
                excerpt:
                    "Organizations must review existing penalty exposure calculations, update incident response escalation paths to meet tighter timelines, reassess executive accountability frameworks, and ensure vulnerability management processes meet the 48-hour reporting window.",
                keywords: ["csl 2026 compliance", "action items", "penalty exposure", "escalation update", "executive accountability", "vulnerability timeline"],
            },
        ],
        sources: [
            "Cybersecurity Law of the PRC (CSL) — 2026 Amendments (effective January 1, 2026)",
            "CAC Announcement on CSL Amendment",
            "DJAC Cybersecurity Compliance Database Report (2026)",
        ],
        updatedAt: "2026-03-16",
    },
    {
        slug: "cross-border-china-saudi-checklist",
        title: "China–Saudi Cross-Border Compliance Alignment Checklist",
        jurisdiction: "Cross-border",
        frameworkCodes: ["CSL", "DSL", "PIPL", "PDPL", "NCA"],
        summary:
            "A practical alignment view for organizations operating between China and Saudi Arabia, focusing on localization, transfer controls, security operations, and auditability.",
        keyTopics: [
            "cross-border transfer",
            "localization evidence",
            "vendor risk",
            "incident response",
            "audit trail",
        ],
        sections: [
            {
                title: "Localization and residency",
                excerpt:
                    "Maintain explicit mapping of data residency commitments by jurisdiction and legal basis for any cross-border flows.",
                keywords: ["localization", "residency", "cross-border flows"],
            },
            {
                title: "Vendor due diligence",
                excerpt:
                    "Evaluate suppliers against both legal stacks and maintain remediation evidence for gaps by severity.",
                keywords: ["vendor", "due diligence", "remediation"],
            },
            {
                title: "Operational assurance",
                excerpt:
                    "Implement periodic control testing, logging, and readiness drills to show ongoing compliance posture.",
                keywords: ["logging", "readiness", "control testing"],
            },
        ],
        sources: ["DJAC comparative framework analysis"],
        updatedAt: "2026-03-16",
    },
];

function normalize(value: string) {
    return value.toLowerCase().trim();
}

function tokenize(value: string) {
    return normalize(value)
        .split(/[^a-z0-9\u0600-\u06FF\u4E00-\u9FFF]+/)
        .map(token => token.trim())
        .filter(token => token.length >= 2);
}

function scoreEntry(queryTokens: string[], entry: LawKnowledgeEntry) {
    if (queryTokens.length === 0) {
        return {
            score: 1,
            matchedTopics: [] as string[],
            highlights: entry.sections.slice(0, 2).map(section => ({
                title: section.title,
                excerpt: section.excerpt,
            })),
        };
    }

    let score = 0;
    const matchedTopics = new Set<string>();
    const highlights: Array<{ title: string; excerpt: string }> = [];

    const title = normalize(entry.title);
    const summary = normalize(entry.summary);

    for (const token of queryTokens) {
        if (title.includes(token)) score += 8;
        if (summary.includes(token)) score += 5;
        if (entry.frameworkCodes.some(code => normalize(code).includes(token))) score += 4;

        for (const topic of entry.keyTopics) {
            if (normalize(topic).includes(token)) {
                score += 3;
                matchedTopics.add(topic);
            }
        }

        for (const section of entry.sections) {
            const sectionText = normalize(
                `${section.title} ${section.excerpt} ${section.keywords.join(" ")}`
            );
            if (sectionText.includes(token)) {
                score += 2;
                if (highlights.length < 3) {
                    highlights.push({
                        title: section.title,
                        excerpt: section.excerpt,
                    });
                }
            }
        }
    }

    return {
        score,
        matchedTopics: Array.from(matchedTopics),
        highlights,
    };
}

export function listLawKnowledge(): LawKnowledgeEntry[] {
    return LAW_KNOWLEDGE_BASE;
}

export function getLawKnowledgeBySlug(slug: string): LawKnowledgeEntry | null {
    const normalized = normalize(slug);
    return LAW_KNOWLEDGE_BASE.find(item => normalize(item.slug) === normalized) ?? null;
}

export function searchLawKnowledge(query: string, limit = 20): LawKnowledgeSearchResult[] {
    const tokens = tokenize(query);
    const normalizedLimit = Math.max(1, Math.min(50, limit));

    return LAW_KNOWLEDGE_BASE.map(entry => {
        const scored = scoreEntry(tokens, entry);

        return {
            slug: entry.slug,
            title: entry.title,
            jurisdiction: entry.jurisdiction,
            frameworkCodes: entry.frameworkCodes,
            summary: entry.summary,
            keyTopics: entry.keyTopics,
            matchedTopics: scored.matchedTopics,
            highlights: scored.highlights,
            score: scored.score,
        };
    })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, normalizedLimit);
}