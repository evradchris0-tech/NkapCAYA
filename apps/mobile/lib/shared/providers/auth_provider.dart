import 'package:flutter_riverpod/flutter_riverpod.dart';

class AuthState {
  final bool isAuthenticated;
  final String? userId;
  final String? role;

  const AuthState({this.isAuthenticated = false, this.userId, this.role});

  AuthState copyWith({bool? isAuthenticated, String? userId, String? role}) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      userId: userId ?? this.userId,
      role: role ?? this.role,
    );
  }
}

class AuthStateNotifier extends StateNotifier<AuthState> {
  AuthStateNotifier() : super(const AuthState());

  void setAuthenticated({required String userId, required String role}) {
    state = AuthState(isAuthenticated: true, userId: userId, role: role);
  }

  void setUnauthenticated() {
    state = const AuthState();
  }
}

final authStateProvider = StateNotifierProvider<AuthStateNotifier, AuthState>((
  ref,
) {
  return AuthStateNotifier();
});
