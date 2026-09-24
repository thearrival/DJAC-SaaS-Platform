/**
 * Yalla Hack Founders Console — User Detail (deep dive)
 * Full-page per-user view: profile, memberships, auth history, merged
 * activity timeline from audit + activity + interaction logs.
 */
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  RefreshCw,
  ChevronLeft,
  ShieldCheck,
  Activity,
  Clock,
  AlertTriangle,
  Building2,
} from "lucide-react";

const ADMIN_API = "/api/admin-dashboard";

interface AdminUser {
  id: number;
  source: "local" | "oauth";
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
  role: string;
  status: string;
  companyName: string | null;
  jobTitle: string | null;
  industry: string | null;
  preferredLocale: string;
  lastSignedIn: string | null;
  createdAt: string | null;
  orgCount: number;
}

interface UserDetail extends AdminUser {
  organizationMemberships: Array<{
    orgId: number;
    orgName: string;
    role: string;
    joinedAt: string | null;
  }>;
  recentActivity: Array<{
    id: number;
    action: string;
    category: string;
    createdAt: string | null;
  }>;
}

interface TimelineEntry {
  id: string;
  source: "audit" | "activity" | "interaction";
  action: string;
  category: string;
  outcome: string | null;
  entityType: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface AuthHistoryEntry {
  id: number;
  action: string;
  outcome: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

const cardStyle: React.CSSProperties = {
  padding: 20,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(15,15,25,0.8)",
};

const SOURCE_COLORS: Record<TimelineEntry["source"], string> = {
  audit: "#d900ff",
  activity: "#00d2ff",
  interaction: "#10b981",
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; border: string; color: string }> = {
    active: {
      bg: "rgba(16,185,129,0.1)",
      border: "rgba(16,185,129,0.3)",
      color: "#10b981",
    },
    pending: {
      bg: "rgba(245,158,11,0.1)",
      border: "rgba(245,158,11,0.3)",
      color: "#f59e0b",
    },
    suspended: {
      bg: "rgba(239,68,68,0.1)",
      border: "rgba(239,68,68,0.3)",
      color: "#ef4444",
    },
  };
  const s = map[status] ?? {
    bg: "rgba(148,163,184,0.1)",
    border: "rgba(148,163,184,0.3)",
    color: "#94a3b8",
  };
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
        textTransform: "capitalize",
      }}
    >
      {status}
    </span>
  );
}

