-- Phase 39: Cyber Operations Modules
-- Migration: 0018_cyber_ops
-- Tables: serviceRequests, assetInventory, securityMaturityAssessments, threatIntelItems

-- ─── Service Requests ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `serviceRequests` (
    `id`                  INT           NOT NULL AUTO_INCREMENT,
    `organizationId`      INT           NOT NULL,
    `requestedByUserId`   INT           NULL,
    `serviceType`         ENUM(
                              'penetration_test',
                              'red_team',
                              'security_audit',
                              'soc_support',
                              'incident_response',
                              'consulting',
                              'phishing_simulation',
                              'cloud_security_review',
                              'vulnerability_assessment',
                              'compliance_gap_assessment'
                          )             NOT NULL,
    `title`               VARCHAR(255)  NOT NULL,
    `description`         TEXT          NOT NULL,
    `scopeDetails`        TEXT          NULL,
    `preferredStartDate`  TIMESTAMP     NULL,
    `budgetRange`         VARCHAR(120)  NULL,
    `priority`            ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
    `status`              ENUM(
                              'draft',
                              'submitted',
                              'under_review',
                              'scoping',
                              'approved',
                              'in_progress',
                              'completed',
                              'cancelled',
                              'on_hold'
                          )             NOT NULL DEFAULT 'submitted',
    `assignedToUserId`    INT           NULL,
    `internalNotes`       TEXT          NULL,
    `clientResponse`      TEXT          NULL,
    `respondedAt`         TIMESTAMP     NULL,
    `completedAt`         TIMESTAMP     NULL,
    `createdAt`           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `serviceRequests_organizationId_idx` (`organizationId`),
    INDEX `serviceRequests_status_idx` (`status`),
    INDEX `serviceRequests_assignedToUserId_idx` (`assignedToUserId`),
    CONSTRAINT `serviceRequests_organizationId_fk`
        FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
    CONSTRAINT `serviceRequests_requestedByUserId_fk`
        FOREIGN KEY (`requestedByUserId`) REFERENCES `localUsers` (`id`) ON DELETE SET NULL,
    CONSTRAINT `serviceRequests_assignedToUserId_fk`
        FOREIGN KEY (`assignedToUserId`) REFERENCES `localUsers` (`id`) ON DELETE SET NULL
);
--> statement-breakpoint

-- ─── Asset Inventory ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `assetInventory` (
    `id`              INT           NOT NULL AUTO_INCREMENT,
    `organizationId`  INT           NOT NULL,
    `name`            VARCHAR(255)  NOT NULL,
    `assetType`       ENUM(
                          'server',
                          'workstation',
                          'network_device',
                          'cloud_service',
                          'saas_application',
                          'database',
                          'api_endpoint',
                          'iot_device',
                          'mobile_device',
                          'industrial_ot',
                          'web_application',
                          'source_code_repo',
                          'third_party_service'
                      )             NOT NULL,
    `identifier`      VARCHAR(512)  NULL,
    `owner`           VARCHAR(255)  NULL,
    `location`        VARCHAR(255)  NULL,
    `criticality`     ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
    `exposure`        ENUM('internal','vpn_only','partner_only','internet_facing') NOT NULL DEFAULT 'internal',
    `status`          ENUM('active','decommissioned','under_review','unknown') NOT NULL DEFAULT 'active',
    `riskScore`       INT           NOT NULL DEFAULT 0,
    `platform`        VARCHAR(120)  NULL,
    `version`         VARCHAR(120)  NULL,
    `lastScannedAt`   TIMESTAMP     NULL,
    `openVulnCount`   INT           NOT NULL DEFAULT 0,
    `tags`            VARCHAR(512)  NULL,
    `notes`           TEXT          NULL,
    `addedByUserId`   INT           NULL,
    `createdAt`       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `assetInventory_organizationId_idx` (`organizationId`),
    INDEX `assetInventory_criticality_idx` (`criticality`),
    INDEX `assetInventory_riskScore_idx` (`riskScore`),
    CONSTRAINT `assetInventory_organizationId_fk`
        FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
    CONSTRAINT `assetInventory_addedByUserId_fk`
        FOREIGN KEY (`addedByUserId`) REFERENCES `localUsers` (`id`) ON DELETE SET NULL
);
--> statement-breakpoint

