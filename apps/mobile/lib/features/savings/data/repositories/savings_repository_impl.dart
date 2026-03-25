import '../../../../core/errors/exceptions.dart';
import '../../../../core/errors/failures.dart';
import '../../domain/entities/savings_entity.dart';
import '../../domain/repositories/savings_repository.dart';
import '../datasources/savings_remote_datasource.dart';

class SavingsRepositoryImpl implements SavingsRepository {
  final SavingsRemoteDataSource _remoteDataSource;

  const SavingsRepositoryImpl(this._remoteDataSource);

  @override
  Future<SavingsEntity> getSavings(String membershipId) async {
    try {
      return await _remoteDataSource.getSavings(membershipId);
    } on NetworkException catch (e) {
      throw NetworkFailure(message: e.message);
    } on UnauthorizedException catch (e) {
      throw UnauthorizedFailure(message: e.message);
    } on NotFoundException catch (e) {
      throw NotFoundFailure(message: e.message);
    } on ValidationException catch (e) {
      throw ValidationFailure(message: e.message, fieldErrors: e.fieldErrors);
    } on ServerException catch (e) {
      throw ServerFailure(
        message: e.message,
        statusCode: e.statusCode ?? 500,
      );
    } catch (e) {
      throw UnknownFailure(message: e.toString());
    }
  }
}
