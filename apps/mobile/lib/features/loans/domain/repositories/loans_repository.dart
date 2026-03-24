import '../entities/loan_entity.dart';

abstract class LoansRepository {
  Future<List<LoanEntity>> getLoans(String membershipId);
}
