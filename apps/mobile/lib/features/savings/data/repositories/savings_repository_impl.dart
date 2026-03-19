import '../../domain/entities/savings_entity.dart';
import '../../domain/repositories/savings_repository.dart';
import '../datasources/savings_remote_datasource.dart';

class SavingsRepositoryImpl implements SavingsRepository {
  final SavingsRemoteDataSource _remoteDataSource;

  const SavingsRepositoryImpl(this._remoteDataSource);

  @override
  Future<SavingsEntity> getBalance() {
    return _remoteDataSource.getBalance();
  }

  @override
  Future<List<SavingsTransactionEntity>> getTransactions({
    int page = 1,
    int pageSize = 20,
  }) {
    return _remoteDataSource.getTransactions(page: page, pageSize: pageSize);
  }
}
