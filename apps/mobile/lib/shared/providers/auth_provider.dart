import 'package:flutter_riverpod/flutter_riverpod.dart';

class AuthState {
  final bool isAuthenticated;
  final String? userId;
  final String? memberCode;

  const AuthState({
    this.isAuthenticated = false,
    this.userId,
    this.memberCode,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    String? userId,
    String? memberCode,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      userId: userId ?? this.userId,
      memberCode: memberCode ?? this.memberCode,
    );
  }
}

class AuthStateNotifier extends StateNotifier<AuthState> {
  AuthStateNotifier() : super(const AuthState());

  void setAuthenticated({required String userId, required String memberCode}) {
    state = AuthState(isAuthenticated: true, userId: userId, memberCode: memberCode);
  }

  void setUnauthenticated() {
    state = const AuthState();
  }
}

final authStateProvider = StateNotifierProvider<AuthStateNotifier, AuthState>((ref) {
  return AuthStateNotifier();
});
