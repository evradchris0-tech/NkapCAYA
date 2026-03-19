import '../entities/user_entity.dart';
import '../repositories/auth_repository.dart';

class LoginParams {
  final String email;
  final String password;

  const LoginParams({required this.email, required this.password});
}

class LoginUseCase {
  final AuthRepository _repository;

  const LoginUseCase(this._repository);

  Future<UserEntity> call(LoginParams params) {
    return _repository.login(email: params.email, password: params.password);
  }
}
