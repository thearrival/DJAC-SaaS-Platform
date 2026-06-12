import { describe, it, expect, beforeAll } from "vitest";

describe("Compliance Reference Data", () => {
  let complianceFrameworks: Array<Record<string, unknown>>;
  let complianceControls: Array<Record<string, unknown>>;
  let complianceRelationships: Array<Record<string, unknown>>;

  beforeAll(async () => {
    const mod = await import("../../../scripts/compliance-reference-data.mjs");
    complianceFrameworks = mod.complianceFrameworks;
    complianceControls = mod.complianceControls;
    complianceRelationships = mod.complianceRelationships;
  });

  it("should export at least 10 compliance frameworks", () => {
    expect(complianceFrameworks.length).toBeGreaterThanOrEqual(10);
  });

  it("should include both China and Saudi Arabia frameworks", () => {
    const countries = new Set(complianceFrameworks.map((f) => f.country));
    expect(countries.has("China")).toBe(true);
    expect(countries.has("Saudi Arabia")).toBe(true);
  });

  it("should include PIPL, CSL, DSL, PDPL frameworks", () => {
    const codes = complianceFrameworks.map((f) => f.code);
    expect(codes).toContain("PIPL");
    expect(codes).toContain("CSL");
    expect(codes).toContain("DSL");
    expect(codes).toContain("PDPL");
  });

  it("each framework should have required fields", () => {
    for (const fw of complianceFrameworks) {
      expect(fw.code).toBeTruthy();
      expect(fw.name).toBeTruthy();
      expect(fw.country).toBeTruthy();
      expect(typeof fw.code).toBe("string");
      expect(typeof fw.name).toBe("string");
    }
  });

  it("should export at least 30 compliance controls", () => {
    expect(complianceControls.length).toBeGreaterThanOrEqual(30);
  });

  it("controls should reference valid framework codes", () => {
    const frameworkCodes = new Set(complianceFrameworks.map((f) => f.code));
    for (const ctrl of complianceControls) {
      expect(frameworkCodes.has(ctrl.frameworkCode as string)).toBe(true);
    }
  });

  it("each control should have required fields", () => {
    for (const ctrl of complianceControls) {
      expect(ctrl.frameworkCode).toBeTruthy();
      expect(ctrl.controlCode).toBeTruthy();
      expect(ctrl.controlName).toBeTruthy();
    }
  });

  it("should export at least 10 compliance relationships", () => {
    expect(complianceRelationships.length).toBeGreaterThanOrEqual(10);
  });

  it("relationships should reference valid framework codes", () => {
    const frameworkCodes = new Set(complianceFrameworks.map((f) => f.code));
    for (const rel of complianceRelationships) {
      expect(frameworkCodes.has(rel.sourceFrameworkCode as string)).toBe(true);
      expect(frameworkCodes.has(rel.targetFrameworkCode as string)).toBe(true);
    }
  });

  it("each relationship should have required fields", () => {
    for (const rel of complianceRelationships) {
      expect(rel.sourceFrameworkCode).toBeTruthy();
      expect(rel.targetFrameworkCode).toBeTruthy();
      expect(rel.relationshipType).toBeTruthy();
    }
  });
});
