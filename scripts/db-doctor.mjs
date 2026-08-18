import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const databaseUrl = (process.env.DATABASE_URL || "").trim();
const allowInMemoryPersistence = (
  process.env.ALLOW_IN_MEMORY_PERSISTENCE || ""
).trim();

function print(line = "") {
  console.log(`[db-doctor] ${line}`);
}

// Read expected physical table names straight from the Drizzle schema file,
// so this check never drifts from the ORM definition.
function readExpectedTables() {
  const schemaPath = path.resolve(__dirname, "..", "drizzle", "schema.ts");
  const schema = fs.readFileSync(schemaPath, "utf8");
  return [...schema.matchAll(/pgTable\(\s*"([^"]+)"/g)].map(m => m[1]);
}

async function main() {
  print(`NODE_ENV=${process.env.NODE_ENV || "undefined"}`);
  print(`ALLOW_IN_MEMORY_PERSISTENCE=${allowInMemoryPersistence || "unset"}`);

  if (!databaseUrl) {
    print("DATABASE_URL is not configured.");
    print("Next steps:");
    print("1. Set DATABASE_URL in .env");
    print("2. Run pnpm db:migrate");
    print("3. Run pnpm seed:all");
    print(
      "4. Disable fallback for strict mode with ALLOW_IN_MEMORY_PERSISTENCE=false"
    );
    process.exitCode = 1;
    return;
  }

  let client;
  try {
    const parsed = new URL(databaseUrl);
    print(`Host=${parsed.hostname || "unknown"}`);
    print(`Port=${parsed.port || "5432"}`);
    print(`Database=${parsed.pathname.replace(/^\//, "") || "unknown"}`);

    client = new pg.Client(databaseUrl);
    await client.connect();
    const result = await client.query(
      "SELECT current_database() AS dbName, version() AS version"
    );
    const first = result.rows[0];
    print(`Connection successful.`);
    if (first && typeof first === "object") {
      print(`Server database=${first.dbname || "unknown"}`);
      print(`Server version=${first.version || "unknown"}`);
    }

    print("Recommended next steps:");
    print("1. Run pnpm db:migrate if schema is not current");
    print("2. Run pnpm seed:all for local reference data");
    print("3. Use pnpm smoke:runtime after starting the app");

    // ── Schema drift check: expected tables vs. live database ─────────────
    const expected = readExpectedTables();
    const tablesResult = await client.query(
      `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`
    );
    const liveTables = new Set(tablesResult.rows.map(r => r.tablename));
    const missing = expected.filter(t => !liveTables.has(t));
    const unexpected = [...liveTables].filter(
      t => !expected.includes(t) && !t.startsWith("_schema_migrations")
    );

    print(
      `Schema drift check: ${expected.length - missing.length}/${expected.length} expected tables present.`
    );
    if (missing.length === 0) {
      print("No missing tables — schema is in sync.");
    } else {
      print(`MISSING TABLES (${missing.length}):`);
      for (const t of missing) print(`  - ${t}`);
      print("Next steps: run `pnpm db:migrate`, then re-run this check.");
      print(
        "(Tables created at boot by server/_core/auto-migrate.ts are applied when the app starts.)"
      );
      process.exitCode = 1;
    }
    if (unexpected.length > 0) {
      print(
        `Unexpected tables (${unexpected.length}, informational): ${unexpected.join(", ")}`
      );
    }
  } catch (error) {
    print(
      `Connection failed: ${error instanceof Error ? error.message : String(error)}`
    );
    print("Troubleshooting:");
    print("1. Verify DATABASE_URL credentials, host, and port");
    print("2. Confirm PostgreSQL is reachable from this machine");
    print("3. Run pnpm db:migrate after connectivity is fixed");
    process.exitCode = 1;
  } finally {
    if (client) await client.end().catch(() => undefined);
  }
}

main().catch(error => {
  print(
    `Unexpected failure: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
});
