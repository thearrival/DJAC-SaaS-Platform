/**
 * provenance-audit.ts — CI/scheduled check for regulatory citation currency.
 *
 * Exits 1 when any citation is pending review, stale, or unverified, so a
 * scheduled workflow can raise a review issue. Never modifies data.
 *
 *   pnpm provenance:audit
 *   pnpm provenance:audit -- --json
 */

import {
  PROVENANCE_REGISTRY,
  getProvenance,
  summariseProvenance,
} from "../shared/regulatory-provenance";

const codes = Object.keys(PROVENANCE_REGISTRY);
const summary = summariseProvenance(codes);
const now = Date.now();

const needsAction = codes
  .map(code => {
    const p = getProvenance(code, now);
    return {
      code,
      status: p.status,
      sourceTitle: p.sourceTitle ?? null,
      sourceUrl: p.sourceUrl ?? null,
      lastVerified: p.lastVerified ?? null,
      assignedReviewer: p.assignedReviewer ?? null,
    };
  })
  .filter(entry => entry.status !== "verified");

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ summary, needsAction }, null, 2));
} else {
  console.log(
    `Regulatory provenance: ${summary.verified}/${summary.total} verified ` +
      `(pending ${summary.pendingReview}, stale ${summary.stale}, unverified ${summary.unverified})`
  );
  for (const entry of needsAction) {
    console.log(
      `- ${entry.code} [${entry.status}] ${entry.sourceTitle ?? ""} ` +
        `lastVerified=${entry.lastVerified ?? "—"} reviewer=${entry.assignedReviewer ?? "—"}`
    );
  }
  if (needsAction.length === 0) {
    console.log("All citations are within their review window.");
  }
}

process.exit(needsAction.length > 0 ? 1 : 0);
