import '../../domain/entities/loan_entity.dart';
import '../../domain/repositories/loans_repository.dart';
import '../datasources/loans_remote_datasource.dart';

class LoansRepositoryImpl implements LoansRepository {
  final LoansRemoteDataSource _remoteDataSource;

  const LoansRepositoryImpl(this._remoteDataSource);

  @override
  Future<List<LoanEntity>> getMyLoans() {
    return _remoteDataSource.getMyLoans();
  }

  @override
  Future<LoanEntity> getLoanById(String id) {
    return _remoteDataSource.getLoanById(id);
  }
}
