import { describe, it, expect } from "vitest";
import {
  listComplianceObligations,
  getObligationsByCountry,
  getObligationsByFramework,
  getComparisonTable,
} from "../../compliance-timetable";

describe("Compliance Timetable", () => {
  it("should return non-empty list of obligations", () => {
    const obligations = listComplianceObligations();
    expect(obligations.length).toBeGreaterThan(5);
  });

  it("should return valid data structure", () => {
    const obligations = listComplianceObligations();
    expect(obligations.length).toBeGreaterThan(5);
    expect(Array.isArray(obligations)).toBe(true);
  });

  it("should filter obligations by country", () => {
    const saudi = getObligationsByCountry("Saudi Arabia");
    const china = getObligationsByCountry("China");
    expect(saudi.length).toBeGreaterThan(0);
    expect(china.length).toBeGreaterThan(0);
    for (const o of saudi) expect(o.country).toBe("Saudi Arabia");
    for (const o of china) expect(o.country).toBe("China");
  });

  it("should filter obligations by framework", () => {
    const pdpl = getObligationsByFramework("PDPL");
    const pipl = getObligationsByFramework("PIPL");
    expect(pdpl.length).toBeGreaterThan(0);
    expect(pipl.length).toBeGreaterThan(0);
  });

  it("should return comparison table data", () => {
    const table = getComparisonTable();
    expect(table.length).toBeGreaterThan(0);
    for (const row of table) {
      expect(row.topic).toBeTruthy();
    }
  });
});
