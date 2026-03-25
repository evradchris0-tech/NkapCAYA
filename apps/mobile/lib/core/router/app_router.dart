import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/dashboard/presentation/pages/dashboard_page.dart';
import '../../features/loans/presentation/pages/loans_page.dart';
import '../../features/payments/presentation/pages/payments_page.dart';
import '../../features/profile/presentation/pages/profile_page.dart';
import '../../features/rescue_fund/presentation/pages/rescue_fund_page.dart';
import '../../features/savings/presentation/pages/savings_page.dart';
import '../../features/tontine/presentation/pages/tontine_search_page.dart';
import '../../shared/providers/auth_provider.dart';
import '../../shared/providers/tontine_provider.dart';
import '../../shared/widgets/offline_banner.dart';
import '../constants/app_constants.dart';
import '../theme/app_colors.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);
  final tontine = ref.watch(tontineProvider);

  return GoRouter(
    initialLocation: AppConstants.routeTontineSearch,
    redirect: (context, state) {
      final location = state.matchedLocation;
      final hasTontine = tontine != null;
      final isAuthenticated = authState.isAuthenticated;

      final isTontineSearch = location == AppConstants.routeTontineSearch;
      final isLogin = location == AppConstants.routeLogin;

      // 1. Pas de tontine → toujours /tontine-search
      if (!hasTontine) {
        return isTontineSearch ? null : AppConstants.routeTontineSearch;
      }

      // 2. Pas authentifié → /login
      if (!isAuthenticated) {
        return isLogin ? null : AppConstants.routeLogin;
      }

      // 3. Authentifié sur login ou tontine-search → dashboard
      if (isLogin || isTontineSearch) {
        return AppConstants.routeDashboard;
      }

      return null;
    },
    routes: [
      // ── Tontine search (pre-login) ───────────────────────────────────────
      GoRoute(
        path: AppConstants.routeTontineSearch,
        name: 'tontine_search',
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const TontineSearchPage(),
          transitionsBuilder: _slideUpTransition,
        ),
      ),

      // ── Login ────────────────────────────────────────────────────────────
      GoRoute(
        path: AppConstants.routeLogin,
        name: 'login',
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const LoginPage(),
          transitionsBuilder: _slideUpTransition,
        ),
      ),

      // ── Authenticated shell (6 tabs) ─────────────────────────────────────
      ShellRoute(
        builder: (context, state, child) => _MainScaffold(child: child),
        routes: [
          GoRoute(
            path: AppConstants.routeDashboard,
            name: 'dashboard',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const DashboardPage(),
              transitionsBuilder: _fadeTransition,
            ),
          ),
          GoRoute(
            path: AppConstants.routeSavings,
            name: 'savings',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const SavingsPage(),
              transitionsBuilder: _fadeTransition,
            ),
          ),
          GoRoute(
            path: AppConstants.routeLoans,
            name: 'loans',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const LoansPage(),
              transitionsBuilder: _fadeTransition,
            ),
          ),
          GoRoute(
            path: AppConstants.routePayments,
            name: 'payments',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const PaymentsPage(),
              transitionsBuilder: _fadeTransition,
            ),
          ),
          GoRoute(
            path: AppConstants.routeRescueFund,
            name: 'rescue_fund',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const RescueFundPage(),
              transitionsBuilder: _fadeTransition,
            ),
          ),
          GoRoute(
            path: AppConstants.routeProfile,
            name: 'profile',
            pageBuilder: (context, state) => CustomTransitionPage(
              key: state.pageKey,
              child: const ProfilePage(),
              transitionsBuilder: _fadeTransition,
            ),
          ),
        ],
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(child: Text('Page introuvable : ${state.error}')),
    ),
  );
});

// ---------------------------------------------------------------------------
// Transition builders
// ---------------------------------------------------------------------------

/// Fade — utilisé pour les onglets racines
Widget _fadeTransition(
  BuildContext context,
  Animation<double> animation,
  Animation<double> secondaryAnimation,
  Widget child,
) {
  return FadeTransition(
    opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut),
    child: child,
  );
}

/// Slide vertical vers le haut — utilisé pour login + tontine-search
Widget _slideUpTransition(
  BuildContext context,
  Animation<double> animation,
  Animation<double> secondaryAnimation,
  Widget child,
) {
  return SlideTransition(
    position: Tween(begin: const Offset(0, 1), end: Offset.zero).animate(
        CurvedAnimation(parent: animation, curve: Curves.easeOutCubic)),
    child: child,
  );
}

/// Slide horizontal — utilisé pour les pages détail (loan/[id], etc.)
Widget slideHorizontalTransition(
  BuildContext context,
  Animation<double> animation,
  Animation<double> secondaryAnimation,
  Widget child,
) {
  return SlideTransition(
    position: Tween(begin: const Offset(1, 0), end: Offset.zero).animate(
        CurvedAnimation(parent: animation, curve: Curves.easeOutCubic)),
    child: child,
  );
}

// ---------------------------------------------------------------------------
// Main scaffold with 6-tab NavigationBar
// ---------------------------------------------------------------------------
class _MainScaffold extends ConsumerWidget {
  final Widget child;
  const _MainScaffold({required this.child});

  static const _tabs = [
    AppConstants.routeDashboard,
    AppConstants.routeSavings,
    AppConstants.routeLoans,
    AppConstants.routePayments,
    AppConstants.routeRescueFund,
    AppConstants.routeProfile,
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final location = GoRouterState.of(context).matchedLocation;
    int currentIndex = _tabs.indexWhere((t) => location.startsWith(t));
    if (currentIndex < 0) currentIndex = 0;

    return Scaffold(
      body: Column(
        children: [
          Expanded(child: child),
          const OfflineBanner(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: currentIndex,
        onDestinationSelected: (index) => context.go(_tabs[index]),
        backgroundColor: Theme.of(context).colorScheme.surface,
        indicatorColor: AppColors.cayaBlue.withValues(alpha: 0.12),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home),
            label: 'Accueil',
          ),
          NavigationDestination(
            icon: Icon(Icons.savings_outlined),
            selectedIcon: Icon(Icons.savings),
            label: 'Épargne',
          ),
          NavigationDestination(
            icon: Icon(Icons.account_balance_outlined),
            selectedIcon: Icon(Icons.account_balance),
            label: 'Prêts',
          ),
          NavigationDestination(
            icon: Icon(Icons.payment_outlined),
            selectedIcon: Icon(Icons.payment),
            label: 'Paiements',
          ),
          NavigationDestination(
            icon: Icon(Icons.favorite_border),
            selectedIcon: Icon(Icons.favorite),
            label: 'Secours',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Profil',
          ),
        ],
      ),
    );
  }
}
