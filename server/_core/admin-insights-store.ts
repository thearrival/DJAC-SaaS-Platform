/**
 * Founders console — end-user monitoring, engagement analytics, reporting
 * and operational alerts. All functions are read-only and safe to call
 * concurrently; each degrades gracefully when the database is unavailable.
 */
import type { PDFDocument } from "pdf-lib";
import { readFileSync } from "node:fs";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import {
  activityEvents,
  auditLogs,
  localUsers,
  organizations,
  serviceRequests,
  subscriptions,
  userInteractionLogs,
} from "../../drizzle/schema";
import { getDb } from "../db";
import { logger } from "./logger";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TimelineEntry {
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

export interface AuthHistoryEntry {
  id: number;
  action: string;
  outcome: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface EngagementMetrics {
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

export type ReportType =
  | "growth"
  | "engagement"
  | "revenue"
  | "security"
  | "operations";

export interface ReportResult {
  type: ReportType;
  title: string;
  generatedAt: string;
  windowDays: number;
  kpis: Array<{ label: string; value: string | number; hint?: string }>;
  series: Array<{ name: string; points: Array<{ x: string; y: number }> }>;
  table: {
    columns: string[];
    rows: Array<Array<string | number>>;
  };
  notes: string[];
}

export interface OperationalAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  category: "security" | "billing" | "support" | "growth" | "system";
  title: string;
  detail: string;
  count?: number;
  createdAt: string;
}

export interface LiveMetrics {
  generatedAt: string;
  sseClients: number;
  onlineRecently: number;
  activeFoundersSessions: number;
  signupsToday: number;
  loginsToday: number;
  failedLogins24h: number;
  openServiceRequests: number;
  unreadAdminNotifications: number;
  recentEvents: Array<{
    id: string;
    type: string;
    label: string;
    at: string;
  }>;
}

// ─── User timeline & auth history ────────────────────────────────────────────

export async function getUserTimeline(
  userId: number,
  limit = 100
): Promise<TimelineEntry[]> {
  const db = await getDb();
  if (!db) return [];

  const [auditRows, activityRows, interactionRows] = await Promise.all([
    db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        category: auditLogs.category,
        outcome: auditLogs.outcome,
        entityType: auditLogs.entityType,
        ipAddress: auditLogs.ipHash,
        userAgent: auditLogs.userAgent,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .where(eq(auditLogs.localUserId, userId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit),
    db
      .select({
        id: activityEvents.id,
        action: activityEvents.action,
        entityType: activityEvents.entityType,
        ipAddress: activityEvents.ipHash,
        createdAt: activityEvents.createdAt,
      })
      .from(activityEvents)
      .where(eq(activityEvents.localUserId, userId))
      .orderBy(desc(activityEvents.createdAt))
      .limit(limit),
    db
      .select({
        id: userInteractionLogs.id,
        action: userInteractionLogs.action,
        context: userInteractionLogs.context,
        entityType: userInteractionLogs.entityType,
        ipAddress: userInteractionLogs.ipHash,
        userAgent: userInteractionLogs.userAgent,
        createdAt: userInteractionLogs.createdAt,
      })
      .from(userInteractionLogs)
      .where(eq(userInteractionLogs.localUserId, userId))
      .orderBy(desc(userInteractionLogs.createdAt))
      .limit(limit),
  ]);

  const merged: TimelineEntry[] = [
    ...auditRows.map(r => ({
      id: `audit-${r.id}`,
      source: "audit" as const,
      action: r.action,
      category: r.category,
      outcome: r.outcome,
      entityType: r.entityType,
      ipAddress: r.ipAddress,
      userAgent: r.userAgent,
      createdAt: r.createdAt?.toISOString() ?? "",
    })),
    ...activityRows.map(r => ({
      id: `activity-${r.id}`,
      source: "activity" as const,
      action: r.action,
      category: "activity",
      outcome: null,
      entityType: r.entityType,
      ipAddress: r.ipAddress,
      userAgent: null,
      createdAt: r.createdAt?.toISOString() ?? "",
    })),
    ...interactionRows.map(r => ({
      id: `interaction-${r.id}`,
      source: "interaction" as const,
      action: r.action,
      category: r.context,
      outcome: null,
      entityType: r.entityType,
      ipAddress: r.ipAddress,
      userAgent: r.userAgent,
      createdAt: r.createdAt?.toISOString() ?? "",
    })),
  ];

  return merged
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export async function getUserAuthHistory(
  userId: number,
  limit = 50
): Promise<AuthHistoryEntry[]> {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      outcome: auditLogs.outcome,
      ipAddress: auditLogs.ipHash,
      userAgent: auditLogs.userAgent,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .where(
      and(eq(auditLogs.localUserId, userId), eq(auditLogs.category, "auth"))
    )
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);

  return rows.map(r => ({
    id: r.id,
    action: r.action,
    outcome: r.outcome,
    ipAddress: r.ipAddress,
    userAgent: r.userAgent,
    createdAt: r.createdAt?.toISOString() ?? "",
  }));
}

// ─── Engagement metrics ──────────────────────────────────────────────────────

export async function getEngagementMetrics(
  windowDays = 30
): Promise<EngagementMetrics> {
  const db = await getDb();
  const now = new Date();
  const empty: EngagementMetrics = {
    generatedAt: now.toISOString(),
    windowDays,
    dau: 0,
    wau: 0,
    mau: 0,
    newUsersInWindow: 0,
    dormantUsers: 0,
    retention: { active1d: 0, active7d: 0, active30d: 0, total: 0 },
    dailyActive: [],
    topUsers: [],
    topFeatures: [],
    topOrgs: [],
  };
  if (!db) return empty;

  const dayAgo = new Date(now.getTime() - 24 * 3600 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
  const windowStart = new Date(
    now.getTime() - Math.max(windowDays, 1) * 24 * 3600 * 1000
  );

  // Distinct actors from audit + interaction logs (union via raw SQL for portability)
  const activeCounts = await db.execute(sql`
    WITH actors AS (
      SELECT "localUserId" AS uid, MAX("createdAt") AS last_at
      FROM "auditLogs"
      WHERE "localUserId" IS NOT NULL AND "createdAt" >= ${monthAgo}
      GROUP BY 1
      UNION
      SELECT "localUserId" AS uid, MAX("createdAt") AS last_at
      FROM "userInteractionLogs"
      WHERE "localUserId" IS NOT NULL AND "createdAt" >= ${monthAgo}
      GROUP BY 1
    ),
    rolled AS (
      SELECT uid, MAX(last_at) AS last_at FROM actors GROUP BY uid
    )
    SELECT
      COUNT(*) FILTER (WHERE last_at >= ${dayAgo}) AS dau,
      COUNT(*) FILTER (WHERE last_at >= ${weekAgo}) AS wau,
      COUNT(*) FILTER (WHERE last_at >= ${monthAgo}) AS mau,
      COUNT(*) AS total_with_activity
    FROM rolled
  `);
  const ac = (activeCounts.rows as Record<string, number>[])[0] ?? {};

  const totals = await db
    .select({
      total: count(),
      newInWindow: sql<number>`COUNT(*) FILTER (WHERE "createdAt" >= ${windowStart})`,
      dormant: sql<number>`COUNT(*) FILTER (WHERE "lastSignedIn" IS NULL OR "lastSignedIn" < ${monthAgo})`,
    })
    .from(localUsers);
  const totalsRow = totals[0];
  const totalUsers = Number(totalsRow?.total ?? 0);

  const [newWindow] = await db
    .select({ c: count() })
    .from(localUsers)
    .where(gte(localUsers.createdAt, windowStart));

  // Daily active series from audit logins + interactions
  const dailyRows = await db.execute(sql`
    SELECT to_char(d, 'YYYY-MM-DD') AS date, COUNT(DISTINCT uid) AS count
    FROM (
      SELECT date_trunc('day', "createdAt") AS d, "localUserId" AS uid
      FROM "auditLogs"
      WHERE "localUserId" IS NOT NULL AND "createdAt" >= ${windowStart}
      UNION ALL
      SELECT date_trunc('day', "createdAt") AS d, "localUserId" AS uid
      FROM "userInteractionLogs"
      WHERE "localUserId" IS NOT NULL AND "createdAt" >= ${windowStart}
    ) src
    GROUP BY d
    ORDER BY d
  `);
  const dailyActive = (dailyRows.rows as { date: string; count: number }[])
    .map(r => ({ date: r.date, count: Number(r.count) }))
    .slice(-90);

  // Top users by event volume in window
  const topUserRows = await db.execute(sql`
    SELECT u.id, u.name, u.email,
           COUNT(*) AS "eventCount",
           MAX(a."createdAt") AS "lastActiveAt"
    FROM "auditLogs" a
    JOIN "localUsers" u ON u.id = a."localUserId"
    WHERE a."localUserId" IS NOT NULL AND a."createdAt" >= ${windowStart}
    GROUP BY u.id, u.name, u.email
    ORDER BY COUNT(*) DESC
    LIMIT 15
  `);
  const topUsers = (
    topUserRows.rows as {
      id: number;
      name: string;
      email: string;
      eventCount: number;
      lastActiveAt: Date | string | null;
    }[]
  ).map(r => ({
    id: r.id,
    name: r.name,
    email: r.email,
    eventCount: Number(r.eventCount),
    lastActiveAt:
      r.lastActiveAt instanceof Date
        ? r.lastActiveAt.toISOString()
        : (r.lastActiveAt ?? null),
  }));

  // Top feature actions from interaction logs
  const featureRows = await db.execute(sql`
    SELECT action, COUNT(*) AS count
    FROM "userInteractionLogs"
    WHERE "createdAt" >= ${windowStart}
    GROUP BY action
    ORDER BY count DESC
    LIMIT 12
  `);
  const topFeatures = (
    featureRows.rows as { action: string; count: number }[]
  ).map(r => ({ action: r.action, count: Number(r.count) }));

  // Top orgs by member activity
  const orgRows = await db.execute(sql`
    SELECT o.id, o.name, COUNT(*) AS "eventCount"
    FROM "auditLogs" a
    JOIN "organizationMembers" m ON m."localUserId" = a."localUserId"
    JOIN "organizations" o ON o.id = m."organizationId"
    WHERE a."localUserId" IS NOT NULL AND a."createdAt" >= ${windowStart}
    GROUP BY o.id, o.name
    ORDER BY COUNT(*) DESC
    LIMIT 10
  `);
  const topOrgs = (
    orgRows.rows as { id: number; name: string; eventCount: number }[]
  ).map(r => ({ id: r.id, name: r.name, eventCount: Number(r.eventCount) }));

  const totalUsersChecked = totalUsers;
  return {
    generatedAt: now.toISOString(),
    windowDays,
    dau: Number(ac.dau ?? 0),
    wau: Number(ac.wau ?? 0),
    mau: Number(ac.mau ?? 0),
    newUsersInWindow: Number(newWindow?.c ?? 0),
    dormantUsers: Number(totalsRow?.dormant ?? 0),
    retention: {
      active1d: Number(ac.dau ?? 0),
      active7d: Number(ac.wau ?? 0),
      active30d: Number(ac.mau ?? 0),
      total: totalUsersChecked,
    },
    dailyActive,
    topUsers,
    topFeatures,
    topOrgs,
  };
}

// ─── Reporting engine ────────────────────────────────────────────────────────

export async function buildReport(
  type: ReportType,
  windowDays = 30
): Promise<ReportResult> {
  const db = await getDb();
  const generatedAt = new Date().toISOString();
  const windowStart = new Date(
    Date.now() - Math.max(windowDays, 1) * 24 * 3600 * 1000
  );

  const base = {
    type,
    generatedAt,
    windowDays,
    notes: [] as string[],
  };

  if (!db) {
    return {
      ...base,
      title: titleFor(type),
      kpis: [],
      series: [],
      table: { columns: [], rows: [] },
      notes: ["Database unavailable — report is empty."],
    };
  }

  switch (type) {
    case "growth":
      return buildGrowthReport(db, base, windowStart);
    case "engagement":
      return buildEngagementReport(db, base, windowStart);
    case "revenue":
      return buildRevenueReport(db, base, windowStart);
    case "security":
      return buildSecurityReport(db, base, windowStart);
    case "operations":
      return buildOperationsReport(db, base, windowStart);
    default:
      throw new Error(`Unknown report type: ${type}`);
  }
}

function titleFor(type: ReportType): string {
  const titles: Record<ReportType, string> = {
    growth: "User Growth Report",
    engagement: "Engagement & Retention Report",
    revenue: "Revenue & Subscriptions Report",
    security: "Security Posture Report",
    operations: "Operations & Support Report",
  };
  return titles[type];
}

type ReportBase = {
  type: ReportType;
  generatedAt: string;
  windowDays: number;
  notes: string[];
};

async function buildGrowthReport(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  base: ReportBase,
  windowStart: Date
): Promise<ReportResult> {
  const [stats] = await db
    .select({
      total: count(),
      newInWindow: sql<number>`COUNT(*) FILTER (WHERE "createdAt" >= ${windowStart})`,
      verified: sql<number>`COUNT(*) FILTER (WHERE "verifiedAt" IS NOT NULL)`,
      mfa: sql<number>`COUNT(*) FILTER (WHERE "mfaEnabled" = 1)`,
      active: sql<number>`COUNT(*) FILTER (WHERE "status" = 'active')`,
      pending: sql<number>`COUNT(*) FILTER (WHERE "status" = 'pending')`,
      suspended: sql<number>`COUNT(*) FILTER (WHERE "status" = 'suspended')`,
    })
    .from(localUsers);

  const byRole = await db
    .select({ role: localUsers.userType, c: count() })
    .from(localUsers)
    .groupBy(localUsers.userType);

  const byDay = await db.execute(sql`
    SELECT to_char("createdAt", 'YYYY-MM-DD') AS day, COUNT(*) AS count
    FROM "localUsers"
    WHERE "createdAt" >= ${windowStart}
    GROUP BY 1 ORDER BY 1
  `);

  const orgStats = await db.select({ c: count() }).from(organizations);

  return {
    ...base,
    title: titleFor("growth"),
    kpis: [
      { label: "Total users", value: Number(stats?.total ?? 0) },
      {
        label: `New (${base.windowDays}d)`,
        value: Number(stats?.newInWindow ?? 0),
      },
      { label: "Active", value: Number(stats?.active ?? 0) },
      { label: "Pending verification", value: Number(stats?.pending ?? 0) },
      { label: "Suspended", value: Number(stats?.suspended ?? 0) },
      { label: "MFA enabled", value: Number(stats?.mfa ?? 0) },
      { label: "Organizations", value: Number(orgStats[0]?.c ?? 0) },
    ],
    series: [
      {
        name: "Daily signups",
        points: (byDay.rows as any[]).map(r => ({
          x: r.day,
          y: Number(r.count),
        })),
      },
    ],
    table: {
      columns: ["Role", "Users"],
      rows: byRole.map(r => [r.role ?? "visitor", Number(r.c)]),
    },
    notes: [
      "Growth counts local (email/OTP) accounts; OAuth accounts are separate.",
    ],
  };
}

async function buildEngagementReport(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  base: ReportBase,
  windowStart: Date
): Promise<ReportResult> {
  const eng = await getEngagementMetrics(base.windowDays);

  const loginRows = await db.execute(sql`
    SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day,
           COUNT(*) AS logins
    FROM "auditLogs"
    WHERE action = 'user.login' AND "createdAt" >= ${windowStart}
    GROUP BY 1 ORDER BY 1
  `);

  const featureRows = await db.execute(sql`
    SELECT action, COUNT(*) AS count
    FROM "userInteractionLogs"
    WHERE "createdAt" >= ${windowStart}
    GROUP BY 1 ORDER BY count DESC LIMIT 20
  `);

  return {
    ...base,
    title: titleFor("engagement"),
    kpis: [
      { label: "DAU", value: eng.dau },
      { label: "WAU", value: eng.wau },
      { label: "MAU", value: eng.mau },
      {
        label: "7d retention",
        value:
          eng.retention.total > 0
            ? `${Math.round((eng.retention.active7d / eng.retention.total) * 100)}%`
            : "—",
      },
      { label: "Dormant 30d+", value: eng.dormantUsers },
      { label: `New (${base.windowDays}d)`, value: eng.newUsersInWindow },
    ],
    series: [
      {
        name: "Logins / day",
        points: (loginRows.rows as any[]).map(r => ({
          x: r.day,
          y: Number(r.logins),
        })),
      },
      {
        name: "Active users / day",
        points: eng.dailyActive.map(d => ({ x: d.date, y: d.count })),
      },
    ],
    table: {
      columns: ["Feature action", "Events"],
      rows: (featureRows.rows as any[]).map(r => [r.action, Number(r.count)]),
    },
    notes: [
      "Engagement is derived from audit + interaction logs (no dedicated session table for end users).",
      `Top users: ${
        eng.topUsers
          .slice(0, 3)
          .map(u => u.name ?? u.email)
          .join(", ") || "none"
      }.`,
    ],
  };
}

async function buildRevenueReport(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  base: ReportBase,
  windowStart: Date
): Promise<ReportResult> {
  const subs = await db
    .select({
      id: subscriptions.id,
      plan: subscriptions.plan,
      status: subscriptions.status,
      interval: subscriptions.billingInterval,
      amount: subscriptions.amountCents,
      cancelAtEnd: subscriptions.cancelAtPeriodEnd,
      orgName: organizations.name,
      periodEnd: subscriptions.currentPeriodEnd,
    })
    .from(subscriptions)
    .innerJoin(
      organizations,
      eq(subscriptions.organizationId, organizations.id)
    )
    .orderBy(desc(subscriptions.updatedAt))
    .limit(500);

  const active = subs.filter(
    s => s.status === "active" || s.status === "trialing"
  );
  const mrr = active.reduce((sum, s) => {
    const monthly =
      s.interval === "annual"
        ? s.amount / 12
        : s.interval === "biannual"
          ? s.amount / 6
          : s.amount;
    return sum + monthly;
  }, 0);
  const canceling = active.filter(s => s.cancelAtEnd).length;
  const pastDue = subs.filter(s => s.status === "past_due").length;

  const newOrgs = await db
    .select({ c: count() })
    .from(organizations)
    .where(gte(organizations.createdAt, windowStart));

  const planMix = new Map<string, number>();
  for (const s of active) {
    planMix.set(s.plan, (planMix.get(s.plan) ?? 0) + 1);
  }

  return {
    ...base,
    title: titleFor("revenue"),
    kpis: [
      { label: "Est. MRR", value: `$${(mrr / 100).toFixed(2)}` },
      { label: "Active subs", value: active.length },
      { label: "Total subs", value: subs.length },
      { label: "Canceling", value: canceling },
      { label: "Past due", value: pastDue },
      {
        label: `New orgs (${base.windowDays}d)`,
        value: Number(newOrgs[0]?.c ?? 0),
      },
    ],
    series: [
      {
        name: "Active by plan",
        points: [...planMix.entries()].map(([plan, n]) => ({
          x: plan,
          y: n,
        })),
      },
    ],
    table: {
      columns: [
        "Org",
        "Plan",
        "Interval",
        "Status",
        "Amount",
        "Period end",
        "Cancel at end",
      ],
      rows: subs.map(s => [
        s.orgName,
        s.plan,
        s.interval,
        s.status,
        `$${(s.amount / 100).toFixed(2)}`,
        s.periodEnd ? new Date(s.periodEnd).toISOString().slice(0, 10) : "—",
        s.cancelAtEnd ? "yes" : "no",
      ]),
    },
    notes: ["MRR normalizes annual/biannual tiers to a monthly figure."],
  };
}

async function buildSecurityReport(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  base: ReportBase,
  windowStart: Date
): Promise<ReportResult> {
  const outcomeRows = await db
    .select({ outcome: auditLogs.outcome, c: count() })
    .from(auditLogs)
    .where(gte(auditLogs.createdAt, windowStart))
    .groupBy(auditLogs.outcome);

  const actionRows = await db.execute(sql`
    SELECT action, COUNT(*) AS count
    FROM "auditLogs"
    WHERE "createdAt" >= ${windowStart}
      AND (category = 'auth' OR outcome IN ('failure','blocked')
           OR action LIKE '%role%' OR action LIKE '%password%')
    GROUP BY action ORDER BY count DESC LIMIT 25
  `);

  const dailyFailures = await db.execute(sql`
    SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day,
           COUNT(*) AS count
    FROM "auditLogs"
    WHERE outcome = 'failure' AND "createdAt" >= ${windowStart}
    GROUP BY 1 ORDER BY 1
  `);

  const roleChanges = await db.execute(sql`
    SELECT COUNT(*) AS c FROM "auditLogs"
    WHERE action LIKE '%role%' AND "createdAt" >= ${windowStart}
  `);

  const founderFails = await db
    .execute(
      sql`
    SELECT COUNT(*) AS c FROM "yallaAdminAuditLogs"
    WHERE action IN ('login.failed','login.mfa_failed')
      AND "createdAt" >= ${windowStart}
  `
    )
    .catch(() => ({ rows: [{ c: 0 }] }));

  const byOutcome = Object.fromEntries(
    outcomeRows.map(r => [r.outcome, Number(r.c)])
  );

  return {
    ...base,
    title: titleFor("security"),
    kpis: [
      { label: "Success events", value: Number(byOutcome.success ?? 0) },
      { label: "Failures", value: Number(byOutcome.failure ?? 0) },
      { label: "Blocked", value: Number(byOutcome.blocked ?? 0) },
      {
        label: "Role changes",
        value: Number((roleChanges.rows as any[])[0]?.c ?? 0),
      },
      {
        label: "Founder login fails",
        value: Number((founderFails.rows as any[])[0]?.c ?? 0),
      },
    ],
    series: [
      {
        name: "Failed events / day",
        points: (dailyFailures.rows as any[]).map(r => ({
          x: r.day,
          y: Number(r.count),
        })),
      },
    ],
    table: {
      columns: ["Action", "Count"],
      rows: (actionRows.rows as any[]).map(r => [r.action, Number(r.count)]),
    },
    notes: [
      "IP addresses are hashed at rest; raw IPs appear only in founders-portal audit rows.",
      "Includes platform auditLogs + founders-portal login failures.",
    ],
  };
}

async function buildOperationsReport(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  base: ReportBase,
  windowStart: Date
): Promise<ReportResult> {
  const srByStatus = await db
    .select({ status: serviceRequests.status, c: count() })
    .from(serviceRequests)
    .groupBy(serviceRequests.status);

  const srOpen = await db.execute(sql`
    SELECT COUNT(*) AS c FROM "serviceRequests"
    WHERE status NOT IN ('completed','cancelled') AND "createdAt" >= ${windowStart}
  `);

  const adminNotes = await db.execute(sql`
    SELECT COUNT(*) AS c FROM "adminNotifications"
    WHERE "isRead" = 0
  `);

  const emails = await db
    .execute(
      sql`
    SELECT status, COUNT(*) AS c FROM "email_log"
    WHERE "createdAt" >= ${windowStart}
    GROUP BY status
  `
    )
    .catch(() => ({ rows: [] as unknown[] }));

  const dailyRegs = await db.execute(sql`
    SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day,
           COUNT(*) AS count
    FROM "localUsers"
    WHERE "createdAt" >= ${windowStart}
    GROUP BY 1 ORDER BY 1
  `);

  const openSr = srByStatus
    .filter(r => r.status !== "completed" && r.status !== "cancelled")
    .reduce((s, r) => s + Number(r.c), 0);

  return {
    ...base,
    title: titleFor("operations"),
    kpis: [
      { label: "Open service requests", value: Number(openSr) },
      {
        label: `New SRs (${base.windowDays}d)`,
        value: Number((srOpen.rows as any[])[0]?.c ?? 0),
      },
      {
        label: "Unread admin notes",
        value: Number((adminNotes.rows as any[])[0]?.c ?? 0),
      },
      ...srByStatus.slice(0, 4).map(r => ({
        label: `SR: ${r.status}`,
        value: Number(r.c),
      })),
    ],
    series: [
      {
        name: "Signups / day",
        points: (dailyRegs.rows as { day: string; count: number }[]).map(r => ({
          x: r.day,
          y: Number(r.count),
        })),
      },
      {
        name: "Emails by status",
        points: (emails.rows as { status: string; c: number }[]).map(r => ({
          x: String(r.status),
          y: Number(r.c),
        })),
      },
    ],
    table: {
      columns: ["Service request status", "Count"],
      rows: srByStatus.map(r => [r.status, Number(r.c)]),
    },
    notes: [
      "Service request pipeline health; email metrics depend on email_log being populated.",
    ],
  };
}

// ─── CSV helper ──────────────────────────────────────────────────────────────

function csvEscape(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function reportToCsv(report: ReportResult): string {
  const lines: string[] = [];
  lines.push(`# ${report.title}`);
  lines.push(`# Generated,${report.generatedAt}`);
  lines.push(`# Window days,${report.windowDays}`);
  lines.push("");
  lines.push("KPI,Value");
  for (const k of report.kpis) {
    lines.push(`${csvEscape(k.label)},${csvEscape(k.value)}`);
  }
  lines.push("");
  lines.push(report.table.columns.map(csvEscape).join(","));
  for (const row of report.table.rows) {
    lines.push(row.map(csvEscape).join(","));
  }
  if (report.notes.length) {
    lines.push("");
    lines.push("Notes");
    for (const n of report.notes) lines.push(csvEscape(n));
  }
  return lines.join("\r\n");
}

// ─── PDF export ────────────────────────────────────────────────────

async function loadFont(pdfDoc: PDFDocument, p: string) {
  try {
    const bytes = readFileSync(p);
    return await pdfDoc.embedFont(bytes);
  } catch {
    return null;
  }
}

export async function reportToPdf(report: ReportResult): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts } = await import("pdf-lib");
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const { height } = page.getSize();
  const dejavuPath = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";
  const boldPath = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf";
  const normal =
    (await loadFont(pdfDoc, dejavuPath)) ??
    (await pdfDoc.embedFont(StandardFonts.Helvetica));
  const bold =
    (await loadFont(pdfDoc, boldPath)) ??
    (await pdfDoc.embedFont(StandardFonts.HelveticaBold));

  const FONT_SIZE = 10;
  const MARGIN = 40;
  let y = height - MARGIN - 20;

  page.drawText(report.title, { x: MARGIN, y, size: 18, font: bold });
  y -= 30;
  page.drawText(
    `Generated: ${report.generatedAt}  |  Window: ${report.windowDays}d`,
    { x: MARGIN, y, size: FONT_SIZE, font: normal }
  );
  y -= 20;

  for (const kp of report.kpis) {
    if (y < MARGIN + 20) {
      pdfDoc.addPage();
      y = height - MARGIN - 20;
    }
    page.drawText(`${kp.label}: ${kp.value}`, {
      x: MARGIN,
      y,
      size: FONT_SIZE,
      font: normal,
    });
    y -= 16;
  }

  if (report.table.columns.length) {
    y -= 8;
    page.drawText(report.table.columns.join(" | "), {
      x: MARGIN,
      y,
      size: FONT_SIZE - 2,
      font: bold,
    });
    y -= 14;
    for (const row of report.table.rows) {
      if (y < MARGIN + 20) {
        pdfDoc.addPage();
        y = height - MARGIN - 20;
      }
      page.drawText(row.join(" | "), {
        x: MARGIN,
        y,
        size: FONT_SIZE - 2,
        font: normal,
      });
      y -= 14;
    }
  }

  if (report.notes.length) {
    y -= 8;
    page.drawText("Notes", { x: MARGIN, y, size: FONT_SIZE, font: bold });
    y -= 14;
    for (const n of report.notes) {
      if (y < MARGIN + 20) {
        pdfDoc.addPage();
        y = height - MARGIN - 20;
      }
      page.drawText(n, { x: MARGIN, y, size: FONT_SIZE, font: normal });
      y -= 14;
    }
  }

  return await pdfDoc.save();
}

// ─── Operational alerts ──────────────────────────────────────────────

export async function sendAlertDigest(): Promise<{
  sent: number;
  skipped: number;
}> {
  const db = await getDb();
  if (!db) return { sent: 0, skipped: 1 };

  try {
    const alerts = await getOperationalAlerts();
    const critical = alerts.filter(a => a.severity === "critical");
    const warnings = alerts.filter(a => a.severity === "warning");

    if (critical.length === 0 && warnings.length === 0) {
      return { sent: 0, skipped: 0 };
    }

    const { createTransport } = await import("nodemailer");
    const { parsedEnv } = await import("../services/config-schema");
    const { logDelivery } = await import("../email");

    const transport = createTransport({
      host: parsedEnv.SMTP_HOST || "localhost",
      port: parsedEnv.SMTP_PORT,
      secure: parsedEnv.SMTP_SECURE,
      auth: parsedEnv.SMTP_USER
        ? { user: parsedEnv.SMTP_USER, pass: parsedEnv.SMTP_PASS }
        : undefined,
    });

    const text = [
      "DJAC Operational Alert Digest",
      "",
      critical.length ? `🔴 CRITICAL (${critical.length}):` : "",
      ...critical.map(a => `  [${a.category}] ${a.title}: ${a.detail}`),
      warnings.length ? `🟡 WARNINGS (${warnings.length}):` : "",
      ...warnings.map(a => `  [${a.category}] ${a.title}: ${a.detail}`),
      "",
      "Generated by the founders console.",
    ]
      .filter(Boolean)
      .join("\n");

    const info = await transport.sendMail({
      from: parsedEnv.SMTP_FROM || "DJAC <noreply@yalla-hack.com>",
      to: parsedEnv.DEFAULT_BILLING_EMAIL,
      subject: `[${critical.length ? "CRITICAL" : "WARNING"}] DJAC Operational Alerts`,
      text,
    });

    await logDelivery(
      {
        to: parsedEnv.DEFAULT_BILLING_EMAIL,
        subject: info.messageId ?? "alert-digest",
        html: text,
      },
      "sent"
    );

    return { sent: alerts.length, skipped: 0 };
  } catch (err) {
    logger.error({ error: err }, "sendAlertDigest failed");
    return { sent: 0, skipped: 1 };
  }
}

// ─── Operational alerts ──────────────────────────────────────────────

export async function getOperationalAlerts(): Promise<OperationalAlert[]> {
  const db = await getDb();
  if (!db) return [];
  const alerts: OperationalAlert[] = [];
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 3600 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

  try {
    const failRow = await db.execute(sql`
      SELECT COUNT(*) AS c FROM "auditLogs"
      WHERE outcome = 'failure' AND "createdAt" >= ${dayAgo}
    `);
    const fails = Number((failRow.rows as any[])[0]?.c ?? 0);
    if (fails >= 10) {
      alerts.push({
        id: "auth-fail-spike",
        severity: fails >= 50 ? "critical" : "warning",
        category: "security",
        title: "Elevated authentication failures",
        detail: `${fails} failed auth events in the last 24 hours.`,
        count: fails,
        createdAt: now.toISOString(),
      });
    }
  } catch {
    /* ignore */
  }

  try {
    const pastDue = await db
      .select({ c: count() })
      .from(subscriptions)
      .where(eq(subscriptions.status, "past_due"));
    if ((pastDue[0]?.c ?? 0) > 0) {
      const pastDueCount = Number(pastDue[0].c);
      alerts.push({
        id: "subs-past-due",
        severity: "warning",
        category: "billing",
        title: "Subscriptions past due",
        detail: `${pastDueCount} subscription(s) require payment attention.`,
        count: pastDueCount,
        createdAt: now.toISOString(),
      });
    }
  } catch {
    /* ignore */
  }

  try {
    const openSr = await db.execute(sql`
      SELECT COUNT(*) AS c FROM "serviceRequests"
      WHERE status NOT IN ('completed','cancelled')
    `);
    const open = Number((openSr.rows as any[])[0]?.c ?? 0);
    if (open >= 5) {
      alerts.push({
        id: "sr-backlog",
        severity: "info",
        category: "support",
        title: "Service request backlog",
        detail: `${open} open service requests in the queue.`,
        count: open,
        createdAt: now.toISOString(),
      });
    } else if (open > 0) {
      alerts.push({
        id: "sr-open",
        severity: "info",
        category: "support",
        title: "Open service requests",
        detail: `${open} request(s) awaiting action.`,
        count: open,
        createdAt: now.toISOString(),
      });
    }
  } catch {
    /* ignore */
  }

  try {
    const dormant = await db.execute(sql`
      SELECT COUNT(*) AS c FROM "localUsers"
      WHERE "status" = 'active'
        AND ("lastSignedIn" IS NULL OR "lastSignedIn" < ${weekAgo})
    `);
    const n = Number((dormant.rows as any[])[0]?.c ?? 0);
    if (n >= 10) {
      alerts.push({
        id: "dormant-users",
        severity: "info",
        category: "growth",
        title: "Many dormant active users",
        detail: `${n} active users have not signed in for 7+ days.`,
        count: n,
        createdAt: now.toISOString(),
      });
    }
  } catch {
    /* ignore */
  }

  try {
    const unread = await db.execute(sql`
      SELECT COUNT(*) AS c FROM "adminNotifications" WHERE "isRead" = 0
    `);
    const n = Number((unread.rows as any[])[0]?.c ?? 0);
    if (n >= 5) {
      alerts.push({
        id: "admin-notes",
        severity: "info",
        category: "system",
        title: "Unread admin notifications",
        detail: `${n} admin notification(s) have not been reviewed.`,
        count: n,
        createdAt: now.toISOString(),
      });
    }
  } catch {
    /* ignore */
  }

  try {
    const canceling = await db
      .select({ c: count() })
      .from(subscriptions)
      .where(eq(subscriptions.cancelAtPeriodEnd, 1));
    if ((canceling[0]?.c ?? 0) > 0) {
      alerts.push({
        id: "canceling",
        severity: "warning",
        category: "billing",
        title: "Subscriptions canceling",
        detail: `${canceling[0].c} subscription(s) cancel at period end.`,
        count: canceling[0].c,
        createdAt: now.toISOString(),
      });
    }
  } catch {
    /* ignore */
  }

  const severityOrder = { critical: 0, warning: 1, info: 2 };
  return alerts.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );
}

// ─── Live metrics ────────────────────────────────────────────────────────────

export async function getLiveMetrics(): Promise<LiveMetrics> {
  const { getSSEClientCount } = await import("../services/sse-bus");
  const db = await getDb();
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 3600 * 1000);

  const empty: LiveMetrics = {
    generatedAt: now.toISOString(),
    sseClients: getSSEClientCount(),
    onlineRecently: 0,
    activeFoundersSessions: 0,
    signupsToday: 0,
    loginsToday: 0,
    failedLogins24h: 0,
    openServiceRequests: 0,
    unreadAdminNotifications: 0,
    recentEvents: [],
  };

  if (!db) return empty;

  try {
    const [online] = await db
      .select({ c: count() })
      .from(localUsers)
      .where(gte(localUsers.lastSignedIn, fiveMinAgo));

    const sessionsResult = await db.execute(sql`
      SELECT COUNT(*) AS c FROM "yallaAdminSessions"
      WHERE "isRevoked" = 0 AND "expiresAt" > NOW()
    `);

    const [signups] = await db
      .select({ c: count() })
      .from(localUsers)
      .where(gte(localUsers.createdAt, dayStart));

    const loginsResult = await db.execute(sql`
      SELECT COUNT(*) AS c FROM "auditLogs"
      WHERE action = 'user.login' AND "createdAt" >= ${dayStart}
    `);

    const failsResult = await db.execute(sql`
      SELECT COUNT(*) AS c FROM "auditLogs"
      WHERE outcome = 'failure' AND "createdAt" >= ${dayAgo}
    `);

    const openSrResult = await db.execute(sql`
      SELECT COUNT(*) AS c FROM "serviceRequests"
      WHERE status NOT IN ('completed','cancelled')
    `);

    const unreadResult = await db.execute(sql`
      SELECT COUNT(*) AS c FROM "adminNotifications" WHERE "isRead" = 0
    `);

    const recent = await db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        category: auditLogs.category,
        outcome: auditLogs.outcome,
        userName: localUsers.name,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .leftJoin(localUsers, eq(auditLogs.localUserId, localUsers.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(25);

    return {
      generatedAt: now.toISOString(),
      sseClients: getSSEClientCount(),
      onlineRecently: Number(online?.c ?? 0),
      activeFoundersSessions: Number(
        (sessionsResult.rows as { c: number }[])[0]?.c ?? 0
      ),
      signupsToday: Number(signups?.c ?? 0),
      loginsToday: Number((loginsResult.rows as { c: number }[])[0]?.c ?? 0),
      failedLogins24h: Number((failsResult.rows as { c: number }[])[0]?.c ?? 0),
      openServiceRequests: Number(
        (openSrResult.rows as { c: number }[])[0]?.c ?? 0
      ),
      unreadAdminNotifications: Number(
        (unreadResult.rows as { c: number }[])[0]?.c ?? 0
      ),
      recentEvents: recent.map(r => ({
        id: String(r.id),
        type: r.category,
        label: `${r.userName ?? "system"} · ${r.action}${
          r.outcome === "failure" ? " (failed)" : ""
        }`,
        at: r.createdAt?.toISOString() ?? "",
      })),
    };
  } catch (error) {
    logger.error({ error }, "getLiveMetrics failed");
    return empty;
  }
}
