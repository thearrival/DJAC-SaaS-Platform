/**
 * Yalla Hack Super Admin — Platform Monitor
 *
 * Founder-facing operational analytics over data that the user/subscription
 * views do not surface:
 *   • Traffic & engagement   (analyticsEvents, userActivitySummary)
 *   • Revenue & dunning      (subscriptions normalised to MRR, billingEvents)
 *   • AI workload health     (aiAgentRuns)
 *   • Email deliverability   (emailLog)
 *   • Security posture       (localUsers MFA adoption)
 *
 * Data comes from GET /api/admin-dashboard/platform/overview (founders
 * session cookie), with auto-refresh and per-section breakdowns.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  Activity,
  RefreshCw,
  ChevronLeft,
  Users,
  TrendingUp,
  Mail,
  Bot,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  Gauge,
} from "lucide-react";

const ADMIN_API = "/api/admin-dashboard";

interface TrafficMetrics {
  totalEvents: number;
  totalSessions: number;
  events24h: number;
  events7d: number;
  activeUsers24h: number;
  activeUsers7d: number;
  activeUsers30d: number;
  trackedUsers: number;
  avgActivationScore: number;
  avgHealthScore: number;
  daily: Array<{ date: string; events: number; users: number }>;
  signups: Array<{ date: string; count: number }>;
  topEvents: Array<{ event: string; category: string; count: number }>;
}

interface RevenueMetrics {
  mrrCents: number;
  arrCents: number;
  arpuCents: number;
  payingSubscriptions: number;
  trialingSubscriptions: number;
  pastDueSubscriptions: number;
  canceledSubscriptions: number;
  churnRiskSubscriptions: number;
  currency: string;
  byPlan: Array<{ plan: string; count: number; mrrCents: number }>;
  byStatus: Array<{ status: string; count: number }>;
  failedPayments30d: number;
  failedAmountCents30d: number;
  refundedAmountCents30d: number;
  recentBillingEvents: Array<{
    id: number;
    eventType: string;
    status: string;
    amountCents: number | null;
    currency: string;
    organizationName: string | null;
    createdAt: string;
  }>;
}

interface AiJobMetrics {
  total: number;
  queued: number;
  running: number;
  completed: number;
  failed: number;
  cancelled: number;
  successRate: number;
  avgDurationMs: number;
  p95DurationMs: number;
  last24h: number;
  recentFailures: Array<{
    id: number;
    agentName: string;
    organizationId: number | null;
    errorMessage: string | null;
    createdAt: string;
  }>;
}

interface EmailMetrics {
  total: number;
  sent: number;
  failed: number;
  opened: number;
  clicked: number;
  queued: number;
  openRate: number;
  clickRate: number;
  last24hSent: number;
  recentFailures: Array<{
    id: number;
    template: string;
    recipient: string;
    errorMessage: string | null;
    createdAt: string;
  }>;
}

interface SecurityMetrics {
  totalUsers: number;
  mfaEnabledUsers: number;
  mfaAdoptionRate: number;
  suspendedUsers: number;
  pendingUsers: number;
}

interface PlatformOverview {
  generatedAt: string;
  traffic: TrafficMetrics;
  revenue: RevenueMetrics;
  ai: AiJobMetrics;
  email: EmailMetrics;
  security: SecurityMetrics;
}

const money = (cents: number, currency = "USD"): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format((cents || 0) / 100);

const ms = (v: number): string => {
  if (!v) return "—";
  return v >= 1000 ? `${(v / 1000).toFixed(1)}s` : `${v}ms`;
};

export default function AdminPlatformMonitor() {
  usePageTitle("Platform Monitor — Yalla Hack Admin");
  const [, navigate] = useLocation();
  const [data, setData] = useState<PlatformOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [days, setDays] = useState(30);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`${ADMIN_API}/platform/overview?days=${days}`, {
        credentials: "include",
      });
      if (res.status === 401) {
        navigate("/yalla-hack-owners-console/login");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [days, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(loadData, 60_000);
    return () => window.clearInterval(id);
  }, [autoRefresh, loadData]);

  const t = data?.traffic;
  const r = data?.revenue;
  const ai = data?.ai;
  const em = data?.email;
  const sec = data?.security;

  const maxDaily = useMemo(
    () => Math.max(1, ...(t?.daily || []).map(d => d.events)),
    [t]
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050508",
        fontFamily: "'Inter', sans-serif",
        color: "#ffffff",
      }}
    >
      <header
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          position: "sticky",
          top: 0,
          background: "rgba(5,5,8,0.92)",
          backdropFilter: "blur(8px)",
          zIndex: 10,
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
              display: "flex",
            }}
            aria-label="Back to dashboard"
          >
            <ChevronLeft size={18} />
          </button>
          <h1 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            Platform Monitor
          </h1>
          {data && (
            <span style={{ fontSize: 11, color: "#7d8aa0" }}>
              updated {new Date(data.generatedAt).toLocaleTimeString()}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <select
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              padding: "6px 8px",
              color: "#94a3b8",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {[7, 14, 30, 60, 90].map(d => (
              <option key={d} value={d} style={{ background: "#0b0b12" }}>
                Last {d}d
              </option>
            ))}
          </select>
          <button
            onClick={() => setAutoRefresh(v => !v)}
            style={{
              background: autoRefresh
                ? "rgba(16,185,129,0.12)"
                : "rgba(255,255,255,0.04)",
              border: `1px solid ${autoRefresh ? "rgba(16,185,129,0.35)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 6,
              padding: "6px 10px",
              color: autoRefresh ? "#10b981" : "#94a3b8",
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            {autoRefresh ? "Auto 60s" : "Paused"}
          </button>
          <button
            onClick={loadData}
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              padding: "6px 10px",
              color: "#94a3b8",
              cursor: "pointer",
              display: "flex",
            }}
            aria-label="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </header>

      <main style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid rgba(239,68,68,0.35)",
              background: "rgba(239,68,68,0.1)",
              color: "#fca5a5",
              fontSize: 13,
            }}
          >
            Could not load platform metrics: {error}
          </div>
        )}

        {/* ── Headline KPIs ─────────────────────────────────────────── */}
        <SectionLabel>Business health</SectionLabel>
        <div style={gridStyle}>
          <KPI
            icon={<CreditCard size={18} />}
            label="MRR (interval-normalised)"
            value={money(r?.mrrCents ?? 0, r?.currency)}
            color="#d900ff"
            sub={`${r?.payingSubscriptions ?? 0} paying · ARPU ${money(r?.arpuCents ?? 0, r?.currency)}`}
          />
          <KPI
            icon={<TrendingUp size={18} />}
            label="ARR"
            value={money(r?.arrCents ?? 0, r?.currency)}
            color="#00d2ff"
            sub={`${r?.trialingSubscriptions ?? 0} trialing · ${r?.pastDueSubscriptions ?? 0} past due`}
          />
          <KPI
            icon={<Users size={18} />}
            label="Active users (24h)"
            value={String(t?.activeUsers24h ?? 0)}
            color="#10b981"
            sub={`7d ${t?.activeUsers7d ?? 0} · 30d ${t?.activeUsers30d ?? 0}`}
          />
          <KPI
            icon={<Activity size={18} />}
            label="Events (24h)"
            value={(t?.events24h ?? 0).toLocaleString()}
            color="#00d2ff"
            sub={`7d ${(t?.events7d ?? 0).toLocaleString()} · all ${(t?.totalEvents ?? 0).toLocaleString()}`}
          />
        </div>

        {/* ── Risk KPIs ─────────────────────────────────────────────── */}
        <SectionLabel>Risk &amp; reliability</SectionLabel>
        <div style={gridStyle}>
          <KPI
            icon={<AlertTriangle size={18} />}
            label="Failed payments (30d)"
            value={String(r?.failedPayments30d ?? 0)}
            color={r && r.failedPayments30d > 0 ? "#ef4444" : "#10b981"}
            sub={`${money(r?.failedAmountCents30d ?? 0, r?.currency)} at risk`}
          />
          <KPI
            icon={<Bot size={18} />}
            label="AI success rate"
            value={`${ai?.successRate ?? 0}%`}
            color={
              ai && ai.successRate < 90 && ai.completed + ai.failed > 0
                ? "#f59e0b"
                : "#10b981"
            }
            sub={`${ai?.completed ?? 0} ok · ${ai?.failed ?? 0} failed · p95 ${ms(ai?.p95DurationMs ?? 0)}`}
          />
          <KPI
            icon={<Mail size={18} />}
            label="Email open rate"
            value={`${em?.openRate ?? 0}%`}
            color="#00d2ff"
            sub={`${em?.sent ?? 0} sent · ${em?.failed ?? 0} failed`}
          />
          <KPI
            icon={<ShieldCheck size={18} />}
            label="MFA adoption"
            value={`${sec?.mfaAdoptionRate ?? 0}%`}
            color={sec && sec.mfaAdoptionRate < 25 ? "#f59e0b" : "#10b981"}
            sub={`${sec?.mfaEnabledUsers ?? 0}/${sec?.totalUsers ?? 0} users`}
          />
        </div>

        {/* ── Traffic ───────────────────────────────────────────────── */}
        <SectionLabel>Traffic &amp; engagement</SectionLabel>
        <div style={gridStyle}>
          <Panel title="Daily events" icon={<Activity size={16} />} wide>
            {loading ? (
              <Muted>Loading…</Muted>
            ) : (t?.daily || []).length === 0 ? (
              <Muted>No analytics events recorded yet.</Muted>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 4,
                    height: 150,
                  }}
                >
                  {(t?.daily || []).map(d => (
                    <div
                      key={d.date}
                      title={`${d.date}: ${d.events} events, ${d.users} users`}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 3,
                        minWidth: 4,
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: `${Math.max((d.events / maxDaily) * 130, 3)}px`,
                          background: "linear-gradient(180deg,#d900ff,#00d2ff)",
                          borderRadius: "3px 3px 0 0",
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 8,
                    fontSize: 10,
                    color: "#7d8aa0",
                  }}
                >
                  <span>{(t?.daily || [])[0]?.date}</span>
                  <span>{(t?.daily || []).slice(-1)[0]?.date}</span>
                </div>
              </>
            )}
          </Panel>

          <Panel title="Top events" icon={<Gauge size={16} />}>
            <BarList
              items={(t?.topEvents || []).map(e => ({
                label: `${e.event} · ${e.category}`,
                value: e.count,
              }))}
              empty="No events yet."
            />
          </Panel>

          <Panel title="New signups" icon={<Users size={16} />}>
            <BarList
              items={(t?.signups || []).map(s => ({
                label: s.date,
                value: s.count,
              }))}
              empty="No signups in this window."
            />
          </Panel>
        </div>

        {/* ── Revenue ───────────────────────────────────────────────── */}
        <SectionLabel>Revenue breakdown</SectionLabel>
        <div style={gridStyle}>
          <Panel title="MRR by plan" icon={<CreditCard size={16} />}>
            <BarList
              items={(r?.byPlan || []).map(p => ({
                label: `${p.plan} (${p.count})`,
                value: p.mrrCents,
                display: money(p.mrrCents, r?.currency),
              }))}
              empty="No active subscriptions."
            />
          </Panel>

          <Panel title="Subscriptions by status" icon={<Activity size={16} />}>
            <BarList
              items={(r?.byStatus || []).map(s => ({
                label: s.status,
                value: s.count,
              }))}
              empty="No subscriptions."
            />
          </Panel>

          <Panel
            title="Recent billing events"
            icon={<CreditCard size={16} />}
            wide
          >
            <Table
              head={["When", "Event", "Status", "Amount"]}
              rows={(r?.recentBillingEvents || []).map(b => [
                fmtTime(b.createdAt),
                b.eventType,
                b.status,
                b.amountCents != null ? money(b.amountCents, b.currency) : "—",
              ])}
              empty="No billing events."
            />
          </Panel>
        </div>

        {/* ── AI + Email ────────────────────────────────────────────── */}
        <SectionLabel>AI workload &amp; email deliverability</SectionLabel>
        <div style={gridStyle}>
          <Panel title="AI agent runs" icon={<Bot size={16} />}>
            <StatRow label="Queued" value={ai?.queued ?? 0} />
            <StatRow label="Running" value={ai?.running ?? 0} />
            <StatRow
              label="Completed"
              value={ai?.completed ?? 0}
              tone="#10b981"
            />
            <StatRow label="Failed" value={ai?.failed ?? 0} tone="#ef4444" />
            <StatRow label="Cancelled" value={ai?.cancelled ?? 0} />
            <StatRow label="Avg duration" value={ms(ai?.avgDurationMs ?? 0)} />
            <StatRow label="p95 duration" value={ms(ai?.p95DurationMs ?? 0)} />
            <StatRow label="Last 24h" value={ai?.last24h ?? 0} />
          </Panel>

          <Panel title="Recent AI failures" icon={<AlertTriangle size={16} />}>
            <Table
              head={["When", "Agent", "Error"]}
              rows={(ai?.recentFailures || []).map(f => [
                fmtTime(f.createdAt),
                f.agentName,
                (f.errorMessage || "—").slice(0, 80),
              ])}
              empty="No recent failures."
            />
          </Panel>

          <Panel title="Email delivery" icon={<Mail size={16} />}>
            <StatRow label="Sent" value={em?.sent ?? 0} tone="#10b981" />
            <StatRow label="Queued" value={em?.queued ?? 0} />
            <StatRow label="Failed" value={em?.failed ?? 0} tone="#ef4444" />
            <StatRow label="Opened" value={em?.opened ?? 0} />
            <StatRow label="Clicked" value={em?.clicked ?? 0} />
            <StatRow label="Open rate" value={`${em?.openRate ?? 0}%`} />
            <StatRow label="Click rate" value={`${em?.clickRate ?? 0}%`} />
            <StatRow label="Sent 24h" value={em?.last24hSent ?? 0} />
          </Panel>
        </div>

        {/* ── Security ──────────────────────────────────────────────── */}
        <SectionLabel>Security posture</SectionLabel>
        <div style={gridStyle}>
          <Panel title="Accounts" icon={<ShieldCheck size={16} />}>
            <StatRow label="Total users" value={sec?.totalUsers ?? 0} />
            <StatRow label="MFA enabled" value={sec?.mfaEnabledUsers ?? 0} />
            <StatRow
              label="MFA adoption"
              value={`${sec?.mfaAdoptionRate ?? 0}%`}
              tone={sec && sec.mfaAdoptionRate < 25 ? "#f59e0b" : "#10b981"}
            />
            <StatRow
              label="Suspended"
              value={sec?.suspendedUsers ?? 0}
              tone="#ef4444"
            />
            <StatRow label="Pending" value={sec?.pendingUsers ?? 0} />
          </Panel>

          <Panel title="Engagement quality" icon={<Gauge size={16} />}>
            <StatRow label="Tracked users" value={t?.trackedUsers ?? 0} />
            <StatRow label="Total sessions" value={t?.totalSessions ?? 0} />
            <StatRow
              label="Avg activation score"
              value={t?.avgActivationScore ?? 0}
            />
            <StatRow label="Avg health score" value={t?.avgHealthScore ?? 0} />
            <StatRow
              label="Churn risk (cancel at period end)"
              value={r?.churnRiskSubscriptions ?? 0}
              tone={r && r.churnRiskSubscriptions > 0 ? "#f59e0b" : "#10b981"}
            />
            <StatRow
              label="Refunded 30d"
              value={money(r?.refundedAmountCents30d ?? 0, r?.currency)}
            />
          </Panel>

          <Panel
            title="Recent email failures"
            icon={<AlertTriangle size={16} />}
          >
            <Table
              head={["When", "Template", "Recipient"]}
              rows={(em?.recentFailures || []).map(f => [
                fmtTime(f.createdAt),
                f.template,
                f.recipient,
              ])}
              empty="No recent failures."
            />
          </Panel>
        </div>
      </main>
    </div>
  );
}

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 16,
  marginBottom: 8,
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1.2,
        textTransform: "uppercase",
        color: "#7d8aa0",
        margin: "24px 0 12px",
      }}
    >
      {children}
    </h2>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 13, color: "#7d8aa0", margin: 0 }}>{children}</p>
  );
}

