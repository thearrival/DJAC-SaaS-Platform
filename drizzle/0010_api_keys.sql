-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 0010_api_keys
-- Purpose:   Programmatic API keys for CI/CD & integrations.
--            Keys are SHA-256 hashed at rest; only the prefix is shown in UI.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `apiKeys` (
  `id`               INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `organizationId`   INT NOT NULL,
  `createdByUserId`  INT,
  `name`             VARCHAR(120) NOT NULL,
  -- BLAKE3 / SHA-256 hex hash of the raw key — never store plaintext
  `keyHash`          VARCHAR(64) NOT NULL UNIQUE,
  -- First 8 chars of raw key shown in UI (e.g.  djac_a1b2c3d4…)
  `keyPrefix`        VARCHAR(16) NOT NULL,
  `scopes`           TEXT,
  `lastUsedAt`       DATETIME,
  `expiresAt`        DATETIME,
  `revokedAt`        DATETIME,
  `createdAt`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_apiKeys_org` FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
);

CREATE INDEX `idx_apiKeys_org` ON `apiKeys` (`organizationId`);
