/**
 * Yalla Hack Super Admin — Security Monitoring
 * Failed logins, MFA events, suspicious activity, active founder sessions,
 * password rotation, and TOTP status — with live charts and auto-refresh.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  RefreshCw,
  ChevronLeft,
  AlertTriangle,
  Key,
  Lock,
  MonitorSmartphone,
  ShieldCheck,
  ShieldAlert,
  Plus,
  Ban,
  Clock,
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
const OWNER_API = "/api/yalla-admin";

interface SecurityEvent {
  id: number;
  action: string;
  category: string;
  outcome: string;
  ipAddress: string | null;
  createdAt: string;
  targetEntity: string | null;
  source: "platform" | "admin";
}

interface AdminSession {
  id: string;
  adminUsername: string;
  ipAddress: string;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
  lastSeenAt: string | null;
  isCurrent: boolean;
}

const OUTCOME_COLORS: Record<string, string> = {
  success: "#10b981",
  failure: "#f59e0b",
  blocked: "#ef4444",
};

const cardStyle: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(255,255,255,0.015)",
  padding: 18,
};

const thStyle: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "left",
  color: "#94a3b8",
  fontSize: 11,
  textTransform: "uppercase",
};

export default function AdminSecurity() {
  usePageTitle("Security Monitor — Yalla Hack Admin");
  const [, navigate] = useLocation();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  // Sessions + security settings
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  // Password change form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMessage, setPwMessage] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`${ADMIN_API}/security-events?limit=200`, {
        credentials: "include",
      });
      if (res.status === 401) {
        navigate("/yalla-hack-owners-console/login");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
      setError("");
      setUpdatedAt(new Date().toLocaleTimeString());
    } catch (e) {
      setError(`Could not load security events: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch(`${OWNER_API}/stats/sessions`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(Array.isArray(data) ? data : []);
      }
    } catch {
      /* non-fatal */
    }
  }, []);

  const loadMfaStatus = useCallback(async () => {
    try {
      const res = await fetch(`${OWNER_API}/2fa/status`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setMfaEnabled(Boolean(data.enabled));
      }
    } catch {
      /* non-fatal */
    }
  }, []);

  useEffect(() => {
    void loadData();
    void loadSessions();
    void loadMfaStatus();
  }, [loadData, loadSessions, loadMfaStatus]);

  // Auto-refresh every 30s (events + sessions)
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      void loadData();
      void loadSessions();
    }, 30_000);
    return () => clearInterval(timer);
  }, [autoRefresh, loadData, loadSessions]);

  async function handleRevoke(sessionId: string) {
    if (
      !window.confirm(
        "Revoke this session? That device will be signed out immediately."
      )
    )
      return;
    setRevoking(sessionId);
    try {
      const res = await fetch(
        `${OWNER_API}/sessions/${encodeURIComponent(sessionId)}/revoke`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: "{}",
        }
      );
      if (res.ok) {
        await loadSessions();
        if (sessionId === sessions.find(s => s.isCurrent)?.id) {
          navigate("/yalla-hack-owners-console/login");
        }
      } else {
        const d = await res.json().catch(() => null);
        setError(d?.error || "Could not revoke session");
      }
    } catch (e) {
      setError(`Could not revoke session: ${(e as Error).message}`);
    } finally {
      setRevoking(null);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMessage(null);
    if (newPassword !== confirmPassword) {
      setPwMessage({ ok: false, text: "New passwords do not match." });
      return;
    }
    setPwBusy(true);
    try {
      const res = await fetch(`${OWNER_API}/password/change`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setPwMessage({
          ok: false,
          text: data?.error || `Password change failed (${res.status}).`,
        });
        return;
      }
      setPwMessage({
        ok: true,
        text: "Password changed. All other sessions were signed out.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      void loadSessions();
    } catch (err) {
      setPwMessage({
        ok: false,
        text: `Network error: ${(err as Error).message}`,
      });
    } finally {
      setPwBusy(false);
    }
  }

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
    if (filter === "admin") return e.source === "admin";
    return true;
  });

  // KPI summary
  const summary = useMemo(() => {
    let failures = 0;
    let blocked = 0;
    let success = 0;
    for (const e of events) {
      if (e.outcome === "failure") failures++;
      else if (e.outcome === "blocked") blocked++;
      else success++;
    }
    return { total: events.length, failures, blocked, success };
  }, [events]);

  // Daily event counts for the last 14 days
  const daily = useMemo(() => {
    const days: { label: string; count: number; ts: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push({
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        count: 0,
        ts: d.getTime(),
      });
    }
    const idx = new Map(days.map((d, i) => [d.ts, i]));
    for (const e of events) {
      const t = new Date(e.createdAt);
      t.setHours(0, 0, 0, 0);
      const i = idx.get(t.getTime());
      if (i !== undefined) days[i].count++;
    }
    return days;
  }, [events]);

  const outcomePie = useMemo(
    () =>
      [
        { name: "Success", value: summary.success, color: "#10b981" },
        { name: "Failures", value: summary.failures, color: "#f59e0b" },
        { name: "Blocked", value: summary.blocked, color: "#ef4444" },
      ].filter(s => s.value > 0),
    [summary]
  );

  const topIps = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of events) {
      if (!e.ipAddress) continue;
      counts.set(e.ipAddress, (counts.get(e.ipAddress) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([ip, count]) => ({ ip, count }));
  }, [events]);

  const maxIpCount = topIps[0]?.count ?? 1;

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#fff",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
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
            Security Monitor
          </h1>
          {updatedAt && (
            <span style={{ fontSize: 11, color: "#64748b" }}>
              updated {updatedAt}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setAutoRefresh(v => !v)}
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
            title={autoRefresh ? "Pause auto-refresh" : "Resume auto-refresh"}
          >
            {autoRefresh ? "Auto 30s" : "Paused"}
          </button>
          <button
            onClick={() => {
              void loadData();
              void loadSessions();
              void loadMfaStatus();
            }}
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

        {/* KPI chips */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
            marginBottom: 20,
          }}
        >
          {[
            {
              label: "Events (24h window)",
              value: summary.total,
              color: "#e2e8f0",
            },
            {
              label: "Failures",
              value: summary.failures,
              color: summary.failures > 0 ? "#f59e0b" : "#10b981",
            },
            {
              label: "Blocked",
              value: summary.blocked,
              color: summary.blocked > 0 ? "#ef4444" : "#10b981",
            },
            {
              label: "Active sessions",
              value: sessions.length,
              color: "#00d2ff",
            },
            {
              label: "2FA",
              value: mfaEnabled === null ? "…" : mfaEnabled ? "Enabled" : "Off",
              color:
                mfaEnabled === null
                  ? "#94a3b8"
                  : mfaEnabled
                    ? "#10b981"
                    : "#f59e0b",
            },
          ].map(kpi => (
            <div key={kpi.label} style={cardStyle}>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>{kpi.label}</div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: kpi.color,
                  marginTop: 4,
                }}
              >
                {kpi.value}
              </div>
            </div>
          ))}
        </div>

        {/* Charts + Top IPs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div style={cardStyle}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#cbd5e1",
                marginBottom: 12,
              }}
            >
              Security events — last 14 days
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart
                data={daily}
                margin={{ top: 4, right: 8, left: -18, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="secFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d900ff" stopOpacity={0.5} />
                    <stop
                      offset="100%"
                      stopColor="#d900ff"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                  tickLine={false}
                  interval={1}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0f0f17",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#cbd5e1" }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Events"
                  stroke="#d900ff"
                  strokeWidth={2}
                  fill="url(#secFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={cardStyle}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#cbd5e1",
                marginBottom: 12,
              }}
            >
              Outcomes
            </div>
            {outcomePie.length === 0 ? (
              <div
                style={{
                  color: "#64748b",
                  fontSize: 13,
                  padding: "40px 0",
                  textAlign: "center",
                }}
              >
                No events yet
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <ResponsiveContainer width="50%" height={150}>
                  <PieChart>
                    <Pie
                      data={outcomePie}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={40}
                      outerRadius={64}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {outcomePie.map(s => (
                        <Cell key={s.name} fill={s.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#0f0f17",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {outcomePie.map(s => (
                    <div
                      key={s.name}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 12,
                      }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 3,
                          background: s.color,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ color: "#94a3b8" }}>{s.name}</span>
                      <span style={{ fontWeight: 700, color: "#e2e8f0" }}>
                        {s.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#cbd5e1",
                marginBottom: 12,
              }}
            >
              Top source IPs
            </div>
            {topIps.length === 0 ? (
              <div
                style={{
                  color: "#64748b",
                  fontSize: 13,
                  padding: "40px 0",
                  textAlign: "center",
                }}
              >
                No IP data yet
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {topIps.map(t => (
                  <div key={t.ip}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 11.5,
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "monospace",
                          color: "#94a3b8",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "75%",
                        }}
                      >
                        {t.ip}
                      </span>
                      <span style={{ color: "#e2e8f0", fontWeight: 700 }}>
                        {t.count}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        borderRadius: 3,
                        background: "rgba(255,255,255,0.05)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.max(6, (t.count / maxIpCount) * 100)}%`,
                          borderRadius: 3,
                          background: "linear-gradient(90deg,#d900ff,#00d2ff)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active sessions + security settings */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 12,
            marginBottom: 20,
          }}
        >
          {/* Sessions */}
          <div style={cardStyle}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#cbd5e1",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <MonitorSmartphone size={14} color="#00d2ff" />
                Active founder sessions ({sessions.length})
              </div>
            </div>
            {sessions.length === 0 ? (
              <div style={{ color: "#64748b", fontSize: 13 }}>
                No active sessions found.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {sessions.map(s => (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: s.isCurrent
                        ? "rgba(16,185,129,0.06)"
                        : "rgba(255,255,255,0.02)",
                      border: s.isCurrent
                        ? "1px solid rgba(16,185,129,0.30)"
                        : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 12.5,
                          fontWeight: 600,
                        }}
                      >
                        <span style={{ fontFamily: "monospace" }}>
                          {s.ipAddress}
                        </span>
                        {s.isCurrent && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: "#10b981",
                              background: "rgba(16,185,129,0.12)",
                              border: "1px solid rgba(16,185,129,0.35)",
                              borderRadius: 20,
                              padding: "1px 8px",
                            }}
                          >
                            THIS DEVICE
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#64748b",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          marginTop: 2,
                        }}
                      >
                        {s.userAgent || "unknown device"} · seen{" "}
                        {s.lastSeenAt
                          ? new Date(s.lastSeenAt).toLocaleString()
                          : "—"}
                      </div>
                    </div>
                    <button
                      onClick={() => void handleRevoke(s.id)}
                      disabled={revoking === s.id}
                      title="Revoke session"
                      style={{
                        background: "rgba(239,68,68,0.10)",
                        border: "1px solid rgba(239,68,68,0.30)",
                        borderRadius: 6,
                        padding: "5px 10px",
                        color: "#f87171",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: revoking === s.id ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Ban size={12} />
                      {revoking === s.id ? "…" : "Revoke"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Security settings: MFA + password */}
          <div style={cardStyle}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#cbd5e1",
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 12,
              }}
            >
              <ShieldCheck size={14} color="#10b981" />
              Security settings
            </div>

            {/* MFA status */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                marginBottom: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {mfaEnabled ? (
                  <ShieldCheck size={15} color="#10b981" />
                ) : (
                  <ShieldAlert size={15} color="#f59e0b" />
                )}
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>
                    Two-factor authentication
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    {mfaEnabled === null
                      ? "Checking…"
                      : mfaEnabled
                        ? "TOTP is required at sign-in"
                        : "Not enabled — strongly recommended"}
                  </div>
                </div>
              </div>
              <button
                onClick={() =>
                  navigate("/yalla-hack-owners-console/security/mfa")
                }
                style={{
                  background: mfaEnabled
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(217,0,255,0.12)",
                  border: mfaEnabled
                    ? "1px solid rgba(255,255,255,0.12)"
                    : "1px solid rgba(217,0,255,0.40)",
                  borderRadius: 6,
                  padding: "5px 12px",
                  color: mfaEnabled ? "#cbd5e1" : "#f0abfc",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {mfaEnabled ? "Manage" : "Enable 2FA"}
                {!mfaEnabled && <Plus size={12} style={{ marginLeft: 4 }} />}
              </button>
            </div>

            {/* Change password */}
            <form
              onSubmit={handleChangePassword}
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              <div
                style={{ fontSize: 11.5, color: "#94a3b8", fontWeight: 600 }}
              >
                Change founders password
              </div>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                autoComplete="current-password"
                required
                style={inputStyle}
              />
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password (min 12 chars, letter + number)"
                autoComplete="new-password"
                required
                minLength={12}
                style={inputStyle}
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
                required
                style={inputStyle}
              />
              {pwMessage && (
                <div
                  style={{
                    fontSize: 12,
                    padding: "8px 10px",
                    borderRadius: 6,
                    background: pwMessage.ok
                      ? "rgba(16,185,129,0.08)"
                      : "rgba(239,68,68,0.08)",
                    border: pwMessage.ok
                      ? "1px solid rgba(16,185,129,0.30)"
                      : "1px solid rgba(239,68,68,0.30)",
                    color: pwMessage.ok ? "#10b981" : "#ef4444",
                  }}
                >
                  {pwMessage.text}
                </div>
              )}
              <button
                type="submit"
                disabled={
                  pwBusy ||
                  !currentPassword ||
                  newPassword.length < 12 ||
                  newPassword !== confirmPassword
                }
                style={{
                  padding: "10px",
                  borderRadius: 8,
                  background:
                    pwBusy ||
                    !currentPassword ||
                    newPassword.length < 12 ||
                    newPassword !== confirmPassword
                      ? "rgba(255,255,255,0.06)"
                      : "linear-gradient(135deg,#d900ff,#d900ff)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  border: "none",
                  cursor:
                    pwBusy ||
                    !currentPassword ||
                    newPassword.length < 12 ||
                    newPassword !== confirmPassword
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    pwBusy ||
                    !currentPassword ||
                    newPassword.length < 12 ||
                    newPassword !== confirmPassword
                      ? 0.5
                      : 1,
                }}
              >
                {pwBusy ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Clock size={13} /> Updating…
                  </span>
                ) : (
                  "Change password"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 20,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {["all", "failed", "auth", "password", "mfa", "admin"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                border: "1px solid",
                borderColor: filter === f ? "#d900ff" : "rgba(255,255,255,0.1)",
                background:
                  filter === f ? "rgba(99,102,241,0.15)" : "transparent",
                color: filter === f ? "#d900ff" : "#94a3b8",
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {f}
            </button>
          ))}
          <span
            style={{ fontSize: 11.5, color: "#64748b", marginLeft: "auto" }}
          >
            showing {Math.min(filtered.length, 100)} of {filtered.length} events
          </span>
        </div>

        {/* Events table */}
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
                <th style={thStyle}>Event</th>
                <th style={thStyle}>Source</th>
                <th style={thStyle}>Outcome</th>
                <th style={thStyle}>IP</th>
                <th style={thStyle}>Target</th>
                <th style={thStyle}>Time</th>
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
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: 40,
                      textAlign: "center",
                      color: "#7d8aa0",
                    }}
                  >
                    No events found
                  </td>
                </tr>
              ) : (
                filtered.slice(0, 100).map(e => (
                  <tr
                    key={`${e.source}-${e.id}`}
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
                          <Key size={12} style={{ color: "#00d2ff" }} />
                        ) : e.action?.includes("2fa") ||
                          e.action?.includes("totp") ? (
                          <Lock size={12} style={{ color: "#d900ff" }} />
                        ) : null}
                        <span>{e.action}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: 0.5,
                          padding: "2px 8px",
                          borderRadius: 20,
                          color: e.source === "admin" ? "#f0abfc" : "#7dd3fc",
                          background:
                            e.source === "admin"
                              ? "rgba(217,0,255,0.10)"
                              : "rgba(0,210,255,0.08)",
                          border: `1px solid ${e.source === "admin" ? "rgba(217,0,255,0.30)" : "rgba(0,210,255,0.25)"}`,
                          textTransform: "uppercase",
                        }}
                      >
                        {e.source === "admin" ? "founder" : "platform"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: OUTCOME_COLORS[e.outcome] ?? "#94a3b8",
                        }}
                      >
                        {e.outcome || "—"}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        color: "#7d8aa0",
                        fontSize: 12,
                        fontFamily: "monospace",
                      }}
                    >
                      {e.ipAddress || "—"}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        color: "#7d8aa0",
                        fontSize: 12,
                      }}
                    >
                      {e.targetEntity || "—"}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        color: "#7d8aa0",
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
