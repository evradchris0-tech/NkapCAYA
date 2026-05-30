-- ════════════════════════════════════════════════════════════════════════
-- Purge des DONNÉES DE DÉMO (jeu seedé par database/seeds/index.ts)
-- À exécuter dans phpMyAdmin sur la base de PRODUCTION si des données de
-- démo y ont été semées par erreur. Idempotent (no-op si rien à supprimer).
--
-- ⚠️ Cible UNIQUEMENT le membre démo « marie.nkeng » (code CAYA-001) et
--    l'exercice démo libellé exactement « 2026 ». NE TOUCHE PAS au super-admin
--    ni à un exercice réel (ex. « 2025-2026 »).
-- ════════════════════════════════════════════════════════════════════════

SET @demo_profile := (SELECT id FROM member_profiles WHERE member_code = 'CAYA-001');
SET @demo_user    := (SELECT id FROM users WHERE username = 'marie.nkeng');
SET @demo_fy      := (SELECT id FROM fiscal_years WHERE label = '2026');

-- ── Enfants rattachés au membership démo ──────────────────────────────────
DELETE se FROM savings_entries se
  JOIN savings_ledgers sl ON sl.id = se.ledger_id
  JOIN memberships m ON m.id = sl.membership_id
  WHERE m.profile_id = @demo_profile;

DELETE sl FROM savings_ledgers sl
  JOIN memberships m ON m.id = sl.membership_id
  WHERE m.profile_id = @demo_profile;

DELETE lr FROM loan_repayments lr
  JOIN loan_accounts la ON la.id = lr.loan_id
  JOIN memberships m ON m.id = la.membership_id
  WHERE m.profile_id = @demo_profile;

DELETE mla FROM monthly_loan_accruals mla
  JOIN loan_accounts la ON la.id = mla.loan_id
  JOIN memberships m ON m.id = la.membership_id
  WHERE m.profile_id = @demo_profile;

DELETE la FROM loan_accounts la
  JOIN memberships m ON m.id = la.membership_id
  WHERE m.profile_id = @demo_profile;

DELETE rfp FROM rescue_fund_positions rfp
  JOIN memberships m ON m.id = rfp.membership_id
  WHERE m.profile_id = @demo_profile;

DELETE sc FROM share_commitments sc
  JOIN memberships m ON m.id = sc.membership_id
  WHERE m.profile_id = @demo_profile;

DELETE FROM memberships WHERE profile_id = @demo_profile;

-- ── Objets rattachés à l'exercice démo « 2026 » ──────────────────────────
DELETE FROM rescue_fund_ledgers WHERE fiscal_year_id = @demo_fy;
DELETE FROM pool_participants    WHERE fiscal_year_id = @demo_fy;
DELETE bs FROM beneficiary_slots bs
  JOIN beneficiary_schedules sch ON sch.id = bs.schedule_id
  WHERE sch.fiscal_year_id = @demo_fy;
DELETE FROM beneficiary_schedules WHERE fiscal_year_id = @demo_fy;
DELETE FROM monthly_sessions      WHERE fiscal_year_id = @demo_fy;
DELETE FROM fiscal_year_configs   WHERE fiscal_year_id = @demo_fy;
DELETE FROM fiscal_years WHERE id = @demo_fy AND label = '2026';

-- ── Profil + compte démo (le super-admin est préservé) ───────────────────
DELETE FROM member_profiles WHERE id = @demo_profile;
DELETE FROM users WHERE id = @demo_user AND role = 'MEMBRE';
