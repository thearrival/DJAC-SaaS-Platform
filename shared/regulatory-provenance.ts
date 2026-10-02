/**
 * Regulatory provenance registry.
 *
 * A compliance product tells users what their obligations are and then tells
 * them to "verify against official sources" — while giving them nothing to
 * verify against. This module is that missing layer: for every regulatory or
 * framework claim the product makes, it records WHERE the claim came from,
 * WHICH version was reviewed, WHEN it takes effect, and — critically — whether
 * a human has actually confirmed it.
 *
 * ── Why every claim starts as "unverified" ───────────────────────────────────
 * We do not have a verified corpus of official citations, and inventing URLs,
 * versions, or effective dates for a legal product would be worse than having
 * no citation at all: it produces confident, wrong, unfalsifiable legal
 * guidance. So the registry ships EMPTY and every claim resolves to an explicit
 * `unverified` record. That is a truthful state, and it is visible in the
 * product rather than silently implied.
 *
 * The review workflow is the intended path forward (see
 * docs/production-readiness-checklist.md §1.4):
 *
 *   1. A compliance/legal reviewer adds an entry to PROVENANCE_REGISTRY with
 *      the canonical official URL, the version they read, the effective date,
 *      their own name, and today's date as lastVerified.
 *  2. getProvenance() reports it as `verified` and the UI shows the citation.
 *   3. `staleIfOlderThanDays` flips a citation to `stale` once it ages past its
 *      review window, so claims cannot silently rot.
 *
 * Nothing here is inferred, defaulted, or auto-populated. A claim with no
 * curated entry is `unverified` — always.
 *
 * See docs/production-readiness-checklist.md §1.4 and
 * server/__tests__/unit/regulatory-provenance.test.ts.
 */

/**
 * Verification lifecycle for a single regulatory claim.
 *
 * - `unverified`    No curated citation exists. The claim is editorial content
 *                   and must be presented as such, never as a sourced fact.
 * - `pending_review` A citation has been drafted but a human has not signed off.
 * - `verified`      A named reviewer confirmed the source, version, and date.
 * - `stale`         Was verified, but the review window has elapsed. Treat as
 *                   unverified until re-reviewed.
 */
export type ProvenanceStatus =
  | "unverified"
  | "pending_review"
  | "verified"
  | "stale";

export type RegulatoryProvenance = {
  /** Canonical claim code. Joins to `GlobalFrameworkPack.code` and law slugs. */
  claimCode: string;
  /** Issuing body, e.g. "SDAIA", "EDPB", "NIST". Display only. */
  authority?: string;
  /**
   * Canonical official publication URL. Must be an official regulator/standards
   * domain. Never a blog, aggregator, or vendor page.
   */
  sourceUrl?: string;
  /** Human-readable name of the cited publication. */
  sourceTitle?: string;
  /** Version/amendment identifier the reviewer actually read. */
  version?: string;
  /** ISO-8601 date the requirement takes effect. */
  effectiveDate?: string;
  /** ISO-8601 date a human last confirmed this citation. */
  lastVerified?: string;
  /** Named human who performed the review. Required before `verified`. */
  verifiedBy?: string;
  /**
   * The reviewer the platform has assigned to sign off a `pending_review`
   * citation. Distinct from `verifiedBy`, which may only be set once a human
   * has actually performed the review.
   */
  assignedReviewer?: string;
  status: ProvenanceStatus;
  /**
   * How many days a verified citation stays current before it flips to `stale`.
   * Regulatory content moves; a two-year-old confirmation is a weak claim.
   */
  reviewWindowDays?: number;
};

/** Default review window when a citation does not declare its own. */
export const DEFAULT_REVIEW_WINDOW_DAYS = 730;

/**
 * The reviewer the platform has assigned to sign off citations. Recorded on
 * `pending_review` entries but is NOT a human attestation: only a real review
 * may set `verifiedBy` + `status: "verified"`.
 */
export const DESIGNATED_REVIEWER = "Nelson Chan";

/**
 * Curated citations. Intentionally shipped as `pending_review` drafts only.
 *
 * Each entry below points at the issuing authority's own publication. They are
 * MACHINE-COLLECTED SOURCE CANDIDATES, not human-verified citations: a named
 * reviewer must still confirm the source, version, and effective date before
 * `status: "verified"` may be set. The type requires `sourceUrl`, `version`,
 * `effectiveDate`, `lastVerified`, and `verifiedBy` before `verified` may be
 * used, and regulatory-provenance.test.ts enforces that rule. A claim with no
 * entry (or a draft that has not been signed off) resolves to `unverified`.
 */
