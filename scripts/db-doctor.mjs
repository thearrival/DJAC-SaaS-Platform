import "dotenv/config";
import pg from "pg";

const databaseUrl = (process.env.DATABASE_URL || "").trim();
const allowInMemoryPersistence = (process.env.ALLOW_IN_MEMORY_PERSISTENCE || "").trim();

function print(line = "") {
    console.log(`[db-doctor] ${line}`);
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
        print("4. Disable fallback for strict mode with ALLOW_IN_MEMORY_PERSISTENCE=false");
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
        const result = await client.query("SELECT current_database() AS dbName, version() AS version");
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
    } catch (error) {
        print(`Connection failed: ${error instanceof Error ? error.message : String(error)}`);
        print("Troubleshooting:");
        print("1. Verify DATABASE_URL credentials, host, and port");
        print("2. Confirm PostgreSQL is reachable from this machine");
        print("3. Run pnpm db:migrate after connectivity is fixed");
        process.exitCode = 1;
    } finally {
        await client?.end().catch(() => undefined);
    }
}

main().catch((error) => {
    print(`Unexpected failure: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
});
