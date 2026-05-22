-- Index composite pour SavingsEntry : agrégation par ledger + mois
CREATE INDEX `savings_entries_ledger_id_month_idx`
  ON `savings_entries` (`ledger_id`, `month`);

-- Index composite pour MonthlyLoanAccrual : findLatestAccrual par loanId + mois
CREATE INDEX `monthly_loan_accruals_loan_id_month_idx`
  ON `monthly_loan_accruals` (`loan_id`, `month`);

-- Index composite pour SessionEntry : distributeInterests filtre par sessionId + type
CREATE INDEX `session_entries_session_id_type_idx`
  ON `session_entries` (`session_id`, `type`);
