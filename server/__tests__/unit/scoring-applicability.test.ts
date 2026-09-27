import { describe, it, expect } from "vitest";
import { runDualJurisdictionAssessment } from "../../supplier-assessment";
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

describe("assessment applicability (no credit without assessment)", () => {
  it("never reports 'compliant' when no jurisdiction signals are provided", () => {
    const result = runDualJurisdictionAssessment(makeVendor({}));
    expect(result.status).not.toBe("compliant");
  });

  it("keeps the overall score within 0–100", () => {
    for (const vendor of [
      makeVendor({}),
      makeVendor({ operatingCountries: "china", dataLocations: "beijing" }),
      makeVendor({
        operatingCountries: "united-kingdom",
        dataLocations: "london",
      }),
    ]) {
      const result = runDualJurisdictionAssessment(vendor);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    }
  });
});
