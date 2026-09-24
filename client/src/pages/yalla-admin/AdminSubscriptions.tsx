/**
 * Yalla Hack Super Admin — Subscription Management
 * View and manage platform subscriptions, billing events, and revenue.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  RefreshCw,
  ChevronLeft,
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "@/lib/recharts-compat";

const ADMIN_API = "/api/admin-dashboard";

interface Subscription {
  id: number;
  plan: string;
  status: string;
  billingInterval: string;
  amountCents: number;
  currency: string;
  organizationName: string;
  billingEmail: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: number;
}

interface SubSummary {
  subscriptions: Subscription[];
}

const STATUS_COLORS: Record<string, string> = {
  active: "#10b981",
  trialing: "#00d2ff",
  past_due: "#f59e0b",
  canceled: "#ef4444",
  incomplete: "#94a3b8",
};

const PLAN_COLORS = ["#d900ff", "#00d2ff", "#10b981", "#f59e0b", "#8b5cf6"];

const cardStyle: React.CSSProperties = {
  padding: 20,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(15,15,25,0.8)",
};

export default function AdminSubscriptions() {
  usePageTitle("Subscriptions — Yalla Hack Admin");
  const [, navigate] = useLocation();
  const [data, setData] = useState<SubSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`${ADMIN_API}/subscriptions`, {
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
      setError(`Could not load subscriptions: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered =
    data?.subscriptions?.filter(s => filter === "all" || s.status === filter) ||
    [];

  // Monthly-normalized revenue from active subscriptions:
  // annual tiers are divided by 12, everything else counts as-is.
  const totalMRR =
    data?.subscriptions
      ?.filter(s => s.status === "active" || s.status === "trialing")
      .reduce((sum, s) => {
        const monthly =
          s.billingInterval === "annual" ? s.amountCents / 12 : s.amountCents;
        return sum + monthly;
      }, 0) || 0;
  const activePlanCount = new Set(
    data?.subscriptions
      ?.filter(s => s.status === "active")
      .map(s => `${s.plan}/${s.billingInterval}`) || []
  ).size;
  const cancelingCount =
    data?.subscriptions?.filter(
      s => s.status === "active" && s.cancelAtPeriodEnd
    ).length || 0;

  const statusPie = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of data?.subscriptions ?? []) {
      counts.set(s.status, (counts.get(s.status) ?? 0) + 1);
    }
    return [...counts.entries()].map(([name, value]) => ({
      name,
      value,
      color: STATUS_COLORS[name] ?? "#94a3b8",
    }));
  }, [data]);

  const planPie = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of data?.subscriptions ?? []) {
      if (s.status !== "active" && s.status !== "trialing") continue;
      counts.set(s.plan, (counts.get(s.plan) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({
        name,
        value,
        color: PLAN_COLORS[i % PLAN_COLORS.length],
      }));
  }, [data]);

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
            Subscriptions
          </h1>
          {updatedAt && (
            <span style={{ fontSize: 11, color: "#64748b" }}>
              updated {updatedAt}
            </span>
          )}
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

        {/* Revenue Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div style={cardStyle}>
            <DollarSign
              size={18}
              style={{ color: "#10b981", marginBottom: 8 }}
            />
            <div style={{ fontSize: 24, fontWeight: 800, color: "#10b981" }}>
              ${(totalMRR / 100).toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>
              Est. Monthly Revenue
            </div>
          </div>
          <div style={cardStyle}>
            <Users size={18} style={{ color: "#d900ff", marginBottom: 8 }} />
            <div style={{ fontSize: 24, fontWeight: 800, color: "#d900ff" }}>
              {data?.subscriptions?.length || 0}
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>
              Total Subscriptions
            </div>
          </div>
          <div style={cardStyle}>
            <TrendingUp
              size={18}
              style={{ color: "#f59e0b", marginBottom: 8 }}
            />
            <div style={{ fontSize: 24, fontWeight: 800, color: "#f59e0b" }}>
              {activePlanCount}
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Active Plans</div>
          </div>
          <div style={cardStyle}>
            <AlertTriangle
              size={18}
              style={{
                color: cancelingCount > 0 ? "#ef4444" : "#10b981",
                marginBottom: 8,
              }}
            />
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: cancelingCount > 0 ? "#ef4444" : "#10b981",
              }}
            >
              {cancelingCount}
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>
              Canceling at Period End
            </div>
          </div>
        </div>

        {/* Charts */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div style={cardStyle}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Status breakdown
            </div>
            {statusPie.length === 0 ? (
              <div
                style={{
                  color: "#64748b",
                  fontSize: 13,
                  textAlign: "center",
                  padding: "30px 0",
                }}
              >
                No data
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <ResponsiveContainer width="50%" height={150}>
                  <PieChart>
                    <Pie
                      data={statusPie}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={40}
                      outerRadius={64}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {statusPie.map(s => (
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
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {statusPie.map(s => (
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
                      <span style={{ fontWeight: 700 }}>{s.value}</span>
                    </div>
                  ))}
                </div>
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
              Active plan mix
            </div>
            {planPie.length === 0 ? (
              <div
                style={{
                  color: "#64748b",
                  fontSize: 13,
                  textAlign: "center",
                  padding: "30px 0",
                }}
              >
                No active subscriptions
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <ResponsiveContainer width="50%" height={150}>
                  <PieChart>
                    <Pie
                      data={planPie}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={40}
                      outerRadius={64}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {planPie.map(s => (
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
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {planPie.map(s => (
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
                      <span
                        style={{
                          color: "#94a3b8",
                          textTransform: "capitalize",
                        }}
                      >
                        {s.name}
                      </span>
                      <span style={{ fontWeight: 700 }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filter */}
        <div style={{ marginBottom: 16 }}>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
              fontSize: 13,
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="trialing">Trialing</option>
            <option value="past_due">Past Due</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>

        {/* Table */}
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
                <th style={thStyle}>Organization</th>
                <th style={thStyle}>Plan</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Amount</th>
                <th style={thStyle}>Period End</th>
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
                      color: "#7d8aa0",
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
                      color: "#7d8aa0",
                    }}
                  >
                    No subscriptions found
                  </td>
                </tr>
              ) : (
                filtered.map(s => (
                  <tr
                    key={s.id}
                    style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 500 }}>
                        {s.organizationName || "—"}
                      </div>
                      <div style={{ fontSize: 12, color: "#7d8aa0" }}>
                        {s.billingEmail}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        textTransform: "capitalize",
                      }}
                    >
                      {s.plan} / {s.billingInterval}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        <SubStatus status={s.status} />
                        {s.cancelAtPeriodEnd ? (
                          <span
                            title="Cancels at end of current period"
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: "#f59e0b",
                              background: "rgba(245,158,11,0.10)",
                              border: "1px solid rgba(245,158,11,0.35)",
                              borderRadius: 20,
                              padding: "1px 8px",
                            }}
                          >
                            ENDS{" "}
                            {s.currentPeriodEnd
                              ? new Date(
                                  s.currentPeriodEnd
                                ).toLocaleDateString()
                              : ""}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      ${(s.amountCents / 100).toFixed(2)}
                      <span style={{ color: "#64748b", fontSize: 11 }}>
                        {" "}
                        /{s.billingInterval === "annual" ? "yr" : "mo"}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        color: "#7d8aa0",
                        fontSize: 12,
                      }}
                    >
                      {s.currentPeriodEnd
                        ? new Date(s.currentPeriodEnd).toLocaleDateString()
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

const thStyle: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "left",
  color: "#94a3b8",
  fontSize: 11,
  textTransform: "uppercase",
};

function SubStatus({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || "#94a3b8";
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color,
        background: `${color}14`,
        border: `1px solid ${color}40`,
        borderRadius: 20,
        padding: "2px 8px",
      }}
    >
      {status}
    </span>
  );
}
