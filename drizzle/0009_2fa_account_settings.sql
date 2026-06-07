-- Migration: 2FA / Account Settings
-- Adds TOTP-based 2FA fields to the localUsers table.
-- Safe to run multiple times: uses IF NOT EXISTS style via ADD COLUMN IF NOT EXISTS (MariaDB 10.0+).

ALTER TABLE `localUsers`
  ADD COLUMN IF NOT EXISTS `mfaEnabled` tinyint(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `totpSecret` varchar(64) NULL,
  ADD COLUMN IF NOT EXISTS `mfaBackupCodes` text NULL;
