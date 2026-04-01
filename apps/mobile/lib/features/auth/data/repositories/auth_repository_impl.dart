import '../../../../core/errors/exceptions.dart';
import '../../../../core/errors/failures.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_datasource.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _remoteDataSource;

  const AuthRepositoryImpl(this._remoteDataSource);

  @override
  Future<UserEntity> login({
    required String identifier,
    required String password,
  }) async {
    try {
      final result = await _remoteDataSource.login(
        identifier: identifier,
        password: password,
      );
      return result.user;
    } on NetworkException catch (e) {
      throw NetworkFailure(message: e.message);
    } on UnauthorizedException catch (e) {
      throw UnauthorizedFailure(message: e.message);
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
  Future<void> logout() async {
    try {
      await _remoteDataSource.logout();
    } catch (_) {
      // Logout silencieux — on efface les tokens côté client quoi qu'il arrive
    }
  }

  @override
  Future<UserEntity?> getCurrentUser() async {
    try {
      return await _remoteDataSource.fetchCurrentUser();
    } catch (_) {
      return null;
    }
  }

  @override
  Future<bool> isAuthenticated() async {
    final user = await getCurrentUser();
    return user != null;
  }
}
