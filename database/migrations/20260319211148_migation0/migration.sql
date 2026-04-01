-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(36) NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'TRESORIER', 'TRESORIER_ADJOINT', 'SECRETAIRE_GENERAL', 'SECRETAIRE_ADJOINT', 'COMMISSAIRE_AUX_COMPTES', 'MEMBRE') NOT NULL DEFAULT 'MEMBRE',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `last_login_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_phone_key`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `user_agent` VARCHAR(500) NULL,

    UNIQUE INDEX `refresh_tokens_token_hash_key`(`token_hash`),
    INDEX `refresh_tokens_user_id_revoked_at_idx`(`user_id`, `revoked_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(36) NOT NULL,
    `actor_id` VARCHAR(36) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` VARCHAR(36) NOT NULL,
    `before_data` JSON NULL,
    `after_data` JSON NULL,
    `reason` TEXT NULL,
    `ip_address` VARCHAR(45) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_year` INTEGER NULL,
    `deleted_at` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    INDEX `audit_logs_entity_type_entity_id_idx`(`entity_type`, `entity_id`),
    INDEX `audit_logs_actor_id_idx`(`actor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tontine_config` (
    `id` VARCHAR(10) NOT NULL DEFAULT 'caya',
    `name` VARCHAR(255) NOT NULL,
    `acronym` VARCHAR(20) NOT NULL,
    `founded_year` INTEGER NOT NULL,
    `motto` VARCHAR(500) NULL,
    `headquarters_city` VARCHAR(255) NULL,
    `registration_number` VARCHAR(100) NULL,
    `share_unit_amount` DECIMAL(15, 2) NOT NULL DEFAULT 100000,
    `half_share_amount` DECIMAL(15, 2) NOT NULL DEFAULT 50000,
    `pot_monthly_amount` DECIMAL(15, 2) NOT NULL DEFAULT 3000,
    `max_shares_per_member` INTEGER NOT NULL DEFAULT 10,
    `mandatory_initial_savings` DECIMAL(15, 2) NOT NULL DEFAULT 100000,
    `loan_monthly_rate` DECIMAL(5, 4) NOT NULL DEFAULT 0.04,
    `min_loan_amount` DECIMAL(15, 2) NOT NULL DEFAULT 10000,
    `max_loan_amount` DECIMAL(15, 2) NOT NULL DEFAULT 1000000,
    `max_loan_multiplier` INTEGER NOT NULL DEFAULT 5,
    `min_savings_to_loan` DECIMAL(15, 2) NOT NULL DEFAULT 100000,
    `max_concurrent_loans` INTEGER NOT NULL DEFAULT 2,
    `rescue_fund_target` DECIMAL(15, 2) NOT NULL DEFAULT 50000,
    `rescue_fund_min_balance` DECIMAL(15, 2) NOT NULL DEFAULT 25000,
    `registration_fee_new` DECIMAL(15, 2) NOT NULL,
    `registration_fee_returning` DECIMAL(15, 2) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `updated_by_id` VARCHAR(36) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fiscal_year_configs` (
    `id` VARCHAR(36) NOT NULL,
    `fiscal_year_id` VARCHAR(36) NOT NULL,
    `snapshot_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `snapshot_by_id` VARCHAR(36) NOT NULL,
    `share_unit_amount` DECIMAL(15, 2) NOT NULL,
    `loan_monthly_rate` DECIMAL(5, 4) NOT NULL,
    `max_loan_multiplier` INTEGER NOT NULL,
    `min_savings_to_loan` DECIMAL(15, 2) NOT NULL,
    `max_concurrent_loans` INTEGER NOT NULL,
    `rescue_fund_target` DECIMAL(15, 2) NOT NULL,
    `rescue_fund_min_balance` DECIMAL(15, 2) NOT NULL,
    `registration_fee_new` DECIMAL(15, 2) NOT NULL,
    `registration_fee_returning` DECIMAL(15, 2) NOT NULL,
    `interest_pool_method` ENUM('THEORETICAL', 'ACTUAL') NOT NULL DEFAULT 'THEORETICAL',
    `forced_modified_at` DATETIME(3) NULL,
    `forced_modified_by_id` VARCHAR(36) NULL,
    `forced_modified_reason` TEXT NULL,
    `deleted_at` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `fiscal_year_configs_fiscal_year_id_key`(`fiscal_year_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rescue_event_amounts` (
    `event_type` ENUM('MEMBER_DEATH', 'RELATIVE_DEATH', 'MARRIAGE', 'BIRTH', 'ILLNESS', 'PROMOTION') NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `label` VARCHAR(255) NOT NULL,
    `updated_by_id` VARCHAR(36) NOT NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`event_type`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `member_profiles` (
    `id` VARCHAR(36) NOT NULL,
    `member_code` VARCHAR(10) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `phone1` VARCHAR(20) NOT NULL,
    `phone2` VARCHAR(20) NULL,
    `attachment_photo` LONGBLOB NULL,
    `neighborhood` VARCHAR(255) NOT NULL,
    `location_detail` TEXT NULL,
    `mobile_money_type` VARCHAR(50) NULL,
    `mobile_money_number` VARCHAR(20) NULL,
    `sponsor_id` VARCHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `member_profiles_member_code_key`(`member_code`),
    UNIQUE INDEX `member_profiles_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `emergency_contacts` (
    `id` VARCHAR(36) NOT NULL,
    `profile_id` VARCHAR(36) NOT NULL,
    `full_name` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `relation` VARCHAR(100) NULL,
    `deleted_at` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fiscal_years` (
    `id` VARCHAR(36) NOT NULL,
    `label` VARCHAR(20) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `cassation_date` DATE NOT NULL,
    `loan_due_date` DATE NOT NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'CASSATION', 'CLOSED', 'ARCHIVED') NOT NULL DEFAULT 'PENDING',
    `opened_at` DATETIME(3) NULL,
    `opened_by_id` VARCHAR(36) NULL,
    `closed_at` DATETIME(3) NULL,
    `closed_by_id` VARCHAR(36) NULL,
    `notes` TEXT NULL,
    `deleted_at` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `fiscal_years_label_key`(`label`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `memberships` (
    `id` VARCHAR(36) NOT NULL,
    `profile_id` VARCHAR(36) NOT NULL,
    `fiscal_year_id` VARCHAR(36) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXCLUDED') NOT NULL DEFAULT 'ACTIVE',
    `joined_at` DATE NOT NULL,
    `joined_at_month` INTEGER NOT NULL,
    `enrollment_type` ENUM('NEW', 'RETURNING', 'MID_YEAR') NOT NULL,
    `catch_up_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `catch_up_paid` BOOLEAN NOT NULL DEFAULT false,
    `registration_fee_paid` BOOLEAN NOT NULL DEFAULT false,
    `rescue_contrib_paid` BOOLEAN NOT NULL DEFAULT false,
    `initial_savings_paid` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `memberships_profile_id_fiscal_year_id_key`(`profile_id`, `fiscal_year_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `share_commitments` (
    `id` VARCHAR(36) NOT NULL,
    `membership_id` VARCHAR(36) NOT NULL,
    `shares_count` DECIMAL(4, 2) NOT NULL,
    `monthly_amount` DECIMAL(15, 2) NOT NULL,
    `is_locked` BOOLEAN NOT NULL DEFAULT false,
    `locked_at` DATETIME(3) NULL,
    `locked_by_id` VARCHAR(36) NULL,
    `deleted_at` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `share_commitments_membership_id_key`(`membership_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transaction_sequences` (
    `fiscal_year_id` VARCHAR(36) NOT NULL,
    `session_number` INTEGER NOT NULL,
    `tx_type` VARCHAR(20) NOT NULL,
    `last_sequence` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`fiscal_year_id`, `session_number`, `tx_type`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `monthly_sessions` (
    `id` VARCHAR(36) NOT NULL,
    `fiscal_year_id` VARCHAR(36) NOT NULL,
    `session_number` INTEGER NOT NULL,
    `meeting_date` DATE NOT NULL,
    `location` VARCHAR(500) NULL,
    `host_membership_id` VARCHAR(36) NULL,
    `status` ENUM('DRAFT', 'OPEN', 'REVIEWING', 'CLOSED') NOT NULL DEFAULT 'DRAFT',
    `opened_at` DATETIME(3) NULL,
    `opened_by_id` VARCHAR(36) NULL,
    `closed_at` DATETIME(3) NULL,
    `closed_by_id` VARCHAR(36) NULL,
    `total_inscription` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_secours` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_cotisation` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_pot` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_rbt_principal` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_rbt_interest` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_epargne` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_projet` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_autres` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `deleted_at` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `monthly_sessions_fiscal_year_id_session_number_key`(`fiscal_year_id`, `session_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session_entries` (
    `id` VARCHAR(36) NOT NULL,
    `reference` VARCHAR(30) NOT NULL,
    `session_id` VARCHAR(36) NULL,
    `membership_id` VARCHAR(36) NOT NULL,
    `type` ENUM('INSCRIPTION', 'SECOURS', 'COTISATION', 'POT', 'RBT_PRINCIPAL', 'RBT_INTEREST', 'EPARGNE', 'PROJET', 'AUTRES') NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `loan_id` VARCHAR(36) NULL,
    `is_out_of_session` BOOLEAN NOT NULL DEFAULT false,
    `out_of_session_at` DATETIME(3) NULL,
    `out_of_session_ref` VARCHAR(100) NULL,
    `is_imported` BOOLEAN NOT NULL DEFAULT false,
    `notes` TEXT NULL,
    `recorded_by_id` VARCHAR(36) NOT NULL,
    `recorded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `session_entries_reference_key`(`reference`),
    INDEX `session_entries_membership_id_type_idx`(`membership_id`, `type`),
    INDEX `session_entries_session_id_idx`(`session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `savings_ledgers` (
    `id` VARCHAR(36) NOT NULL,
    `membership_id` VARCHAR(36) NOT NULL,
    `balance` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `principal_balance` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_interest_received` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `last_updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `savings_ledgers_membership_id_key`(`membership_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `savings_entries` (
    `id` VARCHAR(36) NOT NULL,
    `ledger_id` VARCHAR(36) NOT NULL,
    `session_id` VARCHAR(36) NULL,
    `session_entry_id` VARCHAR(36) NULL,
    `month` INTEGER NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `type` ENUM('DEPOSIT', 'INTEREST_CREDIT') NOT NULL,
    `balance_after` DECIMAL(15, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `savings_entries_session_entry_id_key`(`session_entry_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pool_participants` (
    `id` VARCHAR(36) NOT NULL,
    `fiscal_year_id` VARCHAR(36) NOT NULL,
    `type` ENUM('RESCUE_FUND', 'BUREAU') NOT NULL,
    `label` VARCHAR(100) NOT NULL,
    `initial_balance` DECIMAL(15, 2) NOT NULL,
    `current_balance` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_interest_received` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `deleted_at` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `pool_participants_fiscal_year_id_type_key`(`fiscal_year_id`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `interest_distribution_snapshots` (
    `id` VARCHAR(36) NOT NULL,
    `session_id` VARCHAR(36) NOT NULL,
    `total_interest_pool` DECIMAL(15, 2) NOT NULL,
    `total_savings_base` DECIMAL(15, 2) NOT NULL,
    `distributed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `executed_by_id` VARCHAR(36) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `interest_distribution_snapshots_session_id_key`(`session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `interest_allocations` (
    `id` VARCHAR(36) NOT NULL,
    `snapshot_id` VARCHAR(36) NOT NULL,
    `membership_id` VARCHAR(36) NOT NULL,
    `savings_balance` DECIMAL(15, 2) NOT NULL,
    `allocation_amount` DECIMAL(15, 2) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `interest_allocations_snapshot_id_membership_id_key`(`snapshot_id`, `membership_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loan_accounts` (
    `id` VARCHAR(36) NOT NULL,
    `membership_id` VARCHAR(36) NOT NULL,
    `fiscal_year_id` VARCHAR(36) NOT NULL,
    `principal_amount` DECIMAL(15, 2) NOT NULL,
    `monthly_rate` DECIMAL(5, 4) NOT NULL DEFAULT 0.04,
    `disbursed_at` DATE NULL,
    `disbursed_by_id` VARCHAR(36) NULL,
    `due_before_date` DATE NOT NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'PARTIALLY_REPAID', 'CLOSED') NOT NULL DEFAULT 'PENDING',
    `outstanding_balance` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_interest_accrued` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_repaid` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `requested_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `request_notes` TEXT NULL,
    `deleted_at` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    INDEX `loan_accounts_membership_id_status_idx`(`membership_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `monthly_loan_accruals` (
    `id` VARCHAR(36) NOT NULL,
    `loan_id` VARCHAR(36) NOT NULL,
    `session_id` VARCHAR(36) NOT NULL,
    `month` INTEGER NOT NULL,
    `balance_at_month_start` DECIMAL(15, 2) NOT NULL,
    `interest_accrued` DECIMAL(15, 2) NOT NULL,
    `balance_with_interest` DECIMAL(15, 2) NOT NULL,
    `repayment_received` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `balance_at_month_end` DECIMAL(15, 2) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    INDEX `monthly_loan_accruals_session_id_idx`(`session_id`),
    UNIQUE INDEX `monthly_loan_accruals_loan_id_session_id_key`(`loan_id`, `session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `loan_repayments` (
    `id` VARCHAR(36) NOT NULL,
    `loan_id` VARCHAR(36) NOT NULL,
    `session_id` VARCHAR(36) NOT NULL,
    `session_entry_id` VARCHAR(36) NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `principal_part` DECIMAL(15, 2) NOT NULL,
    `interest_part` DECIMAL(15, 2) NOT NULL,
    `balance_after` DECIMAL(15, 2) NOT NULL,
    `recorded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `loan_repayments_session_entry_id_key`(`session_entry_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `carryover_loan_records` (
    `id` VARCHAR(36) NOT NULL,
    `original_loan_id` VARCHAR(36) NOT NULL,
    `new_fiscal_year_id` VARCHAR(36) NOT NULL,
    `carryover_amount` DECIMAL(15, 2) NOT NULL,
    `reason` TEXT NULL,
    `approved_by_id` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `carryover_loan_records_original_loan_id_key`(`original_loan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rescue_fund_ledgers` (
    `id` VARCHAR(36) NOT NULL,
    `fiscal_year_id` VARCHAR(36) NOT NULL,
    `total_balance` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `target_per_member` DECIMAL(15, 2) NOT NULL DEFAULT 50000,
    `minimum_per_member` DECIMAL(15, 2) NOT NULL DEFAULT 25000,
    `member_count` INTEGER NOT NULL,
    `target_total` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `deleted_at` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `rescue_fund_ledgers_fiscal_year_id_key`(`fiscal_year_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rescue_fund_events` (
    `id` VARCHAR(36) NOT NULL,
    `ledger_id` VARCHAR(36) NOT NULL,
    `beneficiary_id` VARCHAR(36) NOT NULL,
    `event_type` ENUM('MEMBER_DEATH', 'RELATIVE_DEATH', 'MARRIAGE', 'BIRTH', 'ILLNESS', 'PROMOTION') NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `authorized_by_id` VARCHAR(36) NOT NULL,
    `event_date` DATE NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rescue_fund_positions` (
    `id` VARCHAR(36) NOT NULL,
    `membership_id` VARCHAR(36) NOT NULL,
    `ledger_id` VARCHAR(36) NOT NULL,
    `paid_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `balance` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `refill_debt` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `last_updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `rescue_fund_positions_membership_id_key`(`membership_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `beneficiary_schedules` (
    `id` VARCHAR(36) NOT NULL,
    `fiscal_year_id` VARCHAR(36) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `beneficiary_schedules_fiscal_year_id_key`(`fiscal_year_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `beneficiary_slots` (
    `id` VARCHAR(36) NOT NULL,
    `schedule_id` VARCHAR(36) NOT NULL,
    `session_id` VARCHAR(36) NOT NULL,
    `month` INTEGER NOT NULL,
    `slot_index` INTEGER NOT NULL,
    `membership_id` VARCHAR(36) NULL,
    `amount_delivered` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `designated_by_id` VARCHAR(36) NULL,
    `designated_at` DATETIME(3) NULL,
    `status` ENUM('UNASSIGNED', 'ASSIGNED', 'DELIVERED') NOT NULL DEFAULT 'UNASSIGNED',
    `delivered_at` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `deleted_at` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `beneficiary_slots_session_id_slot_index_key`(`session_id`, `slot_index`),
    UNIQUE INDEX `beneficiary_slots_session_id_membership_id_key`(`session_id`, `membership_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cassation_records` (
    `id` VARCHAR(36) NOT NULL,
    `fiscal_year_id` VARCHAR(36) NOT NULL,
    `executed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `executed_by_id` VARCHAR(36) NOT NULL,
    `total_savings_returned` DECIMAL(15, 2) NOT NULL,
    `total_interest_returned` DECIMAL(15, 2) NOT NULL,
    `total_distributed` DECIMAL(15, 2) NOT NULL,
    `member_count` INTEGER NOT NULL,
    `carryover_count` INTEGER NOT NULL DEFAULT 0,
    `notes` TEXT NULL,
    `deleted_at` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `cassation_records_fiscal_year_id_key`(`fiscal_year_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cassation_redistributions` (
    `id` VARCHAR(36) NOT NULL,
    `cassation_id` VARCHAR(36) NOT NULL,
    `membership_id` VARCHAR(36) NOT NULL,
    `savings_amount` DECIMAL(15, 2) NOT NULL,
    `interest_amount` DECIMAL(15, 2) NOT NULL,
    `total_returned` DECIMAL(15, 2) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `cassation_redistributions_cassation_id_membership_id_key`(`cassation_id`, `membership_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pool_participant_cassation_shares` (
    `id` VARCHAR(36) NOT NULL,
    `cassation_id` VARCHAR(36) NOT NULL,
    `participant_id` VARCHAR(36) NOT NULL,
    `participant_type` ENUM('RESCUE_FUND', 'BUREAU') NOT NULL,
    `principal_amount` DECIMAL(15, 2) NOT NULL,
    `interest_earned` DECIMAL(15, 2) NOT NULL,
    `total_distributed` DECIMAL(15, 2) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `version` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `pool_participant_cassation_shares_cassation_id_participant_t_key`(`cassation_id`, `participant_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tontine_config` ADD CONSTRAINT `tontine_config_updated_by_id_fkey` FOREIGN KEY (`updated_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fiscal_year_configs` ADD CONSTRAINT `fiscal_year_configs_fiscal_year_id_fkey` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_years`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fiscal_year_configs` ADD CONSTRAINT `fiscal_year_configs_snapshot_by_id_fkey` FOREIGN KEY (`snapshot_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fiscal_year_configs` ADD CONSTRAINT `fiscal_year_configs_forced_modified_by_id_fkey` FOREIGN KEY (`forced_modified_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rescue_event_amounts` ADD CONSTRAINT `rescue_event_amounts_updated_by_id_fkey` FOREIGN KEY (`updated_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `member_profiles` ADD CONSTRAINT `member_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `member_profiles` ADD CONSTRAINT `member_profiles_sponsor_id_fkey` FOREIGN KEY (`sponsor_id`) REFERENCES `member_profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `emergency_contacts` ADD CONSTRAINT `emergency_contacts_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `member_profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fiscal_years` ADD CONSTRAINT `fiscal_years_opened_by_id_fkey` FOREIGN KEY (`opened_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fiscal_years` ADD CONSTRAINT `fiscal_years_closed_by_id_fkey` FOREIGN KEY (`closed_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `memberships` ADD CONSTRAINT `memberships_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `member_profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `memberships` ADD CONSTRAINT `memberships_fiscal_year_id_fkey` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_years`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `share_commitments` ADD CONSTRAINT `share_commitments_locked_by_id_fkey` FOREIGN KEY (`locked_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `share_commitments` ADD CONSTRAINT `share_commitments_membership_id_fkey` FOREIGN KEY (`membership_id`) REFERENCES `memberships`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `monthly_sessions` ADD CONSTRAINT `monthly_sessions_fiscal_year_id_fkey` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_years`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `monthly_sessions` ADD CONSTRAINT `monthly_sessions_host_membership_id_fkey` FOREIGN KEY (`host_membership_id`) REFERENCES `member_profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `monthly_sessions` ADD CONSTRAINT `monthly_sessions_opened_by_id_fkey` FOREIGN KEY (`opened_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `monthly_sessions` ADD CONSTRAINT `monthly_sessions_closed_by_id_fkey` FOREIGN KEY (`closed_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_entries` ADD CONSTRAINT `session_entries_recorded_by_id_fkey` FOREIGN KEY (`recorded_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_entries` ADD CONSTRAINT `session_entries_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `monthly_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_entries` ADD CONSTRAINT `session_entries_membership_id_fkey` FOREIGN KEY (`membership_id`) REFERENCES `memberships`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_entries` ADD CONSTRAINT `session_entries_loan_id_fkey` FOREIGN KEY (`loan_id`) REFERENCES `loan_accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `savings_ledgers` ADD CONSTRAINT `savings_ledgers_membership_id_fkey` FOREIGN KEY (`membership_id`) REFERENCES `memberships`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `savings_entries` ADD CONSTRAINT `savings_entries_ledger_id_fkey` FOREIGN KEY (`ledger_id`) REFERENCES `savings_ledgers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `savings_entries` ADD CONSTRAINT `savings_entries_session_entry_id_fkey` FOREIGN KEY (`session_entry_id`) REFERENCES `session_entries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pool_participants` ADD CONSTRAINT `pool_participants_fiscal_year_id_fkey` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_years`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interest_distribution_snapshots` ADD CONSTRAINT `interest_distribution_snapshots_executed_by_id_fkey` FOREIGN KEY (`executed_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interest_distribution_snapshots` ADD CONSTRAINT `interest_distribution_snapshots_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `monthly_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interest_allocations` ADD CONSTRAINT `interest_allocations_snapshot_id_fkey` FOREIGN KEY (`snapshot_id`) REFERENCES `interest_distribution_snapshots`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `interest_allocations` ADD CONSTRAINT `interest_allocations_membership_id_fkey` FOREIGN KEY (`membership_id`) REFERENCES `memberships`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan_accounts` ADD CONSTRAINT `loan_accounts_disbursed_by_id_fkey` FOREIGN KEY (`disbursed_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan_accounts` ADD CONSTRAINT `loan_accounts_membership_id_fkey` FOREIGN KEY (`membership_id`) REFERENCES `memberships`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan_accounts` ADD CONSTRAINT `loan_accounts_fiscal_year_id_fkey` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_years`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `monthly_loan_accruals` ADD CONSTRAINT `monthly_loan_accruals_loan_id_fkey` FOREIGN KEY (`loan_id`) REFERENCES `loan_accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `monthly_loan_accruals` ADD CONSTRAINT `monthly_loan_accruals_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `monthly_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan_repayments` ADD CONSTRAINT `loan_repayments_loan_id_fkey` FOREIGN KEY (`loan_id`) REFERENCES `loan_accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loan_repayments` ADD CONSTRAINT `loan_repayments_session_entry_id_fkey` FOREIGN KEY (`session_entry_id`) REFERENCES `session_entries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `carryover_loan_records` ADD CONSTRAINT `carryover_loan_records_approved_by_id_fkey` FOREIGN KEY (`approved_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `carryover_loan_records` ADD CONSTRAINT `carryover_loan_records_original_loan_id_fkey` FOREIGN KEY (`original_loan_id`) REFERENCES `loan_accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `carryover_loan_records` ADD CONSTRAINT `carryover_loan_records_new_fiscal_year_id_fkey` FOREIGN KEY (`new_fiscal_year_id`) REFERENCES `fiscal_years`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rescue_fund_ledgers` ADD CONSTRAINT `rescue_fund_ledgers_fiscal_year_id_fkey` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_years`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rescue_fund_events` ADD CONSTRAINT `rescue_fund_events_authorized_by_id_fkey` FOREIGN KEY (`authorized_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rescue_fund_events` ADD CONSTRAINT `rescue_fund_events_ledger_id_fkey` FOREIGN KEY (`ledger_id`) REFERENCES `rescue_fund_ledgers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rescue_fund_positions` ADD CONSTRAINT `rescue_fund_positions_membership_id_fkey` FOREIGN KEY (`membership_id`) REFERENCES `memberships`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rescue_fund_positions` ADD CONSTRAINT `rescue_fund_positions_ledger_id_fkey` FOREIGN KEY (`ledger_id`) REFERENCES `rescue_fund_ledgers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `beneficiary_schedules` ADD CONSTRAINT `beneficiary_schedules_fiscal_year_id_fkey` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_years`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `beneficiary_slots` ADD CONSTRAINT `beneficiary_slots_designated_by_id_fkey` FOREIGN KEY (`designated_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `beneficiary_slots` ADD CONSTRAINT `beneficiary_slots_schedule_id_fkey` FOREIGN KEY (`schedule_id`) REFERENCES `beneficiary_schedules`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `beneficiary_slots` ADD CONSTRAINT `beneficiary_slots_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `monthly_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `beneficiary_slots` ADD CONSTRAINT `beneficiary_slots_membership_id_fkey` FOREIGN KEY (`membership_id`) REFERENCES `memberships`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cassation_records` ADD CONSTRAINT `cassation_records_executed_by_id_fkey` FOREIGN KEY (`executed_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cassation_records` ADD CONSTRAINT `cassation_records_fiscal_year_id_fkey` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_years`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cassation_redistributions` ADD CONSTRAINT `cassation_redistributions_cassation_id_fkey` FOREIGN KEY (`cassation_id`) REFERENCES `cassation_records`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cassation_redistributions` ADD CONSTRAINT `cassation_redistributions_membership_id_fkey` FOREIGN KEY (`membership_id`) REFERENCES `memberships`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pool_participant_cassation_shares` ADD CONSTRAINT `pool_participant_cassation_shares_cassation_id_fkey` FOREIGN KEY (`cassation_id`) REFERENCES `cassation_records`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pool_participant_cassation_shares` ADD CONSTRAINT `pool_participant_cassation_shares_participant_id_fkey` FOREIGN KEY (`participant_id`) REFERENCES `pool_participants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

