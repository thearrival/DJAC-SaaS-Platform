ALTER TABLE `users`
  ADD COLUMN `organizationName` varchar(255),
  ADD COLUMN `organizationType` varchar(120),
  ADD COLUMN `jobTitle` varchar(120),
  ADD COLUMN `preferredLocale` enum('en','ar','zh') NOT NULL DEFAULT 'en',
  ADD COLUMN `status` enum('active','invited','suspended') NOT NULL DEFAULT 'active',
  ADD COLUMN `lastActivityAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE `accessRequests` (
  `id` int AUTO_INCREMENT NOT NULL,
  `fullName` varchar(255) NOT NULL,
  `email` varchar(320) NOT NULL,
  `organizationName` varchar(255) NOT NULL,
  `organizationType` varchar(120),
  `useCase` text,
  `preferredLocale` enum('en','ar','zh') NOT NULL DEFAULT 'en',
  `status` enum('new','reviewing','approved','archived') NOT NULL DEFAULT 'new',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `accessRequests_id` PRIMARY KEY(`id`)
);

CREATE TABLE `consultationRequests` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int,
  `contactName` varchar(255) NOT NULL,
  `contactEmail` varchar(320) NOT NULL,
  `organizationName` varchar(255) NOT NULL,
  `topic` varchar(255) NOT NULL,
  `jurisdictions` text,
  `summary` text NOT NULL,
  `vendorName` varchar(255),
  `techStackSummary` text,
  `status` enum('new','in_review','responded','closed') NOT NULL DEFAULT 'new',
  `priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
  `assignedAdminUserId` int,
  `adminResponse` text,
  `respondedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `consultationRequests_id` PRIMARY KEY(`id`)
);

CREATE TABLE `activityEvents` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int,
  `actorType` enum('visitor','client','admin','system') NOT NULL,
  `action` varchar(120) NOT NULL,
  `entityType` varchar(120) NOT NULL,
  `entityId` int,
  `metadata` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `activityEvents_id` PRIMARY KEY(`id`)
);

CREATE TABLE `adminNotifications` (
  `id` int AUTO_INCREMENT NOT NULL,
  `category` enum('registration','consultation','assessment','support','system') NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text,
  `entityType` varchar(120),
  `entityId` int,
  `isRead` int NOT NULL DEFAULT 0,
  `readAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `adminNotifications_id` PRIMARY KEY(`id`)
);

ALTER TABLE `consultationRequests`
  ADD CONSTRAINT `consultationRequests_userId_users_id_fk`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `consultationRequests`
  ADD CONSTRAINT `consultationRequests_assignedAdminUserId_users_id_fk`
  FOREIGN KEY (`assignedAdminUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `activityEvents`
  ADD CONSTRAINT `activityEvents_userId_users_id_fk`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;