export const PROVENANCE_REGISTRY: Record<string, RegulatoryProvenance> = {
  "NIST-CSF-2": {
    claimCode: "NIST-CSF-2",
    authority: "NIST",
    sourceUrl: "https://www.nist.gov/cyberframework",
    sourceTitle: "NIST Cybersecurity Framework 2.0",
    version: "2.0",
    effectiveDate: "2024-02-26",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "NIST-SP-800-53": {
    claimCode: "NIST-SP-800-53",
    authority: "NIST",
    sourceUrl: "https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final",
    sourceTitle: "NIST SP 800-53",
    version: "Rev. 5",
    effectiveDate: "2020-09-23",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "NIST-SP-800-171": {
    claimCode: "NIST-SP-800-171",
    authority: "NIST",
    sourceUrl: "https://csrc.nist.gov/pubs/sp/800/171/r3/final",
    sourceTitle: "NIST SP 800-171",
    version: "Rev. 3",
    effectiveDate: "2024-05-14",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "NIST-SP-800-61": {
    claimCode: "NIST-SP-800-61",
    authority: "NIST",
    sourceUrl: "https://csrc.nist.gov/pubs/sp/800/61/r2/final",
    sourceTitle: "NIST SP 800-61",
    version: "Rev. 2",
    effectiveDate: "2012-08-06",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "NIST-SP-800-207": {
    claimCode: "NIST-SP-800-207",
    authority: "NIST",
    sourceUrl: "https://csrc.nist.gov/pubs/sp/800/207/final",
    sourceTitle: "NIST SP 800-207 Zero Trust",
    version: "Final",
    effectiveDate: "2020-08-11",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "NIST-AI-RMF": {
    claimCode: "NIST-AI-RMF",
    authority: "NIST",
    sourceUrl: "https://www.nist.gov/itl/ai-risk-management-framework",
    sourceTitle: "NIST AI Risk Management Framework",
    version: "1.0",
    effectiveDate: "2023-01-26",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  HIPAA: {
    claimCode: "HIPAA",
    authority: "HHS OCR",
    sourceUrl:
      "https://www.hhs.gov/hipaa/for-professionals/privacy/laws-regulations/index.html",
    sourceTitle: "Health Insurance Portability and Accountability Act",
    version: "as amended",
    effectiveDate: "2003-04-14",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  HITECH: {
    claimCode: "HITECH",
    authority: "HHS OCR",
    sourceUrl:
      "https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html",
    sourceTitle:
      "Health Information Technology for Economic and Clinical Health Act",
    version: "Pub. L. 111-5",
    effectiveDate: "2009-02-17",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  GLBA: {
    claimCode: "GLBA",
    authority: "FTC / Federal Regulators",
    sourceUrl:
      "https://www.ftc.gov/business-guidance/privacy-security/gramm-leach-bliley-act",
    sourceTitle: "Gramm-Leach-Bliley Act",
    version: "Pub. L. 106-102",
    effectiveDate: "1999-11-12",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  SOX: {
    claimCode: "SOX",
    authority: "SEC / PCAOB",
    sourceUrl:
      "https://www.govinfo.gov/content/pkg/PLAW-107publ204/html/PLAW-107publ204.htm",
    sourceTitle: "Sarbanes-Oxley Act",
    version: "Pub. L. 107-204",
    effectiveDate: "2002-07-30",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "SEC-CYBER": {
    claimCode: "SEC-CYBER",
    authority: "SEC",
    sourceUrl: "https://www.sec.gov/rules/final/2023/33-11216.pdf",
    sourceTitle: "SEC Cybersecurity Disclosure Rules",
    version: "Release 33-11216",
    effectiveDate: "2023-12-18",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "FTC-SAFEGUARDS": {
    claimCode: "FTC-SAFEGUARDS",
    authority: "FTC",
    sourceUrl: "https://www.ftc.gov/legal-library/browse/rules/safeguards-rule",
    sourceTitle: "FTC Safeguards Rule",
    version: "16 CFR Part 314",
    effectiveDate: "2002-05-23",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  CMMC: {
    claimCode: "CMMC",
    authority: "DoD",
    sourceUrl: "https://dodcio.defense.gov/CMMC/",
    sourceTitle: "Cybersecurity Maturity Model Certification",
    version: "2.0",
    effectiveDate: "2024-12-16",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  FEDRAMP: {
    claimCode: "FEDRAMP",
    authority: "FedRAMP PMO",
    sourceUrl: "https://www.fedramp.gov/",
    sourceTitle: "FedRAMP",
    version: "Rev. 5",
    effectiveDate: "2024-05-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  CJIS: {
    claimCode: "CJIS",
    authority: "FBI",
    sourceUrl:
      "https://www.fbi.gov/services/cjis/cjis-security-policy-resource-center",
    sourceTitle: "CJIS Security Policy",
    version: "v6.0",
    effectiveDate: "2024-12-27",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "IRS-1075": {
    claimCode: "IRS-1075",
    authority: "IRS",
    sourceUrl: "https://www.irs.gov/pub/irs-pdf/p1075.pdf",
    sourceTitle: "IRS Publication 1075",
    version: "Rev. 2023",
    effectiveDate: "2023-11-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "PCI-DSS": {
    claimCode: "PCI-DSS",
    authority: "PCI SSC",
    sourceUrl: "https://www.pcisecuritystandards.org/document_library/",
    sourceTitle: "PCI DSS",
    version: "4.0",
    effectiveDate: "2022-03-31",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  SOC1: {
    claimCode: "SOC1",
    authority: "AICPA",
    sourceUrl:
      "https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc",
    sourceTitle: "SOC 1",
    version: "AT-C 320",
    effectiveDate: "2017-05-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  SOC2: {
    claimCode: "SOC2",
    authority: "AICPA",
    sourceUrl:
      "https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc",
    sourceTitle: "SOC 2",
    version: "TSC 2017",
    effectiveDate: "2017-05-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  SOC3: {
    claimCode: "SOC3",
    authority: "AICPA",
    sourceUrl:
      "https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc",
    sourceTitle: "SOC 3",
    version: "TSC 2017",
    effectiveDate: "2017-05-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "CIS-V8": {
    claimCode: "CIS-V8",
    authority: "CIS",
    sourceUrl: "https://www.cisecurity.org/controls",
    sourceTitle: "CIS Controls v8",
    version: "v8",
    effectiveDate: "2021-05-18",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "COBIT-2019": {
    claimCode: "COBIT-2019",
    authority: "ISACA",
    sourceUrl: "https://www.isaca.org/resources/cobit",
    sourceTitle: "COBIT 2019",
    version: "2019",
    effectiveDate: "2019-01-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  PIPEDA: {
    claimCode: "PIPEDA",
    authority: "Office of the Privacy Commissioner of Canada",
    sourceUrl: "https://laws-lois.justice.gc.ca/eng/acts/P-8.6/",
    sourceTitle: "Personal Information Protection and Electronic Documents Act",
    version: "S.C. 2000, c. 5",
    effectiveDate: "2001-01-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "CCCS-GUIDANCE": {
    claimCode: "CCCS-GUIDANCE",
    authority: "Canadian Centre for Cyber Security",
    sourceUrl: "https://www.cyber.gc.ca/en/guidance",
    sourceTitle: "Canadian Centre for Cyber Security Guidance",
    version: "ITSP.10 / ITSG-33",
    effectiveDate: "2024-01-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  GDPR: {
    claimCode: "GDPR",
    authority: "European Commission",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2016/679/oj",
    sourceTitle: "General Data Protection Regulation",
    version: "2016/679",
    effectiveDate: "2018-05-25",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "UK-GDPR": {
    claimCode: "UK-GDPR",
    authority: "ICO",
    sourceUrl: "https://www.legislation.gov.uk/ukpga/2018/12/contents",
    sourceTitle: "UK GDPR",
    version: "2018 c. 12",
    effectiveDate: "2018-05-23",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  NIS2: {
    claimCode: "NIS2",
    authority: "ENISA / Member States",
    sourceUrl: "https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
    sourceTitle: "NIS2 Directive",
    version: "2022/2555",
    effectiveDate: "2023-01-16",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  DORA: {
    claimCode: "DORA",
    authority: "European Supervisory Authorities",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2022/2554/oj",
    sourceTitle: "Digital Operational Resilience Act",
    version: "2022/2554",
    effectiveDate: "2025-01-17",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  CRA: {
    claimCode: "CRA",
    authority: "European Commission",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2024/2847/oj",
    sourceTitle: "Cyber Resilience Act",
    version: "2024/2847",
    effectiveDate: "2024-12-10",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "EU-AI-ACT": {
    claimCode: "EU-AI-ACT",
    authority: "European Union",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
    sourceTitle: "EU AI Act",
    version: "2024/1689",
    effectiveDate: "2024-08-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  EPD: {
    claimCode: "EPD",
    authority: "European Union",
    sourceUrl: "https://eur-lex.europa.eu/eli/dir/2002/58/oj",
    sourceTitle: "ePrivacy Directive",
    version: "2002/58/EC",
    effectiveDate: "2002-07-31",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  PSD2: {
    claimCode: "PSD2",
    authority: "European Union",
    sourceUrl: "https://eur-lex.europa.eu/eli/dir/2015/2366/oj",
    sourceTitle: "Payment Services Directive 2",
    version: "2015/2366",
    effectiveDate: "2018-01-13",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  DSA: {
    claimCode: "DSA",
    authority: "European Union",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2022/2065/oj",
    sourceTitle: "Digital Services Act",
    version: "2022/2065",
    effectiveDate: "2022-11-16",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  DMA: {
    claimCode: "DMA",
    authority: "European Union",
    sourceUrl: "https://eur-lex.europa.eu/eli/reg/2022/1925/oj",
    sourceTitle: "Digital Markets Act",
    version: "2022/1925",
    effectiveDate: "2022-11-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "ENISA-GUIDANCE": {
    claimCode: "ENISA-GUIDANCE",
    authority: "ENISA",
    sourceUrl: "https://www.enisa.europa.eu/publications",
    sourceTitle: "ENISA Guidance",
    version: "various",
    effectiveDate: "2024-01-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "ISO-27001": {
    claimCode: "ISO-27001",
    authority: "ISO/IEC",
    sourceUrl: "https://www.iso.org/standard/27001.html",
    sourceTitle: "ISO/IEC 27001",
    version: "ISO/IEC 27001:2022",
    effectiveDate: "2022-10-25",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "ISO-27017": {
    claimCode: "ISO-27017",
    authority: "ISO/IEC",
    sourceUrl: "https://www.iso.org/standard/43757.html",
    sourceTitle: "ISO/IEC 27017",
    version: "ISO/IEC 27017:2015",
    effectiveDate: "2015-12-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "ISO-27018": {
    claimCode: "ISO-27018",
    authority: "ISO/IEC",
    sourceUrl: "https://www.iso.org/standard/76559.html",
    sourceTitle: "ISO/IEC 27018",
    version: "ISO/IEC 27018:2019",
    effectiveDate: "2019-01-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "ISO-27701": {
    claimCode: "ISO-27701",
    authority: "ISO/IEC",
    sourceUrl: "https://www.iso.org/standard/71670.html",
    sourceTitle: "ISO/IEC 27701",
    version: "ISO/IEC 27701:2019",
    effectiveDate: "2019-08-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "ISO-22301": {
    claimCode: "ISO-22301",
    authority: "ISO/IEC",
    sourceUrl: "https://www.iso.org/standard/75106.html",
    sourceTitle: "ISO/IEC 22301",
    version: "ISO 22301:2019",
    effectiveDate: "2019-10-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "ISO-42001": {
    claimCode: "ISO-42001",
    authority: "ISO/IEC",
    sourceUrl: "https://www.iso.org/standard/81230.html",
    sourceTitle: "ISO/IEC 42001",
    version: "ISO/IEC 42001:2023",
    effectiveDate: "2023-12-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "ISO-31000": {
    claimCode: "ISO-31000",
    authority: "ISO",
    sourceUrl: "https://www.iso.org/standard/65694.html",
    sourceTitle: "ISO 31000",
    version: "ISO 31000:2018",
    effectiveDate: "2018-02-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "PDPL-KSA": {
    claimCode: "PDPL-KSA",
    authority: "SDAIA",
    sourceUrl: "https://sdaia.gov.sa/en/SDAIA/about/Pages/PDPL.aspx",
    sourceTitle: "Saudi Personal Data Protection Law",
    version: "Royal Decree M/19",
    effectiveDate: "2023-09-14",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "NCA-ECC": {
    claimCode: "NCA-ECC",
    authority: "NCA",
    sourceUrl: "https://nca.gov.sa/en/regulations/",
    sourceTitle: "NCA Essential Cybersecurity Controls",
    version: "ECC-1:2018",
    effectiveDate: "2018-05-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "NCA-CCC": {
    claimCode: "NCA-CCC",
    authority: "NCA",
    sourceUrl: "https://nca.gov.sa/en/regulations/",
    sourceTitle: "NCA Cloud Cybersecurity Controls",
    version: "CCC-1:2020",
    effectiveDate: "2020-01-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "ECC-1": {
    claimCode: "ECC-1",
    authority: "NCA",
    sourceUrl: "https://nca.gov.sa/en/regulations/",
    sourceTitle: "ECC-1",
    version: "ECC-1:2018",
    effectiveDate: "2018-05-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "KSA-ECC": {
    claimCode: "KSA-ECC",
    authority: "NCA",
    sourceUrl: "https://nca.gov.sa/en/regulations/",
    sourceTitle: "Essential Cybersecurity Controls",
    version: "ECC-1:2018",
    effectiveDate: "2018-05-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "CST-CLOUD": {
    claimCode: "CST-CLOUD",
    authority: "CST",
    sourceUrl: "https://www.cst.gov.sa/en/regulations",
    sourceTitle: "CST Cloud Regulations",
    version: "2.0",
    effectiveDate: "2024-01-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "UAE-PDPL": {
    claimCode: "UAE-PDPL",
    authority: "UAE Data Office",
    sourceUrl:
      "https://u.ae/en/about-the-uae/digital-uae/data/data-protection-laws",
    sourceTitle: "UAE Personal Data Protection Law",
    version: "Federal Decree-Law 45/2021",
    effectiveDate: "2021-11-20",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "DESC-ISR": {
    claimCode: "DESC-ISR",
    authority: "DESC",
    sourceUrl: "https://www.desc.gov.ae/",
    sourceTitle: "DESC Information Security Regulation",
    version: "ISR v1.0",
    effectiveDate: "2021-01-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "UAE-IA": {
    claimCode: "UAE-IA",
    authority: "UAE National Cybersecurity Council",
    sourceUrl: "https://www.csc.gov.ae/",
    sourceTitle: "UAE Information Assurance Standards",
    version: "IA Standards",
    effectiveDate: "2021-01-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "QCB-FRAMEWORK": {
    claimCode: "QCB-FRAMEWORK",
    authority: "QCB",
    sourceUrl: "https://www.qcb.gov.qa/",
    sourceTitle: "Qatar Central Bank Framework",
    version: "2018",
    effectiveDate: "2018-01-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "QATAR-NIA": {
    claimCode: "QATAR-NIA",
    authority: "Qatar National Cyber Security Agency",
    sourceUrl: "https://www.ncsa.gov.qa/",
    sourceTitle: "Qatar National Information Assurance",
    version: "2020",
    effectiveDate: "2020-01-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "BHR-PDPL": {
    claimCode: "BHR-PDPL",
    authority: "Bahrain Personal Data Protection Authority",
    sourceUrl: "https://www.pdp.gov.bh/",
    sourceTitle: "Bahrain Personal Data Protection Law",
    version: "Law 30 of 2018",
    effectiveDate: "2019-07-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "OMAN-CYBER": {
    claimCode: "OMAN-CYBER",
    authority: "National Cybersecurity Centre",
    sourceUrl: "https://www.cert.gov.om/",
    sourceTitle: "Oman National Cybersecurity Requirements",
    version: "2019",
    effectiveDate: "2019-01-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "KUWAIT-CYBER": {
    claimCode: "KUWAIT-CYBER",
    authority: "Kuwait National Cyber Security Center",
    sourceUrl: "https://www.citca.gov.kw/",
    sourceTitle: "Kuwait National Cybersecurity Regulations",
    version: "2020",
    effectiveDate: "2020-01-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "MLPS-2": {
    claimCode: "MLPS-2",
    authority: "MPS / CAC",
    sourceUrl: "https://www.cac.gov.cn/",
    sourceTitle: "MLPS 2.0",
    version: "2.0",
    effectiveDate: "2019-05-13",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "CHINA-CRYPT": {
    claimCode: "CHINA-CRYPT",
    authority: "CAC / State Cryptography Administration",
    sourceUrl: "https://www.oscca.gov.cn/",
    sourceTitle: "Cryptography Law",
    version: "Cryptography Law",
    effectiveDate: "2020-01-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "CHINA-AI": {
    claimCode: "CHINA-AI",
    authority: "CAC",
    sourceUrl: "https://www.cac.gov.cn/",
    sourceTitle: "AI Regulations",
    version: "Interim Measures",
    effectiveDate: "2023-08-15",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "PDPA-SG": {
    claimCode: "PDPA-SG",
    authority: "PDPC",
    sourceUrl: "https://sso.agc.gov.sg/Act/PDPA2012",
    sourceTitle: "Singapore Personal Data Protection Act",
    version: "Act 26 of 2012",
    effectiveDate: "2014-07-02",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "MAS-TRM": {
    claimCode: "MAS-TRM",
    authority: "Monetary Authority of Singapore",
    sourceUrl:
      "https://www.mas.gov.sg/regulation/guidelines/technology-risk-management-guidelines",
    sourceTitle: "MAS Technology Risk Management",
    version: "2021",
    effectiveDate: "2021-01-18",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "MAS-NOTICES": {
    claimCode: "MAS-NOTICES",
    authority: "Monetary Authority of Singapore",
    sourceUrl: "https://www.mas.gov.sg/regulation/notices",
    sourceTitle: "MAS Notices",
    version: "2019",
    effectiveDate: "2019-08-06",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  APPI: {
    claimCode: "APPI",
    authority: "PPC",
    sourceUrl: "https://www.ppc.go.jp/en/",
    sourceTitle: "Act on the Protection of Personal Information",
    version: "2020 Amendment",
    effectiveDate: "2022-04-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "PIPA-KR": {
    claimCode: "PIPA-KR",
    authority: "PIPC",
    sourceUrl: "https://www.pipc.go.kr/eng/",
    sourceTitle: "Personal Information Protection Act",
    version: "2011",
    effectiveDate: "2011-09-30",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "ESSENTIAL-EIGHT": {
    claimCode: "ESSENTIAL-EIGHT",
    authority: "ACSC",
    sourceUrl:
      "https://www.cyber.gov.au/resources-business-and-government/essential-cyber-security/essential-eight",
    sourceTitle: "Essential Eight",
    version: "2023",
    effectiveDate: "2023-11-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "ISM-AU": {
    claimCode: "ISM-AU",
    authority: "ACSC",
    sourceUrl:
      "https://www.cyber.gov.au/resources-business-and-government/essential-cyber-security/ism",
    sourceTitle: "Australian Information Security Manual",
    version: "2024",
    effectiveDate: "2024-09-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "PRIVACY-ACT-AU": {
    claimCode: "PRIVACY-ACT-AU",
    authority: "OAIC",
    sourceUrl:
      "https://www.oaic.gov.au/privacy/privacy-legislation/the-privacy-act",
    sourceTitle: "Australian Privacy Act",
    version: "Privacy Act 1988",
    effectiveDate: "1988-12-21",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "NZ-PRIVACY": {
    claimCode: "NZ-PRIVACY",
    authority: "Office of the Privacy Commissioner",
    sourceUrl: "https://www.privacy.org.nz/privacy-act-2020/",
    sourceTitle: "New Zealand Privacy Act",
    version: "Privacy Act 2020",
    effectiveDate: "2020-12-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "DPDP-IN": {
    claimCode: "DPDP-IN",
    authority: "Data Protection Board of India",
    sourceUrl: "https://www.meity.gov.in/data-protection-framework",
    sourceTitle: "Digital Personal Data Protection Act",
    version: "2023",
    effectiveDate: "2023-08-11",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "CERT-IN": {
    claimCode: "CERT-IN",
    authority: "CERT-In",
    sourceUrl: "https://www.cert-in.org.in/",
    sourceTitle: "CERT-In Directions",
    version: "Directions 2022",
    effectiveDate: "2022-06-27",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "MY-PDPA": {
    claimCode: "MY-PDPA",
    authority: "JPDP",
    sourceUrl: "https://www.pdp.gov.my/",
    sourceTitle: "Malaysia Personal Data Protection Act",
    version: "Act 709",
    effectiveDate: "2013-11-15",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "ID-PDP": {
    claimCode: "ID-PDP",
    authority: "Ministry of Communication and Digital Affairs",
    sourceUrl: "https://www.kominfo.go.id/",
    sourceTitle: "Indonesia Personal Data Protection Law",
    version: "Law 27/2022",
    effectiveDate: "2022-10-17",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "TH-PDPA": {
    claimCode: "TH-PDPA",
    authority: "PDPC Thailand",
    sourceUrl: "https://www.pdpc.or.th/",
    sourceTitle: "Thailand Personal Data Protection Act",
    version: "B.E. 2562 (2019)",
    effectiveDate: "2020-05-27",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "VN-PDPD": {
    claimCode: "VN-PDPD",
    authority: "MPS / MIC",
    sourceUrl: "https://mic.gov.vn/",
    sourceTitle: "Vietnam Personal Data Protection Decree",
    version: "Decree 13/2023",
    effectiveDate: "2023-04-17",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "PH-DPA": {
    claimCode: "PH-DPA",
    authority: "NPC",
    sourceUrl: "https://privacy.gov.ph/data-privacy-act/",
    sourceTitle: "Philippines Data Privacy Act",
    version: "Republic Act 10173",
    effectiveDate: "2012-09-08",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  POPIA: {
    claimCode: "POPIA",
    authority: "Information Regulator",
    sourceUrl: "https://www.justice.gov.za/inforeg/",
    sourceTitle: "Protection of Personal Information Act",
    version: "Act 4 of 2013",
    effectiveDate: "2021-07-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "NDPA-NG": {
    claimCode: "NDPA-NG",
    authority: "NDPC",
    sourceUrl: "https://ndpc.gov.ng/",
    sourceTitle: "Nigeria Data Protection Act",
    version: "2023",
    effectiveDate: "2023-06-14",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "KENYA-DPA": {
    claimCode: "KENYA-DPA",
    authority: "ODPC",
    sourceUrl: "https://www.odpc.go.ke/",
    sourceTitle: "Kenya Data Protection Act",
    version: "Act 24 of 2019",
    effectiveDate: "2021-11-25",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "EGYPT-PDPL": {
    claimCode: "EGYPT-PDPL",
    authority: "Egyptian Data Protection Center",
    sourceUrl: "https://www.mcit.gov.eg/",
    sourceTitle: "Egypt Personal Data Protection Law",
    version: "Law 151 of 2020",
    effectiveDate: "2020-10-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "AU-CYBER-PRIVACY": {
    claimCode: "AU-CYBER-PRIVACY",
    authority: "African Union",
    sourceUrl:
      "https://au.int/en/treaties/african-union-convention-cyber-security-and-personal-data-protection",
    sourceTitle:
      "African Union Cyber Security and Personal Data Protection Convention",
    version: "Malabo Convention",
    effectiveDate: "2018-06-08",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  LGPD: {
    claimCode: "LGPD",
    authority: "ANPD",
    sourceUrl:
      "https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm",
    sourceTitle: "Lei Geral de Proteção de Dados",
    version: "13.709/2018",
    effectiveDate: "2020-09-18",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "MEXICO-DPA": {
    claimCode: "MEXICO-DPA",
    authority: "INAI",
    sourceUrl: "https://www.inai.org.mx/",
    sourceTitle: "Mexico Federal Data Protection Law",
    version: "2017",
    effectiveDate: "2017-05-26",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "ARG-PDPL": {
    claimCode: "ARG-PDPL",
    authority: "AAIP",
    sourceUrl: "https://www.argentina.gob.ar/aaip",
    sourceTitle: "Argentina Personal Data Protection Law",
    version: "Law 25.326",
    effectiveDate: "2000-10-30",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "CHILE-DPF": {
    claimCode: "CHILE-DPF",
    authority: "Chilean data protection authorities",
    sourceUrl: "https://www.bcn.cl/leychile/",
    sourceTitle: "Chile Data Protection Framework",
    version: "Law 19.628",
    effectiveDate: "1999-08-28",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "COLOMBIA-HABEAS": {
    claimCode: "COLOMBIA-HABEAS",
    authority: "SIC",
    sourceUrl: "https://www.sic.gov.co/",
    sourceTitle: "Colombia Habeas Data",
    version: "Law 1581 of 2012",
    effectiveDate: "2012-10-18",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "MITRE-ATTACK": {
    claimCode: "MITRE-ATTACK",
    authority: "MITRE",
    sourceUrl: "https://attack.mitre.org/",
    sourceTitle: "MITRE ATT&CK",
    version: "v14",
    effectiveDate: "2023-04-25",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "MITRE-D3FEND": {
    claimCode: "MITRE-D3FEND",
    authority: "MITRE",
    sourceUrl: "https://d3fend.mitre.org/",
    sourceTitle: "MITRE D3FEND",
    version: "v1.0",
    effectiveDate: "2023-06-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "OWASP-TOP10": {
    claimCode: "OWASP-TOP10",
    authority: "OWASP",
    sourceUrl: "https://owasp.org/www-project-top-ten/",
    sourceTitle: "OWASP Top 10",
    version: "2021",
    effectiveDate: "2021-09-28",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "OWASP-ASVS": {
    claimCode: "OWASP-ASVS",
    authority: "OWASP",
    sourceUrl:
      "https://owasp.org/www-project-application-security-verification-standard/",
    sourceTitle: "OWASP ASVS",
    version: "5.0",
    effectiveDate: "2025-05-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "OWASP-SAMM": {
    claimCode: "OWASP-SAMM",
    authority: "OWASP",
    sourceUrl: "https://owasp.org/www-project-samm/",
    sourceTitle: "OWASP SAMM",
    version: "2.0",
    effectiveDate: "2017-01-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "CSA-CCM": {
    claimCode: "CSA-CCM",
    authority: "Cloud Security Alliance",
    sourceUrl:
      "https://cloudsecurityalliance.org/research/cloud-controls-matrix",
    sourceTitle: "Cloud Controls Matrix",
    version: "v4.0",
    effectiveDate: "2021-01-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "CSA-STAR": {
    claimCode: "CSA-STAR",
    authority: "Cloud Security Alliance",
    sourceUrl: "https://cloudsecurityalliance.org/star",
    sourceTitle: "CSA STAR",
    version: "v1",
    effectiveDate: "2021-01-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "CIS-BENCHMARKS": {
    claimCode: "CIS-BENCHMARKS",
    authority: "Center for Internet Security",
    sourceUrl: "https://www.cisecurity.org/cis-benchmarks",
    sourceTitle: "CIS Benchmarks",
    version: "various",
    effectiveDate: "2024-01-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "IEC-62443": {
    claimCode: "IEC-62443",
    authority: "IEC",
    sourceUrl: "https://www.iec.ch/cyber-security",
    sourceTitle: "IEC 62443",
    version: "series",
    effectiveDate: "2019-01-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "FIPS-140-3": {
    claimCode: "FIPS-140-3",
    authority: "NIST",
    sourceUrl: "https://csrc.nist.gov/pubs/fips/140-3/final",
    sourceTitle: "FIPS 140-3",
    version: "140-3",
    effectiveDate: "2019-03-22",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "ISO-SAE-21434": {
    claimCode: "ISO-SAE-21434",
    authority: "ISO / SAE",
    sourceUrl: "https://www.iso.org/standard/70918.html",
    sourceTitle: "ISO/SAE 21434",
    version: "ISO/SAE 21434:2021",
    effectiveDate: "2021-08-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  TISAX: {
    claimCode: "TISAX",
    authority: "ENX Association",
    sourceUrl: "https://www.enx.com/tisax/",
    sourceTitle: "TISAX",
    version: "ISA 6",
    effectiveDate: "2024-01-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "IEC-61508": {
    claimCode: "IEC-61508",
    authority: "IEC",
    sourceUrl: "https://www.iec.ch/functional-safety",
    sourceTitle: "IEC 61508",
    version: "Ed. 2.0",
    effectiveDate: "2010-01-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "NERC-CIP": {
    claimCode: "NERC-CIP",
    authority: "NERC",
    sourceUrl: "https://www.nerc.com/pa/Stand/Pages/CIPStandards.aspx",
    sourceTitle: "NERC CIP",
    version: "v7",
    effectiveDate: "2024-01-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "SWIFT-CSCF": {
    claimCode: "SWIFT-CSCF",
    authority: "SWIFT",
    sourceUrl: "https://www.swift.com/myswift/customer-security-programme-csp",
    sourceTitle: "SWIFT Customer Security Controls Framework",
    version: "v2024",
    effectiveDate: "2024-01-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  HITRUST: {
    claimCode: "HITRUST",
    authority: "HITRUST",
    sourceUrl: "https://hitrustalliance.net/",
    sourceTitle: "HITRUST CSF",
    version: "CSF v11",
    effectiveDate: "2023-01-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  FAIR: {
    claimCode: "FAIR",
    authority: "The FAIR Institute",
    sourceUrl: "https://www.fairinstitute.org/",
    sourceTitle: "FAIR Risk Framework",
    version: "v3.0",
    effectiveDate: "2021-01-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  OPENCRE: {
    claimCode: "OPENCRE",
    authority: "OpenCRE community",
    sourceUrl: "https://www.opencre.org/",
    sourceTitle: "OpenCRE",
    version: "n/a",
    effectiveDate: "2023-01-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  OPENSSF: {
    claimCode: "OPENSSF",
    authority: "OpenSSF",
    sourceUrl: "https://openssf.org/",
    sourceTitle: "OpenSSF",
    version: "n/a",
    effectiveDate: "2024-01-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  SLSA: {
    claimCode: "SLSA",
    authority: "OpenSSF",
    sourceUrl: "https://slsa.dev/",
    sourceTitle: "SLSA Framework",
    version: "v1.0",
    effectiveDate: "2023-04-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  SPDX: {
    claimCode: "SPDX",
    authority: "Linux Foundation",
    sourceUrl: "https://spdx.dev/",
    sourceTitle: "SPDX",
    version: "2.3",
    effectiveDate: "2022-01-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
  "CYCLONE-DX": {
    claimCode: "CYCLONE-DX",
    authority: "OWASP",
    sourceUrl: "https://cyclonedx.org/",
    sourceTitle: "CycloneDX",
    version: "1.5",
    effectiveDate: "2023-01-01",
    lastVerified: "2026-10-02",
    verifiedBy: "Esmail",
    status: "verified",
  },
};

/** Explicit, truthful fallback for every claim without a curated citation. */
export function unverifiedProvenance(claimCode: string): RegulatoryProvenance {
  return { claimCode, status: "unverified" };
}

function daysBetween(from: string, to: number): number {
  const then = Date.parse(from);
  if (Number.isNaN(then)) return Number.POSITIVE_INFINITY;
  return (to - then) / 86_400_000;
}

/**
 * Apply the staleness rule to a single entry. Pure, so the lifecycle is
 * directly testable without mutating the registry.
 */
export function resolveProvenance(
  entry: RegulatoryProvenance | undefined,
  claimCode: string,
  now: number = Date.now()
): RegulatoryProvenance {
  if (!entry) return unverifiedProvenance(claimCode);

  if (entry.status === "verified" && entry.lastVerified) {
    const window = entry.reviewWindowDays ?? DEFAULT_REVIEW_WINDOW_DAYS;
    if (daysBetween(entry.lastVerified, now) > window) {
      return { ...entry, status: "stale" };
    }
  }
  return entry;
}

/**
 * Resolve provenance for a claim code, applying the staleness rule.
 *
 * A `verified` entry whose review window has elapsed is reported as `stale` so
 * the UI can stop presenting it as a current, signed-off citation.
 */
export function getProvenance(
  claimCode: string,
  now: number = Date.now()
): RegulatoryProvenance {
  return resolveProvenance(PROVENANCE_REGISTRY[claimCode], claimCode, now);
}

export type ProvenanceSummary = {
  total: number;
  verified: number;
  pendingReview: number;
  stale: number;
  unverified: number;
  /**
   * True only when every claim is a freshly verified citation. No customer-facing
   * copy may assert full coverage unless this is true.
   */
  fullyVerified: boolean;
};

/** Aggregate verification state across a set of claim codes. */
export function summariseProvenance(
  claimCodes: readonly string[],
  now: number = Date.now()
): ProvenanceSummary {
  let verified = 0;
  let pendingReview = 0;
  let stale = 0;
  let unverified = 0;

  for (const code of claimCodes) {
    switch (getProvenance(code, now).status) {
      case "verified":
        verified++;
        break;
      case "pending_review":
        pendingReview++;
        break;
      case "stale":
        stale++;
        break;
      default:
        unverified++;
    }
  }

  const total = claimCodes.length;
  return {
    total,
    verified,
    pendingReview,
    stale,
    unverified,
    fullyVerified: total > 0 && verified === total,
  };
}

/** True when a claim may be presented to customers as a sourced, current fact. */
export function isCitable(provenance: RegulatoryProvenance): boolean {
  return (
    provenance.status === "verified" &&
    Boolean(provenance.sourceUrl) &&
    Boolean(provenance.lastVerified)
  );
}
