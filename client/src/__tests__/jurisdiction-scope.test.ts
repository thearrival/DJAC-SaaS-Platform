import { describe, it, expect } from "vitest";
import {
  jurisdictionOptionsFor,
  filterByJurisdiction,
  filterMatrixByCodes,
  ALL_JURISDICTIONS,
} from "@/lib/jurisdictionScope";

const fws = [
  { code: "PIPL", country: "China" },
  { code: "PDPL", country: "Saudi Arabia" },
  { code: "GDPR", country: "European Union" },
  { code: "NCA", country: "Saudi Arabia" },
  { code: "GLOBAL", country: null },
];

describe("jurisdictionScope", () => {
  it("lists distinct countries, sorted, ignoring null", () => {
    expect(jurisdictionOptionsFor(fws)).toEqual([
      "China",
      "European Union",
      "Saudi Arabia",
    ]);
  });

  it("returns all frameworks when the filter is 'all'", () => {
    expect(filterByJurisdiction(fws, ALL_JURISDICTIONS)).toHaveLength(5);
  });

  it("returns only the selected jurisdiction's frameworks", () => {
    const out = filterByJurisdiction(fws, "Saudi Arabia");
    expect(out.map(f => f.code)).toEqual(["PDPL", "NCA"]);
  });

  it("scopes matrix rows to the given framework codes", () => {
    const rows = [
      { source: "PIPL", target: "GDPR" },
      { source: "PDPL", target: "NCA" },
      { source: "GDPR", target: "LGPD" },
    ];
    const scoped = filterMatrixByCodes(rows, new Set(["PIPL", "GDPR"]));
    expect(scoped).toEqual([
      { source: "PIPL", target: "GDPR" },
      { source: "GDPR", target: "LGPD" },
    ]);
  });
});
