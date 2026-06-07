-- Phase 40: Yalla-Admin Internal Control Panel
-- Migration: 0019_yalla_admin
-- Tables: yallaAdminSessions, yallaAdminAuditLogs

-- ─── Yalla-Admin Sessions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `yallaAdminSessions` (
    `id`            VARCHAR(64)   NOT NULL,
    `adminUsername` VARCHAR(120)  NOT NULL,
    `ipAddress`     VARCHAR(64)   NOT NULL,
    `userAgent`     VARCHAR(512)  NULL,
    `createdAt`     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expiresAt`     TIMESTAMP     NOT NULL,
    `lastSeenAt`    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `isRevoked`     TINYINT       NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    INDEX `yallaAdminSessions_adminUsername_idx` (`adminUsername`),
    INDEX `yallaAdminSessions_expiresAt_idx` (`expiresAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
--> statement-breakpoint

-- ─── Yalla-Admin Audit Logs ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `yallaAdminAuditLogs` (
    `id`            INT           NOT NULL AUTO_INCREMENT,
    `sessionId`     VARCHAR(64)   NULL,
    `adminUsername` VARCHAR(120)  NOT NULL,
    `action`        VARCHAR(120)  NOT NULL,
    `target`        VARCHAR(255)  NULL,
    `ipAddress`     VARCHAR(64)   NOT NULL,
    `payload`       JSON          NULL,
    `createdAt`     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `yallaAdminAudit_adminUsername_idx` (`adminUsername`),
    INDEX `yallaAdminAudit_action_idx` (`action`),
    INDEX `yallaAdminAudit_createdAt_idx` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
