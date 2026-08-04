import { describe, it, expect } from "vitest";
import {
  JURISDICTION_SCORE_KEYS,
  runDualJurisdictionAssessment,
} from "../../supplier-assessment";
import type { Vendor } from "../../../drizzle/schema";

function makeVendor(overrides: Partial<Vendor>): Vendor {
  return {
    id: 1,
    vendorName: "Foo Corp",
    businessRegistrationNumber: "BR-001",
    industry: "technology",
    serviceType: "professional-services",
    serviceScope: "Managed cloud data processing and SaaS delivery.",
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

describe("runDualJurisdictionAssessment — integration edge cases", () => {
  it("should NOT score a country-only vendor on unrelated jurisdictions", () => {
    const result = runDualJurisdictionAssessment(
      makeVendor({
        operatingCountries: "china",
        dataLocations: "shanghai",
        certifications: "iso-27001, soc-2-type-ii",
      })
    );
    expect(result.jurisdictionScores.uk).toBe(100);
    expect(result.jurisdictionScores.canada).toBe(100);
    expect(result.jurisdictionScores.southAfrica).toBe(100);
    expect(result.gaps.every(g => g.jurisdiction !== "uk")).toBe(true);
  });

  it("should detect all relevant jurisdictions when vendor operates in multiple countries", () => {
    const result = runDualJurisdictionAssessment(
      makeVendor({
        operatingCountries: "china, united-kingdom, singapore",
        dataLocations: "shanghai, london, singapore",
        certifications: "iso-27001, soc-2-type-ii",
      })
    );
    expect(result.jurisdictionScores.uk).toBe(100);
    expect(result.jurisdictionScores.singapore).toBe(100);
    expect(
      result.gaps.filter(g => ["uk", "singapore"].includes(g.jurisdiction))
        .length
    ).toBe(0);
  });

  it("should flag gaps for declared countries without data locations", () => {
    const result = runDualJurisdictionAssessment(
      makeVendor({
        operatingCountries: "united-kingdom, canada",
        dataLocations: "london",
        certifications: "iso-27001, soc-2-type-ii",
      })
    );
    expect(result.jurisdictionScores.uk).toBe(100);
    expect(result.jurisdictionScores.canada).toBe(75);
    expect(result.gaps.some(g => g.code === "LOC-CANADA-001")).toBe(true);
    expect(result.gaps.some(g => g.code === "LOC-UK-001")).toBe(false);
  });

  it("should include all 29 jurisdiction score keys in every result", () => {
    const result = runDualJurisdictionAssessment(makeVendor({}));
    const keys = Object.keys(result.jurisdictionScores);
    expect(keys).toHaveLength(29);
    for (const key of JURISDICTION_SCORE_KEYS) {
      expect(result.jurisdictionScores[key]).toBeGreaterThanOrEqual(0);
      expect(result.jurisdictionScores[key]).toBeLessThanOrEqual(100);
    }
  });

  it("should produce clean gap codes with correct jurisdiction labels", () => {
    const result = runDualJurisdictionAssessment(
      makeVendor({
        operatingCountries: "japan, south-africa",
        dataLocations: "singapore",
        certifications: "privacy-impact-assessment-program",
      })
    );
    const jpGap = result.gaps.find(g => g.code === "LOC-JAPAN-001");
    const zaGap = result.gaps.find(g => g.code === "LOC-SAFRICA-001");
    expect(jpGap?.jurisdiction).toBe("japan");
    expect(zaGap?.jurisdiction).toBe("southAfrica");
    expect(
      result.gaps.filter(g => g.severity === "high").length
    ).toBeGreaterThanOrEqual(2);
  });

  it("should not produce empty penalty context for any gap", () => {
    const result = runDualJurisdictionAssessment(
      makeVendor({
        operatingCountries: "eu, japan, thailand",
        dataLocations: "",
      })
    );
    for (const gap of result.gaps) {
      expect(gap.penaltyContext.length).toBeGreaterThan(0);
    }
  });

  it("should handle vendors with empty/null operating countries", () => {
    const result = runDualJurisdictionAssessment(
      makeVendor({
        operatingCountries: null as unknown as string,
        dataLocations: "",
      })
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.jurisdictionScores.uk).toBeGreaterThanOrEqual(0);
  });
});
