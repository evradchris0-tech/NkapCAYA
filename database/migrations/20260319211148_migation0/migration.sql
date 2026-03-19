-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(36) NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'TRESORIER', 'TRESORIER_ADJOINT', 'SECRETAIRE_GENERAL', 'SECRETAIRE_ADJOINT', 'COMMISSAIRE_AUX_COMPTES', 'MEMBRE') NOT NULL DEFAULT 'MEMBRE',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `lastLoginAt` DATETIME(3) NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_phone_key`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(36) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `tokenHash` VARCHAR(255) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userAgent` VARCHAR(500) NULL,

    UNIQUE INDEX `refresh_tokens_tokenHash_key`(`tokenHash`),
    INDEX `refresh_tokens_userId_revokedAt_idx`(`userId`, `revokedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(36) NOT NULL,
    `actorId` VARCHAR(36) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `entityType` VARCHAR(50) NOT NULL,
    `entityId` VARCHAR(36) NOT NULL,
    `before` JSON NULL,
    `after` JSON NULL,
    `reason` TEXT NULL,
    `ipAddress` VARCHAR(45) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `audit_logs_actorId_idx`(`actorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tontine_config` (
    `id` VARCHAR(10) NOT NULL DEFAULT 'caya',
    `name` VARCHAR(255) NOT NULL,
    `acronym` VARCHAR(20) NOT NULL,
    `foundedYear` INTEGER NOT NULL,
    `motto` VARCHAR(500) NULL,
    `headquartersCity` VARCHAR(255) NULL,
    `registrationNumber` VARCHAR(100) NULL,
    `shareUnitAmount` DECIMAL(15, 2) NOT NULL DEFAULT 100000,
    `halfShareAmount` DECIMAL(15, 2) NOT NULL DEFAULT 50000,
    `potMonthlyAmount` DECIMAL(15, 2) NOT NULL DEFAULT 3000,
    `maxSharesPerMember` INTEGER NOT NULL DEFAULT 10,
    `mandatoryInitialSavings` DECIMAL(15, 2) NOT NULL DEFAULT 100000,
    `loanMonthlyRate` DECIMAL(5, 4) NOT NULL DEFAULT 0.04,
    `minLoanAmount` DECIMAL(15, 2) NOT NULL DEFAULT 10000,
    `maxLoanAmount` DECIMAL(15, 2) NOT NULL DEFAULT 1000000,
    `maxLoanMultiplier` INTEGER NOT NULL DEFAULT 5,
    `minSavingsToLoan` DECIMAL(15, 2) NOT NULL DEFAULT 100000,
    `maxConcurrentLoans` INTEGER NOT NULL DEFAULT 2,
    `rescueFundTarget` DECIMAL(15, 2) NOT NULL DEFAULT 50000,
    `rescueFundMinBalance` DECIMAL(15, 2) NOT NULL DEFAULT 25000,
    `registrationFeeNew` DECIMAL(15, 2) NOT NULL,
    `registrationFeeReturning` DECIMAL(15, 2) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `updatedById` VARCHAR(36) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fiscal_year_configs` (
    `id` VARCHAR(36) NOT NULL,
    `fiscalYearId` VARCHAR(36) NOT NULL,
    `snapshotAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `snapshotById` VARCHAR(36) NOT NULL,
    `shareUnitAmount` DECIMAL(15, 2) NOT NULL,
    `loanMonthlyRate` DECIMAL(5, 4) NOT NULL,
    `maxLoanMultiplier` INTEGER NOT NULL,
    `minSavingsToLoan` DECIMAL(15, 2) NOT NULL,
    `maxConcurrentLoans` INTEGER NOT NULL,
    `rescueFundTarget` DECIMAL(15, 2) NOT NULL,
    `rescueFundMinBalance` DECIMAL(15, 2) NOT NULL,
    `registrationFeeNew` DECIMAL(15, 2) NOT NULL,
    `registrationFeeReturning` DECIMAL(15, 2) NOT NULL,
    `interestPoolMethod` ENUM('THEORETICAL', 'ACTUAL') NOT NULL DEFAULT 'THEORETICAL',
    `forcedModifiedAt` DATETIME(3) NULL,
    `forcedModifiedById` VARCHAR(36) NULL,
    `forcedModifiedReason` TEXT NULL,

    UNIQUE INDEX `fiscal_year_configs_fiscalYearId_key`(`fiscalYearId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rescue_event_amounts` (
    `eventType` ENUM('MEMBER_DEATH', 'RELATIVE_DEATH', 'MARRIAGE', 'BIRTH', 'ILLNESS', 'PROMOTION') NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `label` VARCHAR(255) NOT NULL,
    `updatedById` VARCHAR(36) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`eventType`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `member_profiles` (
    `id` VARCHAR(36) NOT NULL,
    `memberCode` VARCHAR(10) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `firstName` VARCHAR(100) NOT NULL,
    `lastName` VARCHAR(100) NOT NULL,
    `phone1` VARCHAR(20) NOT NULL,
    `phone2` VARCHAR(20) NULL,
    `attachmentPhoto` LONGBLOB NULL,
    `neighborhood` VARCHAR(255) NOT NULL,
    `locationDetail` TEXT NULL,
    `mobileMoneyType` VARCHAR(50) NULL,
    `mobileMoneyNumber` VARCHAR(20) NULL,
    `sponsorId` VARCHAR(36) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `member_profiles_memberCode_key`(`memberCode`),
    UNIQUE INDEX `member_profiles_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `emergency_contacts` (
    `id` VARCHAR(36) NOT NULL,
    `profileId` VARCHAR(36) NOT NULL,
    `fullName` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `relation` VARCHAR(100) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fiscal_years` (
    `id` VARCHAR(36) NOT NULL,
    `label` VARCHAR(20) NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `cassationDate` DATE NOT NULL,
    `loanDueDate` DATE NOT NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'CASSATION', 'CLOSED', 'ARCHIVED') NOT NULL DEFAULT 'PENDING',
    `openedAt` DATETIME(3) NULL,
    `openedById` VARCHAR(36) NULL,
    `closedAt` DATETIME(3) NULL,
    `closedById` VARCHAR(36) NULL,
    `notes` TEXT NULL,

    UNIQUE INDEX `fiscal_years_label_key`(`label`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `memberships` (
    `id` VARCHAR(36) NOT NULL,
    `profileId` VARCHAR(36) NOT NULL,
    `fiscalYearId` VARCHAR(36) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXCLUDED') NOT NULL DEFAULT 'ACTIVE',
    `joinedAt` DATE NOT NULL,
    `joinedAtMonth` INTEGER NOT NULL,
    `enrollmentType` ENUM('NEW', 'RETURNING', 'MID_YEAR') NOT NULL,
    `catchUpAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `catchUpPaid` BOOLEAN NOT NULL DEFAULT false,
    `registrationFeePaid` BOOLEAN NOT NULL DEFAULT false,
    `rescueContribPaid` BOOLEAN NOT NULL DEFAULT false,
    `initialSavingsPaid` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `memberships_profileId_fiscalYearId_key`(`profileId`, `fiscalYearId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `share_commitments` (
    `id` VARCHAR(36) NOT NULL,
    `membershipId` VARCHAR(36) NOT NULL,
    `sharesCount` DECIMAL(4, 2) NOT NULL,
    `monthlyAmount` DECIMAL(15, 2) NOT NULL,
    `isLocked` BOOLEAN NOT NULL DEFAULT false,
    `lockedAt` DATETIME(3) NULL,
    `lockedById` VARCHAR(36) NULL,

    UNIQUE INDEX `share_commitments_membershipId_key`(`membershipId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `monthly_sessions` (
    `id` VARCHAR(36) NOT NULL,
    `fiscalYearId` VARCHAR(36) NOT NULL,
    `sessionNumber` INTEGER NOT NULL,
    `meetingDate` DATE NOT NULL,
    `location` VARCHAR(500) NULL,
    `hostMembershipId` VARCHAR(36) NULL,
    `status` ENUM('DRAFT', 'OPEN', 'REVIEWING', 'CLOSED') NOT NULL DEFAULT 'DRAFT',
    `openedAt` DATETIME(3) NULL,
    `openedById` VARCHAR(36) NULL,
    `closedAt` DATETIME(3) NULL,
    `closedById` VARCHAR(36) NULL,
    `totalInscription` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `totalSecours` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `totalCotisation` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `totalPot` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `totalRbtPrincipal` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `totalRbtInterest` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `totalEpargne` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `totalProjet` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `totalAutres` DECIMAL(15, 2) NOT NULL DEFAULT 0,

    UNIQUE INDEX `monthly_sessions_fiscalYearId_sessionNumber_key`(`fiscalYearId`, `sessionNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session_entries` (
    `id` VARCHAR(36) NOT NULL,
    `reference` VARCHAR(30) NOT NULL,
    `sessionId` VARCHAR(36) NULL,
    `membershipId` VARCHAR(36) NOT NULL,
    `type` ENUM('INSCRIPTION', 'SECOURS', 'COTISATION', 'POT', 'RBT_PRINCIPAL', 'RBT_INTEREST', 'EPARGNE', 'PROJET', 'AUTRES') NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `loanId` VARCHAR(36) NULL,
    `isOutOfSession` BOOLEAN NOT NULL DEFAULT false,
    `outOfSessionAt` DATETIME(3) NULL,
    `outOfSessionRef` VARCHAR(100) NULL,
    `isImported` BOOLEAN NOT NULL DEFAULT false,
    `notes` TEXT NULL,
    `recordedById` VARCHAR(36) NOT NULL,
    `recordedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `session_entries_reference_key`(`reference`),
    INDEX `session_entries_membershipId_type_idx`(`membershipId`, `type`),
    INDEX `session_entries_sessionId_idx`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `savings_ledgers` (
    `id` VARCHAR(36) NOT NULL,
    `membershipId` VARCHAR(36) NOT NULL,
    `balance` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `principalBalance` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `totalInterestReceived` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `lastUpdatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `savings_ledgers_membershipId_key`(`membershipId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `savings_entries` (
    `id` VARCHAR(36) NOT NULL,
    `ledgerId` VARCHAR(36) NOT NULL,
    `sessionId` VARCHAR(36) NULL,
    `sessionEntryId` VARCHAR(36) NULL,
    `month` INTEGER NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `type` ENUM('DEPOSIT', 'INTEREST_CREDIT') NOT NULL,
    `balanceAfter` DECIMAL(15, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `savings_entries_sessionEntryId_key`(`sessionEntryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pool_participants` (
    `id` VARCHAR(36) NOT NULL,
    `fiscalYearId` VARCHAR(36) NOT NULL,
    `type` ENUM('RESCUE_FUND', 'BUREAU') NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `initialBalance` DECIMAL(15, 2) NOT NULL,
    `currentBalance` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `totalInterestReceived` DECIMAL(15, 2) NOT NULL DEFAULT 0,

    UNIQUE INDEX `pool_participants_fiscalYearId_type_key`(`fiscalYearId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `interest_distribution_snapshots` (
    `id` VARCHAR(36) NOT NULL,
    `sessionId` VARCHAR(36) NOT NULL,
    `totalInterestPool` DECIMAL(15, 2) NOT NULL,
    `totalSavingsBase` DECIMAL(15, 2) NOT NULL,
    `distributedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `executedById` VARCHAR(36) NOT NULL,

    UNIQUE INDEX `interest_distribution_snapshots_sessionId_key`(`sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `interest_allocations` (
    `id` VARCHAR(36) NOT NULL,
    `snapshotId` VARCHAR(36) NOT NULL,
    `membershipId` VARCHAR(36) NOT NULL,
    `savingsBalance` DECIMAL(15, 2) NOT NULL,
    `allocationAmount` DECIMAL(15, 2) NOT NULL,

    UNIQUE INDEX `interest_allocations_snapshotId_membershipId_key`(`snapshotId`, `membershipId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loan_accounts` (
    `id` VARCHAR(36) NOT NULL,
    `membershipId` VARCHAR(36) NOT NULL,
    `fiscalYearId` VARCHAR(36) NOT NULL,
    `principalAmount` DECIMAL(15, 2) NOT NULL,
    `monthlyRate` DECIMAL(5, 4) NOT NULL DEFAULT 0.04,
    `disbursedAt` DATE NULL,
    `disbursedById` VARCHAR(36) NULL,
    `dueBeforeDate` DATE NOT NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'PARTIALLY_REPAID', 'CLOSED') NOT NULL DEFAULT 'PENDING',
    `outstandingBalance` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `totalInterestAccrued` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `totalRepaid` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `requestNotes` TEXT NULL,

    INDEX `loan_accounts_membershipId_status_idx`(`membershipId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `monthly_loan_accruals` (
    `id` VARCHAR(36) NOT NULL,
    `loanId` VARCHAR(36) NOT NULL,
    `sessionId` VARCHAR(36) NOT NULL,
    `month` INTEGER NOT NULL,
    `balanceAtMonthStart` DECIMAL(15, 2) NOT NULL,
    `interestAccrued` DECIMAL(15, 2) NOT NULL,
    `balanceWithInterest` DECIMAL(15, 2) NOT NULL,
    `repaymentReceived` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `balanceAtMonthEnd` DECIMAL(15, 2) NOT NULL,

    INDEX `monthly_loan_accruals_sessionId_idx`(`sessionId`),
    UNIQUE INDEX `monthly_loan_accruals_loanId_sessionId_key`(`loanId`, `sessionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loan_repayments` (
    `id` VARCHAR(36) NOT NULL,
    `loanId` VARCHAR(36) NOT NULL,
    `sessionId` VARCHAR(36) NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `principalPart` DECIMAL(15, 2) NOT NULL,
    `interestPart` DECIMAL(15, 2) NOT NULL,
    `balanceAfter` DECIMAL(15, 2) NOT NULL,
    `recordedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `carryover_loan_records` (
    `id` VARCHAR(36) NOT NULL,
    `originalLoanId` VARCHAR(36) NOT NULL,
    `newFiscalYearId` VARCHAR(36) NOT NULL,
    `carryoverAmount` DECIMAL(15, 2) NOT NULL,
    `reason` TEXT NULL,
    `approvedById` VARCHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `carryover_loan_records_originalLoanId_key`(`originalLoanId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rescue_fund_ledgers` (
    `id` VARCHAR(36) NOT NULL,
    `fiscalYearId` VARCHAR(36) NOT NULL,
    `totalBalance` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `targetPerMember` DECIMAL(15, 2) NOT NULL DEFAULT 50000,
    `minimumPerMember` DECIMAL(15, 2) NOT NULL DEFAULT 25000,
    `memberCount` INTEGER NOT NULL,

    UNIQUE INDEX `rescue_fund_ledgers_fiscalYearId_key`(`fiscalYearId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rescue_fund_events` (
    `id` VARCHAR(36) NOT NULL,
    `ledgerId` VARCHAR(36) NOT NULL,
    `beneficiaryId` VARCHAR(36) NOT NULL,
    `eventType` ENUM('MEMBER_DEATH', 'RELATIVE_DEATH', 'MARRIAGE', 'BIRTH', 'ILLNESS', 'PROMOTION') NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `authorizedById` VARCHAR(36) NOT NULL,
    `eventDate` DATE NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rescue_fund_positions` (
    `id` VARCHAR(36) NOT NULL,
    `membershipId` VARCHAR(36) NOT NULL,
    `ledgerId` VARCHAR(36) NOT NULL,
    `paidAmount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `balance` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `refillDebt` DECIMAL(15, 2) NOT NULL DEFAULT 0,

    UNIQUE INDEX `rescue_fund_positions_membershipId_key`(`membershipId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `beneficiary_schedules` (
    `id` VARCHAR(36) NOT NULL,
    `fiscalYearId` VARCHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `beneficiary_schedules_fiscalYearId_key`(`fiscalYearId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `beneficiary_slots` (
    `id` VARCHAR(36) NOT NULL,
    `scheduleId` VARCHAR(36) NOT NULL,
    `sessionId` VARCHAR(36) NOT NULL,
    `month` INTEGER NOT NULL,
    `slotIndex` INTEGER NOT NULL,
    `membershipId` VARCHAR(36) NULL,
    `amountDelivered` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `designatedById` VARCHAR(36) NULL,
    `designatedAt` DATETIME(3) NULL,
    `status` ENUM('UNASSIGNED', 'ASSIGNED', 'DELIVERED') NOT NULL DEFAULT 'UNASSIGNED',
    `deliveredAt` DATETIME(3) NULL,
    `notes` TEXT NULL,

    UNIQUE INDEX `beneficiary_slots_sessionId_slotIndex_key`(`sessionId`, `slotIndex`),
    UNIQUE INDEX `beneficiary_slots_sessionId_membershipId_key`(`sessionId`, `membershipId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cassation_records` (
    `id` VARCHAR(36) NOT NULL,
    `fiscalYearId` VARCHAR(36) NOT NULL,
    `executedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `executedById` VARCHAR(36) NOT NULL,
    `totalSavingsReturned` DECIMAL(15, 2) NOT NULL,
    `totalInterestReturned` DECIMAL(15, 2) NOT NULL,
    `totalDistributed` DECIMAL(15, 2) NOT NULL,
    `memberCount` INTEGER NOT NULL,
    `notes` TEXT NULL,

    UNIQUE INDEX `cassation_records_fiscalYearId_key`(`fiscalYearId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cassation_redistributions` (
    `id` VARCHAR(36) NOT NULL,
    `cassationId` VARCHAR(36) NOT NULL,
    `membershipId` VARCHAR(36) NOT NULL,
    `savingsAmount` DECIMAL(15, 2) NOT NULL,
    `interestAmount` DECIMAL(15, 2) NOT NULL,
    `totalReturned` DECIMAL(15, 2) NOT NULL,

    UNIQUE INDEX `cassation_redistributions_cassationId_membershipId_key`(`cassationId`, `membershipId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pool_participant_cassation_shares` (
    `id` VARCHAR(36) NOT NULL,
    `cassationId` VARCHAR(36) NOT NULL,
    `participantId` VARCHAR(36) NOT NULL,
    `participantType` ENUM('RESCUE_FUND', 'BUREAU') NOT NULL,
    `principalAmount` DECIMAL(15, 2) NOT NULL,
    `interestEarned` DECIMAL(15, 2) NOT NULL,
    `totalDistributed` DECIMAL(15, 2) NOT NULL,

    UNIQUE INDEX `pool_participant_cassation_shares_cassationId_participantTyp_key`(`cassationId`, `participantType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fiscal_year_configs` ADD CONSTRAINT `fiscal_year_configs_fiscalYearId_fkey` FOREIGN KEY (`fiscalYearId`) REFERENCES `fiscal_years`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `member_profiles` ADD CONSTRAINT `member_profiles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `member_profiles` ADD CONSTRAINT `member_profiles_sponsorId_fkey` FOREIGN KEY (`sponsorId`) REFERENCES `member_profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `emergency_contacts` ADD CONSTRAINT `emergency_contacts_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `member_profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `memberships` ADD CONSTRAINT `memberships_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `member_profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `memberships` ADD CONSTRAINT `memberships_fiscalYearId_fkey` FOREIGN KEY (`fiscalYearId`) REFERENCES `fiscal_years`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `share_commitments` ADD CONSTRAINT `share_commitments_membershipId_fkey` FOREIGN KEY (`membershipId`) REFERENCES `memberships`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `monthly_sessions` ADD CONSTRAINT `monthly_sessions_fiscalYearId_fkey` FOREIGN KEY (`fiscalYearId`) REFERENCES `fiscal_years`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_entries` ADD CONSTRAINT `session_entries_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `monthly_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_entries` ADD CONSTRAINT `session_entries_membershipId_fkey` FOREIGN KEY (`membershipId`) REFERENCES `memberships`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_entries` ADD CONSTRAINT `session_entries_loanId_fkey` FOREIGN KEY (`loanId`) REFERENCES `loan_accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `savings_ledgers` ADD CONSTRAINT `savings_ledgers_membershipId_fkey` FOREIGN KEY (`membershipId`) REFERENCES `memberships`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `savings_entries` ADD CONSTRAINT `savings_entries_ledgerId_fkey` FOREIGN KEY (`ledgerId`) REFERENCES `savings_ledgers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `savings_entries` ADD CONSTRAINT `savings_entries_sessionEntryId_fkey` FOREIGN KEY (`sessionEntryId`) REFERENCES `session_entries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pool_participants` ADD CONSTRAINT `pool_participants_fiscalYearId_fkey` FOREIGN KEY (`fiscalYearId`) REFERENCES `fiscal_years`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interest_distribution_snapshots` ADD CONSTRAINT `interest_distribution_snapshots_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `monthly_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interest_allocations` ADD CONSTRAINT `interest_allocations_snapshotId_fkey` FOREIGN KEY (`snapshotId`) REFERENCES `interest_distribution_snapshots`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interest_allocations` ADD CONSTRAINT `interest_allocations_membershipId_fkey` FOREIGN KEY (`membershipId`) REFERENCES `memberships`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan_accounts` ADD CONSTRAINT `loan_accounts_membershipId_fkey` FOREIGN KEY (`membershipId`) REFERENCES `memberships`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan_accounts` ADD CONSTRAINT `loan_accounts_fiscalYearId_fkey` FOREIGN KEY (`fiscalYearId`) REFERENCES `fiscal_years`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `monthly_loan_accruals` ADD CONSTRAINT `monthly_loan_accruals_loanId_fkey` FOREIGN KEY (`loanId`) REFERENCES `loan_accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `monthly_loan_accruals` ADD CONSTRAINT `monthly_loan_accruals_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `monthly_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan_repayments` ADD CONSTRAINT `loan_repayments_loanId_fkey` FOREIGN KEY (`loanId`) REFERENCES `loan_accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `carryover_loan_records` ADD CONSTRAINT `carryover_loan_records_originalLoanId_fkey` FOREIGN KEY (`originalLoanId`) REFERENCES `loan_accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rescue_fund_ledgers` ADD CONSTRAINT `rescue_fund_ledgers_fiscalYearId_fkey` FOREIGN KEY (`fiscalYearId`) REFERENCES `fiscal_years`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rescue_fund_events` ADD CONSTRAINT `rescue_fund_events_ledgerId_fkey` FOREIGN KEY (`ledgerId`) REFERENCES `rescue_fund_ledgers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rescue_fund_positions` ADD CONSTRAINT `rescue_fund_positions_membershipId_fkey` FOREIGN KEY (`membershipId`) REFERENCES `memberships`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rescue_fund_positions` ADD CONSTRAINT `rescue_fund_positions_ledgerId_fkey` FOREIGN KEY (`ledgerId`) REFERENCES `rescue_fund_ledgers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `beneficiary_schedules` ADD CONSTRAINT `beneficiary_schedules_fiscalYearId_fkey` FOREIGN KEY (`fiscalYearId`) REFERENCES `fiscal_years`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `beneficiary_slots` ADD CONSTRAINT `beneficiary_slots_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `beneficiary_schedules`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `beneficiary_slots` ADD CONSTRAINT `beneficiary_slots_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `monthly_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `beneficiary_slots` ADD CONSTRAINT `beneficiary_slots_membershipId_fkey` FOREIGN KEY (`membershipId`) REFERENCES `memberships`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cassation_records` ADD CONSTRAINT `cassation_records_fiscalYearId_fkey` FOREIGN KEY (`fiscalYearId`) REFERENCES `fiscal_years`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cassation_redistributions` ADD CONSTRAINT `cassation_redistributions_cassationId_fkey` FOREIGN KEY (`cassationId`) REFERENCES `cassation_records`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pool_participant_cassation_shares` ADD CONSTRAINT `pool_participant_cassation_shares_cassationId_fkey` FOREIGN KEY (`cassationId`) REFERENCES `cassation_records`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pool_participant_cassation_shares` ADD CONSTRAINT `pool_participant_cassation_shares_participantId_fkey` FOREIGN KEY (`participantId`) REFERENCES `pool_participants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
