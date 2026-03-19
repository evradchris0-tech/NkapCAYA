import '../entities/savings_entity.dart';
import '../repositories/savings_repository.dart';

class GetSavingsBalanceUseCase {
  final SavingsRepository _repository;

  const GetSavingsBalanceUseCase(this._repository);

  Future<SavingsEntity> call() {
    return _repository.getBalance();
  }
}
