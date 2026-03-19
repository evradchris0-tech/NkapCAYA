import '../entities/loan_entity.dart';

abstract class LoansRepository {
  Future<List<LoanEntity>> getMyLoans();
  Future<LoanEntity> getLoanById(String id);
}
