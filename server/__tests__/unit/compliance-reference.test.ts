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

  it("should export at least 40 compliance frameworks", () => {
    expect(complianceFrameworks.length).toBeGreaterThanOrEqual(40);
  });

  it("should include frameworks for all major jurisdictions", () => {
    const countries = new Set(complianceFrameworks.map(f => f.country));
    expect(countries.has("China")).toBe(true);
    expect(countries.has("Saudi Arabia")).toBe(true);
    expect(countries.has("EU")).toBe(true);
    expect(countries.has("US")).toBe(true);
    expect(countries.has("Brazil")).toBe(true);
    expect(countries.has("Global")).toBe(true);
    expect(countries.has("United Kingdom")).toBe(true);
    expect(countries.has("Canada")).toBe(true);
    expect(countries.has("Australia")).toBe(true);
    expect(countries.has("Japan")).toBe(true);
    expect(countries.has("South Korea")).toBe(true);
    expect(countries.has("Singapore")).toBe(true);
    expect(countries.has("India")).toBe(true);
    expect(countries.has("South Africa")).toBe(true);
  });

  it("should include PIPL, CSL, DSL, PDPL, GDPR, CCPA, LGPD frameworks", () => {
    const codes = complianceFrameworks.map(f => f.code);
    expect(codes).toContain("PIPL");
    expect(codes).toContain("CSL");
    expect(codes).toContain("DSL");
    expect(codes).toContain("PDPL");
    expect(codes).toContain("GDPR");
    expect(codes).toContain("CCPA");
    expect(codes).toContain("LGPD");
  });

  it("should include global and international frameworks", () => {
    const codes = complianceFrameworks.map(f => f.code);
    expect(codes).toContain("ISO-27001");
    expect(codes).toContain("ISO-27701");
    expect(codes).toContain("SOC2");
    expect(codes).toContain("NIST-CSF-2");
    expect(codes).toContain("HIPAA");
    expect(codes).toContain("PCI-DSS");
    expect(codes).toContain("NIS2");
    expect(codes).toContain("DORA");
    expect(codes).toContain("EU-AI-ACT");
    expect(codes).toContain("UK-GDPR");
    expect(codes).toContain("PIPEDA");
    expect(codes).toContain("PRIVACY-ACT-AU");
    expect(codes).toContain("APPI");
    expect(codes).toContain("PIPA-KR");
    expect(codes).toContain("PDPA-SG");
    expect(codes).toContain("DPDP-IN");
    expect(codes).toContain("POPIA");
    expect(codes).toContain("MEXICO-DPA");
  });

  it("each framework should have required fields", () => {
    const codes = new Set<string>();
    for (const fw of complianceFrameworks) {
      expect(fw.code).toBeTruthy();
      expect(fw.name).toBeTruthy();
      expect(fw.country).toBeTruthy();
      expect(typeof fw.code).toBe("string");
      expect(typeof fw.name).toBe("string");
      expect((fw.country as string).length).toBeLessThanOrEqual(50);
      expect(codes.has(fw.code as string)).toBe(false);
      codes.add(fw.code as string);
    }
  });

  it("should export at least 30 compliance controls", () => {
    expect(complianceControls.length).toBeGreaterThanOrEqual(30);
  });

  it("controls should reference valid framework codes", () => {
    const frameworkCodes = new Set(complianceFrameworks.map(f => f.code));
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
    const frameworkCodes = new Set(complianceFrameworks.map(f => f.code));
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
