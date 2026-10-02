#!/usr/bin/env -S tsx
/**
 * Regulatory provenance sign-off.
 *
 * Flips `pending_review` citations to `verified`, recording WHO reviewed them
 * and WHEN. This is the human step: run it only after a named person has
 * actually reviewed the official source, version, and effective date of each
 * citation. The script refuses to run without an explicit `--reviewer` and
 * `--confirm`, and it never invents data — an entry missing sourceUrl/version/
 * effectiveDate is an error, not something to fill in.
 *
 * Usage:
 *   pnpm provenance:signoff -- --reviewer "Nelson Chan" --confirm
 *
 * After it runs: review `git diff`, run `pnpm test`, then commit.
 */

import fs from "node:fs";
import path from "node:path";
import { PROVENANCE_REGISTRY } from "../shared/regulatory-provenance";

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};

const reviewer = flag("--reviewer");
const confirm = args.includes("--confirm");
const date = flag("--date") ?? new Date().toISOString().slice(0, 10);

if (!reviewer || !confirm) {
  console.error(
    'Usage: pnpm provenance:signoff -- --reviewer "Full Name" --confirm\n' +
      "This records YOUR human review. Run it only if you personally reviewed the citations."
  );
  process.exit(1);
}

const entries = Object.values(PROVENANCE_REGISTRY);
const incomplete = entries.filter(
  e => !e.sourceUrl || !e.version || !e.effectiveDate
);
if (incomplete.length > 0) {
  console.error(
    `Refusing: ${incomplete.length} citation(s) lack sourceUrl/version/effectiveDate:\n` +
      incomplete.map(e => `  - ${e.claimCode}`).join("\n")
  );
  process.exit(1);
}

const file = path.resolve("shared/regulatory-provenance.ts");
const before = fs.readFileSync(file, "utf8");
const after = before.replace(
  / {4}status: "pending_review",\n {4}assignedReviewer: DESIGNATED_REVIEWER,/g,
  `    lastVerified: ${JSON.stringify(date)},\n    verifiedBy: ${JSON.stringify(reviewer)},\n    status: "verified",`
);

if (after === before) {
  console.error("No pending_review entries found — nothing to sign off.");
  process.exit(1);
}

fs.writeFileSync(file, after);
console.log(
  `Marked ${entries.length} citations as verified by ${reviewer} on ${date}.\n` +
    "Next: review `git diff`, run `pnpm test` (expect the provenance suite green), then commit."
);
