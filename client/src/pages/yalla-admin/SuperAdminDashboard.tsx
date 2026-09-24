/**
 * Yalla Hack Super Admin — Main Dashboard Overview
 * Executive KPIs, user stats, subscription metrics, system health.
 */
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  Users,
  Building2,
  CreditCard,
  Activity,
  Shield,
  Server,
  CheckCircle2,
  XCircle,
  TrendingUp,
  RefreshCw,
  Eye,
  ChevronRight,
  Clock,
  Gauge,
  AlertTriangle,
  Inbox,
  Boxes,
  UserPlus,
} from "lucide-react";

const ADMIN_API = "/api/yalla-admin";

interface OverviewStats {
  totalUsers: number;
  totalOrgs: number;
  activeSessions: number;
  todayLogins: number;
  openServiceRequests: number;
  totalAssets: number;
  todaySignups: number;
  newOrgsToday: number;
  paidOrgs: number;
}

interface SystemInfo {
  uptime: number;
  uptimeFormatted: string;
  memory: { rss: number; heapUsed: number; heapTotal: number };
  db: { status: string; version: string; tableCount: number };
  env: { nodeEnv: string; aiQueueMode: string; redisConfigured: boolean };
  sseClients: number;
}

export default function SuperAdminDashboard() {
  usePageTitle("Admin Dashboard — Yalla Hack");
  const [, navigate] = useLocation();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [system, setSystem] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [statsRes, sysRes] = await Promise.all([
        fetch(`${ADMIN_API}/stats/overview`, { credentials: "include" }),
        fetch(`${ADMIN_API}/stats/system`, { credentials: "include" }),
      ]);

      if (statsRes.status === 401 || sysRes.status === 401) {
        navigate("/yalla-hack-owners-console/login");
        return;
      }
      if (!statsRes.ok) throw new Error(`overview: HTTP ${statsRes.status}`);
      if (!sysRes.ok) throw new Error(`system: HTTP ${sysRes.status}`);

      const statsData = await statsRes.json();
      const sysData = await sysRes.json();
      setStats(statsData);
      setSystem(sysData);
      setError("");
    } catch (e) {
      setError(`Could not load dashboard: ${(e as Error).message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  function handleRefresh() {
    setRefreshing(true);
    loadData();
  }

  async function handleLogout() {
    await fetch(`${ADMIN_API}/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    navigate("/yalla-hack-owners-console/login");
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "#050508",
        }}
      >
        <RefreshCw
          size={24}
          className="animate-spin"
          style={{ color: "#d900ff" }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050508",
        fontFamily: "'Inter', sans-serif",
        color: "#e2e8f0",
      }}
    >
      {/* Header */}
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
          <div
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              background: "rgba(220,38,38,0.15)",
              border: "1px solid rgba(220,38,38,0.3)",
              fontSize: 10,
              fontWeight: 700,
              color: "#ef4444",
              letterSpacing: "0.05em",
            }}
          >
            YALLA HACK ADMIN
          </div>
          <h1 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            Dashboard
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              padding: "6px 10px",
              color: "#94a3b8",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleLogout}
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 6,
              padding: "6px 14px",
              color: "#ef4444",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </header>

      <main style={{ padding: "24px", maxWidth: 1400, margin: "0 auto" }}>
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

        {/* KPI Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <KPICard
            icon={<Users size={18} />}
            label="Total Users"
            value={stats?.totalUsers ?? 0}
            color="#d900ff"
          />
          <KPICard
            icon={<Building2 size={18} />}
            label="Organizations"
            value={stats?.totalOrgs ?? 0}
            color="#00d2ff"
          />
          <KPICard
            icon={<CreditCard size={18} />}
            label="Paid Orgs"
            value={stats?.paidOrgs ?? 0}
            color="#10b981"
          />
          <KPICard
            icon={<Activity size={18} />}
            label="Today's Logins"
            value={stats?.todayLogins ?? 0}
            color="#f59e0b"
          />
          <KPICard
            icon={<Shield size={18} />}
            label="Active Sessions"
            value={stats?.activeSessions ?? 0}
            color="#d900ff"
          />
          <KPICard
            icon={<TrendingUp size={18} />}
            label="Today's Signups"
            value={stats?.todaySignups ?? 0}
            color="#d900ff"
          />
        </div>

        {/* Secondary KPI strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <MiniKPI
            icon={<Inbox size={14} />}
            label="Open Service Requests"
            value={stats?.openServiceRequests ?? 0}
            color={stats?.openServiceRequests ? "#f59e0b" : "#10b981"}
          />
          <MiniKPI
            icon={<Boxes size={14} />}
            label="Total Assets"
            value={stats?.totalAssets ?? 0}
            color="#00d2ff"
          />
          <MiniKPI
            icon={<UserPlus size={14} />}
            label="New Orgs Today"
            value={stats?.newOrgsToday ?? 0}
            color="#10b981"
          />
          <MiniKPI
            icon={<Server size={14} />}
            label="DB Version"
            text={system?.db?.version || "—"}
            color="#8b5cf6"
          />
        </div>

        {/* System Health + Quick Actions */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 16,
          }}
        >
          {/* System Health */}
          <div
            style={{
              padding: 20,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(15,15,25,0.8)",
            }}
          >
            <h3
              style={{
                fontSize: 14,
                fontWeight: 600,
                margin: "0 0 16px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Server size={16} /> System Health
            </h3>
            {system ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                <HealthRow label="Database" status={system.db.status} />
                <HealthRow label="Uptime" value={system.uptimeFormatted} />
                <HealthRow
                  label="Memory"
                  value={`${system.memory.heapUsed}MB / ${system.memory.heapTotal}MB`}
                />
                <HealthRow label="Environment" value={system.env.nodeEnv} />
                <HealthRow label="AI Queue" value={system.env.aiQueueMode} />
                <HealthRow
                  label="Redis"
                  status={
                    system.env.redisConfigured ? "connected" : "not configured"
                  }
                />
                <HealthRow
                  label="SSE Clients"
                  value={String(system.sseClients)}
                />
              </div>
            ) : (
              <p style={{ fontSize: 13, color: "#7d8aa0" }}>
                System info unavailable
              </p>
            )}
          </div>

          {/* Quick Navigation */}
          <div
            style={{
              padding: 20,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(15,15,25,0.8)",
            }}
          >
            <h3
              style={{
                fontSize: 14,
                fontWeight: 600,
                margin: "0 0 16px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Eye size={16} /> Quick Access
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <QuickLink
                label="User Management"
                icon={<Users size={14} />}
                path="/yalla-hack-owners-console/users"
              />
              <QuickLink
                label="Organizations"
                icon={<Building2 size={14} />}
                path="/yalla-hack-owners-console/organizations"
              />
              <QuickLink
                label="Subscriptions"
                icon={<CreditCard size={14} />}
                path="/yalla-hack-owners-console/subscriptions"
              />
              <QuickLink
                label="Security Monitor"
                icon={<Shield size={14} />}
                path="/yalla-hack-owners-console/security"
              />
              <QuickLink
                label="Audit Logs"
                icon={<Clock size={14} />}
                path="/yalla-hack-owners-console/audit"
              />
              <QuickLink
                label="Platform Analytics"
                icon={<Activity size={14} />}
                path="/yalla-hack-owners-console/analytics"
              />
              <QuickLink
                label="Platform Monitor"
                icon={<Gauge size={14} />}
                path="/yalla-hack-owners-console/monitor"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function KPICard({
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
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
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
          }}
        >
          {icon}
        </div>
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

function MiniKPI({
  icon,
  label,
  value,
  text,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value?: number;
  text?: string;
  color: string;
}) {
  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(15,15,25,0.8)",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: `${color}18`,
          border: `1px solid ${color}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 17,
            fontWeight: 800,
            color,
            lineHeight: 1.2,
          }}
        >
          {text ?? value?.toLocaleString()}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#94a3b8",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

function HealthRow({
  label,
  value,
  status,
}: {
  label: string;
  value?: string;
  status?: string;
}) {
  const display = status || value || "unknown";
  const isHealthy = status === "healthy" || status === "connected";
  const isError = status === "error" || status === "unavailable";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: 13,
      }}
    >
      <span style={{ color: "#94a3b8" }}>{label}</span>
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          color: isHealthy ? "#10b981" : isError ? "#ef4444" : "#e2e8f0",
        }}
      >
        {isHealthy ? (
          <CheckCircle2 size={12} />
        ) : isError ? (
          <XCircle size={12} />
        ) : null}
        {display}
      </span>
    </div>
  );
}

function QuickLink({
  label,
  icon,
  path,
}: {
  label: string;
  icon: React.ReactNode;
  path: string;
}) {
  const [, navigate] = useLocation();
  return (
    <button
      onClick={() => navigate(path)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        borderRadius: 8,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        color: "#e2e8f0",
        fontSize: 13,
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {icon} {label}
      </span>
      <ChevronRight size={14} style={{ color: "#7d8aa0" }} />
    </button>
  );
}
