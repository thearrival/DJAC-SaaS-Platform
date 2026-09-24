/**
 * Yalla Hack Founders Console — Reporting Engine
 * Growth / engagement / revenue / security / operations reports with
 * charts, data tables, window selector, and CSV download.
 */
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  RefreshCw,
  ChevronLeft,
  Download,
  FileText,
  AlertTriangle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "@/lib/recharts-compat";

const ADMIN_API = "/api/admin-dashboard";

type ReportType =
  | "growth"
  | "engagement"
  | "revenue"
  | "security"
  | "operations";

interface ReportResult {
  type: ReportType;
  title: string;
  generatedAt: string;
  windowDays: number;
  kpis: Array<{ label: string; value: string | number; hint?: string }>;
  series: Array<{ name: string; points: Array<{ x: string; y: number }> }>;
  table: {
    columns: string[];
    rows: Array<Array<string | number>>;
  };
  notes: string[];
}

const REPORT_TYPES: Array<{ id: ReportType; label: string }> = [
  { id: "growth", label: "Growth" },
  { id: "engagement", label: "Engagement" },
  { id: "revenue", label: "Revenue" },
  { id: "security", label: "Security" },
  { id: "operations", label: "Operations" },
];

const SERIES_COLORS = [
  "#d900ff",
  "#00d2ff",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
];

const cardStyle: React.CSSProperties = {
  padding: 20,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(15,15,25,0.8)",
};

