import '../entities/loan_entity.dart';
import '../repositories/loans_repository.dart';

class GetMyLoansUseCase {
  final LoansRepository _repository;

  const GetMyLoansUseCase(this._repository);

  Future<List<LoanEntity>> call() {
    return _repository.getMyLoans();
  }
}
