#!/usr/bin/env node

/**
 * Safe one-time production database migration.
 *
 * Usage: node scripts/safe-migrate.mjs
 *
 * Uses drizzle-kit migrate with proper SSL configuration.
 * Can be run locally or via Vercel CLI.
 */

import { execSync } from "child_process";

console.log("[safe-migrate] Running database migration...");
try {
  execSync("npx drizzle-kit migrate", {
    stdio: "inherit",
    env: { ...process.env },
  });
  console.log("[safe-migrate] Migration complete.");
} catch (e) {
  console.error("[safe-migrate] Migration failed:", e.message);
  console.error("[safe-migrate] Check the error above for details.");
  process.exit(1);
}
