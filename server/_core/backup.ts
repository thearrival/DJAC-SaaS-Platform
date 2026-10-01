/**
 * Serverless database backup.
 *
 * The GitHub Actions workflow (.github/workflows/db-backup.yml) produces a full
 * `pg_dump`, but it needs a repository secret and a runner. This module is the
 * zero-configuration safety net that runs inside the app: a Vercel cron calls
 * `runDatabaseBackup()`, which snapshots the critical tables to Supabase Storage
 * as JSON and prunes old copies.
 *
 * It is intentionally a *logical* export (row JSON), not a byte-for-byte dump —
 * serverless has no `pg_dump`. It covers the business-critical tables and is a
 * restore aid, not a replacement for Supabase PITR or the pg_dump workflow.
 */
import { sql } from "drizzle-orm";
import { getDb } from "../db";
import { getSupabaseAdmin, getStorageBucket } from "../services/supabase";
import { logger } from "./logger";

export const BACKUP_BUCKET = "backups";
/** Rows exported per table. Bounds memory and object size on serverless. */
export const BACKUP_ROW_CAP = 5000;
/** How many daily snapshots to retain. */
export const BACKUP_KEEP = 14;

/**
 * Business-critical tables. Reference/seed data (frameworks, controls, …) is
 * intentionally excluded — it is reproducible from the repo — so the snapshot
 * stays small and restorable in isolation.
 */
export const BACKUP_TABLES = [
  "localUsers",
  "users",
  "organizations",
  "organizationMembers",
  "organizationProfilesCustom",
  "onboarding_responses",
  "onboarding_events",
  "onboarding_profile_history",
  "personalization_recommendations",
] as const;

export type BackupSnapshot = {
  generatedAt: string;
  version: 1;
  tables: Record<string, unknown[]>;
  rowCap: number;
};

/** Filenames sort chronologically, so "newest first" is a plain reverse sort. */
export function backupFileName(generatedAt: string): string {
  return `djac-${generatedAt.replace(/[:.]/g, "")}.json`;
}

/**
 * Given the stored backup names, return the ones beyond the retention window
 * (oldest first). Pure and directly testable.
 */
export function selectStaleBackups(
  names: string[],
  keep = BACKUP_KEEP
): string[] {
  const sorted = [...names].sort().reverse(); // newest first
  // Return the stale ones oldest-first (natural deletion order).
  return sorted.slice(Math.max(0, keep)).reverse();
}

export async function buildBackupSnapshot(): Promise<BackupSnapshot> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const tables: Record<string, unknown[]> = {};
  for (const table of BACKUP_TABLES) {
    try {
      const result = await db.execute(
        sql`SELECT * FROM ${sql.identifier(table)} LIMIT ${BACKUP_ROW_CAP}`
      );
      tables[table] = (result.rows as unknown[]) ?? [];
    } catch (err) {
      // A missing/renamed table must not abort the whole backup.
      logger.warn({ table, err }, "Backup: skipping table");
      tables[table] = [];
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    version: 1,
    tables,
    rowCap: BACKUP_ROW_CAP,
  };
}

export async function pruneBackups(keep = BACKUP_KEEP): Promise<number> {
  const bucket = getStorageBucket(BACKUP_BUCKET);
  if (!bucket) return 0;
  const { data } = await bucket.list("", {
    limit: 1000,
    sortBy: { column: "name", order: "desc" },
  });
  const stale = selectStaleBackups(
    (data ?? []).map(f => f.name),
    keep
  );
  if (stale.length) await bucket.remove(stale);
  return stale.length;
}

export type BackupResult = {
  ok: boolean;
  file?: string;
  bytes?: number;
  tableCount?: number;
  rowCount?: number;
  pruned?: number;
  error?: string;
};

export async function runDatabaseBackup(): Promise<BackupResult> {
  const admin = getSupabaseAdmin();
  const bucket = getStorageBucket(BACKUP_BUCKET);
  if (!admin || !bucket) {
    return { ok: false, error: "Supabase storage is not configured" };
  }

  try {
    // Idempotent: throws if the bucket already exists.
    await admin.storage
      .createBucket(BACKUP_BUCKET, { public: false })
      .catch(() => {});

    const snapshot = await buildBackupSnapshot();
    const body = JSON.stringify(snapshot);
    const file = backupFileName(snapshot.generatedAt);

    const { error } = await bucket.upload(
      file,
      new TextEncoder().encode(body),
      { contentType: "application/json", upsert: true }
    );
    if (error) return { ok: false, error: error.message };

    const pruned = await pruneBackups();
    const rowCount = Object.values(snapshot.tables).reduce(
      (n, rows) => n + rows.length,
      0
    );

    logger.info(
      { file, bytes: body.length, tableCount: BACKUP_TABLES.length, rowCount },
      "Database backup uploaded"
    );

    return {
      ok: true,
      file,
      bytes: body.length,
      tableCount: BACKUP_TABLES.length,
      rowCount,
      pruned,
    };
  } catch (err) {
    logger.error({ err }, "Database backup failed");
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
