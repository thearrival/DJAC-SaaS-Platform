/**
 * Platform monitoring store — founder/admin analytics over the operational
 * tables that are not surfaced by the user/subscription views:
 *   traffic & engagement (analyticsEvents, userActivitySummary),
 *   revenue (subscriptions, billingEvents),
 *   AI workload (aiAgentRuns),
 *   email deliverability (emailLog),
 *   security posture (localUsers MFA adoption).
 *
 * Every function degrades gracefully to zeroed/empty results when the DB is
 * unavailable so the admin console never renders a broken screen.
 */
import { desc, eq, gte, sql } from "drizzle-orm";
import {
  aiAgentRuns,
  analyticsEvents,
  billingEvents,
  emailLog,
  localUsers,
  subscriptions,
  userActivitySummary,
} from "../../drizzle/schema";
import { getDb } from "../db";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Monthly-normalised price in cents for a billing interval. */
const INTERVAL_MONTHS: Record<string, number> = {
  monthly: 1,
  quarterly: 3,
  biannual: 6,
  annual: 12,
};

export interface TrafficMetrics {
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

export interface RevenueMetrics {
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

export interface AiJobMetrics {
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

export interface EmailMetrics {
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

export interface SecurityMetrics {
  totalUsers: number;
  mfaEnabledUsers: number;
  mfaAdoptionRate: number;
  suspendedUsers: number;
  pendingUsers: number;
}

export interface PlatformOverview {
  generatedAt: string;
  traffic: TrafficMetrics;
  revenue: RevenueMetrics;
  ai: AiJobMetrics;
  email: EmailMetrics;
  security: SecurityMetrics;
}

const emptyTraffic = (): TrafficMetrics => ({
  totalEvents: 0,
  totalSessions: 0,
  events24h: 0,
  events7d: 0,
  activeUsers24h: 0,
  activeUsers7d: 0,
  activeUsers30d: 0,
  trackedUsers: 0,
  avgActivationScore: 0,
  avgHealthScore: 0,
  daily: [],
  signups: [],
  topEvents: [],
});

const emptyRevenue = (): RevenueMetrics => ({
  mrrCents: 0,
  arrCents: 0,
  arpuCents: 0,
  payingSubscriptions: 0,
  trialingSubscriptions: 0,
  pastDueSubscriptions: 0,
  canceledSubscriptions: 0,
  churnRiskSubscriptions: 0,
  currency: "USD",
  byPlan: [],
  byStatus: [],
  failedPayments30d: 0,
  failedAmountCents30d: 0,
  refundedAmountCents30d: 0,
  recentBillingEvents: [],
});

const emptyAi = (): AiJobMetrics => ({
  total: 0,
  queued: 0,
  running: 0,
  completed: 0,
  failed: 0,
  cancelled: 0,
  successRate: 0,
  avgDurationMs: 0,
  p95DurationMs: 0,
  last24h: 0,
  recentFailures: [],
});

const emptyEmail = (): EmailMetrics => ({
  total: 0,
  sent: 0,
  failed: 0,
  opened: 0,
  clicked: 0,
  queued: 0,
  openRate: 0,
  clickRate: 0,
  last24hSent: 0,
  recentFailures: [],
});

const emptySecurity = (): SecurityMetrics => ({
  totalUsers: 0,
  mfaEnabledUsers: 0,
  mfaAdoptionRate: 0,
  suspendedUsers: 0,
  pendingUsers: 0,
});

const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

export async function getTrafficMetrics(days = 30): Promise<TrafficMetrics> {
  const db = await getDb();
  if (!db) return emptyTraffic();

  const now = Date.now();
  const since24h = new Date(now - DAY_MS);
  const since7d = new Date(now - 7 * DAY_MS);
  const since30d = new Date(now - 30 * DAY_MS);
  const sinceWindow = new Date(now - days * DAY_MS);

  const [totals] = await db
    .select({
      totalEvents: sql<number>`COUNT(*)::int`,
      events24h: sql<number>`COUNT(*) FILTER (WHERE ${analyticsEvents.createdAt} >= ${since24h})::int`,
      events7d: sql<number>`COUNT(*) FILTER (WHERE ${analyticsEvents.createdAt} >= ${since7d})::int`,
    })
    .from(analyticsEvents);

  const daily = await db
    .select({
      date: sql<string>`to_char(${analyticsEvents.createdAt}, 'YYYY-MM-DD')`,
      events: sql<number>`COUNT(*)::int`,
      users: sql<number>`COUNT(DISTINCT ${analyticsEvents.userId})::int`,
    })
    .from(analyticsEvents)
    .where(gte(analyticsEvents.createdAt, sinceWindow))
    .groupBy(sql`to_char(${analyticsEvents.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${analyticsEvents.createdAt}, 'YYYY-MM-DD')`);

  const signups = await db
    .select({
      date: sql<string>`to_char(${localUsers.createdAt}, 'YYYY-MM-DD')`,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(localUsers)
    .where(gte(localUsers.createdAt, sinceWindow))
    .groupBy(sql`to_char(${localUsers.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(${localUsers.createdAt}, 'YYYY-MM-DD')`);

  const topEvents = await db
    .select({
      event: analyticsEvents.event,
      category: analyticsEvents.category,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(analyticsEvents)
    .where(gte(analyticsEvents.createdAt, sinceWindow))
    .groupBy(analyticsEvents.event, analyticsEvents.category)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(10);

  const [summary] = await db
    .select({
      trackedUsers: sql<number>`COUNT(*)::int`,
      totalSessions: sql<number>`COALESCE(SUM(${userActivitySummary.totalSessions}), 0)::int`,
      activeUsers24h: sql<number>`COUNT(*) FILTER (WHERE ${userActivitySummary.lastActiveAt} >= ${since24h})::int`,
      activeUsers7d: sql<number>`COUNT(*) FILTER (WHERE ${userActivitySummary.lastActiveAt} >= ${since7d})::int`,
      activeUsers30d: sql<number>`COUNT(*) FILTER (WHERE ${userActivitySummary.lastActiveAt} >= ${since30d})::int`,
      avgActivationScore: sql<number>`COALESCE(AVG(${userActivitySummary.activationScore}), 0)::int`,
      avgHealthScore: sql<number>`COALESCE(AVG(${userActivitySummary.healthScore}), 0)::int`,
    })
    .from(userActivitySummary);

  return {
    totalEvents: num(totals?.totalEvents),
    totalSessions: num(summary?.totalSessions),
    events24h: num(totals?.events24h),
    events7d: num(totals?.events7d),
    activeUsers24h: num(summary?.activeUsers24h),
    activeUsers7d: num(summary?.activeUsers7d),
    activeUsers30d: num(summary?.activeUsers30d),
    trackedUsers: num(summary?.trackedUsers),
    avgActivationScore: num(summary?.avgActivationScore),
    avgHealthScore: num(summary?.avgHealthScore),
    daily: daily.map(r => ({
      date: r.date,
      events: num(r.events),
      users: num(r.users),
    })),
    signups: signups.map(r => ({ date: r.date, count: num(r.count) })),
    topEvents: topEvents.map(r => ({
      event: r.event,
      category: r.category,
      count: num(r.count),
    })),
  };
}

export async function getRevenueMetrics(): Promise<RevenueMetrics> {
  const db = await getDb();
  if (!db) return emptyRevenue();

  const now = Date.now();
  const since30d = new Date(now - 30 * DAY_MS);

  const subs = await db
    .select({
      plan: subscriptions.plan,
      status: subscriptions.status,
      billingInterval: subscriptions.billingInterval,
      amountCents: subscriptions.amountCents,
      currency: subscriptions.currency,
      cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
    })
    .from(subscriptions);

  let mrrCents = 0;
  let paying = 0;
  let trialing = 0;
  let pastDue = 0;
  let canceled = 0;
  let churnRisk = 0;
  let currency = "USD";
  const planMap = new Map<string, { count: number; mrrCents: number }>();
  const statusMap = new Map<string, number>();

  for (const s of subs) {
    const status = String(s.status);
    statusMap.set(status, (statusMap.get(status) ?? 0) + 1);
    if (s.currency) currency = s.currency;

    const months = INTERVAL_MONTHS[String(s.billingInterval)] ?? 1;
    const monthly = Math.round(num(s.amountCents) / months);

    // Active and past-due subscriptions both represent contracted revenue.
    if (status === "active" || status === "past_due") {
      mrrCents += monthly;
      const p = planMap.get(String(s.plan)) ?? { count: 0, mrrCents: 0 };
      p.count += 1;
      p.mrrCents += monthly;
      planMap.set(String(s.plan), p);
    }

    if (status === "active") paying += 1;
    if (status === "trialing") trialing += 1;
    if (status === "past_due") pastDue += 1;
    if (status === "canceled") canceled += 1;
    if (s.cancelAtPeriodEnd === 1) churnRisk += 1;
  }

  const [billing] = await db
    .select({
      failedPayments: sql<number>`COUNT(*) FILTER (WHERE ${billingEvents.status} = 'failed')::int`,
      failedAmount: sql<number>`COALESCE(SUM(${billingEvents.amountCents}) FILTER (WHERE ${billingEvents.status} = 'failed'), 0)::int`,
      refundedAmount: sql<number>`COALESCE(SUM(${billingEvents.amountCents}) FILTER (WHERE ${billingEvents.status} = 'refunded'), 0)::int`,
    })
    .from(billingEvents)
    .where(gte(billingEvents.createdAt, since30d));

  const recentBillingEvents = await db
    .select({
      id: billingEvents.id,
      eventType: billingEvents.eventType,
      status: billingEvents.status,
      amountCents: billingEvents.amountCents,
      currency: billingEvents.currency,
      organizationName: sql<string | null>`NULL`,
      createdAt: billingEvents.createdAt,
    })
    .from(billingEvents)
    .orderBy(desc(billingEvents.createdAt))
    .limit(20);

  return {
    mrrCents,
    arrCents: mrrCents * 12,
    arpuCents: paying > 0 ? Math.round(mrrCents / paying) : 0,
    payingSubscriptions: paying,
    trialingSubscriptions: trialing,
    pastDueSubscriptions: pastDue,
    canceledSubscriptions: canceled,
    churnRiskSubscriptions: churnRisk,
    currency,
    byPlan: [...planMap.entries()]
      .map(([plan, v]) => ({ plan, count: v.count, mrrCents: v.mrrCents }))
      .sort((a, b) => b.mrrCents - a.mrrCents),
    byStatus: [...statusMap.entries()]
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count),
    failedPayments30d: num(billing?.failedPayments),
    failedAmountCents30d: num(billing?.failedAmount),
    refundedAmountCents30d: num(billing?.refundedAmount),
    recentBillingEvents: recentBillingEvents.map(r => ({
      id: r.id,
      eventType: r.eventType,
      status: String(r.status),
      amountCents: r.amountCents,
      currency: r.currency ?? "USD",
      organizationName: r.organizationName,
      createdAt: r.createdAt?.toISOString() ?? "",
    })),
  };
}

export async function getAiJobMetrics(): Promise<AiJobMetrics> {
  const db = await getDb();
  if (!db) return emptyAi();

  const since24h = new Date(Date.now() - DAY_MS);

  const [counts] = await db
    .select({
      total: sql<number>`COUNT(*)::int`,
      queued: sql<number>`COUNT(*) FILTER (WHERE ${aiAgentRuns.status} = 'queued')::int`,
      running: sql<number>`COUNT(*) FILTER (WHERE ${aiAgentRuns.status} = 'running')::int`,
      completed: sql<number>`COUNT(*) FILTER (WHERE ${aiAgentRuns.status} = 'completed')::int`,
      failed: sql<number>`COUNT(*) FILTER (WHERE ${aiAgentRuns.status} = 'failed')::int`,
      cancelled: sql<number>`COUNT(*) FILTER (WHERE ${aiAgentRuns.status} = 'cancelled')::int`,
      last24h: sql<number>`COUNT(*) FILTER (WHERE ${aiAgentRuns.createdAt} >= ${since24h})::int`,
      avgDurationMs: sql<number>`COALESCE(AVG(${aiAgentRuns.durationMs}) FILTER (WHERE ${aiAgentRuns.durationMs} IS NOT NULL), 0)::int`,
    })
    .from(aiAgentRuns);

  // p95 computed in JS over the most recent completed runs (bounded fetch).
  const durations = await db
    .select({ durationMs: aiAgentRuns.durationMs })
    .from(aiAgentRuns)
    .where(sql`${aiAgentRuns.durationMs} IS NOT NULL`)
    .orderBy(desc(aiAgentRuns.createdAt))
    .limit(500);

  const sorted = durations
    .map(d => num(d.durationMs))
    .filter(d => d > 0)
    .sort((a, b) => a - b);
  const p95 =
    sorted.length > 0
      ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]
      : 0;

  const recentFailures = await db
    .select({
      id: aiAgentRuns.id,
      agentName: aiAgentRuns.agentName,
      organizationId: aiAgentRuns.organizationId,
      errorMessage: aiAgentRuns.errorMessage,
      createdAt: aiAgentRuns.createdAt,
    })
    .from(aiAgentRuns)
    .where(eq(aiAgentRuns.status, "failed"))
    .orderBy(desc(aiAgentRuns.createdAt))
    .limit(10);

  const completed = num(counts?.completed);
  const failed = num(counts?.failed);
  const finished = completed + failed;

  return {
    total: num(counts?.total),
    queued: num(counts?.queued),
    running: num(counts?.running),
    completed,
    failed,
    cancelled: num(counts?.cancelled),
    successRate:
      finished > 0 ? Math.round((completed / finished) * 1000) / 10 : 0,
    avgDurationMs: num(counts?.avgDurationMs),
    p95DurationMs: p95,
    last24h: num(counts?.last24h),
    recentFailures: recentFailures.map(r => ({
      id: r.id,
      agentName: r.agentName,
      organizationId: r.organizationId,
      errorMessage: r.errorMessage,
      createdAt: r.createdAt?.toISOString() ?? "",
    })),
  };
}

export async function getEmailMetrics(): Promise<EmailMetrics> {
  const db = await getDb();
  if (!db) return emptyEmail();

  const since24h = new Date(Date.now() - DAY_MS);

  const [counts] = await db
    .select({
      total: sql<number>`COUNT(*)::int`,
      sent: sql<number>`COUNT(*) FILTER (WHERE ${emailLog.status} = 'sent')::int`,
      failed: sql<number>`COUNT(*) FILTER (WHERE ${emailLog.status} = 'failed')::int`,
      queued: sql<number>`COUNT(*) FILTER (WHERE ${emailLog.status} = 'queued')::int`,
      opened: sql<number>`COUNT(*) FILTER (WHERE ${emailLog.openedAt} IS NOT NULL)::int`,
      clicked: sql<number>`COUNT(*) FILTER (WHERE ${emailLog.clickedAt} IS NOT NULL)::int`,
      last24hSent: sql<number>`COUNT(*) FILTER (WHERE ${emailLog.createdAt} >= ${since24h} AND ${emailLog.status} = 'sent')::int`,
    })
    .from(emailLog);

  const recentFailures = await db
    .select({
      id: emailLog.id,
      template: emailLog.template,
      recipient: emailLog.recipient,
      errorMessage: emailLog.errorMessage,
      createdAt: emailLog.createdAt,
    })
    .from(emailLog)
    .where(eq(emailLog.status, "failed"))
    .orderBy(desc(emailLog.createdAt))
    .limit(10);

  const sent = num(counts?.sent);
  const opened = num(counts?.opened);
  const clicked = num(counts?.clicked);

  return {
    total: num(counts?.total),
    sent,
    failed: num(counts?.failed),
    queued: num(counts?.queued),
    opened,
    clicked,
    openRate: sent > 0 ? Math.round((opened / sent) * 1000) / 10 : 0,
    clickRate: sent > 0 ? Math.round((clicked / sent) * 1000) / 10 : 0,
    last24hSent: num(counts?.last24hSent),
    recentFailures: recentFailures.map(r => ({
      id: r.id,
      template: r.template,
      recipient: r.recipient,
      errorMessage: r.errorMessage,
      createdAt: r.createdAt?.toISOString() ?? "",
    })),
  };
}

export async function getSecurityMetrics(): Promise<SecurityMetrics> {
  const db = await getDb();
  if (!db) return emptySecurity();

  const [row] = await db
    .select({
      totalUsers: sql<number>`COUNT(*)::int`,
      mfaEnabledUsers: sql<number>`COUNT(*) FILTER (WHERE ${localUsers.mfaEnabled} = 1)::int`,
      suspendedUsers: sql<number>`COUNT(*) FILTER (WHERE ${localUsers.status} = 'suspended')::int`,
      pendingUsers: sql<number>`COUNT(*) FILTER (WHERE ${localUsers.status} = 'pending')::int`,
    })
    .from(localUsers);

  const total = num(row?.totalUsers);
  const mfa = num(row?.mfaEnabledUsers);

  return {
    totalUsers: total,
    mfaEnabledUsers: mfa,
    mfaAdoptionRate: total > 0 ? Math.round((mfa / total) * 1000) / 10 : 0,
    suspendedUsers: num(row?.suspendedUsers),
    pendingUsers: num(row?.pendingUsers),
  };
}

/** Single aggregate used by the Platform Monitor page. */
export async function getPlatformOverview(
  days = 30
): Promise<PlatformOverview> {
  const [traffic, revenue, ai, email, security] = await Promise.all([
    getTrafficMetrics(days),
    getRevenueMetrics(),
    getAiJobMetrics(),
    getEmailMetrics(),
    getSecurityMetrics(),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    traffic,
    revenue,
    ai,
    email,
    security,
  };
}
