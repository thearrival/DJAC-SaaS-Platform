-- Phase 41: Yalla-Admin One-Time Access Links
-- Migration: 0020_yalla_admin_access_links
-- Tables: yallaAdminAccessLinkNonces

CREATE TABLE IF NOT EXISTS `yallaAdminAccessLinkNonces` (
    `id`             INT           NOT NULL AUTO_INCREMENT,
    `nonceHash`      VARCHAR(64)   NOT NULL,
    `redirectTarget` VARCHAR(255)  NOT NULL,
    `expiresAt`      TIMESTAMP     NOT NULL,
    `consumedAt`     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `consumedByIp`   VARCHAR(64)   NOT NULL,
    `createdAt`      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `yallaAdminAccessLinkNonces_nonceHash_unique` (`nonceHash`),
    INDEX `yallaAdminAccessLinkNonces_expiresAt_idx` (`expiresAt`),
    INDEX `yallaAdminAccessLinkNonces_consumedAt_idx` (`consumedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
