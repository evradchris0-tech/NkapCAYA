import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/providers/tontine_provider.dart';

class OnboardingPage extends ConsumerStatefulWidget {
  const OnboardingPage({super.key});

  @override
  ConsumerState<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends ConsumerState<OnboardingPage>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _fadeIn;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    )..forward();
    _fadeIn = CurvedAnimation(parent: _ctrl, curve: Curves.easeOut);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _start() {
    ref.read(sharedPreferencesProvider).setBool('onboarding_done', true);
    context.go(AppConstants.routeTontineSearch);
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
          child: FadeTransition(
            opacity: _fadeIn,
            child: Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(28, 48, 28, 16),
                    child: Column(
                      children: [
                        // ── Logo ───────────────────────────────────────────
                        Image.asset(
                          'assets/images/caya_logo.png',
                          width: 110,
                          height: 110,
                        ),
                        const SizedBox(height: 24),

                        // ── Titre ──────────────────────────────────────────
                        const Text(
                          'Bienvenue sur CAYA',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 26,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'La plateforme complète pour administrer\nvotre tontine en toute simplicité.',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.72),
                            fontSize: 14,
                            height: 1.55,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 40),

                        // ── Features ───────────────────────────────────────
                        const _FeatureRow(
                          icon: Icons.group_outlined,
                          title: 'Gestion des membres',
                          subtitle:
                              'Inscriptions, statuts et profils membres en temps réel.',
                        ),
                        const _FeatureRow(
                          icon: Icons.savings_outlined,
                          title: 'Épargne & cotisations',
                          subtitle:
                              'Suivi des dépôts, intérêts cumulés et soldes individuels.',
                        ),
                        const _FeatureRow(
                          icon: Icons.account_balance_outlined,
                          title: 'Prêts & remboursements',
                          subtitle:
                              'Demandes de prêt, échéanciers et historique complet.',
                        ),
                        const _FeatureRow(
                          icon: Icons.favorite_border,
                          title: 'Caisse de secours',
                          subtitle:
                              'Solidarité entre membres, bénéficiaires et mouvements.',
                        ),
                        const _FeatureRow(
                          icon: Icons.payment_outlined,
                          title: 'Mobile Money',
                          subtitle:
                              'Paiements Orange Money & MTN MoMo intégrés.',
                          isLast: true,
                        ),
                        const SizedBox(height: 16),
                      ],
                    ),
                  ),
                ),

                // ── CTA ────────────────────────────────────────────────────
                Padding(
                  padding: const EdgeInsets.fromLTRB(28, 0, 28, 36),
                  child: Column(
                    children: [
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _start,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.cayaGold,
                            foregroundColor: AppColors.cayaBlueDark,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                            elevation: 0,
                          ),
                          child: const Text(
                            'Commencer',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'En continuant, vous acceptez les conditions d\'utilisation de CAYA.',
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.4),
                          fontSize: 11,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],
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

class _FeatureRow extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool isLast;

  const _FeatureRow({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: isLast ? 0 : 20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(13),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.15),
              ),
            ),
            child: Icon(icon, color: AppColors.cayaGold, size: 22),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 2),
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  subtitle,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.60),
                    fontSize: 12,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
