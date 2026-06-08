import "dotenv/config";
import { readFileSync } from "fs";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../drizzle/schema.ts";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const db = drizzle(pool, { schema });

async function main() {
  console.log("Pushing Drizzle schema to database...");

  for (const [name, table] of Object.entries(schema)) {
    if (typeof table === "function" || !table || !table[Symbol.for("drizzle:Table")]) continue;

    try {
      const tableName = table[Symbol.for("drizzle:Table")]?.name || name;
      console.log(`  Creating table: ${tableName}`);
      await db.select().from(table).limit(1);
    } catch (err) {
      console.log(`  Table ${table[Symbol.for("drizzle:Table")]?.name || name} needs creation...`);
      // The table will be created by the next batch operation
    }
  }

  // Use Drizzle's built-in push
  const { pushSchema } = await import("drizzle-kit/api");
  
  await pushSchema(db, schema, {
    provider: "pg",
    schemaFilter: ["public"],
    tablesFilter: [],
    verbose: true,
    force: true,
  });

  console.log("Schema push complete.");
  await pool.end();
}

main().catch((err) => {
  console.error("Push failed:", err.message);
  process.exit(1);
});
