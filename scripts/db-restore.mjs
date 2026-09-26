#!/usr/bin/env node
/**
 * Automated database restore script for DJAC SaaS.
 *
 * Usage: node scripts/db-restore.mjs <backup-file>
 *
 * Requires: DATABASE_URL env var
 *
 * Can be run as a recovery procedure:
 *   DATABASE_URL="postgresql://..." node scripts/db-restore.mjs backup/djac-saas-20260101T120000.sql
 *
 * Options:
 *   --drop    Drop all tables before restoring (destructive)
 *   --clean   Clean existing objects before restoring
 *   --verbose Show detailed output
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const backupDir = path.join(root, "backup");

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("[db-restore] DATABASE_URL is not set.");
  process.exit(1);
}

const args = process.argv.slice(2);
const dropFlag = args.includes("--drop");
const cleanFlag = args.includes("--clean");
const verboseFlag = args.includes("--verbose");

const backupFile = args.find(arg => !arg.startsWith("--"));
if (!backupFile) {
  console.error(
    "[db-restore] Usage: node scripts/db-restore.mjs <backup-file> [--drop] [--clean] [--verbose]"
  );
  process.exit(1);
}

const filePath = path.isAbsolute(backupFile)
  ? backupFile
  : path.join(backupDir, backupFile);

if (!fs.existsSync(filePath)) {
  console.error(`[db-restore] Backup file not found: ${filePath}`);
  console.error("[db-restore] Please provide a valid backup file path.");
  console.error("[db-restore] Available backups in backup/:");
  try {
    const files = fs
      .readdirSync(backupDir)
      .filter(f => f.endsWith(".sql") || f.endsWith(".sql.gz"))
      .sort()
      .reverse();
    files.forEach(f => console.error(`  - ${f}`));
  } catch {
    // backup dir may not exist
  }
  process.exit(1);
}

const isGzipped = filePath.endsWith(".gz");

console.log(`[db-restore] Starting restore from ${filePath}...`);
console.log(
  `[db-restore] Database: ${dbUrl.replace(/\/\/.+:.+@/, "://***:***@")}`
);

try {
  // Check if backup file is gzipped and decompress if needed
  const tempFile = isGzipped ? filePath : null;
  const restoreFile = isGzipped ? filePath : filePath;

  if (verboseFlag) {
    const stats = fs.statSync(filePath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
    console.log(`[db-restore] File size: ${sizeMB} MB`);
    console.log(
      `[db-restore] Format: ${isGzipped ? "gzip compressed" : "plain SQL"}`
    );
  }

  const flags = [];
  if (dropFlag) flags.push("--drop");
  if (cleanFlag) flags.push("--clean");
  flags.push("--if-exists");
  flags.push("--no-owner");
  flags.push("--no-acl");

  const flagStr = flags.join(" ");

  if (isGzipped) {
    // Restore from gzipped backup using pipe
    console.log(`[db-restore] Decompressing and restoring gzipped backup...`);
    execSync(`gunzip -c "${filePath}" | pg_restore ${flagStr} "${dbUrl}"`, {
      stdio: verboseFlag ? "inherit" : "pipe",
      timeout: 600_000,
    });
  } else {
    // Restore from plain SQL file using psql
    console.log(`[db-restore] Restoring from SQL dump...`);
    execSync(`psql "${dbUrl}" ${flagStr} -f "${filePath}"`, {
      stdio: verboseFlag ? "inherit" : "pipe",
      timeout: 600_000,
    });
  }

  console.log(`[db-restore] ✅ Restore completed successfully.`);

  // Verify restore by checking table count
  if (!dropFlag) {
    try {
      const result = execSync(
        `psql "${dbUrl}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"`,
        { encoding: "utf-8", timeout: 30_000 }
      ).trim();
      console.log(`[db-restore] Public tables after restore: ${result}`);
    } catch {
      // Verification query may fail in some edge cases
      console.log(
        "[db-restore] Restore completed. Table verification skipped."
      );
    }
  }
} catch (err) {
  console.error("[db-restore] ❌ Restore failed:", err.message);

  if (verboseFlag) {
    console.error("[db-restore] Full error:", err);
  }

  console.error("[db-restore] Troubleshooting:");
  console.error(
    "[db-restore] 1. Ensure DATABASE_URL is correct and the database is accessible"
  );
  console.error(
    "[db-restore] 2. Check that the backup file is valid and not corrupted"
  );
  console.error(
    "[db-restore] 3. If using --drop, ensure no active connections are using the database"
  );
  console.error(
    "[db-restore] 4. Check pg_restore/psql is installed and available in PATH"
  );
  console.error(
    "[db-restore] 5. Verify the database user has sufficient privileges"
  );
  process.exit(1);
}
