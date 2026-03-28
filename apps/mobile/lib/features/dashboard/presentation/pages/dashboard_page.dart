import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/providers/auth_provider.dart';
import '../../../../shared/providers/current_membership_provider.dart';
import '../providers/dashboard_provider.dart';
import '../../../savings/presentation/providers/savings_provider.dart';
import '../../../loans/presentation/providers/loans_provider.dart';
import '../../../rescue_fund/presentation/providers/rescue_fund_provider.dart';
import '../widgets/kpi_card.dart';
import '../widgets/savings_chart.dart';

class DashboardPage extends ConsumerWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authStateProvider);
    final dashboardAsync = ref.watch(dashboardProvider);

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Tableau de bord',
              style: GoogleFonts.montserrat(
                fontSize: 17,
                fontWeight: FontWeight.w600,
              ),
            ),
            if (auth.role != null)
              Text(
                auth.role!,
                style: GoogleFonts.lato(
                  fontSize: 11,
                  color: AppColors.cayaGoldLight,
                  fontWeight: FontWeight.w500,
                ),
              ),
          ],
        ),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 16),
            child: Icon(Icons.notifications_outlined),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(savingsProvider);
          ref.invalidate(loansProvider);
          ref.invalidate(rescueFundPositionProvider);
          ref.invalidate(dashboardProvider);
        },
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          physics: const AlwaysScrollableScrollPhysics(),
          child: dashboardAsync.when(
            loading: () => const _DashboardSkeleton(),
            error: (e, _) => e is NoMemberProfileException
                ? _AdminInfoBanner(message: e.toString())
                : _ErrorBanner(message: e.toString()),
            data: (data) => _DashboardContent(data: data),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Content
// ─────────────────────────────────────────────────────────────────────────────

class _DashboardContent extends StatelessWidget {
  final DashboardData data;
  const _DashboardContent({required this.data});

  @override
  Widget build(BuildContext context) {
    final chartData = [
      SavingsChartData(month: 'Capital', amount: data.principalBalance),
      SavingsChartData(month: 'Intérêts', amount: data.totalInterestReceived),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GridView.count(
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 1.3,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          children: [
            KpiCard(
              title: 'Épargne nette',
              amount: data.savingsBalance,
              icon: Icons.savings_outlined,
              iconColor: AppColors.cayaBlue,
            ),
            KpiCard(
              title: data.activeLoansCount > 0
                  ? 'Encours prêts (${data.activeLoansCount})'
                  : 'Aucun prêt actif',
              amount: data.activeLoansOutstanding,
              icon: Icons.account_balance_outlined,
              iconColor: data.activeLoansOutstanding > 0
                  ? AppColors.warning
                  : AppColors.textSecondary,
            ),
            KpiCard(
              title: 'Fonds de secours',
              amount: data.rescueFundContribution,
              icon: Icons.volunteer_activism_outlined,
              iconColor: AppColors.success,
            ),
            KpiCard(
              title: 'Intérêts reçus',
              amount: data.totalInterestReceived,
              icon: Icons.trending_up_outlined,
              iconColor: AppColors.cayaGold,
            ),
          ],
        ),
        const SizedBox(height: 24),
        Text(
          'Composition de l\'épargne',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: SavingsChart(data: chartData),
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────

class _DashboardSkeleton extends StatelessWidget {
  const _DashboardSkeleton();

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final shimmerColor = isDark ? AppColors.darkSurfaceVariant : AppColors.grey200;
    return Column(
      children: [
        GridView.count(
          crossAxisCount: 2,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 1.3,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          children: List.generate(
            4,
            (_) => Container(
              decoration: BoxDecoration(
                color: shimmerColor,
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Error states
// ─────────────────────────────────────────────────────────────────────────────

/// Bannière info pour admin sans profil membre
class _AdminInfoBanner extends StatelessWidget {
  final String message;
  const _AdminInfoBanner({required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.cayaBlue.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.cayaBlue.withValues(alpha: 0.25),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.cayaBlue.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.admin_panel_settings_outlined,
                  color: AppColors.cayaBlue,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                'Mode administrateur',
                style: GoogleFonts.montserrat(
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                  color: AppColors.cayaBlue,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            message,
            style: GoogleFonts.lato(
              fontSize: 13,
              color: AppColors.textSecondary,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: () => context.go(AppConstants.routeProfile),
            icon: const Icon(Icons.person_outline, size: 16),
            label: const Text('Voir mon profil'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.cayaBlue,
              side: const BorderSide(color: AppColors.cayaBlue),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            ),
          ),
        ],
      ),
    );
  }
}

/// Bannière d'erreur générique
class _ErrorBanner extends StatelessWidget {
  final String message;
  const _ErrorBanner({required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.error.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.error_outline, color: AppColors.error, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: GoogleFonts.lato(
                color: AppColors.error,
                fontSize: 13,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
