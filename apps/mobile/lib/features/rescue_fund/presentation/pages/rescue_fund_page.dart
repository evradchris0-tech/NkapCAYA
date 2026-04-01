import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/error_widget.dart';
import '../providers/rescue_fund_provider.dart';
import '../widgets/rescue_fund_balance.dart';

class RescueFundPage extends ConsumerWidget {
  const RescueFundPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final positionAsync = ref.watch(rescueFundPositionProvider);
    final ledgerAsync = ref.watch(rescueFundLedgerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Fonds de Secours')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(rescueFundPositionProvider);
          ref.invalidate(rescueFundLedgerProvider);
        },
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ledgerAsync.when(
                data: (ledger) => RescueFundBalance(
                  memberContribution: positionAsync.value?.paidAmount,
                  totalFund: ledger.totalBalance,
                  memberBalance: positionAsync.value?.balance,
                  refillDebt: positionAsync.value?.refillDebt,
                ),
                loading: () => const _LoadingCard(),
                error: (e, _) => _ErrorCard(message: e.toString(), error: e),
              ),
              const SizedBox(height: 24),
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
                      const _InfoItem(
                        icon: Icons.percent,
                        color: AppColors.cayaBlue,
                        title: 'Contribution automatique',
                        subtitle:
                            'Une part fixe est versée chaque mois au fonds de secours.',
                      ),
                      const SizedBox(height: 12),
                      const _InfoItem(
                        icon: Icons.medical_services_outlined,
                        color: AppColors.success,
                        title: 'Cas éligibles',
                        subtitle:
                            'Décès, maladie grave, mariage, naissance, promotion.',
                      ),
                      const SizedBox(height: 12),
                      const _InfoItem(
                        icon: Icons.how_to_vote_outlined,
                        color: AppColors.warning,
                        title: 'Validation',
                        subtitle:
                            'Chaque décaissement est autorisé par le Président.',
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LoadingCard extends StatelessWidget {
  const _LoadingCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 160,
      decoration: BoxDecoration(
        color: Colors.grey[200],
        borderRadius: BorderRadius.circular(20),
      ),
      child: const Center(child: CircularProgressIndicator()),
    );
  }
}

class _ErrorCard extends StatelessWidget {
  final String message;
  final Object? error;

  const _ErrorCard({required this.message, this.error});

  @override
  Widget build(BuildContext context) {
    return CayaErrorWidget(message: message, error: error);
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
