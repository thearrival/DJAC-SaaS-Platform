/**
 * Coverage claims must match the actual corpus.
 *
 * The published numbers (30 jurisdictions, 107 framework packs, 46 control-level
 * frameworks) were previously hardcoded in ~27 places across the app and 9
 * locales. They drifted: the site claimed 28 jurisdictions while the data held
 * 30, and one locale claimed 40+. This test recomputes the numbers from the
 * data and fails if the pinned values or the customer-facing copy disagree, so
 * the corpus and the copy can never diverge silently again.
 */

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  GLOBAL_FRAMEWORK_PACKS,
  listGlobalJurisdictions,
  listGlobalSupranationalScopes,
  isJurisdictionScope,
} from "../../global-compliance-registry";
import { complianceFrameworks } from "../../../scripts/compliance-reference-data.mjs";
import { COVERAGE, interpolateCoverage } from "../../../shared/coverage-claims";

const ROOT = path.resolve(import.meta.dirname, "../../..");

describe("coverage numbers match the corpus", () => {
  it("jurisdictions counts countries, not supranational groupings", () => {
    expect(listGlobalJurisdictions()).toHaveLength(COVERAGE.jurisdictions);
  });

  it("excludes supranational scopes from the jurisdiction count", () => {
    for (const scope of listGlobalJurisdictions()) {
      expect(isJurisdictionScope(scope)).toBe(true);
    }
    for (const scope of listGlobalSupranationalScopes()) {
      expect(isJurisdictionScope(scope)).toBe(false);
    }
    // Every pack scope is accounted for exactly once.
    const all = [
      ...listGlobalJurisdictions(),
      ...listGlobalSupranationalScopes(),
    ].length;
    expect(all).toBe(
      new Set(GLOBAL_FRAMEWORK_PACKS.map(p => p.jurisdiction)).size
    );
  });

  it("framework pack count is current", () => {
    expect(GLOBAL_FRAMEWORK_PACKS).toHaveLength(COVERAGE.frameworkPacks);
  });

  it("control-level framework count is current", () => {
    expect(complianceFrameworks).toHaveLength(COVERAGE.controlFrameworks);
  });

  it("supranational scope count is current", () => {
    expect(listGlobalSupranationalScopes()).toHaveLength(
      COVERAGE.supranationalScopes
    );
  });
});

describe("published copy uses the real numbers", () => {
  // Customer-facing sources that state coverage. Localized copy is included:
  // the drift that motivated this test was worst across locales.
  const COPY_SOURCES = [
    "client/src/contexts/LocaleContext.tsx",
    "client/src/pages/DJACHero.tsx",
    "client/src/pages/DocsPortal.tsx",
    "client/src/pages/Signup.tsx",
    "client/src/pages/InteractiveDemo.tsx",
    "client/src/pages/GapTracker.tsx",
    "client/src/pages/VendorRiskDashboard.tsx",
    "client/src/components/ProductTour.tsx",
    "client/src/components/DeHengFooter.tsx",
    "server/personalization.ts",
    "scripts/generate-og-image.mjs",
  ];

  // A jurisdiction count is the number directly preceding a jurisdiction word
  // in any supported language, optionally with a "+"/"+" suffix.
  const JURISDICTION_WORDS = [
    "jurisdiction",
    "jurisdicciones",
    "jurisdictions",
    "juridiction",
    "jurisdictions",
    "jurisdições",
    "Rechtsordnungen",
    "Rechtsordnunge",
    "法域",
    "司法",
    "管辖",
    "관할",
    "ولاية",
    "اختصاص",
  ];

  const files = COPY_SOURCES.map(rel => path.join(ROOT, rel)).filter(
    fs.existsSync
  );

  it("has copy sources to check", () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it("states no jurisdiction count other than the real one", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");
      const lower = content.toLowerCase();
      for (const word of JURISDICTION_WORDS) {
        let idx = lower.indexOf(word);
        while (idx !== -1) {
          // Look back a short window for the number that modifies this word.
          const window = lower.slice(Math.max(0, idx - 40), idx);
          const match = window.match(/(\d{1,3})\+?\s*$/);
          if (match && Number(match[1]) !== COVERAGE.jurisdictions) {
            const line = content.slice(0, idx).split("\n").length;
            offenders.push(
              `${path.relative(ROOT, file)}:${line} claims ${match[1]} ${word}`
            );
          }
          idx = lower.indexOf(word, idx + 1);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("has no framework-packs count other than the real one", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");
      const re = /(\d{1,3})\+?\s+(?:curated\s+)?framework packs/gi;
      let m = re.exec(content);
      while (m) {
        const value = Number(m[1].replace("+", ""));
        const ok = m[1].includes("+")
          ? value <= COVERAGE.frameworkPacks
          : value === COVERAGE.frameworkPacks;
        if (!ok) {
          const line = content.slice(0, m.index).split("\n").length;
          offenders.push(
            `${path.relative(ROOT, file)}:${line} claims ${m[1]} framework packs`
          );
        }
        m = re.exec(content);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("coverage interpolation", () => {
  it("substitutes known tokens", () => {
    expect(interpolateCoverage("{{jurisdictions}} jurisdictions")).toBe(
      "30 jurisdictions"
    );
    expect(
      interpolateCoverage(
        "{{frameworkPacks}} packs in {{jurisdictions}} countries"
      )
    ).toBe("107 packs in 30 countries");
  });

  it("leaves unknown tokens untouched", () => {
    expect(interpolateCoverage("{{nope}}")).toBe("{{nope}}");
  });
});
