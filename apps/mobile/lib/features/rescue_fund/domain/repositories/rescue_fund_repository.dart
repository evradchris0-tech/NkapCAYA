import '../entities/rescue_fund_entity.dart';

abstract class RescueFundRepository {
  Future<RescueFundLedgerEntity> getLedger(String fyId);
  /// Position individuelle — retourne null si l'endpoint n'est pas disponible.
  Future<RescueFundPositionEntity?> getPosition(String fyId, String membershipId);
}
