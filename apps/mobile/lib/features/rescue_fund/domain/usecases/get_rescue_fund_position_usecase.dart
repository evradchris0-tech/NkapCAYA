import '../entities/rescue_fund_entity.dart';
import '../repositories/rescue_fund_repository.dart';

class GetRescueFundPositionUseCase {
  final RescueFundRepository _repository;
  const GetRescueFundPositionUseCase(this._repository);

  Future<RescueFundPositionEntity> call(String membershipId) =>
      _repository.getPosition(membershipId);
}
