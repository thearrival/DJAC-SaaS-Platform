ALTER TABLE `frameworkRelationships`
  MODIFY COLUMN `relationshipType` enum('overlap','conflict','harmonization','coordination','gap','dependency') NOT NULL;

ALTER TABLE `vendors`
  ADD COLUMN `cloudProvider` varchar(255),
  ADD COLUMN `dataLocations` text,
  ADD COLUMN `certifications` text;
