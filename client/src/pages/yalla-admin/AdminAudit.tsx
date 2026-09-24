/**
 * Yalla Hack Super Admin — Audit Log Viewer
 * Platform-wide audit trail and admin action logs.
 */
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  RefreshCw,
  ChevronLeft,
  Filter,
  Download,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const ADMIN_API = "/api/yalla-admin";

interface AuditEntry {
  id: number;
  sessionId: string | null;
  adminUsername: string;
  action: string;
  target: string | null;
  ipAddress: string | null;
  payload: string | null;
  createdAt: string;
}

function csvEscape(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function AdminAudit() {
  usePageTitle("Audit Logs — Yalla Hack Admin");
  const [, navigate] = useLocation();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [debouncedFilter, setDebouncedFilter] = useState("");
  const [error, setError] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const filterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce the filter input (300ms) before hitting the API
  useEffect(() => {
    if (filterTimer.current) clearTimeout(filterTimer.current);
    filterTimer.current = setTimeout(() => {
      setDebouncedFilter(actionFilter.trim());
    }, 300);
    return () => {
      if (filterTimer.current) clearTimeout(filterTimer.current);
    };
  }, [actionFilter]);

  const loadData = useCallback(async () => {
    try {
      const params = debouncedFilter
        ? `?action=${encodeURIComponent(debouncedFilter)}`
        : "";
      const res = await fetch(`${ADMIN_API}/stats/audit${params}`, {
        credentials: "include",
      });
      if (res.status === 401) {
        navigate("/yalla-hack-owners-console/login");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
      setError("");
      setUpdatedAt(new Date().toLocaleTimeString());
    } catch (e) {
      setError(`Could not load audit logs: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [debouncedFilter, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh every 45s
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(loadData, 45_000);
    return () => clearInterval(timer);
  }, [autoRefresh, loadData]);

  function exportCsv() {
    const header = [
      "id",
      "timestamp",
      "admin",
      "action",
      "target",
      "ip",
      "session",
      "payload",
    ];
    const rows = logs.map(l =>
      [
        l.id,
        l.createdAt ? new Date(l.createdAt).toISOString() : "",
        l.adminUsername,
        l.action,
        l.target ?? "",
        l.ipAddress ?? "",
        l.sessionId ?? "",
        l.payload ?? "",
      ]
        .map(csvEscape)
        .join(",")
    );
    const csv = [header.join(","), ...rows].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const countLabel = useMemo(
    () => `showing ${Math.min(logs.length, 200)} of ${logs.length} entries`,
    [logs]
  );

  const thStyle: React.CSSProperties = {
    padding: "12px 16px",
    textAlign: "left",
    color: "#94a3b8",
    fontSize: 11,
    textTransform: "uppercase",
  };

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
            Audit Logs
          </h1>
          {updatedAt && (
            <span style={{ fontSize: 11, color: "#64748b" }}>
              updated {updatedAt}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Filter
              size={12}
              style={{
                position: "absolute",
                left: 8,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#7d8aa0",
              }}
            />
            <input
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              placeholder="Filter by action..."
              style={{
                padding: "6px 10px 6px 26px",
                borderRadius: 6,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff",
                fontSize: 12,
                outline: "none",
                width: 160,
              }}
            />
          </div>
          <button
            onClick={() => setAutoRefresh(v => !v)}
            title={autoRefresh ? "Pause auto-refresh" : "Resume auto-refresh"}
            style={{
              background: autoRefresh ? "rgba(16,185,129,0.12)" : "none",
              border: "1px solid",
              borderColor: autoRefresh
                ? "rgba(16,185,129,0.4)"
                : "rgba(255,255,255,0.1)",
              borderRadius: 6,
              padding: "6px 10px",
              color: autoRefresh ? "#10b981" : "#94a3b8",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {autoRefresh ? "Auto 45s" : "Paused"}
          </button>
          <button
            onClick={exportCsv}
            disabled={logs.length === 0}
            title="Export CSV"
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              padding: "6px 10px",
              color: logs.length === 0 ? "#475569" : "#94a3b8",
              cursor: logs.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            <Download size={14} />
          </button>
          <button
            onClick={loadData}
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

        <div
          style={{
            fontSize: 11.5,
            color: "#64748b",
            marginBottom: 10,
          }}
        >
          {countLabel}
          {debouncedFilter && (
            <span>
              {" "}
              · filtered by{" "}
              <code style={{ color: "#d900ff" }}>"{debouncedFilter}"</code>
            </span>
          )}
        </div>

        <div
          style={{
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.06)",
            overflow: "hidden",
          }}
        >
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                <th style={{ ...thStyle, width: 36 }}></th>
                <th style={thStyle}>Timestamp</th>
                <th style={thStyle}>Admin</th>
                <th style={thStyle}>Action</th>
                <th style={thStyle}>Target</th>
                <th style={thStyle}>IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: 40,
                      textAlign: "center",
                      color: "#7d8aa0",
                    }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: 40,
                      textAlign: "center",
                      color: "#7d8aa0",
                    }}
                  >
                    No audit entries found
                  </td>
                </tr>
              ) : (
                logs.slice(0, 200).flatMap(log => {
                  const isOpen = expanded === log.id;
                  const hasPayload = Boolean(log.payload);
                  const rows = [
                    <tr
                      key={log.id}
                      style={{
                        borderTop: "1px solid rgba(255,255,255,0.04)",
                        background: isOpen
                          ? "rgba(255,255,255,0.02)"
                          : "transparent",
                        cursor: hasPayload ? "pointer" : "default",
                      }}
                      onClick={() => {
                        if (hasPayload) setExpanded(isOpen ? null : log.id);
                      }}
                    >
                      <td style={{ padding: "12px 8px", textAlign: "center" }}>
                        {hasPayload ? (
                          isOpen ? (
                            <ChevronDown
                              size={14}
                              style={{ color: "#94a3b8" }}
                            />
                          ) : (
                            <ChevronRight
                              size={14}
                              style={{ color: "#64748b" }}
                            />
                          )
                        ) : (
                          <span style={{ color: "#334155" }}>·</span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "#7d8aa0",
                          fontSize: 12,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {log.createdAt
                          ? new Date(log.createdAt).toLocaleString()
                          : "—"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {log.adminUsername || "—"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <code
                          style={{
                            fontSize: 11,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: "rgba(99,102,241,0.1)",
                            color: "#d900ff",
                          }}
                        >
                          {log.action}
                        </code>
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "#94a3b8",
                          fontSize: 12,
                        }}
                      >
                        {log.target || "—"}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "#7d8aa0",
                          fontSize: 12,
                          fontFamily: "monospace",
                        }}
                      >
                        {log.ipAddress || "—"}
                      </td>
                    </tr>,
                  ];
                  if (isOpen && log.payload) {
                    rows.push(
                      <tr
                        key={`${log.id}-payload`}
                        style={{
                          borderTop: "1px solid rgba(255,255,255,0.04)",
                          background: "rgba(0,0,0,0.35)",
                        }}
                      >
                        <td />
                        <td colSpan={5} style={{ padding: "10px 16px 14px" }}>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#64748b",
                              textTransform: "uppercase",
                              marginBottom: 6,
                              letterSpacing: 0.5,
                            }}
                          >
                            Payload
                          </div>
                          <pre
                            style={{
                              margin: 0,
                              padding: "10px 12px",
                              borderRadius: 8,
                              background: "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(255,255,255,0.06)",
                              fontSize: 11.5,
                              color: "#cbd5e1",
                              overflowX: "auto",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                              fontFamily:
                                "ui-monospace, SFMono-Regular, Menlo, monospace",
                            }}
                          >
                            {(() => {
                              try {
                                return JSON.stringify(
                                  JSON.parse(log.payload as string),
                                  null,
                                  2
                                );
                              } catch {
                                return log.payload;
                              }
                            })()}
                          </pre>
                        </td>
                      </tr>
                    );
                  }
                  return rows;
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
