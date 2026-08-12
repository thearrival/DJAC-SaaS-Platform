/**
 * Yalla Hack Super Admin — Security Monitoring
 * Failed logins, password resets, MFA events, suspicious activity.
 */
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";
import { RefreshCw, ChevronLeft, AlertTriangle, Key, Lock } from "lucide-react";

const ADMIN_API = "/api/admin-dashboard";

interface SecurityEvent {
  id: number;
  action: string;
  category: string;
  outcome: string;
  ipAddress: string | null;
  createdAt: string;
  targetEntity: string | null;
}

export default function AdminSecurity() {
  usePageTitle("Security Monitor — Yalla Hack Admin");
  const [, navigate] = useLocation();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`${ADMIN_API}/security-events?limit=200`, {
        credentials: "include",
      });
      if (res.status === 401) {
        navigate("/yalla-hack-owners-console/login");
        return;
      }
      setEvents(await res.json());
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = events.filter(e => {
    if (filter === "all") return true;
    if (filter === "failed")
      return e.outcome === "failure" || e.action?.includes("failed");
    if (filter === "auth") return e.category === "auth";
    if (filter === "password")
      return e.action?.includes("password") || e.action?.includes("reset");
    if (filter === "mfa")
      return (
        e.action?.includes("2fa") ||
        e.action?.includes("mfa") ||
        e.action?.includes("totp")
      );
    return true;
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
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
            Security Monitor
          </h1>
        </div>
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
      </header>

      <main style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          {["all", "failed", "auth", "password", "mfa"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                border: "1px solid",
                borderColor: filter === f ? "#6366f1" : "rgba(255,255,255,0.1)",
                background:
                  filter === f ? "rgba(99,102,241,0.15)" : "transparent",
                color: filter === f ? "#a5b4fc" : "#94a3b8",
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {f}
            </button>
          ))}
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
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#94a3b8",
                    fontSize: 11,
                    textTransform: "uppercase",
                  }}
                >
                  Event
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#94a3b8",
                    fontSize: 11,
                    textTransform: "uppercase",
                  }}
                >
                  Category
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#94a3b8",
                    fontSize: 11,
                    textTransform: "uppercase",
                  }}
                >
                  Outcome
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#94a3b8",
                    fontSize: 11,
                    textTransform: "uppercase",
                  }}
                >
                  IP
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#94a3b8",
                    fontSize: 11,
                    textTransform: "uppercase",
                  }}
                >
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: 40,
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: 40,
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    No events found
                  </td>
                </tr>
              ) : (
                filtered.slice(0, 100).map(e => (
                  <tr
                    key={e.id}
                    style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        {e.outcome === "failure" ? (
                          <AlertTriangle
                            size={12}
                            style={{ color: "#f59e0b" }}
                          />
                        ) : e.action?.includes("password") ? (
                          <Key size={12} style={{ color: "#22d3ee" }} />
                        ) : e.action?.includes("2fa") ||
                          e.action?.includes("totp") ? (
                          <Lock size={12} style={{ color: "#a855f7" }} />
                        ) : null}
                        <span>{e.action}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#94a3b8" }}>
                      {e.category}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color:
                            e.outcome === "failure"
                              ? "#f59e0b"
                              : e.outcome === "blocked"
                                ? "#f87171"
                                : "#4ade80",
                        }}
                      >
                        {e.outcome || "—"}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        color: "#64748b",
                        fontSize: 12,
                        fontFamily: "monospace",
                      }}
                    >
                      {e.ipAddress || "—"}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        color: "#64748b",
                        fontSize: 12,
                      }}
                    >
                      {e.createdAt
                        ? new Date(e.createdAt).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
