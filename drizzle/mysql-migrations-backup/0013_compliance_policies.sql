-- Migration 0013 — Compliance Policies (Phase 31)
-- Apply: mariadb.exe -u root djac_tool < drizzle/0013_compliance_policies.sql

CREATE TABLE IF NOT EXISTS `compliancePolicies` (
  `id`                INT             NOT NULL AUTO_INCREMENT,
  `organizationId`    INT             NOT NULL,
  `policyCode`        VARCHAR(64),
  `title`             VARCHAR(255)    NOT NULL,
  `description`       TEXT,
  `policyType`        ENUM('policy','standard','procedure','guideline') NOT NULL DEFAULT 'policy',
  `frameworks`        TEXT,
  `controlReferences` TEXT,
  `status`            ENUM('draft','under_review','approved','active','retired') NOT NULL DEFAULT 'draft',
  `ownerId`           INT,
  `reviewCycleMonths` INT             DEFAULT 12,
  `lastApprovedAt`    TIMESTAMP       NULL,
  `nextReviewAt`      TIMESTAMP       NULL,
  `version`           VARCHAR(20)     DEFAULT '1.0',
  `documentUrl`       VARCHAR(512),
  `notes`             TEXT,
  `createdAt`         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_compliancePolicies_org`
    FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX `idx_compPolicies_org`    ON `compliancePolicies` (`organizationId`);
CREATE INDEX `idx_compPolicies_status` ON `compliancePolicies` (`organizationId`, `status`);
CREATE INDEX `idx_compPolicies_review` ON `compliancePolicies` (`nextReviewAt`);
