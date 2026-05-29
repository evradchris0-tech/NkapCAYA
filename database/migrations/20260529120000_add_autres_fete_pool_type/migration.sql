-- AlterEnum: add AUTRES_FETE to PoolParticipantType
-- Comptes spéciaux du modèle CAYABASE (feuille ep+int) : SECOURS / CAYA, BUREAU, AUTRES / FETE.
-- "AUTRES / FETE" devient un participant de pool dédié, au même titre que RESCUE_FUND et BUREAU.
ALTER TABLE `pool_participants`
  MODIFY `type` ENUM('RESCUE_FUND', 'BUREAU', 'AUTRES_FETE') NOT NULL;
