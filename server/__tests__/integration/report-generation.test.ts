import { describe, it, expect, beforeAll } from "vitest";

describe("Report Generation", () => {
  let generateComplianceReport: (opts: {
    jurisdiction: string;
    locale: string;
    reportType?: string;
  }) => { reportId: string; title: string; markdown: string };

  beforeAll(async () => {
    const mod = await import("../../report-generator");
    generateComplianceReport = mod.generateComplianceReport;
  });

  it("should generate a Saudi Arabia compliance report", () => {
    const report = generateComplianceReport({
      jurisdiction: "Saudi Arabia",
      locale: "en",
    });

    expect(report.reportId).toBeTruthy();
    expect(report.markdown).toBeTruthy();
    expect(report.markdown.length).toBeGreaterThan(500);
  });

  it("should generate a China compliance report", () => {
    const report = generateComplianceReport({
      jurisdiction: "China",
      locale: "en",
    });

    expect(report.reportId).toBeTruthy();
    expect(report.markdown).toBeTruthy();
    expect(report.markdown.length).toBeGreaterThan(500);
  });

  it("should generate an EU compliance report", () => {
    const report = generateComplianceReport({
      jurisdiction: "EU",
      locale: "en",
    });

    expect(report.reportId).toBeTruthy();
    expect(report.markdown).toBeTruthy();
    expect(report.markdown.length).toBeGreaterThan(500);
  });

  it("should generate a US compliance report", () => {
    const report = generateComplianceReport({
      jurisdiction: "US",
      locale: "en",
    });

    expect(report.reportId).toBeTruthy();
    expect(report.markdown).toBeTruthy();
    expect(report.markdown.length).toBeGreaterThan(500);
  });

  it("should generate a Brazil compliance report", () => {
    const report = generateComplianceReport({
      jurisdiction: "Brazil",
      locale: "en",
    });

    expect(report.reportId).toBeTruthy();
    expect(report.markdown).toBeTruthy();
    expect(report.markdown.length).toBeGreaterThan(500);
  });

  it("should generate a combined both-jurisdiction report", () => {
    const report = generateComplianceReport({
      jurisdiction: "both",
      locale: "en",
    });

    expect(report.reportId).toBeTruthy();
    expect(report.markdown).toBeTruthy();
    expect(report.markdown.length).toBeGreaterThan(800);
  });

  it("should generate Arabic locale report", () => {
    const report = generateComplianceReport({
      jurisdiction: "both",
      locale: "ar",
    });

    expect(report.reportId).toBeTruthy();
    expect(report.markdown).toBeTruthy();
  });

  it("should generate Chinese locale report", () => {
    const report = generateComplianceReport({
      jurisdiction: "both",
      locale: "zh",
    });

    expect(report.reportId).toBeTruthy();
    expect(report.markdown).toBeTruthy();
  });

  it("should generate different report types", () => {
    const types = [
      "full_compliance",
      "gap_analysis",
      "executive_summary",
      "regulatory_deadline",
    ] as const;

    for (const reportType of types) {
      const report = generateComplianceReport({
        jurisdiction: "both",
        locale: "en",
        reportType,
      });

      expect(report.reportId).toBeTruthy();
      expect(report.markdown).toBeTruthy();
      expect(report.markdown.length).toBeGreaterThan(200);
    }
  });

  it("should generate unique report IDs", () => {
    const id1 = generateComplianceReport({
      jurisdiction: "Saudi Arabia",
      locale: "en",
    }).reportId;
    const id2 = generateComplianceReport({
      jurisdiction: "China",
      locale: "en",
    }).reportId;
    const id3 = generateComplianceReport({
      jurisdiction: "EU",
      locale: "en",
    }).reportId;
    const id4 = generateComplianceReport({
      jurisdiction: "US",
      locale: "en",
    }).reportId;
    const id5 = generateComplianceReport({
      jurisdiction: "Brazil",
      locale: "en",
    }).reportId;
    const ids = new Set([id1, id2, id3, id4, id5]);
    expect(ids.size).toBe(5);
  });
});
