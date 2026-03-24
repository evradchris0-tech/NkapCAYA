import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/providers/auth_provider.dart';
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
            const Text('Tableau de bord', style: TextStyle(fontSize: 18)),
            Text(
              auth.role ?? '',
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.cayaGoldLight,
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
            error: (e, _) => _ErrorBanner(message: e.toString()),
            data: (data) => _DashboardContent(data: data),
          ),
        ),
      ),
    );
  }
}

class _DashboardContent extends StatelessWidget {
  final DashboardData data;

  const _DashboardContent({required this.data});

  @override
  Widget build(BuildContext context) {
    // Données synthétiques pour le graphique (épargne brute + intérêts = NAP)
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

class _DashboardSkeleton extends StatelessWidget {
  const _DashboardSkeleton();

  @override
  Widget build(BuildContext context) {
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
                color: Colors.grey[200],
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Center(child: CircularProgressIndicator()),
            ),
          ),
        ),
      ],
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  final String message;

  const _ErrorBanner({required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.error.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: AppColors.error),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(color: AppColors.error),
            ),
          ),
        ],
      ),
    );
  }
}
