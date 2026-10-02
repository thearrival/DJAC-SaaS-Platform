/**
 * Foreign-key index bootstrap.
 *
 * A database audit found dozens of foreign-key columns with no index — every
 * join, tenant-scoped filter, and `ON DELETE CASCADE` then does a sequential
 * scan, which is invisible at today's data volume but degrades sharply as the
 * platform grows. These indexes are created idempotently on startup (IF NOT
 * EXISTS ⇒ a no-op after the first run).
 *
 * Only the high-traffic tenant/user/vendor FKs are listed; the full audit is in
 * the PR that introduced this file. Extend the list as new hot columns appear.
 *
 * NOTE: plain `CREATE INDEX` (not `CONCURRENTLY`) because this runs inside the
 * migration transaction. It is safe for the current table sizes; if a table ever
 * grows large, drop this and apply `CREATE INDEX CONCURRENTLY` out-of-band.
 */
import { sql } from "drizzle-orm";
import type { getDb } from "../db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

export type ForeignKeyIndex = {
  name: string;
  table: string;
  columns: string[];
};

export const FK_INDEXES: ForeignKeyIndex[] = [
  // Tenant scoping (organization_id / org columns)
  {
    name: "onboarding_responses_org_idx",
    table: "onboarding_responses",
    columns: ["organization_id"],
  },
  {
    name: "onboarding_events_org_idx",
    table: "onboarding_events",
    columns: ["organization_id"],
  },
  {
    name: "onboarding_profile_history_org_idx",
    table: "onboarding_profile_history",
    columns: ["organization_id"],
  },
  {
    name: "personalization_recommendations_org_idx",
    table: "personalization_recommendations",
    columns: ["organization_id"],
  },
  {
    name: "analytics_events_org_idx",
    table: "analytics_events",
    columns: ["organization_id"],
  },
  {
    name: "email_log_org_idx",
    table: "email_log",
    columns: ["organization_id"],
  },
  // User identity (both OAuth users and local users)
  {
    name: "activityEvents_userId_idx",
    table: "activityEvents",
    columns: ["userId"],
  },
  {
    name: "activityEvents_localUserId_idx",
    table: "activityEvents",
    columns: ["localUserId"],
  },
  { name: "auditLogs_userId_idx", table: "auditLogs", columns: ["userId"] },
  {
    name: "notifications_userId_idx",
    table: "notifications",
    columns: ["user_id"],
  },
  {
    name: "userInteractionLogs_userId_idx",
    table: "userInteractionLogs",
    columns: ["userId"],
  },
  {
    name: "userInteractionLogs_localUserId_idx",
    table: "userInteractionLogs",
    columns: ["localUserId"],
  },
  {
    name: "userOnboarding_userId_idx",
    table: "userOnboarding",
    columns: ["userId"],
  },
  {
    name: "userOnboarding_localUserId_idx",
    table: "userOnboarding",
    columns: ["localUserId"],
  },
  {
    name: "analytics_events_user_idx",
    table: "analytics_events",
    columns: ["user_id"],
  },
  { name: "email_log_user_idx", table: "email_log", columns: ["user_id"] },
  // Vendor / assessment graph
  {
    name: "vendorAssessments_vendorId_idx",
    table: "vendorAssessments",
    columns: ["vendorId"],
  },
  {
    name: "vendorAssessments_frameworkId_idx",
    table: "vendorAssessments",
    columns: ["frameworkId"],
  },
  {
    name: "techStackComponents_vendorId_idx",
    table: "techStackComponents",
    columns: ["vendorId"],
  },
  {
    name: "continuousComplianceRuns_vendorId_idx",
    table: "continuousComplianceRuns",
    columns: ["vendorId"],
  },
  {
    name: "assessmentGaps_assessmentId_idx",
    table: "assessmentGaps",
    columns: ["assessmentId"],
  },
  // Owner / actor lookups
  {
    name: "complianceReports_generatedByUserId_idx",
    table: "complianceReports",
    columns: ["generatedByUserId"],
  },
  {
    name: "apiKeys_createdByUserId_idx",
    table: "apiKeys",
    columns: ["createdByUserId"],
  },
  {
    name: "complianceDeadlines_assignedToUserId_idx",
    table: "complianceDeadlines",
    columns: ["assignedToUserId"],
  },
];

/**
 * Build the DDL for one index. Pure and directly testable.
 */
export function buildCreateIndexSql(index: ForeignKeyIndex) {
  return sql`CREATE INDEX IF NOT EXISTS ${sql.identifier(index.name)} ON ${sql.identifier(index.table)} (${sql.join(
    index.columns.map(column => sql.identifier(column)),
    sql`, `
  )})`;
}

export async function ensureForeignKeyIndexes(db: Db): Promise<void> {
  for (const index of FK_INDEXES) {
    try {
      await db.execute(buildCreateIndexSql(index));
    } catch (err) {
      // A renamed/absent table must not break startup.
      console.warn(
        `[Schema] Could not ensure index ${index.name}:`,
        err instanceof Error ? err.message : err
      );
    }
  }
}
