import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/providers/auth_provider.dart';
import '../widgets/kpi_card.dart';
import '../widgets/savings_chart.dart';

class DashboardPage extends ConsumerWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authStateProvider);

    // Sample chart data — will be replaced by real provider data
    final chartData = [
      const SavingsChartData(month: 'Oct', amount: 50000),
      const SavingsChartData(month: 'Nov', amount: 75000),
      const SavingsChartData(month: 'Déc', amount: 60000),
      const SavingsChartData(month: 'Jan', amount: 90000),
      const SavingsChartData(month: 'Fév', amount: 80000),
      const SavingsChartData(month: 'Mar', amount: 100000),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Tableau de bord', style: TextStyle(fontSize: 18)),
            Text(
              auth.memberCode ?? '',
              style: const TextStyle(fontSize: 12, color: AppColors.cayaGoldLight),
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
        onRefresh: () async {},
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // KPI grid
              GridView.count(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 1.3,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                children: const [
                  KpiCard(
                    title: 'Épargne totale',
                    amount: 450000,
                    icon: Icons.savings_outlined,
                    iconColor: AppColors.cayaBlue,
                  ),
                  KpiCard(
                    title: 'Encours prêts',
                    amount: 150000,
                    icon: Icons.account_balance_outlined,
                    iconColor: AppColors.warning,
                  ),
                  KpiCard(
                    title: 'Fonds de secours',
                    amount: 25000,
                    icon: Icons.volunteer_activism_outlined,
                    iconColor: AppColors.success,
                  ),
                  KpiCard(
                    title: 'Cotisation due',
                    amount: 10000,
                    icon: Icons.payment_outlined,
                    iconColor: AppColors.cayaGold,
                  ),
                ],
              ),
              const SizedBox(height: 24),
              // Savings evolution chart
              Text(
                'Évolution de l\'épargne',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: SavingsChart(data: chartData),
                ),
              ),
              const SizedBox(height: 24),
              // Recent activity placeholder
              Text(
                'Dernières opérations',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 12),
              _buildRecentActivities(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRecentActivities() {
    final items = [
      ('Cotisation mars 2024', '+ 10 000 XAF', '19/03/2024', AppColors.success),
      ('Remboursement prêt', '- 25 000 XAF', '15/03/2024', AppColors.error),
      ('Dépôt épargne', '+ 50 000 XAF', '01/03/2024', AppColors.success),
    ];
    return Card(
      child: Column(
        children: items.asMap().entries.map((entry) {
          final i = entry.key;
          final item = entry.value;
          return Column(
            children: [
              ListTile(
                leading: CircleAvatar(
                  backgroundColor: item.$4.withValues(alpha: 0.12),
                  child: Icon(
                    item.$4 == AppColors.success ? Icons.arrow_upward : Icons.arrow_downward,
                    color: item.$4,
                    size: 18,
                  ),
                ),
                title: Text(item.$1, style: const TextStyle(fontSize: 14)),
                subtitle: Text(item.$3, style: const TextStyle(fontSize: 12)),
                trailing: Text(
                  item.$2,
                  style: TextStyle(
                    color: item.$4,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
              if (i < items.length - 1)
                const Divider(height: 1, indent: 16, endIndent: 16),
            ],
          );
        }).toList(),
      ),
    );
  }
}
