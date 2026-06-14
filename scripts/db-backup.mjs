#!/usr/bin/env node
/**
 * Automated database backup script for DJAC SaaS.
 *
 * Usage: node scripts/db-backup.mjs
 *
 * Requires: DATABASE_URL env var
 * Outputs: backup/dbac-saas-YYYY-MM-DDTHHmmss.sql.gz
 *
 * Can be run as a cron job:
 *   0 3 * * * cd /app && node scripts/db-backup.mjs
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const backupDir = path.join(root, "backup");
fs.mkdirSync(backupDir, { recursive: true });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("[db-backup] DATABASE_URL is not set.");
  process.exit(1);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "").slice(0, 15);
const filename = `djac-saas-${timestamp}.sql`;
const filepath = path.join(backupDir, filename);

console.log(`[db-backup] Starting backup to ${filepath}...`);

try {
  execSync(
    `pg_dump "${dbUrl}" --no-owner --no-acl --clean --if-exists --file="${filepath}"`,
    { stdio: "inherit", timeout: 300_000 }
  );

  const stats = fs.statSync(filepath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
  console.log(`[db-backup] Complete — ${sizeMB} MB`);

  // Keep only last 7 daily backups
  const files = fs.readdirSync(backupDir)
    .filter(f => f.startsWith("djac-saas-") && f.endsWith(".sql"))
    .sort()
    .reverse();
  
  for (const old of files.slice(7)) {
    fs.unlinkSync(path.join(backupDir, old));
    console.log(`[db-backup] Removed old backup: ${old}`);
  }
} catch (err) {
  console.error("[db-backup] Failed:", err.message);
  process.exit(1);
}
