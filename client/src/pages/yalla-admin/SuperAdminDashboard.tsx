/**
 * Yalla Hack Super Admin — Main Dashboard Overview
 * Executive KPIs, user stats, subscription metrics, system health.
 */
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  Users, Building2, CreditCard, Activity, Shield, Server,
  AlertTriangle, CheckCircle2, XCircle, TrendingUp, TrendingDown,
  RefreshCw, Eye, Search, ChevronRight, Clock,
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

      const statsData = await statsRes.json();
      const sysData = await sysRes.json();
      setStats(statsData);
      setSystem(sysData);
    } catch {
      // silent
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
    await fetch(`${ADMIN_API}/logout`, { method: "POST", credentials: "include" });
    navigate("/yalla-hack-owners-console/login");
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#0a0a0f" }}>
        <RefreshCw size={24} style={{ color: "#6366f1", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", fontFamily: "'Inter', sans-serif", color: "#e2e8f0" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ padding: "4px 10px", borderRadius: 6, background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.3)", fontSize: 10, fontWeight: 700, color: "#f87171", letterSpacing: "0.05em" }}>
            YALLA HACK ADMIN
          </div>
          <h1 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Dashboard</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={handleRefresh} disabled={refreshing} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 10px", color: "#94a3b8", cursor: "pointer" }}>
            <RefreshCw size={14} className={refreshing ? "spin" : ""} />
          </button>
          <button onClick={handleLogout} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 6, padding: "6px 14px", color: "#fca5a5", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Logout
          </button>
        </div>
      </header>

      <main style={{ padding: "24px", maxWidth: 1400, margin: "0 auto" }}>
        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
          <KPICard icon={<Users size={18} />} label="Total Users" value={stats?.totalUsers ?? 0} color="#6366f1" />
          <KPICard icon={<Building2 size={18} />} label="Organizations" value={stats?.totalOrgs ?? 0} color="#22d3ee" />
          <KPICard icon={<CreditCard size={18} />} label="Paid Orgs" value={stats?.paidOrgs ?? 0} color="#4ade80" />
          <KPICard icon={<Activity size={18} />} label="Today's Logins" value={stats?.todayLogins ?? 0} color="#f59e0b" />
          <KPICard icon={<Shield size={18} />} label="Active Sessions" value={stats?.activeSessions ?? 0} color="#a855f7" />
          <KPICard icon={<TrendingUp size={18} />} label="Today's Signups" value={stats?.todaySignups ?? 0} color="#ec4899" />
        </div>

        {/* System Health + Quick Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {/* System Health */}
          <div style={{ padding: 20, borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(15,15,25,0.8)" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
              <Server size={16} /> System Health
            </h3>
            {system ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <HealthRow label="Database" status={system.db.status} />
                <HealthRow label="Uptime" value={system.uptimeFormatted} />
                <HealthRow label="Memory" value={`${system.memory.heapUsed}MB / ${system.memory.heapTotal}MB`} />
                <HealthRow label="Environment" value={system.env.nodeEnv} />
                <HealthRow label="AI Queue" value={system.env.aiQueueMode} />
                <HealthRow label="Redis" status={system.env.redisConfigured ? "connected" : "not configured"} />
                <HealthRow label="SSE Clients" value={String(system.sseClients)} />
              </div>
            ) : (
              <p style={{ fontSize: 13, color: "#64748b" }}>System info unavailable</p>
            )}
          </div>

          {/* Quick Navigation */}
          <div style={{ padding: 20, borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(15,15,25,0.8)" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
              <Eye size={16} /> Quick Access
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <QuickLink label="User Management" icon={<Users size={14} />} path="/yalla-hack-owners-console/users" />
              <QuickLink label="Organizations" icon={<Building2 size={14} />} path="/yalla-hack-owners-console/organizations" />
              <QuickLink label="Subscriptions" icon={<CreditCard size={14} />} path="/yalla-hack-owners-console/subscriptions" />
              <QuickLink label="Security Monitor" icon={<Shield size={14} />} path="/yalla-hack-owners-console/security" />
              <QuickLink label="Audit Logs" icon={<Clock size={14} />} path="/yalla-hack-owners-console/audit" />
              <QuickLink label="Platform Analytics" icon={<Activity size={14} />} path="/yalla-hack-owners-console/analytics" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function KPICard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div style={{ padding: 20, borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(15,15,25,0.8)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", color }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1.2 }}>{value.toLocaleString()}</div>
      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>{label}</div>
    </div>
  );
}

function HealthRow({ label, value, status }: { label: string; value?: string; status?: string }) {
  const display = status || value || "unknown";
  const isHealthy = status === "healthy" || status === "connected";
  const isError = status === "error" || status === "unavailable";
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
      <span style={{ color: "#94a3b8" }}>{label}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 6, color: isHealthy ? "#4ade80" : isError ? "#f87171" : "#e2e8f0" }}>
        {isHealthy ? <CheckCircle2 size={12} /> : isError ? <XCircle size={12} /> : null}
        {display}
      </span>
    </div>
  );
}

function QuickLink({ label, icon, path }: { label: string; icon: React.ReactNode; path: string }) {
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
      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>{icon} {label}</span>
      <ChevronRight size={14} style={{ color: "#64748b" }} />
    </button>
  );
}
