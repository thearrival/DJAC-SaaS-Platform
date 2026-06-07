-- Phase 37: Compliance Evidence Locker
-- Migration: 0016_compliance_evidence
-- Creates the complianceEvidence table for linking URL-based evidence documents
-- to audit schedules, policies, risks, gaps, remediations, CTEM assets, and incidents.

CREATE TABLE IF NOT EXISTS `complianceEvidence` (
    `id`             INT            NOT NULL AUTO_INCREMENT,
    `organizationId` INT            NOT NULL,
    `sourceType`     ENUM(
                         'audit_schedule',
                         'policy',
                         'risk',
                         'gap',
                         'remediation',
                         'ctem_asset',
                         'incident',
                         'general'
                     )              NOT NULL DEFAULT 'general',
    `sourceId`       INT            NULL,
    `title`          VARCHAR(255)   NOT NULL,
    `url`            VARCHAR(1024)  NOT NULL,
    `description`    TEXT,
    `addedByUserId`  INT            NULL,
    `tags`           VARCHAR(512),
    `createdAt`      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    CONSTRAINT `fk_ce_org`
        FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
    INDEX `idx_ce_org`     (`organizationId`),
    INDEX `idx_ce_source`  (`sourceType`, `sourceId`),
    INDEX `idx_ce_created` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
