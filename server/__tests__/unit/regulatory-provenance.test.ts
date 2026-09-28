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
import {
  PROVENANCE_REGISTRY,
  DEFAULT_REVIEW_WINDOW_DAYS,
  getProvenance,
  resolveProvenance,
  summariseProvenance,
  isCitable,
} from "../../../shared/regulatory-provenance";

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
  "shared/regulatory-provenance.ts",
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

describe("provenance registry integrity", () => {
  it("never claims a citation is verified without a source, date, and reviewer", () => {
    const offenders: string[] = [];
    for (const [code, entry] of Object.entries(PROVENANCE_REGISTRY)) {
      if (entry.status !== "verified") continue;
      if (!entry.sourceUrl || !entry.lastVerified || !entry.verifiedBy) {
        offenders.push(
          `${code}: verified without sourceUrl/lastVerified/verifiedBy`
        );
      }
      if (!entry.version || !entry.effectiveDate) {
        offenders.push(`${code}: verified without version/effectiveDate`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("uses https and an official-looking host for every curated source URL", () => {
    const offenders: string[] = [];
    for (const [code, entry] of Object.entries(PROVENANCE_REGISTRY)) {
      if (!entry.sourceUrl) continue;
      if (!entry.sourceUrl.startsWith("https://")) {
        offenders.push(`${code}: sourceUrl is not https`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("uses parseable ISO dates", () => {
    const offenders: string[] = [];
    for (const [code, entry] of Object.entries(PROVENANCE_REGISTRY)) {
      for (const field of ["effectiveDate", "lastVerified"] as const) {
        const value = entry[field];
        if (value && Number.isNaN(Date.parse(value))) {
          offenders.push(
            `${code}: ${field}="${value}" is not a parseable date`
          );
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("reports claims with no curated citation as explicitly unverified", () => {
    const result = getProvenance("SOME-CLAIM-WITH-NO-ENTRY");
    expect(result.status).toBe("unverified");
    expect(isCitable(result)).toBe(false);
  });

  it("never reports full coverage while citations are missing", () => {
    const summary = summariseProvenance(["A", "B"]);
    expect(summary.fullyVerified).toBe(false);
    expect(summary.unverified).toBe(2);
  });

  it("does not treat an empty claim set as fully verified", () => {
    // Guards against copy that claims total coverage by counting an empty list.
    expect(summariseProvenance([]).fullyVerified).toBe(false);
  });
});

describe("staleness", () => {
  const day = 86_400_000;
  const now = Date.parse("2026-09-29T00:00:00Z");
  const base = {
    claimCode: "X",
    sourceUrl: "https://www.nist.gov/cyberframework",
    version: "2.0",
    effectiveDate: "2024-02-26",
    verifiedBy: "Compliance Reviewer",
    status: "verified" as const,
  };

  it("keeps a freshly verified citation verified", () => {
    const entry = {
      ...base,
      lastVerified: new Date(now - 30 * day).toISOString(),
    };
    const result = resolveProvenance(entry, "X", now);
    expect(result.status).toBe("verified");
    expect(isCitable(result)).toBe(true);
  });

  it("flips a verified citation to stale once its review window elapses", () => {
    const entry = {
      ...base,
      lastVerified: new Date(
        now - (DEFAULT_REVIEW_WINDOW_DAYS + 1) * day
      ).toISOString(),
    };
    const result = resolveProvenance(entry, "X", now);
    expect(result.status).toBe("stale");
    // A stale citation must not be presented as a current, signed-off fact.
    expect(isCitable(result)).toBe(false);
  });

  it("honours a claim-specific shorter review window", () => {
    const entry = {
      ...base,
      reviewWindowDays: 30,
      lastVerified: new Date(now - 60 * day).toISOString(),
    };
    expect(resolveProvenance(entry, "X", now).status).toBe("stale");
  });

  it("does not age out a pending_review entry", () => {
    const entry = {
      ...base,
      status: "pending_review" as const,
      lastVerified: new Date(now - 5000 * day).toISOString(),
    };
    expect(resolveProvenance(entry, "X", now).status).toBe("pending_review");
  });

  it("fails closed on an unparseable lastVerified instead of trusting it", () => {
    // An unreadable review date must never be reported as a current citation:
    // for a compliance claim, uncertain provenance is treated as stale.
    const entry = { ...base, lastVerified: "not-a-date" };
    const result = resolveProvenance(entry, "X", now);
    expect(result.status).toBe("stale");
    expect(isCitable(result)).toBe(false);
  });
});
