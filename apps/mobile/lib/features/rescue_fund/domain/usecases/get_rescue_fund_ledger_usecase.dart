import '../entities/rescue_fund_entity.dart';
import '../repositories/rescue_fund_repository.dart';

class GetRescueFundLedgerUseCase {
  final RescueFundRepository _repository;
  const GetRescueFundLedgerUseCase(this._repository);

  Future<RescueFundLedgerEntity> call(String fyId) => _repository.getLedger(fyId);
}
