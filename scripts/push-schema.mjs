import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

async function main() {
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
  const db = drizzle(pool);

  console.log("[push] Connected. Running schema push...");

  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("[push] Migrations applied successfully.");
  } catch (err) {
    // If migration fails due to existing objects, try direct SQL
    if (err.message?.includes("already exists")) {
      console.log("[push] Some objects already exist - running supplementary tables.");

      // Get the generated SQL and filter only CREATE TABLE IF NOT EXISTS
      const fs = await import("fs");
      const files = fs.readdirSync("./drizzle").filter(f => f.endsWith(".sql") && /^\d+/.test(f));
      files.sort();

      for (const file of files) {
        const sql = fs.readFileSync(`./drizzle/${file}`, "utf-8");
        const statements = sql.split(";").filter(s => s.trim());

        for (const stmt of statements) {
          const trimmed = stmt.trim();
          if (!trimmed) continue;

          // Skip CREATE TYPE statements (already exist)
          if (trimmed.toUpperCase().includes("CREATE TYPE")) {
            continue;
          }

          // Add IF NOT EXISTS to CREATE TABLE
          let finalStmt = trimmed;
          if (trimmed.toUpperCase().startsWith("CREATE TABLE")) {
            if (!trimmed.toUpperCase().includes("IF NOT EXISTS")) {
              finalStmt = trimmed.replace("CREATE TABLE", "CREATE TABLE IF NOT EXISTS");
            }
          }

          // Wrap CREATE INDEX in IF NOT EXISTS
          if (trimmed.toUpperCase().startsWith("CREATE INDEX") || trimmed.toUpperCase().startsWith("CREATE UNIQUE INDEX")) {
            if (!trimmed.toUpperCase().includes("IF NOT EXISTS")) {
              finalStmt = trimmed.replace("CREATE INDEX", "CREATE INDEX IF NOT EXISTS")
                .replace("CREATE UNIQUE INDEX", "CREATE UNIQUE INDEX IF NOT EXISTS");
            }
          }

          try {
            await pool.query(finalStmt + ";");
            console.log(`  ✓ ${finalStmt.substring(0, 80)}...`);
          } catch (stmtErr) {
            if (!stmtErr.message?.includes("already exists")) {
              console.warn(`  ⚠ ${stmtErr.message.substring(0, 100)}`);
            }
          }
        }
      }
    } else {
      throw err;
    }
  }

  await pool.end();
  console.log("[push] Schema sync complete.");
}

main().catch(err => {
  console.error("[push] Failed:", err.message);
  process.exit(1);
});