export default function AdminReports() {
  usePageTitle("Reports — Yalla Hack Admin");
  const [, navigate] = useLocation();
  const [type, setType] = useState<ReportType>("growth");
  const [days, setDays] = useState(30);
  const [report, setReport] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  const loadReport = useCallback(
    async (reportType: ReportType, windowDays: number) => {
      setLoading(true);
      try {
        const res = await fetch(
          `${ADMIN_API}/reports/${reportType}?days=${windowDays}`,
          { credentials: "include" }
        );
        if (res.status === 401) {
          navigate("/yalla-hack-owners-console/login");
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setReport(await res.json());
        setError("");
      } catch (e) {
        setError(`Could not load report: ${(e as Error).message}`);
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    loadReport(type, days);
  }, [type, days, loadReport]);

  async function downloadCsv() {
    setDownloading(true);
    try {
      const res = await fetch(
        `${ADMIN_API}/reports/${type}?days=${days}&format=csv`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(`CSV download failed: ${(e as Error).message}`);
    } finally {
      setDownloading(false);
    }
  }

  const primarySeries = report?.series[0];
  const secondarySeries = report?.series[1];
  const isPieish =
    type === "revenue" ||
    (primarySeries != null &&
      primarySeries.points.length <= 8 &&
      type !== "growth");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050508",
        fontFamily: "'Inter', sans-serif",
        color: "#e2e8f0",
      }}
    >
      <header
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => navigate("/yalla-hack-owners-console/dashboard")}
            style={{
              background: "none",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <h1 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            Reporting Center
          </h1>
          {report && (
            <span style={{ fontSize: 11, color: "#64748b" }}>
              {report.title} · generated{" "}
              {new Date(report.generatedAt).toLocaleString()}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#e2e8f0",
              fontSize: 13,
            }}
          >
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
            <option value={365}>365 days</option>
          </select>
          <button
            onClick={downloadCsv}
            disabled={downloading}
            title="Download CSV"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(217,0,255,0.12)",
              border: "1px solid rgba(217,0,255,0.35)",
              borderRadius: 6,
              padding: "6px 12px",
              color: "#f0abfc",
              cursor: downloading ? "wait" : "pointer",
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            <Download size={14} />
            {downloading ? "…" : "CSV"}
          </button>
          <button
            onClick={() => loadReport(type, days)}
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              padding: "6px 10px",
              color: "#94a3b8",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </header>

      <main style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
        {/* Report type tabs */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          {REPORT_TYPES.map(r => {
            const active = r.id === type;
            return (
              <button
                key={r.id}
                onClick={() => setType(r.id)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: active
                    ? "1px solid rgba(217,0,255,0.45)"
                    : "1px solid rgba(255,255,255,0.1)",
                  background: active ? "rgba(217,0,255,0.12)" : "transparent",
                  color: active ? "#f0abfc" : "#94a3b8",
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  cursor: "pointer",
                }}
              >
                <FileText
                  size={13}
                  style={{
                    display: "inline",
                    marginRight: 6,
                    verticalAlign: -2,
                  }}
                />
                {r.label}
              </button>
            );
          })}
        </div>

        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderRadius: 8,
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#ef4444",
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {loading && !report ? (
          <div style={{ color: "#64748b", fontSize: 13 }}>Building report…</div>
        ) : report ? (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
                gap: 12,
                marginBottom: 20,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {report.kpis.map(k => (
                <div key={k.label} style={cardStyle}>
                  <div style={{ fontSize: 11.5, color: "#94a3b8" }}>
                    {k.label}
                  </div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: "#f0abfc",
                      marginTop: 4,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {k.value}
                  </div>
                  {k.hint && (
                    <div style={{ fontSize: 10.5, color: "#64748b" }}>
                      {k.hint}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
                gap: 16,
                marginBottom: 20,
              }}
            >
              {primarySeries && (
                <div style={cardStyle}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 12,
                    }}
                  >
                    {primarySeries.name}
                  </div>
                  <div style={{ height: 240 }}>
                    <ResponsiveContainer width="100%" height={240}>
                      {isPieish ? (
                        <PieChart>
                          <Pie
                            data={primarySeries.points.map(p => ({
                              name: p.x,
                              value: p.y,
                            }))}
                            dataKey="value"
                            nameKey="name"
                            outerRadius={90}
                            label={(entry: { name?: string | number }) =>
                              `${entry?.name ?? ""}`
                            }
                          >
                            {primarySeries.points.map((_, i) => (
                              <Cell
                                key={i}
                                fill={SERIES_COLORS[i % SERIES_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: "#0b0b12",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: 8,
                              fontSize: 12,
                            }}
                          />
                        </PieChart>
                      ) : (
                        <AreaChart data={primarySeries.points}>
                          <XAxis
                            dataKey="x"
                            stroke="#475569"
                            fontSize={10}
                            tickLine={false}
                          />
                          <YAxis
                            stroke="#475569"
                            fontSize={10}
                            allowDecimals={false}
                            width={36}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "#0b0b12",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: 8,
                              fontSize: 12,
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="y"
                            stroke="#d900ff"
                            fill="rgba(217,0,255,0.15)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {secondarySeries && (
                <div style={cardStyle}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 12,
                    }}
                  >
                    {secondarySeries.name}
                  </div>
                  <div style={{ height: 240 }}>
                    <ResponsiveContainer width="100%" height={240}>
                      <AreaChart data={secondarySeries.points}>
                        <XAxis
                          dataKey="x"
                          stroke="#475569"
                          fontSize={10}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="#475569"
                          fontSize={10}
                          allowDecimals={false}
                          width={36}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#0b0b12",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="y"
                          stroke="#00d2ff"
                          fill="rgba(0,210,255,0.15)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                {report.title} — detail
              </div>
              {report.table.rows.length === 0 ? (
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  No rows for this window.
                </div>
              ) : (
                <div
                  style={{
                    overflowX: "auto",
                    maxHeight: 420,
                    overflowY: "auto",
                  }}
                >
                  <table style={{ width: "100%", fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ color: "#64748b", textAlign: "left" }}>
                        {report.table.columns.map(c => (
                          <th
                            key={c}
                            style={{
                              padding: "8px 12px 8px 0",
                              fontWeight: 500,
                              position: "sticky",
                              top: 0,
                              background: "#0f0f19",
                            }}
                          >
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {report.table.rows.map((row, i) => (
                        <tr
                          key={i}
                          style={{
                            borderTop: "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          {row.map((cell, j) => (
                            <td
                              key={j}
                              style={{
                                padding: "8px 12px 8px 0",
                                color: j === 0 ? "#cbd5e1" : "#94a3b8",
                              }}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {report.notes.length > 0 && (
                <div
                  style={{
                    marginTop: 14,
                    paddingTop: 12,
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    fontSize: 11.5,
                    color: "#64748b",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  {report.notes.map(n => (
                    <div key={n}>• {n}</div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
