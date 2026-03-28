import '../../../../core/errors/exceptions.dart';
import '../../../../core/errors/failures.dart';
import '../../domain/entities/rescue_fund_entity.dart';
import '../../domain/repositories/rescue_fund_repository.dart';
import '../datasources/rescue_fund_remote_datasource.dart';

class RescueFundRepositoryImpl implements RescueFundRepository {
  final RescueFundRemoteDataSource _remoteDataSource;

  const RescueFundRepositoryImpl(this._remoteDataSource);

  @override
  Future<RescueFundLedgerEntity> getLedger(String fyId) async {
    try {
      return await _remoteDataSource.getLedger(fyId);
    } on NetworkException catch (e) {
      throw NetworkFailure(message: e.message);
    } on UnauthorizedException catch (e) {
      throw UnauthorizedFailure(message: e.message);
    } on NotFoundException catch (e) {
      throw NotFoundFailure(message: e.message);
    } on ValidationException catch (e) {
      throw ValidationFailure(message: e.message, fieldErrors: e.fieldErrors);
    } on ServerException catch (e) {
      throw ServerFailure(message: e.message, statusCode: e.statusCode ?? 500);
    } catch (e) {
      throw UnknownFailure(message: e.toString());
    }
  }

  @override
  Future<RescueFundPositionEntity?> getPosition(
    String fyId,
    String membershipId,
  ) async {
    try {
      return await _remoteDataSource.getPosition(fyId, membershipId);
    } on NetworkException catch (e) {
      throw NetworkFailure(message: e.message);
    } on UnauthorizedException catch (e) {
      throw UnauthorizedFailure(message: e.message);
    } on NotFoundException catch (e) {
      throw NotFoundFailure(message: e.message);
    } on ValidationException catch (e) {
      throw ValidationFailure(message: e.message, fieldErrors: e.fieldErrors);
    } on ServerException catch (e) {
      throw ServerFailure(message: e.message, statusCode: e.statusCode ?? 500);
    } catch (e) {
      throw UnknownFailure(message: e.toString());
    }
  }
}
