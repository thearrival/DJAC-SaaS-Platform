-- Migration 0003: Add lastMfaVerifiedAt and firstLoginEmailSent to localUsers
-- These columns were defined in the Drizzle schema but no migration existed.
-- Runtime errors would occur on fresh DB deployments when code references them.

ALTER TABLE "localUsers" ADD COLUMN IF NOT EXISTS "lastMfaVerifiedAt" timestamp;
ALTER TABLE "localUsers" ADD COLUMN IF NOT EXISTS "firstLoginEmailSent" integer DEFAULT 0 NOT NULL;
