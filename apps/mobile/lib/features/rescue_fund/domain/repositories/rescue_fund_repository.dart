import '../entities/rescue_fund_entity.dart';

abstract class RescueFundRepository {
  Future<RescueFundLedgerEntity> getLedger();
  Future<RescueFundPositionEntity> getPosition(String membershipId);
}
