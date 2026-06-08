-- Migration: 0005_local_auth_users
-- Creates the localUsers table for platform-native (email + password) authentication.
-- Kept separate from the OAuth `users` table for clean segmentation.

CREATE TABLE `localUsers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(72) NOT NULL,
	`userType` enum('visitor','professional','admin') NOT NULL DEFAULT 'visitor',
	`companyName` varchar(255),
	`jobTitle` varchar(120),
	`industry` varchar(120),
	`complianceResponsibility` text,
	`preferredLocale` enum('en','ar','zh') NOT NULL DEFAULT 'en',
	`status` enum('active','pending','suspended') NOT NULL DEFAULT 'pending',
	`lastSignedIn` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `localUsers_id` PRIMARY KEY(`id`),
	CONSTRAINT `localUsers_email_unique` UNIQUE(`email`)
);
