import '../../../../core/errors/exceptions.dart';
import '../../../../core/errors/failures.dart';
import '../../domain/entities/loan_entity.dart';
import '../../domain/repositories/loans_repository.dart';
import '../datasources/loans_remote_datasource.dart';

class LoansRepositoryImpl implements LoansRepository {
  final LoansRemoteDataSource _remoteDataSource;

  const LoansRepositoryImpl(this._remoteDataSource);

  @override
  Future<List<LoanEntity>> getLoans(String membershipId) async {
    try {
      return await _remoteDataSource.getLoans(membershipId);
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
