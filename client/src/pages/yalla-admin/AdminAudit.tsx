/**
 * Yalla Hack Super Admin — Audit Log Viewer
 * Platform-wide audit trail and admin action logs.
 */
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";
import { FileText, RefreshCw, ChevronLeft, Filter } from "lucide-react";

const ADMIN_API = "/api/yalla-admin";

interface AuditEntry {
  id: number; sessionId: string | null; adminUsername: string;
  action: string; target: string | null; ipAddress: string | null;
  payload: string | null; createdAt: string;
}

export default function AdminAudit() {
  usePageTitle("Audit Logs — Yalla Hack Admin");
  const [, navigate] = useLocation();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");

  const loadData = useCallback(async () => {
    try {
      const params = actionFilter ? `?action=${encodeURIComponent(actionFilter)}` : "";
      const res = await fetch(`${ADMIN_API}/stats/audit${params}`, { credentials: "include" });
      if (res.status === 401) { navigate("/yalla-hack-owners-console/login"); return; }
      setLogs(await res.json());
    } catch { /* silent */ } finally { setLoading(false); }
  }, [actionFilter, navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", fontFamily: "'Inter', sans-serif", color: "#e2e8f0" }}>
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => navigate("/yalla-hack-owners-console/dashboard")} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: 0 }}><ChevronLeft size={18} /></button>
          <h1 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Audit Logs</h1>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Filter size={12} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
            <input value={actionFilter} onChange={e => setActionFilter(e.target.value)} placeholder="Filter by action..." style={{ padding: "6px 10px 6px 26px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 12, outline: "none", width: 160 }} />
          </div>
          <button onClick={loadData} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 10px", color: "#94a3b8", cursor: "pointer" }}><RefreshCw size={14} /></button>
        </div>
      </header>

      <main style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#94a3b8", fontSize: 11, textTransform: "uppercase" }}>Timestamp</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#94a3b8", fontSize: 11, textTransform: "uppercase" }}>Admin</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#94a3b8", fontSize: 11, textTransform: "uppercase" }}>Action</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#94a3b8", fontSize: 11, textTransform: "uppercase" }}>Target</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "#94a3b8", fontSize: 11, textTransform: "uppercase" }}>IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: "center", color: "#64748b" }}>No audit entries found</td></tr>
              ) : logs.slice(0, 200).map(log => (
                <tr key={log.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 12, whiteSpace: "nowrap" }}>{log.createdAt ? new Date(log.createdAt).toLocaleString() : "—"}</td>
                  <td style={{ padding: "12px 16px" }}>{log.adminUsername || "—"}</td>
                  <td style={{ padding: "12px 16px" }}><code style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: "rgba(99,102,241,0.1)", color: "#a5b4fc" }}>{log.action}</code></td>
                  <td style={{ padding: "12px 16px", color: "#94a3b8", fontSize: 12 }}>{log.target || "—"}</td>
                  <td style={{ padding: "12px 16px", color: "#64748b", fontSize: 12, fontFamily: "monospace" }}>{log.ipAddress || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
