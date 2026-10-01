#!/usr/bin/env tsx
/**
 * Restore drill.
 *
 * Restores a backup snapshot into a SCRATCH database and verifies per-table row
 * counts — proving the backups are actually restorable. It refuses to run
 * against the production database unless `--force` is passed.
 *
 * Usage:
 *   TARGET_DATABASE_URL="postgresql://…scratch…" \
 *     pnpm drill:restore                       # newest snapshot from Storage
 *   TARGET_DATABASE_URL="…" pnpm drill:restore -- --file snapshot.json
 *
 * For Storage access set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 * DATABASE_URL (if set) is used only to detect that the target is production.
 */
import pg from "pg";
import fs from "node:fs";
import { isSameDatabase, BACKUP_TABLES } from "../server/_core/backup";

type Snapshot = {
  generatedAt?: string;
  tables: Record<string, Record<string, unknown>[]>;
};

function die(message: string): never {
  console.error(`[drill] ${message}`);
  process.exit(1);
}

const TARGET = process.env.TARGET_DATABASE_URL;
const PRODUCTION = process.env.DATABASE_URL;
const fileIdx = process.argv.indexOf("--file");
const filePath = fileIdx >= 0 ? process.argv[fileIdx + 1] : undefined;
const force = process.argv.includes("--force");

if (!TARGET) {
  die(
    "TARGET_DATABASE_URL is required. Point it at a scratch/read-only database."
  );
}
if (isSameDatabase(TARGET, PRODUCTION) && !force) {
  die(
    "Refusing to run against the production database (TARGET_DATABASE_URL matches DATABASE_URL). Pass --force to override."
  );
}

async function loadSnapshot(): Promise<Snapshot> {
  if (filePath) {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as Snapshot;
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    die(
      "Provide --file <snapshot.json>, or set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  const authHeaders = {
    apikey: key,
    Authorization: `Bearer ${key}`,
  };
  const listRes = await fetch(`${url}/storage/v1/object/list/backups`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      prefix: "",
      limit: 1,
      sortBy: { column: "name", order: "desc" },
    }),
  });
  const list = (await listRes.json()) as { name: string }[];
  const name = list?.[0]?.name;
  if (!name) die("No backups found in the `backups` bucket.");
  console.log(`[drill] newest snapshot: ${name}`);

  const res = await fetch(`${url}/storage/v1/object/backups/${name}`, {
    headers: authHeaders,
  });
  if (!res.ok) die(`Failed to download snapshot (${res.status}).`);
  return (await res.json()) as Snapshot;
}

async function main() {
  const snapshot = await loadSnapshot();
  const allowed = new Set<string>(BACKUP_TABLES);
  const client = new pg.Client({ connectionString: TARGET });
  await client.connect();

  const report: Record<string, unknown>[] = [];
  for (const [table, rows] of Object.entries(snapshot.tables)) {
    // Never interpolate an untrusted table name.
    if (!allowed.has(table)) {
      report.push({ table, error: "skipped: not a known backup table" });
      continue;
    }
    try {
      const inserted = await client.query(
        `INSERT INTO "${table}"
           SELECT * FROM json_populate_recordset(null::"${table}", $1::json)
         ON CONFLICT DO NOTHING`,
        [JSON.stringify(rows)]
      );
      const counted = await client.query(
        `SELECT count(*)::int AS n FROM "${table}"`
      );
      const total = counted.rows[0]?.n ?? 0;
      report.push({
        table,
        source: rows.length,
        inserted: inserted.rowCount,
        total,
        ok: total >= rows.length,
      });
    } catch (err) {
      report.push({
        table,
        source: rows.length,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  await client.end();
  console.table(report);

  const failed = report.filter(r => r.error || r.ok === false);
  if (failed.length) {
    console.error(`[drill] FAILED: ${failed.length} table(s) did not verify.`);
    process.exit(1);
  }
  console.log(
    `[drill] OK: ${Object.keys(snapshot.tables).length} tables restored and row counts verified (${snapshot.generatedAt ?? "unknown time"}).`
  );
}

main().catch(err => die(err instanceof Error ? err.message : String(err)));
