/**
 * Jurisdiction consistency guard.
 *
 * Canonical source: shared/jurisdictions.ts — also mirrored by the
 * drizzle/schema.ts `jurisdiction` pgEnum. Every client jurisdiction picker
 * must offer only values from the canonical list so a selection can never be
 * rejected by the DB enum, and the schema enum must never drift from the
 * shared constants.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { GLOBAL_JURISDICTIONS, DSR_JURISDICTIONS } from "@shared/jurisdictions";

const CANON = new Set<string>(GLOBAL_JURISDICTIONS);

function read(rel: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), rel), "utf8");
}

function quotedValues(block: string): string[] {
  return [...block.matchAll(/"([^"]+)"/g)].map(m => m[1]);
}

describe("jurisdiction consistency", () => {
  it("DSR list is a subset of GLOBAL_JURISDICTIONS", () => {
    for (const j of DSR_JURISDICTIONS) {
      expect(CANON.has(j), `DSR value "${j}" not canonical`).toBe(true);
    }
  });

  it("drizzle jurisdictionEnum matches GLOBAL_JURISDICTIONS exactly", () => {
    const src = read("drizzle/schema.ts");
    const m = src.match(/pgEnum\("jurisdiction", \[([\s\S]*?)\]\)/);
    expect(m, "jurisdictionEnum not found in drizzle/schema.ts").toBeTruthy();
    const enumValues = quotedValues(m![1]);
    expect(new Set(enumValues)).toEqual(new Set(GLOBAL_JURISDICTIONS));
  });

  it("OrgSettings jurisdiction picker offers exactly the canonical list", () => {
    const src = read("client/src/pages/OrgSettings.tsx");
    const m = src.match(
      /const JURISDICTION_OPTIONS = \[([\s\S]*?)\] as const;/
    );
    expect(m, "JURISDICTION_OPTIONS not found").toBeTruthy();
    const values = [...m![1].matchAll(/value:\s*"([^"]+)"/g)].map(x => x[1]);
    expect(new Set(values)).toEqual(new Set(GLOBAL_JURISDICTIONS));
  });

  it("DataSubjectRequests derives its list from the shared module", () => {
    const src = read("client/src/pages/DataSubjectRequests.tsx");
    expect(src).toContain('from "@shared/jurisdictions"');
    expect(src).toContain("DSR_JURISDICTIONS");
  });

  it("Signup jurisdiction chips use canonical values covering all real jurisdictions", () => {
    const src = read("client/src/pages/Signup.tsx");
    const m = src.match(
      /const JURISDICTIONS: \{ value: string; label: string \}\[\] = \[([\s\S]*?)\];/
    );
    expect(m, "JURISDICTIONS list not found in Signup.tsx").toBeTruthy();
    const values = [...m![1].matchAll(/value:\s*"([^"]+)"/g)].map(x => x[1]);
    for (const v of values) {
      expect(CANON.has(v), `Signup value "${v}" not canonical`).toBe(true);
    }
    const real = GLOBAL_JURISDICTIONS.filter(
      j => j !== "Global" && j !== "Both" && j !== "Other"
    );
    const missing = real.filter(j => !values.includes(j));
    expect(
      missing,
      `Signup missing jurisdictions: ${missing.join(", ")}`
    ).toEqual([]);
  });

  it("TransferChecker includes Brazil (LGPD) in its transfer matrix", () => {
    const src = read("client/src/pages/TransferChecker.tsx");
    expect(src).toContain('value: "br"');
    expect(src).toContain("LGPD");
  });
});