-- ─── Security Maturity Assessments ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `securityMaturityAssessments` (
    `id`                      INT           NOT NULL AUTO_INCREMENT,
    `organizationId`          INT           NOT NULL,
    `title`                   VARCHAR(255)  NOT NULL,
    `frameworkRef`            VARCHAR(64)   NULL,
    `scoreGovernance`         INT           NOT NULL DEFAULT 1,
    `scoreAssetManagement`    INT           NOT NULL DEFAULT 1,
    `scoreAccessControl`      INT           NOT NULL DEFAULT 1,
    `scoreDataProtection`     INT           NOT NULL DEFAULT 1,
    `scoreNetworkSecurity`    INT           NOT NULL DEFAULT 1,
    `scoreVulnerabilityMgmt`  INT           NOT NULL DEFAULT 1,
    `scoreIncidentResponse`   INT           NOT NULL DEFAULT 1,
    `scoreBackupRecovery`     INT           NOT NULL DEFAULT 1,
    `scoreThirdPartyRisk`     INT           NOT NULL DEFAULT 1,
    `scoreSecurityAwareness`  INT           NOT NULL DEFAULT 1,
    `overallScore`            INT           NOT NULL DEFAULT 0,
    `maturityLevel`           ENUM('initial','developing','defined','managed','optimized') NOT NULL DEFAULT 'initial',
    `recommendations`         TEXT          NULL,
    `assessedByUserId`        INT           NULL,
    `createdAt`               TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`               TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `securityMaturity_organizationId_idx` (`organizationId`),
    CONSTRAINT `securityMaturity_organizationId_fk`
        FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
    CONSTRAINT `securityMaturity_assessedByUserId_fk`
        FOREIGN KEY (`assessedByUserId`) REFERENCES `localUsers` (`id`) ON DELETE SET NULL
);
--> statement-breakpoint

-- ─── Threat Intelligence Items ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `threatIntelItems` (
    `id`               INT            NOT NULL AUTO_INCREMENT,
    `organizationId`   INT            NULL,
    `title`            VARCHAR(255)   NOT NULL,
    `summary`          TEXT           NOT NULL,
    `threatActor`      VARCHAR(180)   NULL,
    `category`         ENUM(
                           'malware',
                           'ransomware',
                           'phishing',
                           'apt',
                           'zero_day',
                           'ddos',
                           'supply_chain',
                           'data_breach',
                           'vulnerability',
                           'social_engineering',
                           'insider_threat',
                           'other'
                       )              NOT NULL,
    `severity`         ENUM('info','low','medium','high','critical') NOT NULL DEFAULT 'medium',
    `tlp`              ENUM('white','green','amber','red') NOT NULL DEFAULT 'white',
    `affectedSectors`  VARCHAR(512)   NULL,
    `indicators`       TEXT           NULL,
    `referenceUrl`     VARCHAR(1024)  NULL,
    `cveId`            VARCHAR(32)    NULL,
    `cvssScore`        VARCHAR(8)     NULL,
    `isActive`         TINYINT        NOT NULL DEFAULT 1,
    `createdByUserId`  INT            NULL,
    `publishedAt`      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `createdAt`        TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`        TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `threatIntel_organizationId_idx` (`organizationId`),
    INDEX `threatIntel_severity_idx` (`severity`),
    INDEX `threatIntel_isActive_idx` (`isActive`),
    INDEX `threatIntel_publishedAt_idx` (`publishedAt`),
    CONSTRAINT `threatIntel_organizationId_fk`
        FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
    CONSTRAINT `threatIntel_createdByUserId_fk`
        FOREIGN KEY (`createdByUserId`) REFERENCES `localUsers` (`id`) ON DELETE SET NULL
);
