-- Migration 0012 — Risk Register (Phase 30)
-- Apply: mariadb.exe -u root djac_tool < drizzle/0012_risk_register.sql

CREATE TABLE IF NOT EXISTS `riskRegister` (
  `id`               INT             NOT NULL AUTO_INCREMENT,
  `organizationId`   INT             NOT NULL,
  `title`            VARCHAR(255)    NOT NULL,
  `description`      TEXT,
  `category`         ENUM('operational','legal','technical','financial','reputational') NOT NULL DEFAULT 'operational',
  `likelihood`       TINYINT         NOT NULL DEFAULT 3,
  `impact`           TINYINT         NOT NULL DEFAULT 3,
  `treatment`        ENUM('accept','mitigate','transfer','avoid') NOT NULL DEFAULT 'mitigate',
  `status`           ENUM('open','in_treatment','closed','accepted') NOT NULL DEFAULT 'open',
  `ownerId`          INT,
  `vendorId`         INT,
  `gapCode`          VARCHAR(64),
  `controlReference` VARCHAR(128),
  `reviewDate`       TIMESTAMP       NULL,
  `notes`            TEXT,
  `createdAt`        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_riskRegister_org`
    FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Indexes for common query patterns
CREATE INDEX `idx_riskRegister_org`      ON `riskRegister` (`organizationId`);
CREATE INDEX `idx_riskRegister_status`   ON `riskRegister` (`organizationId`, `status`);
CREATE INDEX `idx_riskRegister_vendor`   ON `riskRegister` (`vendorId`);
