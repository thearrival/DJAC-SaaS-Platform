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
 * Curated citations. Intentionally empty.
 *
 * Populated only from a named human review of the official publication. The
 * type requires `sourceUrl`, `version`, `effectiveDate`, `lastVerified`, and
 * `verifiedBy` before `status: "verified"` may be used, and
 * regulatory-provenance.test.ts enforces that rule.
 */
export const PROVENANCE_REGISTRY: Record<string, RegulatoryProvenance> = {};

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
