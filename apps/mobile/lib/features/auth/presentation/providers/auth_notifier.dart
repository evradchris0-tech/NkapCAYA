// AsyncLoading est défini dans notre async_result.dart ET dans flutter_riverpod.
// On masque la version Riverpod pour éviter l'ambiguïté — StateNotifier n'en a pas besoin.
import 'package:flutter_riverpod/flutter_riverpod.dart' hide AsyncLoading;
import '../../../../core/errors/failures.dart';
import '../../../../core/utils/async_result.dart';
import '../../../../shared/providers/api_providers.dart';
import '../../../../shared/providers/auth_provider.dart';
import '../../data/datasources/auth_remote_datasource.dart';
import '../../data/repositories/auth_repository_impl.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../domain/usecases/login_usecase.dart';
import '../../domain/usecases/logout_usecase.dart';

// ---------------------------------------------------------------------------
// Infrastructure providers (réutilisent les providers partagés)
// ---------------------------------------------------------------------------
final _authRemoteDataSourceProvider = Provider<AuthRemoteDataSource>((ref) {
  return AuthRemoteDataSourceImpl(
    apiClient: ref.watch(apiClientProvider),
    storage: ref.watch(secureStorageProvider),
  );
});

// Expose l'interface abstraite — respecte le DIP
final _authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepositoryImpl(ref.watch(_authRemoteDataSourceProvider));
});

final _loginUseCaseProvider = Provider<LoginUseCase>((ref) {
  return LoginUseCase(ref.watch(_authRepositoryProvider));
});

final _logoutUseCaseProvider = Provider<LogoutUseCase>((ref) {
  return LogoutUseCase(ref.watch(_authRepositoryProvider));
});

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
class AuthNotifierState {
  final AsyncResult<UserEntity> result;

  const AuthNotifierState({this.result = const AsyncIdle()});

  AuthNotifierState copyWith({AsyncResult<UserEntity>? result}) {
    return AuthNotifierState(result: result ?? this.result);
  }

  bool get isLoading => result is AsyncLoading<UserEntity>;
  UserEntity? get user => result is AsyncSuccess<UserEntity>
      ? (result as AsyncSuccess<UserEntity>).data
      : null;
}

// ---------------------------------------------------------------------------
// Notifier
// ---------------------------------------------------------------------------
class AuthNotifier extends StateNotifier<AuthNotifierState> {
  final LoginUseCase _loginUseCase;
  final LogoutUseCase _logoutUseCase;
  final AuthStateNotifier _globalAuthState;
  final AuthRepository _authRepository;

  AuthNotifier({
    required LoginUseCase loginUseCase,
    required LogoutUseCase logoutUseCase,
    required AuthStateNotifier globalAuthState,
    required AuthRepository authRepository,
  })  : _loginUseCase = loginUseCase,
        _logoutUseCase = logoutUseCase,
        _globalAuthState = globalAuthState,
        _authRepository = authRepository,
        super(const AuthNotifierState());

  Future<void> login({
    required String identifier,
    required String password,
  }) async {
    state = state.copyWith(result: const AsyncLoading());
    try {
      final user = await _loginUseCase(
        LoginParams(identifier: identifier, password: password),
      );
      _globalAuthState.setAuthenticated(userId: user.id, role: user.role);
      state = state.copyWith(result: AsyncSuccess(user));
    } on AppFailure catch (f) {
      state = state.copyWith(result: AsyncFailure(f));
    } catch (e) {
      state = state.copyWith(
        result: AsyncFailure(UnknownFailure(message: e.toString())),
      );
    }
  }

  /// Restaure la session depuis les tokens stockés (appelé au démarrage).
  /// Appelle GET /auth/me — si le token est expiré, le refresh interceptor
  /// tente automatiquement le renouvellement. En cas d'échec, retourne false.
  Future<bool> restoreSession() async {
    try {
      final user = await _authRepository.getCurrentUser();
      if (user == null) return false;
      _globalAuthState.setAuthenticated(userId: user.id, role: user.role);
      state = state.copyWith(result: AsyncSuccess(user));
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> logout() async {
    await _logoutUseCase();
    _globalAuthState.setUnauthenticated();
    state = const AuthNotifierState();
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
final authNotifierProvider =
    StateNotifierProvider<AuthNotifier, AuthNotifierState>((ref) {
  return AuthNotifier(
    loginUseCase: ref.watch(_loginUseCaseProvider),
    logoutUseCase: ref.watch(_logoutUseCaseProvider),
    globalAuthState: ref.watch(authStateProvider.notifier),
    authRepository: ref.watch(_authRepositoryProvider),
  );
});
