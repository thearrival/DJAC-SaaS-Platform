-- Phase 29: Remediation Tasks table
-- Run: mariadb.exe -u root djac_tool < drizzle/0011_remediation_tasks.sql

CREATE TABLE IF NOT EXISTS `remediationTasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `organizationId` INT NOT NULL,
  `vendorId` INT,
  `gapCode` VARCHAR(64),
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `severity` ENUM('critical','high','medium','low') NOT NULL DEFAULT 'medium',
  `status` ENUM('open','in_progress','resolved','accepted_risk') NOT NULL DEFAULT 'open',
  `assignedToUserId` INT,
  `dueDate` TIMESTAMP NULL,
  `notes` TEXT,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `remediationTasks_orgId_fk`
    FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE CASCADE,
  INDEX `idx_remediation_org` (`organizationId`),
  INDEX `idx_remediation_status` (`status`),
  INDEX `idx_remediation_vendor` (`vendorId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
