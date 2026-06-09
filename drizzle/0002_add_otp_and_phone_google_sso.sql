-- Migration 0002: Phone OTP authentication + Google SSO support
-- Changes:
--   1. localUsers: email NOT NULL → nullable, passwordHash NOT NULL → nullable, add phoneNumber
--   2. New: otpCodes table for one-time password verification

ALTER TABLE "localUsers" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "localUsers" ALTER COLUMN "passwordHash" DROP NOT NULL;
ALTER TABLE "localUsers" ADD COLUMN IF NOT EXISTS "phoneNumber" varchar(20);
CREATE UNIQUE INDEX IF NOT EXISTS "localUsers_phoneNumber_idx" ON "localUsers" ("phoneNumber") WHERE "phoneNumber" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "otpCodes" (
    "id"         serial        PRIMARY KEY,
    "identifier" varchar(320)  NOT NULL,
    "codeHash"   varchar(64)   NOT NULL,
    "purpose"    varchar(32)   NOT NULL DEFAULT 'login',
    "expiresAt"  timestamp     NOT NULL,
    "attempts"   integer       NOT NULL DEFAULT 0,
    "createdAt"  timestamp     NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "otpCodes_identifier_idx" ON "otpCodes" ("identifier");
CREATE INDEX IF NOT EXISTS "otpCodes_expiresAt_idx" ON "otpCodes" ("expiresAt");
