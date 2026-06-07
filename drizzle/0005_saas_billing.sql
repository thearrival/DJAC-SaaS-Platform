-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 0005_saas_billing
-- Description: SaaS multi-tenancy, subscription billing, compliance reports,
--              user interaction logging, and compliance deadlines.
-- Apply with: mariadb -u root djac_tool < drizzle/0005_saas_billing.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- Organizations (top-level tenant unit)
CREATE TABLE IF NOT EXISTS `organizations` (
  `id`                        INT AUTO_INCREMENT PRIMARY KEY,
  `slug`                      VARCHAR(100)  NOT NULL UNIQUE,
  `name`                      VARCHAR(255)  NOT NULL,
  `billingEmail`              VARCHAR(320)  NOT NULL,
  `industry`                  VARCHAR(120),
  `primaryJurisdiction`       ENUM('China','Saudi Arabia','Both','Other') DEFAULT 'Both',
  `stripeCustomerId`          VARCHAR(64),
  `plan`                      ENUM('free_trial','starter','professional','enterprise') NOT NULL DEFAULT 'free_trial',
  `trialStartedAt`            TIMESTAMP NULL,
  `trialEndsAt`               TIMESTAMP NULL,
  `trialReminderDay3Sent`     INT NOT NULL DEFAULT 0,
  `trialReminderDay6Sent`     INT NOT NULL DEFAULT 0,
  `trialExpiredNoticeSent`    INT NOT NULL DEFAULT 0,
  `isActive`                  INT NOT NULL DEFAULT 1,
  `maxSeats`                  INT NOT NULL DEFAULT 5,
  `metadata`                  TEXT,
  `createdAt`                 TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`                 TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Organization Members (RBAC: owner | admin | compliance_officer | analyst)
CREATE TABLE IF NOT EXISTS `organizationMembers` (
  `id`                INT AUTO_INCREMENT PRIMARY KEY,
  `organizationId`    INT NOT NULL,
  `userId`            INT,
  `localUserId`       INT,
  `role`              ENUM('owner','admin','compliance_officer','analyst') NOT NULL DEFAULT 'analyst',
  `invitedByUserId`   INT,
  `inviteEmail`       VARCHAR(320),
  `inviteToken`       VARCHAR(64),
  `inviteAcceptedAt`  TIMESTAMP NULL,
  `status`            ENUM('active','invited','suspended') NOT NULL DEFAULT 'active',
  `createdAt`         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`userId`)         REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`localUserId`)    REFERENCES `localUsers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subscriptions (mirrors Stripe subscription state)
CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id`                    INT AUTO_INCREMENT PRIMARY KEY,
  `organizationId`        INT NOT NULL,
  `stripeSubscriptionId`  VARCHAR(64) UNIQUE,
  `stripePriceId`         VARCHAR(64),
  `plan`                  ENUM('starter','professional','enterprise') NOT NULL,
  `billingInterval`       ENUM('monthly','quarterly','biannual','annual') NOT NULL,
  `amountCents`           INT NOT NULL,
  `currency`              VARCHAR(3) NOT NULL DEFAULT 'USD',
  `status`                ENUM('trialing','active','past_due','canceled','incomplete','paused') NOT NULL DEFAULT 'trialing',
  `currentPeriodStart`    TIMESTAMP NULL,
  `currentPeriodEnd`      TIMESTAMP NULL,
  `cancelAtPeriodEnd`     INT NOT NULL DEFAULT 0,
  `canceledAt`            TIMESTAMP NULL,
  `lastInvoiceId`         VARCHAR(64),
  `stripeMetadata`        TEXT,
  `createdAt`             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Billing Events (immutable payment ledger / Stripe webhook log)
CREATE TABLE IF NOT EXISTS `billingEvents` (
  `id`              INT AUTO_INCREMENT PRIMARY KEY,
  `organizationId`  INT NOT NULL,
  `subscriptionId`  INT,
  `stripeEventId`   VARCHAR(64) UNIQUE,
  `eventType`       VARCHAR(120) NOT NULL,
  `status`          ENUM('success','failed','pending','refunded') NOT NULL DEFAULT 'pending',
  `amountCents`     INT,
  `currency`        VARCHAR(3) DEFAULT 'USD',
  `description`     TEXT,
  `rawPayload`      TEXT,
  `createdAt`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`subscriptionId`) REFERENCES `subscriptions`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Compliance Reports (AI-generated, versioned, per organization)
CREATE TABLE IF NOT EXISTS `complianceReports` (
  `id`                       INT AUTO_INCREMENT PRIMARY KEY,
  `organizationId`           INT NOT NULL,
  `generatedByUserId`        INT,
  `generatedByLocalUserId`   INT,
  `title`                    VARCHAR(255) NOT NULL,
  `reportType`               ENUM('full_compliance','gap_analysis','vendor_assessment','risk_assessment','executive_summary','regulatory_deadline') NOT NULL,
  `frameworks`               TEXT NOT NULL,
  `aiJobId`                  VARCHAR(64),
  `version`                  INT NOT NULL DEFAULT 1,
  `overallScore`             INT,
  `riskLevel`                ENUM('low','medium','high','critical'),
  `reportBody`               TEXT NOT NULL,
  `exportedAt`               TIMESTAMP NULL,
  `exportedPdfUrl`           VARCHAR(512),
  `status`                   ENUM('generating','ready','failed','archived') NOT NULL DEFAULT 'generating',
  `createdAt`                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`organizationId`)         REFERENCES `organizations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`generatedByUserId`)      REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`generatedByLocalUserId`) REFERENCES `localUsers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Interaction Logs (comprehensive usage capture for analytics & audit)
CREATE TABLE IF NOT EXISTS `userInteractionLogs` (
  `id`              INT AUTO_INCREMENT PRIMARY KEY,
  `organizationId`  INT,
  `userId`          INT,
  `localUserId`     INT,
  `sessionId`       VARCHAR(64),
  `context`         VARCHAR(120) NOT NULL,
  `action`          VARCHAR(120) NOT NULL,
  `entityType`      VARCHAR(120),
  `entityId`        INT,
  `inputSnapshot`   TEXT,
  `outputRef`       TEXT,
  `durationMs`      INT,
  `ipHash`          VARCHAR(64),
  `userAgent`       VARCHAR(512),
  `createdAt`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`userId`)         REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`localUserId`)    REFERENCES `localUsers`(`id`) ON DELETE SET NULL,
  INDEX `idx_uil_org_action`   (`organizationId`, `action`),
  INDEX `idx_uil_user_action`  (`userId`, `action`),
  INDEX `idx_uil_context`      (`context`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Compliance Deadlines (regulatory calendar per org)
CREATE TABLE IF NOT EXISTS `complianceDeadlines` (
  `id`                  INT AUTO_INCREMENT PRIMARY KEY,
  `organizationId`      INT,
  `frameworkCode`       VARCHAR(50) NOT NULL,
  `title`               VARCHAR(255) NOT NULL,
  `description`         TEXT,
  `deadlineDate`        TIMESTAMP NOT NULL,
  `jurisdiction`        ENUM('China','Saudi Arabia','Both') NOT NULL,
  `priority`            ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  `status`              ENUM('upcoming','overdue','completed','waived') NOT NULL DEFAULT 'upcoming',
  `notificationsSent`   TEXT,
  `assignedToUserId`    INT,
  `completedAt`         TIMESTAMP NULL,
  `createdAt`           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`organizationId`)   REFERENCES `organizations`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`assignedToUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_cd_org_deadline` (`organizationId`, `deadlineDate`),
  INDEX `idx_cd_status`       (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
