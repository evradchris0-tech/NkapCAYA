-- AlterTable: add reopen_reason to monthly_sessions
ALTER TABLE `monthly_sessions`
  ADD COLUMN `reopen_reason` TEXT NULL;
