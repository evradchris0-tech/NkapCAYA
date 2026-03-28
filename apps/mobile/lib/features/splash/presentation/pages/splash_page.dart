import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../shared/providers/api_providers.dart';
import '../../../../shared/providers/tontine_provider.dart';
import '../../../auth/presentation/providers/auth_notifier.dart';

class SplashPage extends ConsumerStatefulWidget {
  const SplashPage({super.key});

  @override
  ConsumerState<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends ConsumerState<SplashPage>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _logoOpacity;
  late final Animation<double> _logoScale;
  late final Animation<double> _textOpacity;
  late final Animation<double> _loaderOpacity;
  Timer? _navTimer;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    );

    _logoOpacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _ctrl,
        curve: const Interval(0.0, 0.5, curve: Curves.easeOut),
      ),
    );
    _logoScale = Tween<double>(begin: 0.65, end: 1.0).animate(
      CurvedAnimation(
        parent: _ctrl,
        curve: const Interval(0.0, 0.55, curve: Curves.easeOutBack),
      ),
    );
    _textOpacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _ctrl,
        curve: const Interval(0.45, 0.85, curve: Curves.easeOut),
      ),
    );
    _loaderOpacity = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _ctrl,
        curve: const Interval(0.75, 1.0, curve: Curves.easeOut),
      ),
    );

    _ctrl.forward();
    _navTimer = Timer(const Duration(milliseconds: 2800), _navigate);
  }

  @override
  void dispose() {
    _navTimer?.cancel();
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _navigate() async {
    if (!mounted) return;

    // 1. Onboarding — premier lancement
    final prefs = ref.read(sharedPreferencesProvider);
    if (!(prefs.getBool('onboarding_done') ?? false)) {
      context.go(AppConstants.routeOnboarding);
      return;
    }

    // 2. Tontine non sélectionnée
    final tontine = ref.read(tontineProvider);
    if (tontine == null) {
      context.go(AppConstants.routeTontineSearch);
      return;
    }

    // 3. Tentative de restauration de session depuis les tokens stockés
    final storage = ref.read(secureStorageProvider);
    final storedToken = await storage.read(key: ApiConstants.accessTokenKey);

    if (storedToken != null) {
      // Token présent → appelle /auth/me pour valider et reconstruire l'état
      final restored =
          await ref.read(authNotifierProvider.notifier).restoreSession();
      if (restored && mounted) {
        context.go(AppConstants.routeDashboard);
        return;
      }
    }

    // 4. Pas de session valide → login
    if (mounted) context.go(AppConstants.routeLogin);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF0F2347),
              Color(0xFF1A3A6B),
              Color(0xFF2B5EA7),
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // ── Logo ──────────────────────────────────────────────────
                AnimatedBuilder(
                  animation: _ctrl,
                  builder: (_, child) => FadeTransition(
                    opacity: _logoOpacity,
                    child: ScaleTransition(scale: _logoScale, child: child),
                  ),
                  child: Image.asset(
                    'assets/images/caya_logo.png',
                    width: 130,
                    height: 130,
                  ),
                ),
                const SizedBox(height: 28),

                // ── Nom + tagline ─────────────────────────────────────────
                AnimatedBuilder(
                  animation: _ctrl,
                  builder: (_, child) =>
                      FadeTransition(opacity: _textOpacity, child: child),
                  child: Column(
                    children: [
                      const Text(
                        'CAYA',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 34,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 8,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Caisse Autonome des Yaourtiers Associés',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.65),
                          fontSize: 12,
                          letterSpacing: 0.3,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Votre tontine, simplifiée.',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.85),
                          fontSize: 13,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 64),

                // ── Indicateur de chargement ───────────────────────────────
                AnimatedBuilder(
                  animation: _ctrl,
                  builder: (_, child) =>
                      FadeTransition(opacity: _loaderOpacity, child: child),
                  child: SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        Colors.white.withValues(alpha: 0.55),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
