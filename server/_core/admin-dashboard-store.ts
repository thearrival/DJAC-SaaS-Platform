import { and, count, desc, eq, gte, like, or, sql } from "drizzle-orm";
import {
  localUsers,
  organizations,
  organizationMembers,
  users,
  userOnboarding,
  auditLogs,
  subscriptions,
} from "../../drizzle/schema";
import { getDb } from "../db";
import {
  isLocalMemoryFallbackEnabled,
  localMemoryUsers,
} from "../services/local-jwt";

export interface UnifiedUser {
  id: number;
  source: "local" | "oauth";
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
  role: string;
  status: string;
  companyName: string | null;
  jobTitle: string | null;
  industry: string | null;
  preferredLocale: string;
  lastSignedIn: Date | null;
  createdAt: Date | null;
  orgCount: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  pendingUsers: number;
  newThisMonth: number;
  localUsers: number;
  oauthUsers: number;
  byRole: Record<string, number>;
}

export interface UserDetail extends UnifiedUser {
  organizationMemberships: Array<{
    orgId: number;
    orgName: string;
    role: string;
    joinedAt: Date | null;
  }>;
  recentActivity: Array<{
    id: number;
    action: string;
    category: string;
    createdAt: Date | null;
  }>;
}

export interface ActivityEvent {
  id: number;
  userId: number | null;
  userName: string | null;
  action: string;
  category: string;
  target: string | null;
  outcome: string | null;
  ipAddress: string | null;
  createdAt: Date | null;
}