export default function AdminUserDetail() {
  const [location, navigate] = useLocation();
  const userIdMatch = location.match(/\/users\/(\d+)/);
  const userId = userIdMatch ? Number(userIdMatch[1]) : null;

  usePageTitle(
    userId
      ? `User #${userId} — Yalla Hack Admin`
      : "User Detail — Yalla Hack Admin"
  );

  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [authHistory, setAuthHistory] = useState<AuthHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (userId == null) {
      setError("Invalid user id");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [detailRes, timelineRes, authRes] = await Promise.all([
        fetch(`${ADMIN_API}/users/${userId}`, { credentials: "include" }),
        fetch(`${ADMIN_API}/users/${userId}/timeline?limit=150`, {
          credentials: "include",
        }),
        fetch(`${ADMIN_API}/users/${userId}/auth-history?limit=50`, {
          credentials: "include",
        }),
      ]);
      if (
        detailRes.status === 401 ||
        timelineRes.status === 401 ||
        authRes.status === 401
      ) {
        navigate("/yalla-hack-owners-console/login");
        return;
      }
      if (!detailRes.ok) throw new Error(`detail: HTTP ${detailRes.status}`);
      setDetail(await detailRes.json());
      if (timelineRes.ok) setTimeline(await timelineRes.json());
      if (authRes.ok) setAuthHistory(await authRes.json());
      setError("");
    } catch (e) {
      setError(`Could not load user: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [userId, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  if (userId == null) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#050508",
          color: "#e2e8f0",
          padding: 40,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        Invalid user id.{" "}
        <button
          onClick={() => navigate("/yalla-hack-owners-console/users")}
          style={{
            background: "none",
            border: "none",
            color: "#f0abfc",
            cursor: "pointer",
          }}
        >
          Back to users
        </button>
      </div>
    );
  }

  const failures = authHistory.filter(a => a.outcome === "failure").length;

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
            onClick={() => navigate("/yalla-hack-owners-console/users")}
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
            {detail?.name || detail?.email || `User #${userId}`}
          </h1>
          {detail && <StatusBadge status={detail.status} />}
        </div>
        <button
          onClick={load}
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

        {loading && !detail ? (
          <div style={{ color: "#64748b", fontSize: 13 }}>Loading…</div>
        ) : detail ? (
          <>
            {/* Profile + memberships */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
                gap: 16,
                marginBottom: 20,
              }}
            >
              <div style={cardStyle}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <ShieldCheck size={14} color="#d900ff" />
                  Profile
                </div>
                <dl
                  style={{
                    display: "grid",
                    gridTemplateColumns: "120px 1fr",
                    gap: "8px 12px",
                    fontSize: 13,
                    margin: 0,
                  }}
                >
                  <dt style={{ color: "#64748b" }}>Email</dt>
                  <dd style={{ margin: 0, color: "#e2e8f0" }}>
                    {detail.email || "—"}
                  </dd>
                  <dt style={{ color: "#64748b" }}>Phone</dt>
                  <dd style={{ margin: 0 }}>{detail.phoneNumber || "—"}</dd>
                  <dt style={{ color: "#64748b" }}>Role</dt>
                  <dd style={{ margin: 0 }}>{detail.role}</dd>
                  <dt style={{ color: "#64748b" }}>Source</dt>
                  <dd style={{ margin: 0 }}>{detail.source}</dd>
                  <dt style={{ color: "#64748b" }}>Company</dt>
                  <dd style={{ margin: 0 }}>{detail.companyName || "—"}</dd>
                  <dt style={{ color: "#64748b" }}>Job title</dt>
                  <dd style={{ margin: 0 }}>{detail.jobTitle || "—"}</dd>
                  <dt style={{ color: "#64748b" }}>Industry</dt>
                  <dd style={{ margin: 0 }}>{detail.industry || "—"}</dd>
                  <dt style={{ color: "#64748b" }}>Locale</dt>
                  <dd style={{ margin: 0 }}>{detail.preferredLocale}</dd>
                  <dt style={{ color: "#64748b" }}>Joined</dt>
                  <dd style={{ margin: 0 }}>
                    {detail.createdAt
                      ? new Date(detail.createdAt).toLocaleString()
                      : "—"}
                  </dd>
                  <dt style={{ color: "#64748b" }}>Last signed in</dt>
                  <dd style={{ margin: 0 }}>
                    {detail.lastSignedIn
                      ? new Date(detail.lastSignedIn).toLocaleString()
                      : "Never"}
                  </dd>
                </dl>
              </div>

              <div style={cardStyle}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Building2 size={14} color="#00d2ff" />
                  Memberships ({detail.organizationMemberships.length})
                </div>
                {detail.organizationMemberships.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#64748b" }}>
                    No organization memberships.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {detail.organizationMemberships.map(m => (
                      <div
                        key={m.orgId}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "8px 10px",
                          borderRadius: 8,
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          fontSize: 13,
                        }}
                      >
                        <span style={{ color: "#cbd5e1" }}>{m.orgName}</span>
                        <span style={{ color: "#7d8aa0", fontSize: 12 }}>
                          {m.role}
                          {m.joinedAt
                            ? ` · ${new Date(m.joinedAt).toLocaleDateString()}`
                            : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    marginTop: 16,
                    fontSize: 13,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Clock size={14} color="#f59e0b" />
                  Auth history
                </div>
                <div style={{ marginTop: 10, fontSize: 12.5 }}>
                  <div style={{ color: "#64748b", marginBottom: 6 }}>
                    {authHistory.length} events ·{" "}
                    <span
                      style={{ color: failures > 0 ? "#ef4444" : "#10b981" }}
                    >
                      {failures} failure{failures === 1 ? "" : "s"}
                    </span>
                  </div>
                  {authHistory.length === 0 ? (
                    <div style={{ color: "#64748b" }}>No auth events.</div>
                  ) : (
                    <div
                      style={{
                        maxHeight: 220,
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {authHistory.map(a => (
                        <div
                          key={a.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 8,
                            padding: "6px 8px",
                            borderRadius: 6,
                            background: "rgba(255,255,255,0.03)",
                          }}
                        >
                          <span style={{ color: "#cbd5e1" }}>{a.action}</span>
                          <span
                            style={{
                              color:
                                a.outcome === "failure" ? "#ef4444" : "#10b981",
                              fontSize: 11.5,
                            }}
                          >
                            {a.outcome}
                          </span>
                          <span style={{ color: "#64748b", fontSize: 11 }}>
                            {a.createdAt
                              ? new Date(a.createdAt).toLocaleString()
                              : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Merged timeline */}
            <div style={cardStyle}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Activity size={14} color="#10b981" />
                Activity timeline ({timeline.length})
              </div>
              {timeline.length === 0 ? (
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  No activity recorded for this user yet.
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0,
                    maxHeight: 560,
                    overflowY: "auto",
                  }}
                >
                  {timeline.map(entry => (
                    <div
                      key={entry.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "72px 1fr auto",
                        gap: 12,
                        padding: "10px 4px",
                        borderTop: "1px solid rgba(255,255,255,0.05)",
                        alignItems: "start",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          letterSpacing: 0.5,
                          textTransform: "uppercase",
                          color: SOURCE_COLORS[entry.source],
                        }}
                      >
                        {entry.source}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            color: "#e2e8f0",
                            fontFamily: "ui-monospace,monospace",
                          }}
                        >
                          {entry.action}
                        </div>
                        <div
                          style={{
                            fontSize: 11.5,
                            color: "#64748b",
                            marginTop: 2,
                          }}
                        >
                          {entry.category}
                          {entry.entityType ? ` · ${entry.entityType}` : ""}
                          {entry.ipAddress ? ` · ${entry.ipAddress}` : ""}
                          {entry.outcome === "failure"
                            ? " · FAILED"
                            : entry.outcome
                              ? ` · ${entry.outcome}`
                              : ""}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 11.5,
                          color: "#7d8aa0",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {entry.createdAt
                          ? new Date(entry.createdAt).toLocaleString()
                          : ""}
                      </span>
                    </div>
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
