/**
 * Unit tests for founders console report CSV export.
 * Pure-function coverage (no database required).
 */
import { describe, it, expect } from "vitest";
import {
  reportToCsv,
  type ReportResult,
} from "../../_core/admin-insights-store";

function sampleReport(overrides: Partial<ReportResult> = {}): ReportResult {
  return {
    type: "growth",
    title: "Growth Report",
    generatedAt: "2026-09-24T00:00:00.000Z",
    windowDays: 30,
    kpis: [
      { label: "New users", value: 42 },
      { label: "Churn", value: "0" },
    ],
    series: [],
    table: {
      columns: ["Date", "Signups"],
      rows: [["2026-09-01", 3]],
    },
    notes: ["All good"],
    ...overrides,
  };
}

describe("reportToCsv", () => {
  it("includes title, window, and KPI header", () => {
    const csv = reportToCsv(sampleReport());
    expect(csv).toContain("# Growth Report");
    expect(csv).toContain("# Window days,30");
    expect(csv).toContain("KPI,Value");
    expect(csv).toContain("New users,42");
  });

  it("emits table columns and data rows", () => {
    const csv = reportToCsv(sampleReport());
    expect(csv).toContain("Date,Signups");
    expect(csv).toContain("2026-09-01,3");
  });

  it("escapes commas and quotes in values", () => {
    const csv = reportToCsv(
      sampleReport({
        kpis: [{ label: "Metric, with comma", value: 'has "quotes"' }],
        notes: [],
      })
    );
    expect(csv).toContain('"Metric, with comma"');
    expect(csv).toContain('"has ""quotes"""');
  });

  it("appends notes section when notes exist", () => {
    const csv = reportToCsv(sampleReport());
    expect(csv).toContain("Notes");
    expect(csv).toContain("All good");
  });

  it("omits notes header when notes are empty", () => {
    const csv = reportToCsv(sampleReport({ notes: [] }));
    expect(csv).not.toContain("\r\nNotes\r\n");
  });

  it("uses CRLF line endings", () => {
    const csv = reportToCsv(sampleReport());
    expect(csv).toContain("\r\n");
    const lines = csv.split("\r\n");
    expect(lines.length).toBeGreaterThan(3);
  });
});
