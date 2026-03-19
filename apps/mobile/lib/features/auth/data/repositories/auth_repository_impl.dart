import '../../domain/entities/user_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_datasource.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _remoteDataSource;

  const AuthRepositoryImpl(this._remoteDataSource);

  @override
  Future<UserEntity> login({required String email, required String password}) async {
    final result = await _remoteDataSource.login(email: email, password: password);
    return result.user;
  }

  @override
  Future<void> logout() async {
    await _remoteDataSource.logout();
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
