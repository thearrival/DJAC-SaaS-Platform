-- Phase 32: Compliance Incident Register
-- Run: mariadb.exe -u root djac_tool < drizzle/0014_compliance_incidents.sql

CREATE TABLE IF NOT EXISTS `complianceIncidents` (
  `id`                             int            NOT NULL AUTO_INCREMENT,
  `organizationId`                 int            NOT NULL,
  `incidentCode`                   varchar(64)    DEFAULT NULL,
  `title`                          varchar(255)   NOT NULL,
  `description`                    text           DEFAULT NULL,
  `incidentType`                   enum('data_breach','unauthorized_access','policy_violation','system_outage','third_party_breach','other') NOT NULL DEFAULT 'other',
  `severity`                       enum('critical','high','medium','low') NOT NULL DEFAULT 'medium',
  `status`                         enum('open','under_investigation','contained','resolved','closed') NOT NULL DEFAULT 'open',
  `affectedFrameworks`             text           DEFAULT NULL,
  `affectedVendorId`               int            DEFAULT NULL,
  `affectedDataTypes`              text           DEFAULT NULL,
  `affectedDataSubjects`           int            DEFAULT NULL,
  `reportedById`                   int            DEFAULT NULL,
  `occurredAt`                     timestamp      NULL DEFAULT NULL,
  `detectedAt`                     timestamp      NULL DEFAULT NULL,
  `containedAt`                    timestamp      NULL DEFAULT NULL,
  `resolvedAt`                     timestamp      NULL DEFAULT NULL,
  `regulatoryNotificationRequired` tinyint(1)     NOT NULL DEFAULT 0,
  `regulatoryNotificationSentAt`   timestamp      NULL DEFAULT NULL,
  `notificationDeadlineHours`      int            DEFAULT 72,
  `rootCause`                      text           DEFAULT NULL,
  `lessonsLearned`                 text           DEFAULT NULL,
  `notes`                          text           DEFAULT NULL,
  `createdAt`                      timestamp      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`                      timestamp      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `complianceIncidents_organizationId_fk`
    FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_ci_org`      ON `complianceIncidents` (`organizationId`);
CREATE INDEX `idx_ci_status`   ON `complianceIncidents` (`status`);
CREATE INDEX `idx_ci_severity` ON `complianceIncidents` (`severity`);
