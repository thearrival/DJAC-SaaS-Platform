import { describe, it, expect } from "vitest";
import {
  JURISDICTION_SCORE_KEYS,
  buildAssessmentCsv,
  runDualJurisdictionAssessment,
} from "../../supplier-assessment";
import type { Vendor } from "../../../drizzle/schema";

function makeVendor(overrides: Partial<Vendor>): Vendor {
  return {
    id: 1,
    vendorName: "Test Vendor",
    businessRegistrationNumber: "BR-123",
    industry: "technology",
    serviceType: "professional-services",
    serviceScope: "Managed data processing services for regulated data.",
    hostingEnvironment: "public cloud",
    cloudProvider: "aws",
    operatingCountries: "",
    dataLocations: "",
    regulatoryJurisdictions: "",
    certifications: "",
    dataProcessingActivities: "logistics coordination",
    criticalityLevel: "medium",
    riskTier: null,
    thirdPartyDependencies: null,
    fourthPartyDependencies: null,
    headquartersLocation: "global",
    primaryContactName: "Jane Doe",
    primaryContactEmail: "jane@example.com",
    primaryContactRole: "CISO",
    primaryContactPhone: null,
    ...overrides,
  } as Vendor;
}

describe("runDualJurisdictionAssessment - global jurisdictions", () => {
  it("returns scores for all 23 new jurisdictions plus the 6 core ones", () => {
    const result = runDualJurisdictionAssessment(makeVendor({}));
    const keys = Object.keys(result.jurisdictionScores);
    expect(keys).toHaveLength(29);
    for (const key of JURISDICTION_SCORE_KEYS) {
      expect(result.jurisdictionScores[key]).toBeTypeOf("number");
    }
  });

  it("deducts the UK score and flags a gap when UK controls are required without a UK location", () => {
    const result = runDualJurisdictionAssessment(
      makeVendor({
        operatingCountries: "united-kingdom",
        dataLocations: "frankfurt",
        certifications: "iso-27001, soc-2-type-ii",
      })
    );
    expect(result.jurisdictionScores.uk).toBe(70);
    const ukGap = result.gaps.find(gap => gap.code === "LOC-UK-001");
    expect(ukGap).toBeDefined();
    expect(ukGap?.jurisdiction).toBe("uk");
    expect(ukGap?.frameworks).toContain("UK GDPR");
  });

  it("keeps the UK score at 100 when a London location is declared", () => {
    const result = runDualJurisdictionAssessment(
      makeVendor({
        operatingCountries: "united-kingdom",
        dataLocations: "london",
        certifications: "iso-27001, soc-2-type-ii",
      })
    );
    expect(result.jurisdictionScores.uk).toBe(100);
    expect(result.gaps.some(gap => gap.code === "LOC-UK-001")).toBe(false);
  });

  it("applies generic control deductions to the new jurisdiction scores", () => {
    const result = runDualJurisdictionAssessment(
      makeVendor({
        operatingCountries: "japan",
        dataLocations: "tokyo",
      })
    );
    expect(result.jurisdictionScores.japan).toBe(80);
    expect(result.gaps.some(gap => gap.code === "CERT-ISO27001-001")).toBe(
      true
    );
  });

  it("flags a Japan gap when required without a Japan location", () => {
    const result = runDualJurisdictionAssessment(
      makeVendor({
        operatingCountries: "japan",
        dataLocations: "singapore",
        certifications: "iso-27001, soc-2-type-ii",
      })
    );
    expect(result.jurisdictionScores.japan).toBe(75);
    expect(result.gaps.some(gap => gap.code === "LOC-JAPAN-001")).toBe(true);
  });

  it("keeps the core (china/saudiArabia/eu/us/brazil/global) scores unchanged for existing scenarios", () => {
    const vendor = makeVendor({
      operatingCountries: "china",
      dataLocations: "shanghai",
      certifications: "iso-27001, soc-2-type-ii",
    });
    const result = runDualJurisdictionAssessment(vendor);
    expect(result.jurisdictionScores.china).toBe(100);
    expect(result.jurisdictionScores.saudiArabia).toBe(100);
    expect(result.jurisdictionScores.eu).toBe(100);
    expect(result.jurisdictionScores.us).toBe(100);
    expect(result.jurisdictionScores.brazil).toBe(100);
    expect(result.jurisdictionScores.global).toBe(100);
    expect(result.overallScore).toBe(100);
  });

  it("flags a UAE gap for a Dubai-based vendor without declared UAE location", () => {
    const result = runDualJurisdictionAssessment(
      makeVendor({
        operatingCountries: "united-arab-emirates",
        dataLocations: "singapore",
        certifications: "iso-27001, soc-2-type-ii",
      })
    );
    expect(result.jurisdictionScores.uae).toBe(75);
    expect(result.gaps.some(gap => gap.code === "LOC-UAE-001")).toBe(true);
  });

  it("includes the new jurisdiction scores in the CSV export", () => {
    const vendor = makeVendor({});
    const result = runDualJurisdictionAssessment(vendor);
    const csv = buildAssessmentCsv(vendor, result);
    expect(csv).toContain("uk Score");
    expect(csv).toContain("kenya Score");
    expect(csv).toContain("southKorea Score");
  });
});
