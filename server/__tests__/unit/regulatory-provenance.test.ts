/**
 * Regulatory provenance guard.
 *
 * A compliance product must never ship fabricated citations. This test scans
 * the runtime source for fabricated regulatory source URLs and for placeholder
 * domains inside the citation corpora.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "../../..");
const SCAN_DIRS = ["server", "scripts"];
const EXTS = new Set([".ts", ".tsx", ".mjs", ".cjs", ".js", ".json"]);

// Fabricated identifiers that must never appear anywhere in runtime source.
const FABRICATED_EVERYWHERE: Array<{ name: string; re: RegExp }> = [
  {
    name: "fabricated CAC content id",
    re: /c_1723456789|c_1726543210|c_1723456123/,
  },
  // ISO standard pages are /standard/<id>.html — a "<id>-<year>" slug is fake.
  { name: "fabricated ISO standard URL", re: /iso\.org\/standard\/\d+-20\d\d/ },
];

// The reference corpora that back customer-facing regulatory claims must not
// use placeholder domains either (example.com is only banned here, not in
// demo/test tooling where RFC-2606 placeholders are legitimate).
const CITATION_CORPORA = [
  "server/regulatory-change-store.ts",
  "server/legal-knowledge.ts",
  "server/global-compliance-registry.ts",
  "server/compliance-timetable.ts",
  "scripts/compliance-reference-data.mjs",
];

function collectFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "__tests__") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectFiles(full));
    else if (EXTS.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

describe("regulatory provenance", () => {
  it("contains no fabricated regulatory source URLs", () => {
    const offenders: string[] = [];
    for (const dir of SCAN_DIRS) {
      const root = path.join(ROOT, dir);
      if (!fs.existsSync(root)) continue;
      for (const file of collectFiles(root)) {
        const content = fs.readFileSync(file, "utf8");
        for (const { name, re } of FABRICATED_EVERYWHERE) {
          if (re.test(content)) {
            offenders.push(`${path.relative(ROOT, file)} → ${name}`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("citation corpora contain no placeholder domains", () => {
    const offenders: string[] = [];
    for (const rel of CITATION_CORPORA) {
      const file = path.join(ROOT, rel);
      if (!fs.existsSync(file)) continue;
      const content = fs.readFileSync(file, "utf8");
      if (/example\.(com|org|net)/i.test(content)) offenders.push(rel);
    }
    expect(offenders).toEqual([]);
  });
});
