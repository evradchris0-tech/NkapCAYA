import '../../domain/entities/savings_entity.dart';
import '../../domain/repositories/savings_repository.dart';
import '../datasources/savings_remote_datasource.dart';

class SavingsRepositoryImpl implements SavingsRepository {
  final SavingsRemoteDataSource _remoteDataSource;

  const SavingsRepositoryImpl(this._remoteDataSource);

  @override
  Future<SavingsEntity> getSavings(String membershipId) {
    return _remoteDataSource.getSavings(membershipId);
  }
}
