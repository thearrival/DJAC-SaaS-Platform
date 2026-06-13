/**
 * Auto-migration runner — applies missing schema changes on server startup.
 * Safe for serverless (Vercel): runs fast, checks existence first, idempotent.
 */
import { sql } from "drizzle-orm";
import { getDb } from "../db";
import { ENV } from "../_core/env";

let migrationApplied = false;

async function seedComplianceFrameworks(db: NonNullable<Awaited<ReturnType<typeof getDb>>>): Promise<void> {
    try {
        const { complianceFrameworks } = await import(
            "../../scripts/compliance-reference-data.mjs"
        );

        let seeded = 0;
        for (const fw of complianceFrameworks) {
            await db.execute(sql`
                INSERT INTO "frameworks" ("code", "name", "country", "description", "scope", "enforcementAuthority", "maxPenalty")
                VALUES (${fw.code}, ${fw.name}, ${fw.country}, ${fw.description ?? null}, ${fw.scope ?? null}, ${fw.enforcementAuthority ?? null}, ${fw.maxPenalty ?? null})
                ON CONFLICT ("code") DO UPDATE SET
                    "name" = EXCLUDED."name",
                    "country" = EXCLUDED."country",
                    "description" = EXCLUDED."description",
                    "scope" = EXCLUDED."scope",
                    "enforcementAuthority" = EXCLUDED."enforcementAuthority",
                    "maxPenalty" = EXCLUDED."maxPenalty",
                    "updatedAt" = NOW()
            `);
            seeded++;
        }

        if (!ENV.isProduction) {
            console.info(`[Migrate] Seeded ${seeded} compliance frameworks.`);
        }
    } catch (err) {
        console.warn("[Migrate] Compliance seed data could not be loaded (fallback will be used):", (err as Error).message);
    }
}

export async function ensureMigrated(): Promise<void> {
    if (migrationApplied) return;

    const db = await getDb();
    if (!db) return; // No DB connection — skip (in-memory mode)

    try {
        // Migration 0001: admin tables + performance indexes + verifiedAt
        await db.execute(sql`
            ALTER TABLE "localUsers" ADD COLUMN IF NOT EXISTS "verifiedAt" timestamp
        `);

        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "yallaAdminSessions" (
                "id"            varchar(64)   NOT NULL PRIMARY KEY,
                "adminUsername" varchar(120)  NOT NULL,
                "ipAddress"     varchar(64)   NOT NULL,
                "userAgent"     varchar(512),
                "createdAt"     timestamp     NOT NULL DEFAULT now(),
                "expiresAt"     timestamp     NOT NULL,
                "lastSeenAt"    timestamp     NOT NULL DEFAULT now(),
                "isRevoked"     integer       NOT NULL DEFAULT 0
            )
        `);

        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "yallaAdminAuditLogs" (
                "id"            serial        PRIMARY KEY,
                "sessionId"     varchar(64),
                "adminUsername" varchar(120)  NOT NULL,
                "action"        varchar(120)  NOT NULL,
                "target"        varchar(255),
                "ipAddress"     varchar(64)   NOT NULL,
                "payload"       text,
                "createdAt"     timestamp     NOT NULL DEFAULT now()
            )
        `);

        // Migration 0002: phoneNumber + otpCodes
        await db.execute(sql`
            ALTER TABLE "localUsers" ADD COLUMN IF NOT EXISTS "phoneNumber" varchar(20)
        `);
        await db.execute(sql`
            CREATE UNIQUE INDEX IF NOT EXISTS "localUsers_phoneNumber_idx"
            ON "localUsers" ("phoneNumber") WHERE "phoneNumber" IS NOT NULL
        `);

        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "otpCodes" (
                "id"         serial        PRIMARY KEY,
                "identifier" varchar(320)  NOT NULL,
                "codeHash"   varchar(64)   NOT NULL,
                "purpose"    varchar(32)   NOT NULL DEFAULT 'login',
                "expiresAt"  timestamp     NOT NULL,
                "attempts"   integer       NOT NULL DEFAULT 0,
                "createdAt"  timestamp     NOT NULL DEFAULT now()
            )
        `);

        // Ensure core audit table exists (may be missing if only auto-migrate ran)
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS "auditLogs" (
                "id"             serial        PRIMARY KEY,
                "userId"         integer,
                "localUserId"    integer,
                "organizationId" integer,
                "actorRole"      varchar(64),
                "category"       varchar(64)   NOT NULL,
                "action"         varchar(120)  NOT NULL,
                "entityType"     varchar(120),
                "entityId"       integer,
                "targetEntity"   varchar(255),
                "outcome"        varchar(32)   NOT NULL DEFAULT 'success',
                "payload"        text,
                "ipHash"         varchar(64),
                "userAgent"      varchar(512),
                "createdAt"      timestamp     NOT NULL DEFAULT now()
            )
        `);

        // Performance indexes (safe with IF NOT EXISTS)
        const indexes = [
            `CREATE INDEX IF NOT EXISTS "organizations_plan_idx" ON "organizations" ("plan")`,
            `CREATE INDEX IF NOT EXISTS "organizations_stripeCustomerId_idx" ON "organizations" ("stripeCustomerId")`,
            `CREATE INDEX IF NOT EXISTS "organizationMembers_organizationId_idx" ON "organizationMembers" ("organizationId")`,
            `CREATE INDEX IF NOT EXISTS "vendors_organizationId_idx" ON "vendors" ("organizationId")`,
            `CREATE INDEX IF NOT EXISTS "auditLogs_organizationId_idx" ON "auditLogs" ("organizationId")`,
            `CREATE INDEX IF NOT EXISTS "auditLogs_createdAt_idx" ON "auditLogs" ("createdAt")`,
            `CREATE INDEX IF NOT EXISTS "subscriptions_organizationId_idx" ON "subscriptions" ("organizationId")`,
            `CREATE INDEX IF NOT EXISTS "billingEvents_organizationId_idx" ON "billingEvents" ("organizationId")`,
            `CREATE INDEX IF NOT EXISTS "riskRegister_organizationId_idx" ON "riskRegister" ("organizationId")`,
            `CREATE INDEX IF NOT EXISTS "userInteractionLogs_organizationId_idx" ON "userInteractionLogs" ("organizationId")`,
            `CREATE INDEX IF NOT EXISTS "activityEvents_createdAt_idx" ON "activityEvents" ("createdAt")`,
        ];

        for (const idx of indexes) {
            await db.execute(sql.raw(idx));
        }

        // Seed compliance reference data into DB (idempotent upserts)
        await seedComplianceFrameworks(db);

        migrationApplied = true;
        if (!ENV.isProduction) {
            console.info("[Migrate] Schema auto-migration complete.");
        }
    } catch (err) {
        // Don't crash the server if migration fails — log and continue
        console.warn("[Migrate] Auto-migration failed (may already be applied):", (err as Error).message);
    }
}
