-- Phase 38: Data Subject Request (DSR) Tracker
-- Migration: 0017_dsr_requests
-- Tracks incoming data subject rights requests under PIPL (China, 15 working days)
-- and PDPL (Saudi Arabia, 30 days). Supports access, rectification, erasure,
-- portability, restriction, objection, and explanation request types.

CREATE TABLE IF NOT EXISTS `dsrRequests` (
    `id`               INT             NOT NULL AUTO_INCREMENT,
    `organizationId`   INT             NOT NULL,
    `requestType`      ENUM(
                           'access',
                           'rectification',
                           'erasure',
                           'portability',
                           'restriction',
                           'objection',
                           'explanation'
                       )               NOT NULL,
    `jurisdiction`     ENUM(
                           'China',
                           'Saudi Arabia',
                           'Other'
                       )               NOT NULL DEFAULT 'Other',
    `requesterName`    VARCHAR(255)    NOT NULL,
    `requesterEmail`   VARCHAR(320)    NOT NULL,
    `description`      TEXT,
    `status`           ENUM(
                           'received',
                           'in_review',
                           'pending_info',
                           'completed',
                           'rejected',
                           'withdrawn'
                       )               NOT NULL DEFAULT 'received',
    `priority`         ENUM(
                           'normal',
                           'high',
                           'urgent'
                       )               NOT NULL DEFAULT 'normal',
    `dueDate`          TIMESTAMP       NOT NULL,
    `completedAt`      TIMESTAMP       NULL,
    `assignedToUserId` INT             NULL,
    `notes`            TEXT,
    `createdAt`        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    CONSTRAINT `fk_dsr_org`
        FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
    INDEX `idx_dsr_org`          (`organizationId`),
    INDEX `idx_dsr_status`       (`status`),
    INDEX `idx_dsr_due`          (`dueDate`),
    INDEX `idx_dsr_jurisdiction` (`jurisdiction`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
