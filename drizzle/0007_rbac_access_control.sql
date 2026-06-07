-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 0007_rbac_access_control
-- Description: RBAC & Onboarding — adds userOnboarding, rolePermissions,
--              vendorShares, and regulatorOversightTargets tables.
-- ─────────────────────────────────────────────────────────────────────────────

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `userOnboarding` (
  `id`                INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId`            INT           NULL,
  `localUserId`       INT           NULL,
  `stage`             ENUM(
                        'not_started',
                        'account_type_selected',
                        'org_created',
                        'org_joined',
                        'jurisdiction_set',
                        'completed'
                      ) NOT NULL DEFAULT 'not_started',
  `accountIntent`     ENUM(
                        'compliance_professional',
                        'legal_advisor',
                        'enterprise_admin',
                        'consultant',
                        'vendor',
                        'government',
                        'researcher'
                      ) NULL,
  `selectedLocale`    ENUM('en','ar','zh') NOT NULL DEFAULT 'en',
  `completedAt`       TIMESTAMP     NULL,
  `createdAt`         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `userOnboarding_userId_fk`
    FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `userOnboarding_localUserId_fk`
    FOREIGN KEY (`localUserId`) REFERENCES `localUsers`(`id`) ON DELETE CASCADE
);

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `rolePermissions` (
  `id`              INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `organizationId`  INT           NOT NULL,
  `userId`          INT           NULL,
  `localUserId`     INT           NULL,
  `module`          VARCHAR(120)  NOT NULL,
  `canView`         TINYINT       NOT NULL DEFAULT 0,
  `canCreate`       TINYINT       NOT NULL DEFAULT 0,
  `canEdit`         TINYINT       NOT NULL DEFAULT 0,
  `canDelete`       TINYINT       NOT NULL DEFAULT 0,
  `canExport`       TINYINT       NOT NULL DEFAULT 0,
  `canInvite`       TINYINT       NOT NULL DEFAULT 0,
  `grantedByUserId` INT           NULL,
  `createdAt`       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `rolePermissions_orgId_fk`
    FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
  CONSTRAINT `rolePermissions_userId_fk`
    FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `rolePermissions_localUserId_fk`
    FOREIGN KEY (`localUserId`) REFERENCES `localUsers`(`id`) ON DELETE CASCADE,
  CONSTRAINT `rolePermissions_grantedBy_fk`
    FOREIGN KEY (`grantedByUserId`) REFERENCES `users`(`id`)
);

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `vendorShares` (
  `id`                INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `vendorId`          INT           NOT NULL,
  `shareToken`        VARCHAR(64)   NOT NULL,
  `allowedOrgId`      INT           NULL,
  `expiresAt`         TIMESTAMP     NULL,
  `viewCount`         INT           NOT NULL DEFAULT 0,
  `createdByUserId`   INT           NULL,
  `isRevoked`         TINYINT       NOT NULL DEFAULT 0,
  `revokedAt`         TIMESTAMP     NULL,
  `createdAt`         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `vendorShares_vendorId_fk`
    FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE CASCADE,
  CONSTRAINT `vendorShares_allowedOrgId_fk`
    FOREIGN KEY (`allowedOrgId`) REFERENCES `organizations`(`id`) ON DELETE SET NULL,
  CONSTRAINT `vendorShares_createdBy_fk`
    FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`),
  UNIQUE KEY `vendorShares_shareToken_unique` (`shareToken`)
);

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS `regulatorOversightTargets` (
  `id`                INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `regulatorOrgId`    INT           NOT NULL,
  `targetOrgId`       INT           NOT NULL,
  `grantedByAdminId`  INT           NULL,
  `expiresAt`         TIMESTAMP     NULL,
  `isActive`          TINYINT       NOT NULL DEFAULT 1,
  `justification`     TEXT          NULL,
  `createdAt`         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `regulatorOversight_regulatorOrgId_fk`
    FOREIGN KEY (`regulatorOrgId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
  CONSTRAINT `regulatorOversight_targetOrgId_fk`
    FOREIGN KEY (`targetOrgId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
  CONSTRAINT `regulatorOversight_grantedBy_fk`
    FOREIGN KEY (`grantedByAdminId`) REFERENCES `users`(`id`)
);
