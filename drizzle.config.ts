import { defineConfig } from "drizzle-kit";
import { fixSslMode } from "./server/_core/ssl-helper";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.POSTGRES_PRISMA_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL or POSTGRES_URL is required to run drizzle commands"
  );
}

const dbUrl = fixSslMode(connectionString);

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  },
});
