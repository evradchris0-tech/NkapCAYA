import '../entities/savings_entity.dart';

abstract class SavingsRepository {
  Future<SavingsEntity> getBalance();
  Future<List<SavingsTransactionEntity>> getTransactions({int page = 1, int pageSize = 20});
}
