-- Phase 33: Compliance Audit Schedule
-- Creates the auditSchedules table for scheduling and tracking compliance audits.

CREATE TABLE IF NOT EXISTS auditSchedules (
    id               INT          NOT NULL AUTO_INCREMENT,
    organizationId   INT          NOT NULL,
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    auditType        ENUM('internal','external','regulatory','certification') NOT NULL DEFAULT 'internal',
    scope            TEXT,
    status           ENUM('planned','in_progress','completed','cancelled')   NOT NULL DEFAULT 'planned',
    scheduledDate    TIMESTAMP    NOT NULL,
    completedDate    TIMESTAMP    NULL,
    assignedToId     INT          NULL,
    vendorId         INT          NULL,
    findings         TEXT,
    recurrence       ENUM('none','monthly','quarterly','biannual','annual')  NOT NULL DEFAULT 'none',
    nextOccurrence   TIMESTAMP    NULL,
    notes            TEXT,
    createdAt        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_as_org FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
    INDEX idx_as_org    (organizationId),
    INDEX idx_as_status (status),
    INDEX idx_as_date   (scheduledDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
