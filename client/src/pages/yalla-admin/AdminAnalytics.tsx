/**
 * Yalla Hack Super Admin — Platform Analytics
 * Registration trends, login frequency, feature usage, revenue metrics.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  BarChart3,
  RefreshCw,
  ChevronLeft,
  TrendingUp,
  Users,
  Activity,
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

interface AnalyticsData {
  monthlyRegistrations: Array<{ month: string; count: number }>;
  userStats: {
    totalUsers: number;
    activeUsers: number;
    newThisMonth: number;
    byRole: Record<string, number>;
  };
}

const ROLE_COLORS = [
  "#d900ff",
  "#00d2ff",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
  "#f472b6",
  "#60a5fa",
  "#a3e635",
];

const cardStyle: React.CSSProperties = {
  padding: 20,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(15,15,25,0.8)",
};

export default function AdminAnalytics() {
  usePageTitle("Analytics — Yalla Hack Admin");
  const [, navigate] = useLocation();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [regRes, statsRes] = await Promise.all([
        fetch(`${ADMIN_API}/users/registrations?months=12`, {
          credentials: "include",
        }),
        fetch(`${ADMIN_API}/users/stats`, { credentials: "include" }),
      ]);
      if (regRes.status === 401 || statsRes.status === 401) {
        navigate("/yalla-hack-owners-console/login");
        return;
      }
      if (!regRes.ok) throw new Error(`registrations: HTTP ${regRes.status}`);
      if (!statsRes.ok) throw new Error(`stats: HTTP ${statsRes.status}`);
      setData({
        monthlyRegistrations: await regRes.json(),
        userStats: await statsRes.json(),
      });
      setError("");
      setUpdatedAt(new Date().toLocaleTimeString());
    } catch (e) {
      setError(`Could not load analytics: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalUsers = data?.userStats?.totalUsers ?? 0;
  const activeUsers = data?.userStats?.activeUsers ?? 0;
  const newThisMonth = data?.userStats?.newThisMonth ?? 0;
  const activationRate =
    totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

  const rolePie = useMemo(() => {
    const entries = Object.entries(data?.userStats?.byRole || {});
    return entries.map(([name, value], i) => ({
      name,
      value,
      color: ROLE_COLORS[i % ROLE_COLORS.length],
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
            Platform Analytics
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

        {/* KPIs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <KPI
            icon={<Users size={18} />}
            label="Total Users"
            value={totalUsers}
            color="#d900ff"
          />
          <KPI
            icon={<Activity size={18} />}
            label="Active Users"
            value={activeUsers}
            color="#10b981"
            sub={`${activationRate}% activation rate`}
          />
          <KPI
            icon={<TrendingUp size={18} />}
            label="New This Month"
            value={newThisMonth}
            color="#f59e0b"
          />
          <KPI
            icon={<BarChart3 size={18} />}
            label="Inactive"
            value={Math.max(totalUsers - activeUsers, 0)}
            color="#64748b"
            sub="registered, not yet active"
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {/* Registration Chart */}
          <div style={cardStyle}>
            <h3
              style={{
                fontSize: 14,
                fontWeight: 600,
                margin: "0 0 20px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <BarChart3 size={16} /> Monthly Registrations (12 months)
            </h3>
            {loading ? (
              <p style={{ fontSize: 13, color: "#7d8aa0" }}>Loading...</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart
                  data={data?.monthlyRegistrations ?? []}
                  margin={{ top: 4, right: 8, left: -18, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="regFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d900ff" stopOpacity={0.5} />
                      <stop
                        offset="100%"
                        stopColor="#d900ff"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                    tickLine={false}
                    interval={0}
                    angle={-35}
                    textAnchor="end"
                    height={50}
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
                    name="Registrations"
                    stroke="#d900ff"
                    strokeWidth={2}
                    fill="url(#regFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Role Distribution */}
          <div style={cardStyle}>
            <h3
              style={{
                fontSize: 14,
                fontWeight: 600,
                margin: "0 0 16px",
              }}
            >
              User Distribution by Role
            </h3>
            {loading ? (
              <p style={{ fontSize: 13, color: "#7d8aa0" }}>Loading...</p>
            ) : rolePie.length === 0 ? (
              <p style={{ fontSize: 13, color: "#64748b" }}>No role data</p>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  flexWrap: "wrap",
                }}
              >
                <ResponsiveContainer width={150} height={160}>
                  <PieChart>
                    <Pie
                      data={rolePie}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={42}
                      outerRadius={68}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {rolePie.map(r => (
                        <Cell key={r.name} fill={r.color} />
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
                    gap: 7,
                    flex: 1,
                    minWidth: 150,
                  }}
                >
                  {rolePie
                    .slice()
                    .sort((a, b) => b.value - a.value)
                    .map(r => (
                      <div
                        key={r.name}
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
                            background: r.color,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            color: "#94a3b8",
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            textTransform: "capitalize",
                          }}
                        >
                          {r.name.replace(/_/g, " ")}
                        </span>
                        <span style={{ color: "#e2e8f0", fontWeight: 700 }}>
                          {r.value}
                        </span>
                        <span style={{ color: "#64748b", fontSize: 11 }}>
                          {totalUsers > 0
                            ? Math.round((r.value / totalUsers) * 100)
                            : 0}
                          %
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function KPI({
  icon,
  label,
  value,
  color,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  sub?: string;
}) {
  return (
    <div style={cardStyle}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: `${color}18`,
          border: `1px solid ${color}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
          marginBottom: 12,
        }}
      >
        {icon}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1.2 }}>
        {value.toLocaleString()}
      </div>
      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  );
}
