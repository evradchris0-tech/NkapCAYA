import '../../domain/entities/rescue_fund_entity.dart';
import '../../domain/repositories/rescue_fund_repository.dart';
import '../datasources/rescue_fund_remote_datasource.dart';

class RescueFundRepositoryImpl implements RescueFundRepository {
  final RescueFundRemoteDataSource _remoteDataSource;

  const RescueFundRepositoryImpl(this._remoteDataSource);

  @override
  Future<RescueFundLedgerEntity> getLedger() {
    return _remoteDataSource.getLedger();
  }

  @override
  Future<RescueFundPositionEntity> getPosition(String membershipId) {
    return _remoteDataSource.getPosition(membershipId);
  }
}
