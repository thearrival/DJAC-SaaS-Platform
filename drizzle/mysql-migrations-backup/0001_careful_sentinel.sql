CREATE TABLE `assessmentGaps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`controlId` int NOT NULL,
	`gapDescription` text,
	`severity` enum('low','medium','high','critical'),
	`remediation` text,
	`estimatedRemediationCost` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assessmentGaps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `complianceControls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`frameworkId` int NOT NULL,
	`controlCode` varchar(100) NOT NULL,
	`controlName` text NOT NULL,
	`category` varchar(100),
	`description` text,
	`requirement` text,
	`applicability` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `complianceControls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `controlMappings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceControlId` int NOT NULL,
	`targetControlId` int NOT NULL,
	`mappingType` enum('equivalent','related','conflicting','complementary') NOT NULL,
	`alignmentScore` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `controlMappings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `frameworkRelationships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceFrameworkId` int NOT NULL,
	`targetFrameworkId` int NOT NULL,
	`relationshipType` enum('overlap','conflict','harmonization','gap','dependency') NOT NULL,
	`description` text,
	`severity` enum('low','medium','high','critical'),
	`riskLevel` varchar(50),
	`mitigation` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `frameworkRelationships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `frameworks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` text NOT NULL,
	`country` varchar(50) NOT NULL,
	`description` text,
	`scope` text,
	`enforcementAuthority` varchar(255),
	`maxPenalty` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `frameworks_id` PRIMARY KEY(`id`),
	CONSTRAINT `frameworks_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `techStackComponents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vendorId` int NOT NULL,
	`componentName` varchar(255) NOT NULL,
	`componentType` varchar(100),
	`technology` varchar(255),
	`description` text,
	`dataHandling` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `techStackComponents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vendorAssessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`vendorId` int NOT NULL,
	`frameworkId` int NOT NULL,
	`assessmentDate` timestamp NOT NULL DEFAULT (now()),
	`complianceScore` int,
	`riskLevel` enum('low','medium','high','critical'),
	`status` enum('compliant','partial','non_compliant','unknown'),
	`findings` text,
	`recommendations` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vendorAssessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vendors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`vendorName` varchar(255) NOT NULL,
	`vendorDescription` text,
	`industry` varchar(100),
	`operatingCountries` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vendors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `assessmentGaps` ADD CONSTRAINT `assessmentGaps_assessmentId_vendorAssessments_id_fk` FOREIGN KEY (`assessmentId`) REFERENCES `vendorAssessments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessmentGaps` ADD CONSTRAINT `assessmentGaps_controlId_complianceControls_id_fk` FOREIGN KEY (`controlId`) REFERENCES `complianceControls`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `complianceControls` ADD CONSTRAINT `complianceControls_frameworkId_frameworks_id_fk` FOREIGN KEY (`frameworkId`) REFERENCES `frameworks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `controlMappings` ADD CONSTRAINT `controlMappings_sourceControlId_complianceControls_id_fk` FOREIGN KEY (`sourceControlId`) REFERENCES `complianceControls`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `controlMappings` ADD CONSTRAINT `controlMappings_targetControlId_complianceControls_id_fk` FOREIGN KEY (`targetControlId`) REFERENCES `complianceControls`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `frameworkRelationships` ADD CONSTRAINT `frameworkRelationships_sourceFrameworkId_frameworks_id_fk` FOREIGN KEY (`sourceFrameworkId`) REFERENCES `frameworks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `frameworkRelationships` ADD CONSTRAINT `frameworkRelationships_targetFrameworkId_frameworks_id_fk` FOREIGN KEY (`targetFrameworkId`) REFERENCES `frameworks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `techStackComponents` ADD CONSTRAINT `techStackComponents_vendorId_vendors_id_fk` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vendorAssessments` ADD CONSTRAINT `vendorAssessments_vendorId_vendors_id_fk` FOREIGN KEY (`vendorId`) REFERENCES `vendors`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vendorAssessments` ADD CONSTRAINT `vendorAssessments_frameworkId_frameworks_id_fk` FOREIGN KEY (`frameworkId`) REFERENCES `frameworks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vendors` ADD CONSTRAINT `vendors_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;