import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../widgets/rescue_fund_balance.dart';

class RescueFundPage extends StatelessWidget {
  const RescueFundPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Fonds de Secours')),
      body: RefreshIndicator(
        onRefresh: () async {},
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Balance overview
              const RescueFundBalance(
                memberContribution: 25000,
                totalFund: 1250000,
                pendingRequests: 75000,
              ),
              const SizedBox(height: 24),
              // Info section
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Comment ça fonctionne ?',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 12),
                      _InfoItem(
                        icon: Icons.percent,
                        color: AppColors.cayaBlue,
                        title: 'Contribution automatique',
                        subtitle:
                            '2% de chaque cotisation est versé au fonds de secours.',
                      ),
                      const SizedBox(height: 12),
                      _InfoItem(
                        icon: Icons.medical_services_outlined,
                        color: AppColors.success,
                        title: 'Cas éligibles',
                        subtitle:
                            'Décès, maladie grave, catastrophe naturelle.',
                      ),
                      const SizedBox(height: 12),
                      _InfoItem(
                        icon: Icons.how_to_vote_outlined,
                        color: AppColors.warning,
                        title: 'Validation',
                        subtitle:
                            "Chaque demande est soumise au vote du bureau.",
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              // Contribution history
              Text(
                'Mes contributions',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 12),
              Card(
                child: Column(
                  children: [
                    _ContributionItem(date: 'Mars 2024', amount: 200),
                    const Divider(height: 1, indent: 16, endIndent: 16),
                    _ContributionItem(date: 'Février 2024', amount: 200),
                    const Divider(height: 1, indent: 16, endIndent: 16),
                    _ContributionItem(date: 'Janvier 2024', amount: 200),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoItem extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;

  const _InfoItem({
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: color, size: 18),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _ContributionItem extends StatelessWidget {
  final String date;
  final double amount;

  const _ContributionItem({required this.date, required this.amount});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: const CircleAvatar(
        backgroundColor: Color(0xFFE8F5E9),
        child: Icon(
          Icons.volunteer_activism_outlined,
          color: AppColors.success,
          size: 18,
        ),
      ),
      title: Text('Contribution — $date', style: const TextStyle(fontSize: 14)),
      trailing: Text(
        '${amount.toStringAsFixed(0)} XAF',
        style: const TextStyle(
          color: AppColors.success,
          fontWeight: FontWeight.bold,
          fontSize: 13,
        ),
      ),
    );
  }
}
