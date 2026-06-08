-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0006 — RBAC Role Extension + Audit Logs
-- Extends user/localUser role enums with full RBAC hierarchy,
-- adds audit-trail columns to activityEvents, and creates auditLogs table.
-- ─────────────────────────────────────────────────────────────────────────────

--> statement-breakpoint
-- Extend users.role enum (MySQL requires MODIFY COLUMN for enum changes)
ALTER TABLE `users`
  MODIFY COLUMN `role` ENUM(
    'user',
    'admin',
    'basic_user',
    'professional_user',
    'company_admin',
    'platform_admin',
    'yalla_hack_employee',
    'super_admin'
  ) NOT NULL DEFAULT 'user';

--> statement-breakpoint
-- Extend localUsers.userType enum
ALTER TABLE `localUsers`
  MODIFY COLUMN `userType` ENUM(
    'visitor',
    'professional',
    'admin',
    'basic_user',
    'professional_user',
    'company_admin',
    'platform_admin',
    'yalla_hack_employee',
    'super_admin'
  ) NOT NULL DEFAULT 'visitor';

--> statement-breakpoint
-- Extend activityEvents with audit-trail columns (ignore if already present)
ALTER TABLE `activityEvents`
  ADD COLUMN IF NOT EXISTS `localUserId`  INT          NULL REFERENCES `localUsers`(`id`),
  ADD COLUMN IF NOT EXISTS `actorRole`    VARCHAR(64)  NULL,
  ADD COLUMN IF NOT EXISTS `targetEntity` VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS `payload`      TEXT         NULL,
  ADD COLUMN IF NOT EXISTS `ipHash`       VARCHAR(64)  NULL;

--> statement-breakpoint
-- Granular, immutable audit log table
CREATE TABLE IF NOT EXISTS `auditLogs` (
  `id`             INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId`         INT           NULL REFERENCES `users`(`id`),
  `localUserId`    INT           NULL REFERENCES `localUsers`(`id`),
  `organizationId` INT           NULL REFERENCES `organizations`(`id`),
  `actorRole`      VARCHAR(64)   NULL,
  `category`       ENUM('auth','data_write','data_read','role_change','system','billing') NOT NULL,
  `action`         VARCHAR(120)  NOT NULL,
  `entityType`     VARCHAR(120)  NULL,
  `entityId`       INT           NULL,
  `targetEntity`   VARCHAR(255)  NULL,
  `outcome`        ENUM('success','failure','blocked') NOT NULL DEFAULT 'success',
  `payload`        TEXT          NULL,
  `ipHash`         VARCHAR(64)   NULL,
  `userAgent`      VARCHAR(512)  NULL,
  `createdAt`      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_userId`    (`userId`),
  INDEX `idx_audit_orgId`     (`organizationId`),
  INDEX `idx_audit_category`  (`category`),
  INDEX `idx_audit_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
