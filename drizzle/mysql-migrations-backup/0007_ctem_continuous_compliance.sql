-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0007: CTEM — Continuous Threat Exposure Management
-- Adds 6 new tables for continuous compliance + CTEM module.
-- Safe to run on a fresh DB (no-op if tables already exist).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. ctemAssets —  inventoried assets per vendor
CREATE TABLE IF NOT EXISTS `ctemAssets` (
  `id`                  INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `organizationId`      INT          NOT NULL,
  `vendorId`            INT,
  `assetName`           VARCHAR(255) NOT NULL,
  `assetType`           ENUM('web_application','api_endpoint','database','cloud_service','network_device','iot_device','data_pipeline','identity_provider','storage_bucket','other') NOT NULL DEFAULT 'other',
  `ipDomain`            VARCHAR(255),
  `region`              ENUM('China','Saudi Arabia','Cross-border','Other') NOT NULL DEFAULT 'Other',
  `isInternetFacing`    TINYINT      NOT NULL DEFAULT 0,
  `handlesPersonalData` TINYINT      NOT NULL DEFAULT 0,
  `handlesCriticalData` TINYINT      NOT NULL DEFAULT 0,
  `criticalityScore`    INT          NOT NULL DEFAULT 5,
  `status`              ENUM('active','inactive','decommissioned') NOT NULL DEFAULT 'active',
  `notes`               TEXT,
  `createdAt`           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `ctemAssets_organizationId_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ctemAssets_vendorId_fk`       FOREIGN KEY (`vendorId`)       REFERENCES `vendors` (`id`)       ON DELETE SET NULL
);

-- 2. ctemVulnerabilities — CVEs / findings per asset
CREATE TABLE IF NOT EXISTS `ctemVulnerabilities` (
  `id`               INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `assetId`          INT          NOT NULL,
  `cveId`            VARCHAR(64),
  `title`            VARCHAR(255) NOT NULL,
  `description`      TEXT,
  `severity`         ENUM('critical','high','medium','low','informational') NOT NULL DEFAULT 'medium',
  `cvssScore`        INT          NOT NULL DEFAULT 0,
  `exploitAvailable` TINYINT      NOT NULL DEFAULT 0,
  `isConfirmed`      TINYINT      NOT NULL DEFAULT 0,
  `isPatched`        TINYINT      NOT NULL DEFAULT 0,
  `discoveredAt`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `patchedAt`        TIMESTAMP    NULL,
  `notes`            TEXT,
  `createdAt`        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `ctemVulnerabilities_assetId_fk` FOREIGN KEY (`assetId`) REFERENCES `ctemAssets` (`id`) ON DELETE CASCADE
);

-- 3. ctemAttackSimulations — BAS simulation runs per asset
CREATE TABLE IF NOT EXISTS `ctemAttackSimulations` (
  `id`                  INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `assetId`             INT          NOT NULL,
  `simulationType`      ENUM('lateral_movement','privilege_escalation','data_exfiltration','ransomware','phishing','api_abuse','supply_chain','ddos','insider_threat','other') NOT NULL DEFAULT 'other',
  `successProbability`  INT          NOT NULL DEFAULT 0,
  `executedAt`          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `outputSummary`       TEXT,
  `createdAt`           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `ctemAttackSim_assetId_fk` FOREIGN KEY (`assetId`) REFERENCES `ctemAssets` (`id`) ON DELETE CASCADE
);

-- 4. ctemRiskScores — computed composite priority scores per asset
CREATE TABLE IF NOT EXISTS `ctemRiskScores` (
  `id`                  INT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `assetId`             INT       NOT NULL,
  `exposureScore`       INT       NOT NULL DEFAULT 0,
  `exploitabilityScore` INT       NOT NULL DEFAULT 0,
  `businessImpactScore` INT       NOT NULL DEFAULT 0,
  `finalPriorityScore`  INT       NOT NULL DEFAULT 0,
  `priorityTier`        ENUM('critical','high','medium','low') NOT NULL DEFAULT 'low',
  `previousFinalScore`  INT,
  `updatedAt`           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `ctemRiskScores_assetId_fk` FOREIGN KEY (`assetId`) REFERENCES `ctemAssets` (`id`) ON DELETE CASCADE
);

-- 5. continuousComplianceRuns — one record per scheduled or manual scan
CREATE TABLE IF NOT EXISTS `continuousComplianceRuns` (
  `id`               INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `organizationId`   INT          NOT NULL,
  `vendorId`         INT,
  `runStatus`        ENUM('queued','running','completed','failed') NOT NULL DEFAULT 'queued',
  `triggeredBy`      ENUM('manual','scheduled','webhook')          NOT NULL DEFAULT 'manual',
  `aiJobId`          VARCHAR(64),
  `assetsScanned`    INT          NOT NULL DEFAULT 0,
  `vulnsFound`       INT          NOT NULL DEFAULT 0,
  `exploitableVulns` INT          NOT NULL DEFAULT 0,
  `avgPriorityScore` INT          NOT NULL DEFAULT 0,
  `scoreDelta`       INT,
  `alertRaised`      TINYINT      NOT NULL DEFAULT 0,
  `summary`          TEXT,
  `startedAt`        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completedAt`      TIMESTAMP    NULL,
  `createdAt`        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `ccRuns_organizationId_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ccRuns_vendorId_fk`       FOREIGN KEY (`vendorId`)       REFERENCES `vendors` (`id`)       ON DELETE SET NULL
);

-- 6. complianceExposureMappings — vuln → control compliance impact
CREATE TABLE IF NOT EXISTS `complianceExposureMappings` (
  `id`               INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `vulnerabilityId`  INT          NOT NULL,
  `frameworkId`      INT,
  `frameworkCode`    VARCHAR(50),
  `controlId`        INT,
  `controlCode`      VARCHAR(100),
  `mappingReason`    TEXT         NOT NULL,
  `severityImpact`   ENUM('critical','high','medium','low') NOT NULL DEFAULT 'medium',
  `createdAt`        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `exposureMap_vulnId_fk`   FOREIGN KEY (`vulnerabilityId`) REFERENCES `ctemVulnerabilities` (`id`)  ON DELETE CASCADE,
  CONSTRAINT `exposureMap_fwId_fk`     FOREIGN KEY (`frameworkId`)     REFERENCES `frameworks` (`id`)           ON DELETE SET NULL,
  CONSTRAINT `exposureMap_ctrlId_fk`   FOREIGN KEY (`controlId`)       REFERENCES `complianceControls` (`id`)   ON DELETE SET NULL
);