function fmtTime(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "—";
  }
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
  value: string;
  color: string;
  sub?: string;
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
      <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1.2 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "#7d8aa0", marginTop: 6 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
  wide,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(15,15,25,0.8)",
        gridColumn: wide ? "span 2" : undefined,
        minWidth: 0,
      }}
    >
      <h3
        style={{
          fontSize: 13,
          fontWeight: 600,
          margin: "0 0 16px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: "#ffffff",
        }}
      >
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

function StatRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "7px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        fontSize: 13,
      }}
    >
      <span style={{ color: "#94a3b8" }}>{label}</span>
      <span style={{ fontWeight: 600, color: tone || "#ffffff" }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
    </div>
  );
}

function BarList({
  items,
  empty,
}: {
  items: Array<{ label: string; value: number; display?: string }>;
  empty: string;
}) {
  const max = Math.max(1, ...items.map(i => i.value));
  if (items.length === 0) return <Muted>{empty}</Muted>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map(i => (
        <div
          key={i.label}
          style={{ display: "flex", alignItems: "center", gap: 10 }}
        >
          <span
            style={{
              fontSize: 12,
              color: "#94a3b8",
              width: 150,
              flexShrink: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={i.label}
          >
            {i.label}
          </span>
          <div
            style={{
              flex: 1,
              height: 18,
              borderRadius: 4,
              background: "rgba(255,255,255,0.04)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${Math.max((i.value / max) * 100, 2)}%`,
                height: "100%",
                background: "linear-gradient(90deg,#d900ff,#00d2ff)",
                borderRadius: 4,
              }}
            />
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#ffffff",
              minWidth: 64,
              textAlign: "right",
            }}
          >
            {i.display ?? i.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

function Table({
  head,
  rows,
  empty,
}: {
  head: string[];
  rows: Array<Array<string | number>>;
  empty: string;
}) {
  if (rows.length === 0) return <Muted>{empty}</Muted>;
  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 12,
        }}
      >
        <thead>
          <tr>
            {head.map(h => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  padding: "6px 8px",
                  color: "#7d8aa0",
                  fontWeight: 600,
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  style={{
                    padding: "6px 8px",
                    color: ci === 0 ? "#7d8aa0" : "#e2e8f0",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