export async function getUnifiedUsers(options: {
  search?: string;
  status?: string;
  role?: string;
  source?: "local" | "oauth";
  limit?: number;
  offset?: number;
}): Promise<{ users: UnifiedUser[]; total: number }> {
  const db = await getDb();
  if (!db) {
    const memFallback = isLocalMemoryFallbackEnabled() ? localMemoryUsers : [];
    const filtered = memFallback
      .filter(u => !options.status || u.status === options.status)
      .map(u => ({
        id: u.id,
        source: "local" as const,
        name: u.name,
        email: u.email ?? null,
        phoneNumber: u.phoneNumber ?? null,
        role: u.userType ?? "visitor",
        status: u.status ?? "pending",
        companyName: u.companyName ?? null,
        jobTitle: u.jobTitle ?? null,
        industry: u.industry ?? null,
        preferredLocale: u.preferredLocale ?? "en",
        lastSignedIn: u.lastSignedIn ?? null,
        createdAt: u.createdAt ?? null,
        orgCount: 0,
      }));
    return {
      users: filtered.slice(
        options.offset ?? 0,
        (options.offset ?? 0) + (options.limit ?? 50)
      ),
      total: filtered.length,
    };
  }

  const conditions: ReturnType<typeof and>[] = [];

  if (options.search) {
    const term = `%${options.search}%`;
    conditions.push(
      or(
        like(localUsers.name, term),
        like(localUsers.email, term),
        like(localUsers.companyName, term),
        like(localUsers.phoneNumber, term)
      )
    );
  }

  if (options.status) {
    conditions.push(
      eq(
        localUsers.status,
        options.status as "active" | "pending" | "suspended"
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [total] = await db
    .select({ count: count() })
    .from(localUsers)
    .where(whereClause);

  const rows = await db
    .select({
      id: localUsers.id,
      source: sql<string>`'local'`.as("source"),
      name: localUsers.name,
      email: localUsers.email,
      phoneNumber: localUsers.phoneNumber,
      role: sql<string>`${localUsers.userType}`,
      status: sql<string>`${localUsers.status}`,
      companyName: localUsers.companyName,
      jobTitle: localUsers.jobTitle,
      industry: localUsers.industry,
      preferredLocale: localUsers.preferredLocale,
      lastSignedIn: localUsers.lastSignedIn,
      createdAt: localUsers.createdAt,
    })
    .from(localUsers)
    .where(whereClause)
    .orderBy(desc(localUsers.createdAt))
    .limit(options.limit ?? 50)
    .offset(options.offset ?? 0);

  const orgCounts = await db
    .select({
      localUserId: organizationMembers.localUserId,
      orgCount: count(),
    })
    .from(organizationMembers)
    .where(
      and(
        sql`${organizationMembers.localUserId} IS NOT NULL`,
        eq(organizationMembers.status, "active")
      )
    )
    .groupBy(organizationMembers.localUserId);

  const orgCountMap = new Map(orgCounts.map(r => [r.localUserId, r.orgCount]));

  const unified: UnifiedUser[] = rows.map(r => ({
    ...r,
    source: "local" as const,
    orgCount: orgCountMap.get(r.id) ?? 0,
  }));

  return { users: unified, total: total.count };
}

export async function getUserStats(): Promise<UserStats> {
  const db = await getDb();
  if (!db) {
    return {
      totalUsers: 0,
      activeUsers: 0,
      suspendedUsers: 0,
      pendingUsers: 0,
      newThisMonth: 0,
      localUsers: 0,
      oauthUsers: 0,
      byRole: {},
    };
  }

  const [localCounts] = await db
    .select({
      total: count(),
      active: sql<number>`COUNT(*) FILTER (WHERE ${localUsers.status} = 'active')`,
      suspended: sql<number>`COUNT(*) FILTER (WHERE ${localUsers.status} = 'suspended')`,
      pending: sql<number>`COUNT(*) FILTER (WHERE ${localUsers.status} = 'pending')`,
      newThisMonth: sql<number>`COUNT(*) FILTER (WHERE ${localUsers.createdAt} >= date_trunc('month', CURRENT_DATE))`,
    })
    .from(localUsers);

  const [oauthCounts] = await db.select({ total: count() }).from(users);

  const roleCounts = await db
    .select({
      role: localUsers.userType,
      count: count(),
    })
    .from(localUsers)
    .groupBy(localUsers.userType);

  const byRole: Record<string, number> = {};
  for (const r of roleCounts) {
    byRole[r.role ?? "visitor"] = r.count;
  }

  return {
    totalUsers: (localCounts?.total ?? 0) + (oauthCounts?.total ?? 0),
    activeUsers: localCounts?.active ?? 0,
    suspendedUsers: localCounts?.suspended ?? 0,
    pendingUsers: localCounts?.pending ?? 0,
    newThisMonth: localCounts?.newThisMonth ?? 0,
    localUsers: localCounts?.total ?? 0,
    oauthUsers: oauthCounts?.total ?? 0,
    byRole,
  };
}

export async function getUserDetail(
  userId: number
): Promise<UserDetail | null> {
  const db = await getDb();
  if (!db) return null;

  const [user] = await db
    .select()
    .from(localUsers)
    .where(eq(localUsers.id, userId))
    .limit(1);

  if (!user) return null;

  const memberships = await db
    .select({
      orgId: organizations.id,
      orgName: organizations.name,
      role: organizationMembers.role,
      joinedAt: organizationMembers.createdAt,
    })
    .from(organizationMembers)
    .innerJoin(
      organizations,
      eq(organizationMembers.organizationId, organizations.id)
    )
    .where(
      and(
        eq(organizationMembers.localUserId, userId),
        eq(organizationMembers.status, "active")
      )
    );

  const activity = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      category: auditLogs.category,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .where(eq(auditLogs.localUserId, userId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(50);

  return {
    id: user.id,
    source: "local",
    name: user.name,
    email: user.email ?? null,
    phoneNumber: user.phoneNumber ?? null,
    role: user.userType ?? "visitor",
    status: user.status ?? "pending",
    companyName: user.companyName ?? null,
    jobTitle: user.jobTitle ?? null,
    industry: user.industry ?? null,
    preferredLocale: user.preferredLocale ?? "en",
    lastSignedIn: user.lastSignedIn ?? null,
    createdAt: user.createdAt ?? null,
    orgCount: memberships.length,
    organizationMemberships: memberships,
    recentActivity: activity,
  };
}

export async function toggleUserSuspension(
  userId: number,
  suspend: boolean
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .update(localUsers)
    .set({ status: suspend ? "suspended" : "active", updatedAt: new Date() })
    .where(eq(localUsers.id, userId));

  return true;
}

export async function updateUserRole(
  userId: number,
  newRole: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .update(localUsers)
    .set({
      userType: newRole as
        | "visitor"
        | "professional"
        | "admin"
        | "basic_user"
        | "professional_user"
        | "company_admin"
        | "platform_admin"
        | "yalla_hack_employee"
        | "super_admin",
      updatedAt: new Date(),
    })
    .where(eq(localUsers.id, userId));

  return true;
}

export async function deleteUser(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db
    .delete(organizationMembers)
    .where(eq(organizationMembers.localUserId, userId));
  await db.delete(auditLogs).where(eq(auditLogs.localUserId, userId));
  await db.delete(userOnboarding).where(eq(userOnboarding.localUserId, userId));
  await db.delete(localUsers).where(eq(localUsers.id, userId));

  return true;
}

export async function getRecentActivity(limit = 100): Promise<ActivityEvent[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: auditLogs.id,
      userId: auditLogs.localUserId,
      userName: localUsers.name,
      action: auditLogs.action,
      category: auditLogs.category,
      target: auditLogs.targetEntity,
      outcome: auditLogs.outcome,
      ipAddress: auditLogs.ipHash,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(localUsers, eq(auditLogs.localUserId, localUsers.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

export async function getMonthlyRegistrations(
  months = 12
): Promise<Array<{ month: string; count: number }>> {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      month: sql<string>`to_char(${localUsers.createdAt}, 'YYYY-MM')`,
      count: count(),
    })
    .from(localUsers)
    .where(
      gte(
        localUsers.createdAt,
        sql`CURRENT_DATE - INTERVAL '${sql.raw(String(months))} months'`
      )
    )
    .groupBy(sql`1`)
    .orderBy(sql`1`);

  return rows;
}

export async function getSubscriptionData(): Promise<{
  subscriptions: Array<{
    id: number;
    plan: string;
    status: string;
    billingInterval: string;
    amountCents: number;
    currency: string;
    organizationName: string;
    billingEmail: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: number;
    createdAt: string;
    updatedAt: string;
  }>;
}> {
  const db = await getDb();
  if (!db) return { subscriptions: [] };

  const rows = await db
    .select({
      id: subscriptions.id,
      plan: subscriptions.plan,
      status: subscriptions.status,
      billingInterval: subscriptions.billingInterval,
      amountCents: subscriptions.amountCents,
      currency: subscriptions.currency,
      organizationName: organizations.name,
      billingEmail: organizations.billingEmail,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
      createdAt: subscriptions.createdAt,
      updatedAt: subscriptions.updatedAt,
    })
    .from(subscriptions)
    .innerJoin(
      organizations,
      eq(subscriptions.organizationId, organizations.id)
    )
    .orderBy(desc(subscriptions.updatedAt))
    .limit(500);

  return {
    subscriptions: rows.map(r => ({
      ...r,
      createdAt: r.createdAt?.toISOString() || "",
      updatedAt: r.updatedAt?.toISOString() || "",
      currentPeriodEnd: r.currentPeriodEnd?.toISOString() || null,
    })),
  };
}

export async function getOrganizationData(): Promise<
  Array<{
    id: number;
    name: string;
    plan: string;
    status: string;
    memberCount: number;
    createdAt: string;
    lastActivity: string | null;
  }>
> {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      plan: organizations.plan,
      status: sql<string>`CASE WHEN ${organizations.isActive} = 1 THEN 'active' ELSE 'inactive' END`,
      memberCount: sql<number>`COUNT(DISTINCT ${organizationMembers.id})`,
      createdAt: organizations.createdAt,
      lastActivity: sql<string | null>`MAX(${organizationMembers.createdAt})`,
    })
    .from(organizations)
    .leftJoin(
      organizationMembers,
      eq(organizations.id, organizationMembers.organizationId)
    )
    .groupBy(organizations.id)
    .orderBy(desc(organizations.createdAt))
    .limit(500);

  return rows.map(r => ({
    ...r,
    createdAt: r.createdAt?.toISOString() || "",
    lastActivity: r.lastActivity,
  }));
}

export async function getSecurityEvents(limit = 200): Promise<
  Array<{
    id: number;
    action: string;
    category: string;
    outcome: string;
    ipAddress: string | null;
    createdAt: string;
    targetEntity: string | null;
  }>
> {
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      category: auditLogs.category,
      outcome: auditLogs.outcome,
      ipAddress: auditLogs.ipHash,
      createdAt: auditLogs.createdAt,
      targetEntity: auditLogs.targetEntity,
    })
    .from(auditLogs)
    .where(
      or(
        eq(auditLogs.category, "auth"),
        eq(auditLogs.outcome, "failure"),
        eq(auditLogs.outcome, "blocked")
      )
    )
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);

  return rows.map(r => ({ ...r, createdAt: r.createdAt?.toISOString() || "" }));
}
