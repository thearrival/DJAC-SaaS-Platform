/**
 * Yalla Hack Founders Console — Engagement Insights
 * DAU/WAU/MAU, daily activity series, top users/features/orgs, dormancy.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  RefreshCw,
  ChevronLeft,
  Users,
  Activity,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "@/lib/recharts-compat";

const ADMIN_API = "/api/admin-dashboard";

interface EngagementMetrics {
  generatedAt: string;
  windowDays: number;
  dau: number;
  wau: number;
  mau: number;
  newUsersInWindow: number;
  dormantUsers: number;
  retention: {
    active1d: number;
    active7d: number;
    active30d: number;
    total: number;
  };
  dailyActive: Array<{ date: string; count: number }>;
  topUsers: Array<{
    id: number;
    name: string | null;
    email: string | null;
    eventCount: number;
    lastActiveAt: string | null;
  }>;
  topFeatures: Array<{ action: string; count: number }>;
  topOrgs: Array<{ id: number; name: string; eventCount: number }>;
}

const cardStyle: React.CSSProperties = {
  padding: 20,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(15,15,25,0.8)",
};

function KPI({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
}) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: accent ?? "#f0abfc",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      {hint && (
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

export default function AdminInsights() {
  usePageTitle("Engagement Insights — Yalla Hack Admin");
  const [, navigate] = useLocation();
  const [data, setData] = useState<EngagementMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(30);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_API}/engagement?days=${days}`, {
        credentials: "include",
      });
      if (res.status === 401) {
        navigate("/yalla-hack-owners-console/login");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
      setError("");
      setUpdatedAt(new Date().toLocaleTimeString());
    } catch (e) {
      setError(`Could not load engagement metrics: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [days, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const maxFeature = useMemo(
    () => Math.max(1, ...(data?.topFeatures ?? []).map(f => f.count)),
    [data]
  );

  const retentionPct =
    data && data.retention.total > 0
      ? Math.round((data.retention.active7d / data.retention.total) * 100)
      : 0;

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
            Engagement Insights
          </h1>
          {updatedAt && (
            <span style={{ fontSize: 11, color: "#64748b" }}>
              updated {updatedAt}
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
          </select>
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

        {loading && !data ? (
          <div style={{ color: "#64748b", fontSize: 13 }}>Loading…</div>
        ) : data ? (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <KPI label="DAU" value={data.dau} accent="#00d2ff" />
              <KPI label="WAU" value={data.wau} accent="#8b5cf6" />
              <KPI label="MAU" value={data.mau} accent="#d900ff" />
              <KPI
                label="7d retention"
                value={`${retentionPct}%`}
                hint={`${data.retention.active7d} / ${data.retention.total} users`}
                accent="#10b981"
              />
              <KPI
                label={`New (${data.windowDays}d)`}
                value={data.newUsersInWindow}
                accent="#f59e0b"
              />
              <KPI
                label="Dormant 30d+"
                value={data.dormantUsers}
                accent="#ef4444"
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
                gap: 16,
                marginBottom: 20,
              }}
            >
              <div style={cardStyle}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <Activity size={14} color="#00d2ff" />
                  Daily active users
                </div>
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={data.dailyActive}>
                      <XAxis
                        dataKey="date"
                        stroke="#475569"
                        fontSize={10}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#475569"
                        fontSize={10}
                        allowDecimals={false}
                        width={32}
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
                        dataKey="count"
                        stroke="#00d2ff"
                        fill="rgba(0,210,255,0.15)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={cardStyle}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <TrendingUp size={14} color="#d900ff" />
                  Top feature actions
                </div>
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.topFeatures}>
                      <XAxis
                        dataKey="action"
                        stroke="#475569"
                        fontSize={9}
                        tickLine={false}
                        interval={0}
                        angle={-35}
                        textAnchor="end"
                        height={56}
                      />
                      <YAxis
                        stroke="#475569"
                        fontSize={10}
                        allowDecimals={false}
                        width={32}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#0b0b12",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="#d900ff"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
                gap: 16,
              }}
            >
              <div style={cardStyle}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 12,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <Users size={14} color="#10b981" />
                  Most active users
                </div>
                {data.topUsers.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#64748b" }}>
                    No activity in this window.
                  </div>
                ) : (
                  <table style={{ width: "100%", fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ color: "#64748b", textAlign: "left" }}>
                        <th style={{ padding: "6px 0", fontWeight: 500 }}>
                          User
                        </th>
                        <th style={{ padding: "6px 0", fontWeight: 500 }}>
                          Events
                        </th>
                        <th style={{ padding: "6px 0", fontWeight: 500 }}>
                          Last active
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topUsers.map(u => (
                        <tr
                          key={u.id}
                          style={{
                            borderTop: "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          <td style={{ padding: "8px 0" }}>
                            <button
                              onClick={() =>
                                navigate(
                                  `/yalla-hack-owners-console/users/${u.id}`
                                )
                              }
                              style={{
                                background: "none",
                                border: "none",
                                color: "#f0abfc",
                                cursor: "pointer",
                                padding: 0,
                                fontSize: 12.5,
                                textAlign: "left",
                              }}
                            >
                              {u.name || u.email || `#${u.id}`}
                            </button>
                          </td>
                          <td
                            style={{
                              padding: "8px 0",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {u.eventCount}
                          </td>
                          <td style={{ padding: "8px 0", color: "#7d8aa0" }}>
                            {u.lastActiveAt
                              ? new Date(u.lastActiveAt).toLocaleString()
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div style={cardStyle}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 12,
                  }}
                >
                  Feature adoption
                </div>
                {data.topFeatures.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#64748b" }}>
                    No interaction events yet.
                  </div>
                ) : (
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {data.topFeatures.slice(0, 10).map(f => (
                      <div key={f.action}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 12,
                            marginBottom: 3,
                          }}
                        >
                          <span style={{ color: "#cbd5e1" }}>{f.action}</span>
                          <span style={{ color: "#94a3b8" }}>{f.count}</span>
                        </div>
                        <div
                          style={{
                            height: 6,
                            borderRadius: 3,
                            background: "rgba(255,255,255,0.06)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${Math.round((f.count / maxFeature) * 100)}%`,
                              background:
                                "linear-gradient(90deg,#d900ff,#00d2ff)",
                              borderRadius: 3,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={cardStyle}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 12,
                  }}
                >
                  Top organizations by activity
                </div>
                {data.topOrgs.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#64748b" }}>
                    No org-linked activity in this window.
                  </div>
                ) : (
                  <table style={{ width: "100%", fontSize: 12.5 }}>
                    <tbody>
                      {data.topOrgs.map(o => (
                        <tr
                          key={o.id}
                          style={{
                            borderTop: "1px solid rgba(255,255,255,0.05)",
                          }}
                        >
                          <td style={{ padding: "8px 0", color: "#cbd5e1" }}>
                            {o.name}
                          </td>
                          <td
                            style={{
                              padding: "8px 0",
                              textAlign: "right",
                              color: "#94a3b8",
                            }}
                          >
                            {o.eventCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
