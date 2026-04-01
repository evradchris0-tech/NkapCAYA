import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/token_model.dart';
import '../models/user_model.dart';

abstract class AuthRemoteDataSource {
  Future<({TokenModel token, UserModel user})> login({
    required String identifier,
    required String password,
  });

  Future<void> logout();
  Future<UserModel> fetchCurrentUser();
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final ApiClient _apiClient;
  final FlutterSecureStorage _storage;

  const AuthRemoteDataSourceImpl({
    required ApiClient apiClient,
    required FlutterSecureStorage storage,
  })  : _apiClient = apiClient,
        _storage = storage;

  @override
  Future<({TokenModel token, UserModel user})> login({
    required String identifier,
    required String password,
  }) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      ApiConstants.login,
      data: {'identifier': identifier, 'password': password},
    );
    final data = response.data!;
    final token = TokenModel.fromJson(data['tokens'] as Map<String, dynamic>);
    final user = UserModel.fromJson(data['user'] as Map<String, dynamic>);

    await _storage.write(key: ApiConstants.accessTokenKey, value: token.access);
    await _storage.write(
      key: ApiConstants.refreshTokenKey,
      value: token.refresh,
    );

    return (token: token, user: user);
  }

  @override
  Future<void> logout() async {
    final refresh = await _storage.read(key: ApiConstants.refreshTokenKey);
    if (refresh != null) {
      await _apiClient.post<void>(
        ApiConstants.logout,
        data: {'refreshToken': refresh},
      );
    }
    await _storage.delete(key: ApiConstants.accessTokenKey);
    await _storage.delete(key: ApiConstants.refreshTokenKey);
  }

  @override
  Future<UserModel> fetchCurrentUser() async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      ApiConstants.authMe,
    );
    return UserModel.fromJson(response.data!);
  }
}
