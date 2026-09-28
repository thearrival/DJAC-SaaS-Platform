/**
 * Onboarding schema bootstrap.
 *
 * Idempotent, self-healing DDL for the intelligent-onboarding tables. Invoked
 * from the auto-migrate routine and lazily from the onboarding service (once
 * per process). The tables exist in production already, so the ALTER statements
 * below migrate them to the dual-identity model (userId OR localUserId).
 */

import { sql } from "drizzle-orm";
import type { getDb } from "../db";

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;

let _ensured = false;

/** Tables that carry (userId | localUserId). */
const IDENTITY_TABLES = [
  "onboarding_responses",
  "onboarding_events",
  "onboarding_profile_history",
  "personalization_recommendations",
] as const;

export async function ensureOnboardingSchema(db: Db): Promise<void> {
  if (_ensured) return;

  const statements = [
    sql`
      CREATE TABLE IF NOT EXISTS "onboarding_responses" (
        "id"                 serial      PRIMARY KEY,
        "user_id"            integer     REFERENCES "users" ("id") ON DELETE CASCADE,
        "local_user_id"      integer     REFERENCES "localUsers" ("id") ON DELETE CASCADE,
        "organization_id"    integer     REFERENCES "organizations" ("id") ON DELETE CASCADE,
        "session_id"         varchar(64) NOT NULL,
        "onboarding_version" integer     NOT NULL DEFAULT 1,
        "question_id"        varchar(80) NOT NULL,
        "question_version"   integer     NOT NULL DEFAULT 1,
        "step_number"        integer     NOT NULL DEFAULT 0,
        "answer_value"       jsonb,
        "source"             varchar(40) NOT NULL DEFAULT 'onboarding',
        "submitted_at"       timestamp   NOT NULL DEFAULT now(),
        "created_at"         timestamp   NOT NULL DEFAULT now(),
        "updated_at"         timestamp   NOT NULL DEFAULT now()
      )
    `,
    sql`
      CREATE TABLE IF NOT EXISTS "onboarding_events" (
        "id"                 serial      PRIMARY KEY,
        "user_id"            integer     REFERENCES "users" ("id") ON DELETE CASCADE,
        "local_user_id"      integer     REFERENCES "localUsers" ("id") ON DELETE CASCADE,
        "organization_id"    integer     REFERENCES "organizations" ("id") ON DELETE CASCADE,
        "session_id"         varchar(64),
        "event_type"         varchar(60) NOT NULL,
        "step_number"        integer,
        "actor_type"         varchar(20) NOT NULL DEFAULT 'user',
        "actor_id"           varchar(80),
        "request_id"         varchar(80),
        "onboarding_version" integer     NOT NULL DEFAULT 1,
        "payload"            jsonb       DEFAULT '{}'::jsonb,
        "created_at"         timestamp   NOT NULL DEFAULT now()
      )
    `,
    sql`
      CREATE TABLE IF NOT EXISTS "onboarding_profile_history" (
        "id"                 serial      PRIMARY KEY,
        "user_id"            integer     REFERENCES "users" ("id") ON DELETE CASCADE,
        "local_user_id"      integer     REFERENCES "localUsers" ("id") ON DELETE CASCADE,
        "organization_id"    integer     REFERENCES "organizations" ("id") ON DELETE CASCADE,
        "field"              varchar(80) NOT NULL,
        "previous_value"     jsonb,
        "new_value"          jsonb,
        "actor_type"         varchar(20) NOT NULL DEFAULT 'user',
        "actor_id"           varchar(80),
        "source"             varchar(40) NOT NULL DEFAULT 'onboarding',
        "onboarding_version" integer     NOT NULL DEFAULT 1,
        "created_at"         timestamp   NOT NULL DEFAULT now()
      )
    `,
    sql`
      CREATE TABLE IF NOT EXISTS "personalization_recommendations" (
        "id"              serial      PRIMARY KEY,
        "user_id"         integer     REFERENCES "users" ("id") ON DELETE CASCADE,
        "local_user_id"   integer     REFERENCES "localUsers" ("id") ON DELETE CASCADE,
        "organization_id" integer     REFERENCES "organizations" ("id") ON DELETE CASCADE,
        "module_id"       varchar(80) NOT NULL,
        "priority"        integer     NOT NULL DEFAULT 50,
        "reason"          text        NOT NULL DEFAULT '',
        "rule_id"         varchar(80) NOT NULL DEFAULT 'default',
        "status"          varchar(20) NOT NULL DEFAULT 'active',
        "created_at"      timestamp   NOT NULL DEFAULT now(),
        "updated_at"      timestamp   NOT NULL DEFAULT now()
      )
    `,
    // Migrate pre-existing tables (created before dual-identity) — idempotent.
    ...IDENTITY_TABLES.flatMap(table => [
      sql`ALTER TABLE ${sql.identifier(table)} ADD COLUMN IF NOT EXISTS "local_user_id" integer REFERENCES "localUsers" ("id") ON DELETE CASCADE`,
      sql`ALTER TABLE ${sql.identifier(table)} ALTER COLUMN "user_id" DROP NOT NULL`,
      sql`CREATE INDEX IF NOT EXISTS ${sql.identifier(`${table}_local_user_idx`)} ON ${sql.identifier(table)} ("local_user_id")`,
    ]),
    sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "onboarding_responses_user_q_idx"
        ON "onboarding_responses" ("user_id", "onboarding_version", "question_id")
    `,
    sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "onboarding_responses_local_q_idx"
        ON "onboarding_responses" ("local_user_id", "onboarding_version", "question_id")
        WHERE "local_user_id" IS NOT NULL
    `,
    sql`
      CREATE INDEX IF NOT EXISTS "onboarding_responses_user_idx"
        ON "onboarding_responses" ("user_id")
    `,
    sql`
      CREATE INDEX IF NOT EXISTS "onboarding_events_user_idx"
        ON "onboarding_events" ("user_id", "created_at")
    `,
    sql`
      CREATE INDEX IF NOT EXISTS "onboarding_profile_history_user_idx"
        ON "onboarding_profile_history" ("user_id", "created_at")
    `,
    sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "personalization_recommendations_user_module_idx"
        ON "personalization_recommendations" ("user_id", "module_id")
    `,
    sql`
      CREATE UNIQUE INDEX IF NOT EXISTS "personalization_recommendations_local_module_idx"
        ON "personalization_recommendations" ("local_user_id", "module_id")
        WHERE "local_user_id" IS NOT NULL
    `,
    sql`
      CREATE INDEX IF NOT EXISTS "personalization_recommendations_user_idx"
        ON "personalization_recommendations" ("user_id")
    `,
  ];

  for (const statement of statements) {
    try {
      await db.execute(statement);
    } catch {
      // Best-effort: a failure in one statement must not block the others.
    }
  }
  _ensured = true;
}
