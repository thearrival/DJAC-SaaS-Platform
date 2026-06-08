#!/usr/bin/env node
/**
 * DJAC Tool — Production Migration Runner
 *
 * Purpose:
 *   Applies pending SQL migrations from ./drizzle/*.sql without requiring
 *   drizzle-kit (a devDependency unavailable in the production Docker image).
 *
 * Strategy:
 *   - Tracks applied migrations in a `_schema_migrations` table.
 *   - Reads SQL files from ./drizzle/ in lexicographic order (0000_, 0001_, …).
 *   - Files already recorded in _schema_migrations are skipped (idempotent).
 *   - Each SQL file is split on ";\n" and each statement is executed separately.
 *
 * Usage:
 *   node scripts/migrate-production.mjs
 *   (called automatically by scripts/entrypoint.sh before server start)
 */

import pg from "pg";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Configuration ──────────────────────────────────────────────────────────

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) {
    console.error("❌ FATAL: DATABASE_URL environment variable is not set");
    process.exit(1);
}

/** How many 3-second intervals to wait for DB readiness (default 90s total) */
const MAX_CONNECT_ATTEMPTS = 30;

// ── Helpers ────────────────────────────────────────────────────────────────

async function waitForDatabase(url) {
    console.log(`⏳  Waiting for database to become available…`);

    for (let attempt = 1; attempt <= MAX_CONNECT_ATTEMPTS; attempt++) {
        try {
            const client = new pg.Client(url);
            await client.connect();
            await client.query("SELECT 1");
            await client.end();
            console.log(`✅  Database is ready`);
            return;
        } catch (err) {
            if (attempt === MAX_CONNECT_ATTEMPTS) {
                throw new Error(
                    `Database never became available after ${MAX_CONNECT_ATTEMPTS} attempts. Last error: ${err.message}`
                );
            }
            process.stdout.write(
                `    attempt ${attempt}/${MAX_CONNECT_ATTEMPTS} — ${err.code ?? err.message}\n`
            );
            await sleep(3000);
        }
    }
}

/** Split a SQL file into individual executable statements */
function splitStatements(sql) {
    return sql
        .split(/;\s*(?:\r?\n|$)/)
        .map((s) => s.trim())
        .filter(
            (s) =>
                s.length > 0 &&
                !s.startsWith("--") &&
                !s.startsWith("/*")
        );
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main ───────────────────────────────────────────────────────────────────

async function run() {
    await waitForDatabase(DB_URL);

    const client = new pg.Client(DB_URL);
    await client.connect();

    try {
        // ── Bootstrap migration tracking table ─────────────────────────────
        await client.query(`
      CREATE TABLE IF NOT EXISTS _schema_migrations (
        id          SERIAL       NOT NULL,
        filename    VARCHAR(255) NOT NULL,
        applied_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        checksum    CHAR(64)     NULL,
        PRIMARY KEY (id),
        UNIQUE (filename)
      )
    `);

        // ── Discover migration files ────────────────────────────────────────
        const migrationsDir = path.resolve(__dirname, "..", "drizzle");
        let files;
        try {
            const all = await fs.readdir(migrationsDir);
            files = all
                .filter((f) => f.endsWith(".sql") && /^\d/.test(f))
                .sort();
        } catch {
            console.log("⚠   No drizzle/ directory found — skipping migrations");
            return;
        }

        if (files.length === 0) {
            console.log("ℹ   No SQL migration files found in drizzle/");
            return;
        }

        // ── Fetch already-applied migrations ───────────────────────────────
        const appliedResult = await client.query(
            "SELECT filename FROM _schema_migrations"
        );
        const applied = new Set(appliedResult.rows.map((r) => r.filename));

        // ── Apply pending migrations ────────────────────────────────────────
        let appliedCount = 0;
        let skippedCount = 0;

        for (const file of files) {
            if (applied.has(file)) {
                console.log(`  ⏩  skip   ${file}`);
                skippedCount++;
                continue;
            }

            const filePath = path.join(migrationsDir, file);
            const sql = await fs.readFile(filePath, "utf8");
            const statements = splitStatements(sql);

            if (statements.length === 0) {
                console.log(`  ⚠   empty  ${file} — recorded but no statements executed`);
                await client.query(
                    "INSERT INTO _schema_migrations (filename) VALUES ($1)",
                    [file]
                );
                appliedCount++;
                continue;
            }

            console.log(`  ▶   apply  ${file}  (${statements.length} statements)`);

            await client.query("BEGIN");
            try {
                for (const stmt of statements) {
                    await client.query(stmt);
                }
                await client.query(
                    "INSERT INTO _schema_migrations (filename) VALUES ($1)",
                    [file]
                );
                await client.query("COMMIT");
                appliedCount++;
            } catch (err) {
                await client.query("ROLLBACK");
                throw new Error(
                    `Migration failed in file "${file}": ${err.message}\n` +
                    `Failing statement (truncated): ${err.message}`
                );
            }
        }

        console.log(
            `\n✅  Migrations complete — applied: ${appliedCount}, skipped: ${skippedCount}, total: ${files.length}`
        );
    } finally {
        await client.end();
    }
}

run().catch((err) => {
    console.error(`\n❌  Migration runner failed: ${err.message}`);
    process.exit(1);
});
