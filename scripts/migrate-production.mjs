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

import mysql from "mysql2/promise";
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

/**
 * Wait until the database accepts connections.
 * Retries up to MAX_CONNECT_ATTEMPTS times with a 3-second pause between attempts.
 */
async function waitForDatabase(url) {
    console.log(`⏳  Waiting for database to become available…`);

    for (let attempt = 1; attempt <= MAX_CONNECT_ATTEMPTS; attempt++) {
        try {
            const conn = await mysql.createConnection(url);
            await conn.ping();
            await conn.end();
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
                // Drop comment-only lines
                !s.startsWith("--") &&
                // Drop drizzle metadata comments that appear as standalone blocks
                !s.startsWith("/*")
        );
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main ───────────────────────────────────────────────────────────────────

async function run() {
    await waitForDatabase(DB_URL);

    const connection = await mysql.createConnection(DB_URL);

    try {
        // ── Bootstrap migration tracking table ─────────────────────────────
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS _schema_migrations (
        id          INT UNSIGNED   NOT NULL AUTO_INCREMENT,
        filename    VARCHAR(255)   NOT NULL,
        applied_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
        checksum    CHAR(64)       NULL COMMENT 'SHA-256 of the SQL file at time of apply',
        PRIMARY KEY (id),
        UNIQUE KEY uq_filename (filename)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

        // ── Discover migration files ────────────────────────────────────────
        const migrationsDir = path.resolve(__dirname, "..", "drizzle");
        let files;
        try {
            const all = await fs.readdir(migrationsDir);
            files = all
                .filter((f) => f.endsWith(".sql") && /^\d/.test(f))
                .sort(); // lexicographic → 0000_, 0001_, 0002_, …
        } catch {
            console.log("⚠   No drizzle/ directory found — skipping migrations");
            return;
        }

        if (files.length === 0) {
            console.log("ℹ   No SQL migration files found in drizzle/");
            return;
        }

        // ── Fetch already-applied migrations ───────────────────────────────
        const [rows] = await connection.query(
            "SELECT filename FROM _schema_migrations"
        );
        const applied = new Set(rows.map((r) => r.filename));

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
                await connection.execute(
                    "INSERT INTO _schema_migrations (filename) VALUES (?)",
                    [file]
                );
                appliedCount++;
                continue;
            }

            console.log(`  ▶   apply  ${file}  (${statements.length} statements)`);

            // Use a transaction per migration file for atomicity
            await connection.execute("START TRANSACTION");
            try {
                for (const stmt of statements) {
                    await connection.execute(stmt);
                }
                await connection.execute(
                    "INSERT INTO _schema_migrations (filename) VALUES (?)",
                    [file]
                );
                await connection.execute("COMMIT");
                appliedCount++;
            } catch (err) {
                await connection.execute("ROLLBACK");
                throw new Error(
                    `Migration failed in file "${file}": ${err.message}\n` +
                    `Failing statement (truncated): ${err.sql?.slice(0, 200) ?? "(unknown)"}`
                );
            }
        }

        // ── Summary ─────────────────────────────────────────────────────────
        console.log(
            `\n✅  Migrations complete — applied: ${appliedCount}, skipped: ${skippedCount}, total: ${files.length}`
        );
    } finally {
        await connection.end();
    }
}

run().catch((err) => {
    console.error(`\n❌  Migration runner failed: ${err.message}`);
    process.exit(1);
});
