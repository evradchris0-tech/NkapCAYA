import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/dashboard/presentation/pages/dashboard_page.dart';
import '../../features/savings/presentation/pages/savings_page.dart';
import '../../features/loans/presentation/pages/loans_page.dart';
import '../../features/rescue_fund/presentation/pages/rescue_fund_page.dart';
import '../../features/profile/presentation/pages/profile_page.dart';
import '../../shared/providers/auth_provider.dart';
import '../constants/app_constants.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: AppConstants.routeLogin,
    redirect: (context, state) {
      final isAuthenticated = authState.isAuthenticated;
      final isLoginRoute = state.matchedLocation == AppConstants.routeLogin;

      if (!isAuthenticated && !isLoginRoute) {
        return AppConstants.routeLogin;
      }
      if (isAuthenticated && isLoginRoute) {
        return AppConstants.routeDashboard;
      }
      return null;
    },
    routes: [
      GoRoute(
        path: AppConstants.routeLogin,
        name: 'login',
        builder: (context, state) => const LoginPage(),
      ),
      ShellRoute(
        builder: (context, state, child) => _MainScaffold(child: child),
        routes: [
          GoRoute(
            path: AppConstants.routeDashboard,
            name: 'dashboard',
            builder: (context, state) => const DashboardPage(),
          ),
          GoRoute(
            path: AppConstants.routeSavings,
            name: 'savings',
            builder: (context, state) => const SavingsPage(),
          ),
          GoRoute(
            path: AppConstants.routeLoans,
            name: 'loans',
            builder: (context, state) => const LoansPage(),
          ),
          GoRoute(
            path: AppConstants.routeRescueFund,
            name: 'rescue_fund',
            builder: (context, state) => const RescueFundPage(),
          ),
          GoRoute(
            path: AppConstants.routeProfile,
            name: 'profile',
            builder: (context, state) => const ProfilePage(),
          ),
        ],
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Text('Page introuvable : ${state.error}'),
      ),
    ),
  );
});

class _MainScaffold extends StatelessWidget {
  final Widget child;
  const _MainScaffold({required this.child});

  static const _tabs = [
    AppConstants.routeDashboard,
    AppConstants.routeSavings,
    AppConstants.routeLoans,
    AppConstants.routeRescueFund,
    AppConstants.routeProfile,
  ];

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    final currentIndex = _tabs.indexWhere((t) => location.startsWith(t));

    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: currentIndex < 0 ? 0 : currentIndex,
        onTap: (index) => context.go(_tabs[index]),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), label: 'Accueil'),
          BottomNavigationBarItem(icon: Icon(Icons.savings_outlined), label: 'Épargne'),
          BottomNavigationBarItem(icon: Icon(Icons.account_balance_outlined), label: 'Prêts'),
          BottomNavigationBarItem(icon: Icon(Icons.volunteer_activism_outlined), label: 'Secours'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'Profil'),
        ],
      ),
    );
  }
}
