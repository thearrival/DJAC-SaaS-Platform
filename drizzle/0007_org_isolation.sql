-- Organization data isolation: add organizationId FK to vendors table.
-- Existing rows will have organizationId = NULL (isolated by userId, legacy behaviour).
-- New vendors created via orgProcedure routes will have organizationId set.

ALTER TABLE `vendors`
  ADD COLUMN `organizationId` int NULL AFTER `userId`,
  ADD CONSTRAINT `vendors_organizationId_fk`
    FOREIGN KEY (`organizationId`) REFERENCES `organizations` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX `vendors_organizationId_idx` ON `vendors` (`organizationId`);
