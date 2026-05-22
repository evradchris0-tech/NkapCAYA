-- AlterTable: add principalEntryId and interestEntryId to loan_repayments
ALTER TABLE `loan_repayments`
  ADD COLUMN `principal_entry_id` VARCHAR(36) NULL,
  ADD COLUMN `interest_entry_id`  VARCHAR(36) NULL;

-- UniqueIndex on each new column
ALTER TABLE `loan_repayments`
  ADD UNIQUE INDEX `loan_repayments_principal_entry_id_key` (`principal_entry_id`),
  ADD UNIQUE INDEX `loan_repayments_interest_entry_id_key` (`interest_entry_id`);

-- Foreign keys to session_entries
ALTER TABLE `loan_repayments`
  ADD CONSTRAINT `loan_repayments_principal_entry_id_fkey`
    FOREIGN KEY (`principal_entry_id`) REFERENCES `session_entries`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `loan_repayments_interest_entry_id_fkey`
    FOREIGN KEY (`interest_entry_id`) REFERENCES `session_entries`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
