import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/dashboard/presentation/pages/dashboard_page.dart';
import '../../features/onboarding/presentation/pages/onboarding_page.dart';
import '../../features/splash/presentation/pages/splash_page.dart';
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
  final notifier = _RouterNotifier(ref);

  return GoRouter(
    initialLocation: AppConstants.routeSplash,
    refreshListenable: notifier,
    redirect: notifier.redirect,
    routes: [
      // ── Splash ───────────────────────────────────────────────────────────
      GoRoute(
        path: AppConstants.routeSplash,
        name: 'splash',
        pageBuilder: (context, state) => NoTransitionPage(
          key: state.pageKey,
          child: const SplashPage(),
        ),
      ),

      // ── Onboarding (premier lancement) ───────────────────────────────────
      GoRoute(
        path: AppConstants.routeOnboarding,
        name: 'onboarding',
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const OnboardingPage(),
          transitionsBuilder: _fadeTransition,
        ),
      ),

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
// Router notifier — évite de recréer le GoRouter à chaque changement d'état
// ---------------------------------------------------------------------------

class _RouterNotifier extends ChangeNotifier {
  final Ref _ref;

  _RouterNotifier(this._ref) {
    _ref.listen(authStateProvider, (_, __) => notifyListeners());
    _ref.listen(tontineProvider, (_, __) => notifyListeners());
  }

  String? redirect(BuildContext context, GoRouterState state) {
    final location = state.matchedLocation;

    // Splash et onboarding gèrent leur propre navigation
    if (location == AppConstants.routeSplash) return null;
    if (location == AppConstants.routeOnboarding) return null;

    final hasTontine = _ref.read(tontineProvider) != null;
    final isAuthenticated = _ref.read(authStateProvider).isAuthenticated;

    final isTontineSearch = location == AppConstants.routeTontineSearch;
    final isLogin = location == AppConstants.routeLogin;

    if (!hasTontine) {
      return isTontineSearch ? null : AppConstants.routeTontineSearch;
    }
    if (!isAuthenticated) {
      return isLogin ? null : AppConstants.routeLogin;
    }
    if (isLogin || isTontineSearch) {
      return AppConstants.routeDashboard;
    }

    return null;
  }
}

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
