import '../../../../core/errors/exceptions.dart';
import '../../../../core/errors/failures.dart';
import '../../domain/entities/member_entity.dart';
import '../../domain/entities/membership_entity.dart';
import '../../domain/repositories/profile_repository.dart';
import '../datasources/profile_remote_datasource.dart';

class ProfileRepositoryImpl implements ProfileRepository {
  final ProfileRemoteDataSource _remoteDataSource;

  const ProfileRepositoryImpl(this._remoteDataSource);

  @override
  Future<MemberEntity> getMyProfile() async {
    try {
      return await _remoteDataSource.getMyProfile();
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

  @override
  Future<List<MembershipEntity>> getMemberships(String profileId) async {
    try {
      return await _remoteDataSource.getMemberships(profileId);
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
