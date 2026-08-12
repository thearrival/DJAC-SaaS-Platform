/**
 * Yalla Hack Super Admin — Platform Analytics
 * Registration trends, login frequency, feature usage, revenue metrics.
 */
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  BarChart3,
  RefreshCw,
  ChevronLeft,
  TrendingUp,
  Users,
  Activity,
  CreditCard,
} from "lucide-react";

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

export default function AdminAnalytics() {
  usePageTitle("Analytics — Yalla Hack Admin");
  const [, navigate] = useLocation();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

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
      setData({
        monthlyRegistrations: await regRes.json(),
        userStats: await statsRes.json(),
      });
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const maxReg = Math.max(
    ...(data?.monthlyRegistrations?.map(r => r.count) || [1]),
    1
  );

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
            Platform Analytics
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
            value={data?.userStats?.totalUsers ?? 0}
            color="#6366f1"
          />
          <KPI
            icon={<Activity size={18} />}
            label="Active Users"
            value={data?.userStats?.activeUsers ?? 0}
            color="#4ade80"
          />
          <KPI
            icon={<TrendingUp size={18} />}
            label="New This Month"
            value={data?.userStats?.newThisMonth ?? 0}
            color="#f59e0b"
          />
          <KPI
            icon={<CreditCard size={18} />}
            label="Roles"
            value={Object.keys(data?.userStats?.byRole || {}).length}
            color="#a855f7"
          />
        </div>

        {/* Registration Chart */}
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(15,15,25,0.8)",
            marginBottom: 24,
          }}
        >
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
            <p style={{ fontSize: 13, color: "#64748b" }}>Loading...</p>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 8,
                height: 160,
              }}
            >
              {data?.monthlyRegistrations?.map(r => (
                <div
                  key={r.month}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: `${Math.max((r.count / maxReg) * 140, 4)}px`,
                      background: "linear-gradient(180deg, #6366f1, #a855f7)",
                      borderRadius: "4px 4px 0 0",
                      minHeight: 4,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 9,
                      color: "#64748b",
                      transform: "rotate(-45deg)",
                      transformOrigin: "top left",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.month}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Role Distribution */}
        <div
          style={{
            padding: 20,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(15,15,25,0.8)",
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 16px" }}>
            User Distribution by Role
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Object.entries(data?.userStats?.byRole || {}).map(
              ([role, count]) => (
                <div
                  key={role}
                  style={{ display: "flex", alignItems: "center", gap: 12 }}
                >
                  <span style={{ fontSize: 13, color: "#94a3b8", width: 120 }}>
                    {role}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 20,
                      borderRadius: 4,
                      background: "rgba(255,255,255,0.04)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.max((count / (data?.userStats?.totalUsers || 1)) * 100, 2)}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #6366f1, #a855f7)",
                        borderRadius: 4,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      color: "#e2e8f0",
                      fontWeight: 600,
                      minWidth: 30,
                      textAlign: "right",
                    }}
                  >
                    {count}
                  </span>
                </div>
              )
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
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(15,15,25,0.8)",
      }}
    >
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
    </div>
  );
}
