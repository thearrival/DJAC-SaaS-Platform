-- Migration: 0008_report_shares
-- Adds the reportShares table for time-limited compliance report share links.

CREATE TABLE IF NOT EXISTS `reportShares` (
  `id`               INT           NOT NULL AUTO_INCREMENT,
  `token`            VARCHAR(64)   NOT NULL,
  `jurisdiction`     VARCHAR(64)   NOT NULL,
  `locale`           ENUM('en','ar','zh') NOT NULL DEFAULT 'en',
  `reportType`       VARCHAR(64)   NOT NULL,
  `createdByUserId`  INT           NULL,
  `viewCount`        INT           NOT NULL DEFAULT 0,
  `expiresAt`        TIMESTAMP     NOT NULL,
  `createdAt`        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reportShares_token_unique` (`token`),
  KEY `reportShares_expiresAt_idx` (`expiresAt`),
  CONSTRAINT `reportShares_createdByUserId_fk`
    FOREIGN KEY (`createdByUserId`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
);
