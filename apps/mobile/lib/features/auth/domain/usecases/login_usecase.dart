import '../entities/user_entity.dart';
import '../repositories/auth_repository.dart';

class LoginParams {
  final String identifier;
  final String password;

  const LoginParams({required this.identifier, required this.password});
}

class LoginUseCase {
  final AuthRepository _repository;

  const LoginUseCase(this._repository);

  Future<UserEntity> call(LoginParams params) {
    return _repository.login(
      identifier: params.identifier,
      password: params.password,
    );
  }
}
