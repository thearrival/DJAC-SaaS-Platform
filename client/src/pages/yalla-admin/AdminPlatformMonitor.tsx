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
import { useLocale } from "@/contexts/useLocale";
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
import { storedLocaleTag } from "@/lib/intl";

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
  const { t } = useLocale();
  usePageTitle(
    t(
      "yallaAdmin.platformMonitor.pageTitle",
      "Platform Monitor — Yalla Hack Admin"
    )
  );
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

  const traffic = data?.traffic;
  const r = data?.revenue;
  const ai = data?.ai;
  const em = data?.email;
  const sec = data?.security;

  const maxDaily = useMemo(
    () => Math.max(1, ...(traffic?.daily || []).map(d => d.events)),
    [traffic]
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--djac-bg)",
        fontFamily: "'Inter', sans-serif",
        color: "var(--djac-text)",
      }}
    >
      <header
        style={{
          borderBottom: "1px solid var(--djac-border)",
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
              color: "var(--djac-muted)",
              cursor: "pointer",
              padding: 0,
              display: "flex",
            }}
            aria-label={t("common.back", "Back")}
          >
            <ChevronLeft size={18} />
          </button>
          <h1 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            {t("yallaAdmin.platformMonitor.title", "Platform Monitor")}
          </h1>
          {data && (
            <span style={{ fontSize: 11, color: "var(--djac-muted)" }}>
              {t("yallaAdmin.security.updated", "updated {time}").replace(
                "{time}",
                new Date(data.generatedAt).toLocaleTimeString(storedLocaleTag())
              )}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <select
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            style={{
              background: "var(--djac-card-hi)",
              border: "1px solid var(--djac-border)",
              borderRadius: 6,
              padding: "6px 8px",
              color: "var(--djac-muted)",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {[7, 14, 30, 60, 90].map(d => (
              <option
                key={d}
                value={d}
                style={{ background: "var(--djac-bg-deep)" }}
              >
                {t(
                  "yallaAdmin.platformMonitor.lastDays",
                  "Last {days}d"
                ).replace("{days}", String(d))}
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
            {autoRefresh
              ? t("yallaAdmin.platformMonitor.auto60s", "Auto 60s")
              : t("yallaAdmin.security.paused", "Paused")}
          </button>
          <button
            onClick={loadData}
            style={{
              background: "none",
              border: "1px solid var(--djac-border)",
              borderRadius: 6,
              padding: "6px 10px",
              color: "var(--djac-muted)",
              cursor: "pointer",
              display: "flex",
            }}
            aria-label={t("yallaAdmin.common.refresh", "Refresh")}
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
            {t(
              "yallaAdmin.platformMonitor.loadError",
              "Could not load platform metrics: {message}"
            ).replace("{message}", String(error))}
          </div>
        )}

        {/* ── Headline KPIs ─────────────────────────────────────────── */}
        <SectionLabel>
          {t("yallaAdmin.platformMonitor.businessHealth", "Business health")}
        </SectionLabel>
        <div style={gridStyle}>
          <KPI
            icon={<CreditCard size={18} />}
            label={t(
              "yallaAdmin.platformMonitor.kpi.mrr",
              "MRR (interval-normalised)"
            )}
            value={money(r?.mrrCents ?? 0, r?.currency)}
            color="#d900ff"
            sub={t(
              "yallaAdmin.platformMonitor.sub.payingArpu",
              "{count} paying • ARPU {arpu}"
            )
              .replace("{count}", String(r?.payingSubscriptions ?? 0))
              .replace("{arpu}", money(r?.arpuCents ?? 0, r?.currency))}
          />
          <KPI
            icon={<TrendingUp size={18} />}
            label={t("yallaAdmin.platformMonitor.kpi.arr", "ARR")}
            value={money(r?.arrCents ?? 0, r?.currency)}
            color="#00d2ff"
            sub={t(
              "yallaAdmin.platformMonitor.sub.trialingPastDue",
              "{trialing} trialing • {pastDue} past due"
            )
              .replace("{trialing}", String(r?.trialingSubscriptions ?? 0))
              .replace("{pastDue}", String(r?.pastDueSubscriptions ?? 0))}
          />
          <KPI
            icon={<Users size={18} />}
            label={t(
              "yallaAdmin.platformMonitor.kpi.activeUsers24h",
              "Active users (24h)"
            )}
            value={String(traffic?.activeUsers24h ?? 0)}
            color="#10b981"
            sub={t(
              "yallaAdmin.platformMonitor.sub.activeUsers",
              "7d {d7} • 30d {d30}"
            )
              .replace("{d7}", String(traffic?.activeUsers7d ?? 0))
              .replace("{d30}", String(traffic?.activeUsers30d ?? 0))}
          />
          <KPI
            icon={<Activity size={18} />}
            label={t(
              "yallaAdmin.platformMonitor.kpi.events24h",
              "Events (24h)"
            )}
            value={(traffic?.events24h ?? 0).toLocaleString(storedLocaleTag())}
            color="#00d2ff"
            sub={t(
              "yallaAdmin.platformMonitor.sub.events",
              "7d {d7} • all {all}"
            )
              .replace(
                "{d7}",
                (traffic?.events7d ?? 0).toLocaleString(storedLocaleTag())
              )
              .replace(
                "{all}",
                (traffic?.totalEvents ?? 0).toLocaleString(storedLocaleTag())
              )}
          />
        </div>

        {/* ── Risk KPIs ─────────────────────────────────────────────── */}
        <SectionLabel>
          {t(
            "yallaAdmin.platformMonitor.riskReliability",
            "Risk & reliability"
          )}
        </SectionLabel>
        <div style={gridStyle}>
          <KPI
            icon={<AlertTriangle size={18} />}
            label={t(
              "yallaAdmin.platformMonitor.kpi.failedPayments30d",
              "Failed payments (30d)"
            )}
            value={String(r?.failedPayments30d ?? 0)}
            color={r && r.failedPayments30d > 0 ? "#ef4444" : "#10b981"}
            sub={t(
              "yallaAdmin.platformMonitor.sub.atRisk",
              "{amount} at risk"
            ).replace(
              "{amount}",
              money(r?.failedAmountCents30d ?? 0, r?.currency)
            )}
          />
          <KPI
            icon={<Bot size={18} />}
            label={t(
              "yallaAdmin.platformMonitor.kpi.aiSuccessRate",
              "AI success rate"
            )}
            value={`${ai?.successRate ?? 0}%`}
            color={
              ai && ai.successRate < 90 && ai.completed + ai.failed > 0
                ? "#f59e0b"
                : "#10b981"
            }
            sub={t(
              "yallaAdmin.platformMonitor.sub.aiStats",
              "{ok} ok • {failed} failed • p95 {p95}"
            )
              .replace("{ok}", String(ai?.completed ?? 0))
              .replace("{failed}", String(ai?.failed ?? 0))
              .replace("{p95}", ms(ai?.p95DurationMs ?? 0))}
          />
          <KPI
            icon={<Mail size={18} />}
            label={t(
              "yallaAdmin.platformMonitor.kpi.emailOpenRate",
              "Email open rate"
            )}
            value={`${em?.openRate ?? 0}%`}
            color="#00d2ff"
            sub={t(
              "yallaAdmin.platformMonitor.sub.emailStats",
              "{sent} sent • {failed} failed"
            )
              .replace("{sent}", String(em?.sent ?? 0))
              .replace("{failed}", String(em?.failed ?? 0))}
          />
          <KPI
            icon={<ShieldCheck size={18} />}
            label={t(
              "yallaAdmin.platformMonitor.kpi.mfaAdoption",
              "MFA adoption"
            )}
            value={`${sec?.mfaAdoptionRate ?? 0}%`}
            color={sec && sec.mfaAdoptionRate < 25 ? "#f59e0b" : "#10b981"}
            sub={t(
              "yallaAdmin.platformMonitor.sub.mfaUsers",
              "{enabled}/{total} users"
            )
              .replace("{enabled}", String(sec?.mfaEnabledUsers ?? 0))
              .replace("{total}", String(sec?.totalUsers ?? 0))}
          />
        </div>

        {/* ── Traffic ───────────────────────────────────────────────── */}
        <SectionLabel>
          {t(
            "yallaAdmin.platformMonitor.trafficEngagement",
            "Traffic & engagement"
          )}
        </SectionLabel>
        <div style={gridStyle}>
          <Panel
            title={t(
              "yallaAdmin.platformMonitor.panel.dailyEvents",
              "Daily events"
            )}
            icon={<Activity size={16} />}
            wide
          >
            {loading ? (
              <Muted>
                {t("yallaAdmin.platformMonitor.loading", "Loading…")}
              </Muted>
            ) : (traffic?.daily || []).length === 0 ? (
              <Muted>
                {t(
                  "yallaAdmin.platformMonitor.empty.noAnalytics",
                  "No analytics events recorded yet."
                )}
              </Muted>
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
                  {(traffic?.daily || []).map(d => (
                    <div
                      key={d.date}
                      title={t(
                        "yallaAdmin.platformMonitor.tooltip.eventsUsers",
                        "{date}: {events} events, {users} users"
                      )
                        .replace("{date}", d.date)
                        .replace("{events}", String(d.events))
                        .replace("{users}", String(d.users))}
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
                    color: "var(--djac-muted)",
                  }}
                >
                  <span>{(traffic?.daily || [])[0]?.date}</span>
                  <span>{(traffic?.daily || []).slice(-1)[0]?.date}</span>
                </div>
              </>
            )}
          </Panel>

          <Panel
            title={t(
              "yallaAdmin.platformMonitor.panel.topEvents",
              "Top events"
            )}
            icon={<Gauge size={16} />}
          >
            <BarList
              items={(traffic?.topEvents || []).map(e => ({
                label: `${e.event} • ${e.category}`,
                value: e.count,
              }))}
              empty={t(
                "yallaAdmin.platformMonitor.empty.noEvents",
                "No events yet."
              )}
            />
          </Panel>

          <Panel
            title={t(
              "yallaAdmin.platformMonitor.panel.newSignups",
              "New signups"
            )}
            icon={<Users size={16} />}
          >
            <BarList
              items={(traffic?.signups || []).map(s => ({
                label: s.date,
                value: s.count,
              }))}
              empty={t(
                "yallaAdmin.platformMonitor.empty.noSignups",
                "No signups in this window."
              )}
            />
          </Panel>
        </div>

        {/* ── Revenue ───────────────────────────────────────────────── */}
        <SectionLabel>
          {t(
            "yallaAdmin.platformMonitor.revenueBreakdown",
            "Revenue breakdown"
          )}
        </SectionLabel>
        <div style={gridStyle}>
          <Panel
            title={t(
              "yallaAdmin.platformMonitor.panel.mrrByPlan",
              "MRR by plan"
            )}
            icon={<CreditCard size={16} />}
          >
            <BarList
              items={(r?.byPlan || []).map(p => ({
                label: `${p.plan} (${p.count})`,
                value: p.mrrCents,
                display: money(p.mrrCents, r?.currency),
              }))}
              empty={t(
                "yallaAdmin.platformMonitor.empty.noActiveSubs",
                "No active subscriptions."
              )}
            />
          </Panel>

          <Panel
            title={t(
              "yallaAdmin.platformMonitor.panel.subsByStatus",
              "Subscriptions by status"
            )}
            icon={<Activity size={16} />}
          >
            <BarList
              items={(r?.byStatus || []).map(s => ({
                label: s.status,
                value: s.count,
              }))}
              empty={t(
                "yallaAdmin.platformMonitor.empty.noSubs",
                "No subscriptions."
              )}
            />
          </Panel>

          <Panel
            title={t(
              "yallaAdmin.platformMonitor.panel.recentBillingEvents",
              "Recent billing events"
            )}
            icon={<CreditCard size={16} />}
            wide
          >
            <Table
              head={[
                t("yallaAdmin.platformMonitor.table.when", "When"),
                t("yallaAdmin.platformMonitor.table.event", "Event"),
                t("yallaAdmin.platformMonitor.table.status", "Status"),
                t("yallaAdmin.platformMonitor.table.amount", "Amount"),
              ]}
              rows={(r?.recentBillingEvents || []).map(b => [
                fmtTime(b.createdAt),
                b.eventType,
                b.status,
                b.amountCents != null
                  ? money(b.amountCents, b.currency)
                  : t("yallaAdmin.common.notAvailable", "—"),
              ])}
              empty={t(
                "yallaAdmin.platformMonitor.empty.noBillingEvents",
                "No billing events."
              )}
            />
          </Panel>
        </div>

        {/* ── AI + Email ────────────────────────────────────────────── */}
        <SectionLabel>
          {t(
            "yallaAdmin.platformMonitor.aiEmail",
            "AI workload & email deliverability"
          )}
        </SectionLabel>
        <div style={gridStyle}>
          <Panel
            title={t(
              "yallaAdmin.platformMonitor.panel.aiAgentRuns",
              "AI agent runs"
            )}
            icon={<Bot size={16} />}
          >
            <StatRow
              label={t("yallaAdmin.platformMonitor.stat.queued", "Queued")}
              value={ai?.queued ?? 0}
            />
            <StatRow
              label={t("yallaAdmin.platformMonitor.stat.running", "Running")}
              value={ai?.running ?? 0}
            />
            <StatRow
              label={t(
                "yallaAdmin.platformMonitor.stat.completed",
                "Completed"
              )}
              value={ai?.completed ?? 0}
              tone="#10b981"
            />
            <StatRow
              label={t("yallaAdmin.platformMonitor.stat.failed", "Failed")}
              value={ai?.failed ?? 0}
              tone="#ef4444"
            />
            <StatRow
              label={t(
                "yallaAdmin.platformMonitor.stat.cancelled",
                "Cancelled"
              )}
              value={ai?.cancelled ?? 0}
            />
            <StatRow
              label={t(
                "yallaAdmin.platformMonitor.stat.avgDuration",
                "Avg duration"
              )}
              value={ms(ai?.avgDurationMs ?? 0)}
            />
            <StatRow
              label={t(
                "yallaAdmin.platformMonitor.stat.p95Duration",
                "p95 duration"
              )}
              value={ms(ai?.p95DurationMs ?? 0)}
            />
            <StatRow
              label={t("yallaAdmin.platformMonitor.stat.last24h", "Last 24h")}
              value={ai?.last24h ?? 0}
            />
          </Panel>

          <Panel
            title={t(
              "yallaAdmin.platformMonitor.panel.recentAiFailures",
              "Recent AI failures"
            )}
            icon={<AlertTriangle size={16} />}
          >
            <Table
              head={[
                t("yallaAdmin.platformMonitor.table.when", "When"),
                t("yallaAdmin.platformMonitor.table.agent", "Agent"),
                t("yallaAdmin.platformMonitor.table.error", "Error"),
              ]}
              rows={(ai?.recentFailures || []).map(f => [
                fmtTime(f.createdAt),
                f.agentName,
                (
                  f.errorMessage || t("yallaAdmin.common.notAvailable", "—")
                ).slice(0, 80),
              ])}
              empty={t(
                "yallaAdmin.platformMonitor.empty.noRecentFailures",
                "No recent failures."
              )}
            />
          </Panel>

          <Panel
            title={t(
              "yallaAdmin.platformMonitor.panel.emailDelivery",
              "Email delivery"
            )}
            icon={<Mail size={16} />}
          >
            <StatRow
              label={t("yallaAdmin.platformMonitor.stat.sent", "Sent")}
              value={em?.sent ?? 0}
              tone="#10b981"
            />
            <StatRow
              label={t("yallaAdmin.platformMonitor.stat.queued", "Queued")}
              value={em?.queued ?? 0}
            />
            <StatRow
              label={t("yallaAdmin.platformMonitor.stat.failed", "Failed")}
              value={em?.failed ?? 0}
              tone="#ef4444"
            />
            <StatRow
              label={t("yallaAdmin.platformMonitor.stat.opened", "Opened")}
              value={em?.opened ?? 0}
            />
            <StatRow
              label={t("yallaAdmin.platformMonitor.stat.clicked", "Clicked")}
              value={em?.clicked ?? 0}
            />
            <StatRow
              label={t("yallaAdmin.platformMonitor.stat.openRate", "Open rate")}
              value={`${em?.openRate ?? 0}%`}
            />
            <StatRow
              label={t(
                "yallaAdmin.platformMonitor.stat.clickRate",
                "Click rate"
              )}
              value={`${em?.clickRate ?? 0}%`}
            />
            <StatRow
              label={t("yallaAdmin.platformMonitor.stat.sent24h", "Sent 24h")}
              value={em?.last24hSent ?? 0}
            />
          </Panel>
        </div>

        {/* ── Security ──────────────────────────────────────────────── */}
        <SectionLabel>
          {t("yallaAdmin.platformMonitor.securityPosture", "Security posture")}
        </SectionLabel>
        <div style={gridStyle}>
          <Panel
            title={t("yallaAdmin.platformMonitor.panel.accounts", "Accounts")}
            icon={<ShieldCheck size={16} />}
          >
            <StatRow
              label={t(
                "yallaAdmin.platformMonitor.stat.totalUsers",
                "Total users"
              )}
              value={sec?.totalUsers ?? 0}
            />
            <StatRow
              label={t(
                "yallaAdmin.platformMonitor.stat.mfaEnabled",
                "MFA enabled"
              )}
              value={sec?.mfaEnabledUsers ?? 0}
            />
            <StatRow
              label={t(
                "yallaAdmin.platformMonitor.kpi.mfaAdoption",
                "MFA adoption"
              )}
              value={`${sec?.mfaAdoptionRate ?? 0}%`}
              tone={sec && sec.mfaAdoptionRate < 25 ? "#f59e0b" : "#10b981"}
            />
            <StatRow
              label={t(
                "yallaAdmin.platformMonitor.stat.suspended",
                "Suspended"
              )}
              value={sec?.suspendedUsers ?? 0}
              tone="#ef4444"
            />
            <StatRow
              label={t("yallaAdmin.platformMonitor.stat.pending", "Pending")}
              value={sec?.pendingUsers ?? 0}
            />
          </Panel>

          <Panel
            title={t(
              "yallaAdmin.platformMonitor.panel.engagementQuality",
              "Engagement quality"
            )}
            icon={<Gauge size={16} />}
          >
            <StatRow
              label={t(
                "yallaAdmin.platformMonitor.stat.trackedUsers",
                "Tracked users"
              )}
              value={traffic?.trackedUsers ?? 0}
            />
            <StatRow
              label={t(
                "yallaAdmin.platformMonitor.stat.totalSessions",
                "Total sessions"
              )}
              value={traffic?.totalSessions ?? 0}
            />
            <StatRow
              label={t(
                "yallaAdmin.platformMonitor.stat.avgActivation",
                "Avg activation score"
              )}
              value={traffic?.avgActivationScore ?? 0}
            />
            <StatRow
              label={t(
                "yallaAdmin.platformMonitor.stat.avgHealth",
                "Avg health score"
              )}
              value={traffic?.avgHealthScore ?? 0}
            />
            <StatRow
              label={t(
                "yallaAdmin.platformMonitor.stat.churnRisk",
                "Churn risk (cancel at period end)"
              )}
              value={r?.churnRiskSubscriptions ?? 0}
              tone={r && r.churnRiskSubscriptions > 0 ? "#f59e0b" : "#10b981"}
            />
            <StatRow
              label={t(
                "yallaAdmin.platformMonitor.stat.refunded30d",
                "Refunded 30d"
              )}
              value={money(r?.refundedAmountCents30d ?? 0, r?.currency)}
            />
          </Panel>

          <Panel
            title={t(
              "yallaAdmin.platformMonitor.panel.recentEmailFailures",
              "Recent email failures"
            )}
            icon={<AlertTriangle size={16} />}
          >
            <Table
              head={[
                t("yallaAdmin.platformMonitor.table.when", "When"),
                t("yallaAdmin.platformMonitor.table.template", "Template"),
                t("yallaAdmin.platformMonitor.table.recipient", "Recipient"),
              ]}
              rows={(em?.recentFailures || []).map(f => [
                fmtTime(f.createdAt),
                f.template,
                f.recipient,
              ])}
              empty={t(
                "yallaAdmin.platformMonitor.empty.noRecentFailures",
                "No recent failures."
              )}
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
        color: "var(--djac-muted)",
        margin: "24px 0 12px",
      }}
    >
      {children}
    </h2>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 13, color: "var(--djac-muted)", margin: 0 }}>
      {children}
    </p>
  );
}

function fmtTime(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(storedLocaleTag());
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
        border: "1px solid var(--djac-border)",
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
      <div style={{ fontSize: 12, color: "var(--djac-muted)", marginTop: 4 }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: "var(--djac-muted)", marginTop: 6 }}>
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
        border: "1px solid var(--djac-border)",
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
          color: "var(--djac-text)",
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
        borderBottom: "1px solid var(--djac-border)",
        fontSize: 13,
      }}
    >
      <span style={{ color: "var(--djac-muted)" }}>{label}</span>
      <span style={{ fontWeight: 600, color: tone || "#ffffff" }}>
        {typeof value === "number"
          ? value.toLocaleString(storedLocaleTag())
          : value}
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
              color: "var(--djac-muted)",
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
              background: "var(--djac-card-hi)",
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
              color: "var(--djac-text)",
              minWidth: 64,
              textAlign: "right",
            }}
          >
            {i.display ?? i.value.toLocaleString(storedLocaleTag())}
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
                  color: "var(--djac-muted)",
                  fontWeight: 600,
                  borderBottom: "1px solid var(--djac-border)",
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
                    borderBottom: "1px solid var(--djac-border)",
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
