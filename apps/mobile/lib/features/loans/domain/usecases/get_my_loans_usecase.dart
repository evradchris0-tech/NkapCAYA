import '../entities/loan_entity.dart';
import '../repositories/loans_repository.dart';

class GetLoansUseCase {
  final LoansRepository _repository;

  const GetLoansUseCase(this._repository);

  Future<List<LoanEntity>> call(String membershipId) {
    return _repository.getLoans(membershipId);
  }
}
