import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../../core/network/api_client.dart';
import '../../../../shared/providers/auth_provider.dart';
import '../../data/datasources/auth_remote_datasource.dart';
import '../../data/repositories/auth_repository_impl.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/usecases/login_usecase.dart';
import '../../domain/usecases/logout_usecase.dart';

// --- Infrastructure providers ---
final _storageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage();
});

final _apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(_storageProvider);
  return ApiClient(storage: storage);
});

final _authRemoteDataSourceProvider = Provider<AuthRemoteDataSource>((ref) {
  return AuthRemoteDataSourceImpl(
    apiClient: ref.watch(_apiClientProvider),
    storage: ref.watch(_storageProvider),
  );
});

final _authRepositoryProvider = Provider<AuthRepositoryImpl>((ref) {
  return AuthRepositoryImpl(ref.watch(_authRemoteDataSourceProvider));
});

// --- Use case providers ---
final _loginUseCaseProvider = Provider<LoginUseCase>((ref) {
  return LoginUseCase(ref.watch(_authRepositoryProvider));
});

final _logoutUseCaseProvider = Provider<LogoutUseCase>((ref) {
  return LogoutUseCase(ref.watch(_authRepositoryProvider));
});

// --- Auth notifier state ---
enum AuthStatus { idle, loading, success, failure }

class AuthNotifierState {
  final AuthStatus status;
  final UserEntity? user;
  final String? errorMessage;

  const AuthNotifierState({
    this.status = AuthStatus.idle,
    this.user,
    this.errorMessage,
  });

  AuthNotifierState copyWith({
    AuthStatus? status,
    UserEntity? user,
    String? errorMessage,
  }) {
    return AuthNotifierState(
      status: status ?? this.status,
      user: user ?? this.user,
      errorMessage: errorMessage,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthNotifierState> {
  final LoginUseCase _loginUseCase;
  final LogoutUseCase _logoutUseCase;
  final AuthStateNotifier _globalAuthState;

  AuthNotifier({
    required LoginUseCase loginUseCase,
    required LogoutUseCase logoutUseCase,
    required AuthStateNotifier globalAuthState,
  })  : _loginUseCase = loginUseCase,
        _logoutUseCase = logoutUseCase,
        _globalAuthState = globalAuthState,
        super(const AuthNotifierState());

  Future<void> login({
    required String identifier,
    required String password,
  }) async {
    state = state.copyWith(status: AuthStatus.loading, errorMessage: null);
    try {
      final user = await _loginUseCase(
        LoginParams(identifier: identifier, password: password),
      );
      _globalAuthState.setAuthenticated(userId: user.id, role: user.role);
      state = state.copyWith(status: AuthStatus.success, user: user);
    } catch (e) {
      state = state.copyWith(
        status: AuthStatus.failure,
        errorMessage: e.toString(),
      );
    }
  }

  Future<void> logout() async {
    await _logoutUseCase();
    _globalAuthState.setUnauthenticated();
    state = const AuthNotifierState();
  }
}

final authNotifierProvider =
    StateNotifierProvider<AuthNotifier, AuthNotifierState>((ref) {
  return AuthNotifier(
    loginUseCase: ref.watch(_loginUseCaseProvider),
    logoutUseCase: ref.watch(_logoutUseCaseProvider),
    globalAuthState: ref.watch(authStateProvider.notifier),
  );
});
