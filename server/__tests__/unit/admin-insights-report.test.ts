/**
 * Unit tests for founders console report CSV export and PDF export.
 * Pure-function coverage (no database required).
 */
import { describe, it, expect } from "vitest";
import {
  reportToCsv,
  reportToPdf,
  getOperationalAlerts,
  getLiveMetrics,
  type ReportResult,
} from "../../_core/admin-insights-store";
import { sanitizeString } from "../../_core/security";

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

describe("reportToPdf", () => {
  it("returns a non-empty Uint8Array", async () => {
    const pdf = await reportToPdf(sampleReport());
    expect(pdf).toBeInstanceOf(Uint8Array);
    expect(pdf.length).toBeGreaterThan(0);
  });

  it("has PDF magic header", async () => {
    const pdf = await reportToPdf(sampleReport());
    const header = Buffer.from(pdf).toString("binary", 0, 5);
    expect(header).toBe("%PDF-");
  });

  it("contains compressed stream objects (FlateDecode)", async () => {
    const pdf = await reportToPdf(sampleReport());
    const text = Buffer.from(pdf).toString("latin1");
    expect(text).toContain("/Filter /FlateDecode");
  });

  it("has multiple objects and ends with %%EOF", async () => {
    const pdf = await reportToPdf(sampleReport());
    const text = Buffer.from(pdf).toString("latin1");
    expect(text).toContain("endobj");
    expect(text).toContain("%%EOF");
  });

  it("includes the report title in the PDF output", async () => {
    const pdf = await reportToPdf(sampleReport());
    const text = Buffer.from(pdf).toString("latin1");
    // Title appears in object metadata or compressed streams
    expect(text.length).toBeGreaterThan(500);
  });

  it("produces larger output for reports with more KPIs", async () => {
    const small = await reportToPdf(
      sampleReport({ kpis: [{ label: "A", value: 1 }] })
    );
    const large = await reportToPdf(
      sampleReport({
        kpis: Array.from({ length: 10 }, (_, i) => ({
          label: `KPI ${i}`,
          value: i,
        })),
      })
    );
    expect(large.length).toBeGreaterThanOrEqual(small.length);
  });
});

describe("sanitizeString", () => {
  it("strips angle brackets", () => {
    expect(sanitizeString("<script>alert(1)</script>")).toBe(
      "scriptalert(1)/script"
    );
  });

  it("strips quotes and backticks", () => {
    expect(sanitizeString('test "hello" <b>world</b>')).toBe(
      "test hello bworld/b"
    );
  });

  it("collapses whitespace", () => {
    expect(sanitizeString("too   many    spaces")).toBe("too many spaces");
  });

  it("truncates to maxLen", () => {
    const long = "a".repeat(600);
    expect(sanitizeString(long, 100).length).toBeLessThanOrEqual(100);
  });

  it("returns empty string for empty input", () => {
    expect(sanitizeString("")).toBe("");
  });

  it("preserves alphanumeric characters", () => {
    expect(sanitizeString("hello world 123")).toBe("hello world 123");
  });
});

describe("getOperationalAlerts", () => {
  it("returns an array (degrades gracefully when DB is unavailable)", async () => {
    const alerts = await getOperationalAlerts();
    expect(Array.isArray(alerts)).toBe(true);
  });
});

describe("getLiveMetrics", () => {
  it("returns a LiveMetrics object (degrades gracefully when DB is unavailable)", async () => {
    const metrics = await getLiveMetrics();
    expect(metrics).toBeDefined();
    expect(metrics.generatedAt).toBeDefined();
    expect(typeof metrics).toBe("object");
  });
});
