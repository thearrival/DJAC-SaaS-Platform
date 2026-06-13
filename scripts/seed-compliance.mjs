#!/usr/bin/env node
/**
 * Seed compliance reference data into production database.
 *
 * Usage: node scripts/seed-compliance.mjs
 *
 * This script runs outside the Vercel function timeout (60s) so it can
 * handle the full 400+ control definitions in a single batch INSERT.
 *
 * Prerequisites: DATABASE_URL environment variable must be set.
 */

import pg from "pg";
import { fixSslMode } from "../server/_core/ssl-helper.js";

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("[seed-compliance] DATABASE_URL is not set.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: fixSslMode(dbUrl),
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  console.log("[seed-compliance] Connecting to database...");
  await client.connect();

  try {
    const { complianceFrameworks, complianceControls } = await import(
      "./compliance-reference-data.mjs"
    );

    console.log(`[seed-compliance] Loaded ${complianceFrameworks.length} frameworks, ${complianceControls.length} controls.`);

    // Seed frameworks
    let fwCount = 0;
    for (const fw of complianceFrameworks) {
      await client.query(
        `INSERT INTO "frameworks" ("code", "name", "country", "description", "scope", "enforcementAuthority", "maxPenalty")
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT ("code") DO UPDATE SET
           "name" = EXCLUDED."name",
           "country" = EXCLUDED."country",
           "description" = EXCLUDED."description",
           "scope" = EXCLUDED."scope",
           "enforcementAuthority" = EXCLUDED."enforcementAuthority",
           "maxPenalty" = EXCLUDED."maxPenalty",
           "updatedAt" = NOW()`,
        [fw.code, fw.name, fw.country, fw.description ?? null, fw.scope ?? null, fw.enforcementAuthority ?? null, fw.maxPenalty ?? null]
      );
      fwCount++;
    }
    console.log(`[seed-compliance] Seeded ${fwCount} frameworks.`);

    // Resolve framework IDs
    const fwRes = await client.query(`SELECT "id", "code" FROM "frameworks"`);
    const codeToId = new Map();
    for (const row of fwRes.rows) {
      codeToId.set(row.code, row.id);
    }

    // Ensure unique constraint exists
    await client.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "complianceControls_frameworkId_controlCode_idx"
       ON "complianceControls" ("frameworkId", "controlCode")`
    );

    // Build single batch INSERT for performance
    const values = [];
    for (const ctrl of complianceControls) {
      const frameworkId = codeToId.get(ctrl.frameworkCode);
      if (!frameworkId) continue;
      const esc = (s) => s ? `'${s.replace(/'/g, "''")}'` : "NULL";
      values.push(`(${frameworkId}, ${esc(ctrl.controlCode)}, ${esc(ctrl.controlName)}, ${esc(ctrl.category)}, ${esc(ctrl.description)}, ${esc(ctrl.requirement)}, ${esc(ctrl.applicability)})`);
    }

    if (values.length > 0) {
      await client.query(
        `INSERT INTO "complianceControls" ("frameworkId", "controlCode", "controlName", "category", "description", "requirement", "applicability")
         VALUES ${values.join(", ")}
         ON CONFLICT ("frameworkId", "controlCode") DO NOTHING`
      );
      console.log(`[seed-compliance] Seeded ${values.length} compliance controls.`);
    }

    console.log("[seed-compliance] Complete.");
  } catch (err) {
    console.error("[seed-compliance] Failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seed();
