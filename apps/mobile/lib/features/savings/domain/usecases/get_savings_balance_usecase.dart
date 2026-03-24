import '../entities/savings_entity.dart';
import '../repositories/savings_repository.dart';

class GetSavingsUseCase {
  final SavingsRepository _repository;

  const GetSavingsUseCase(this._repository);

  Future<SavingsEntity> call(String membershipId) {
    return _repository.getSavings(membershipId);
  }
}
