import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/amount_display.dart';
import '../../../../shared/widgets/loading_widget.dart';
import '../../../../shared/widgets/error_widget.dart';
import '../providers/savings_provider.dart';

class SavingsPage extends ConsumerWidget {
  const SavingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final savingsAsync = ref.watch(savingsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Mon Épargne')),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(savingsProvider),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              savingsAsync.when(
                loading: () =>
                    const SizedBox(height: 120, child: LoadingWidget()),
                error: (e, _) => CayaErrorWidget(
                  message: e.toString(),
                  error: e,
                  onRetry: () => ref.invalidate(savingsProvider),
                ),
                data: (savings) => Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppColors.cayaBlue, AppColors.cayaBlueDark],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Solde épargne',
                        style: TextStyle(
                          color: AppColors.cayaGoldLight,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 8),
                      AmountDisplay(
                        amount: savings.balance,
                        amountFontSize: 32,
                        amountColor: AppColors.white,
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          _StatChip(
                            label: 'Capital versé',
                            amount: savings.principalBalance,
                            icon: Icons.arrow_downward,
                            color: AppColors.success,
                          ),
                          const SizedBox(width: 16),
                          _StatChip(
                            label: 'Intérêts reçus',
                            amount: savings.totalInterestReceived,
                            icon: Icons.trending_up,
                            color: AppColors.cayaGoldLight,
                          ),
                        ],
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

class _StatChip extends StatelessWidget {
  final String label;
  final double amount;
  final IconData icon;
  final Color color;

  const _StatChip({
    required this.label,
    required this.amount,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 12, color: color),
              const SizedBox(width: 4),
              Text(label, style: TextStyle(color: color, fontSize: 11)),
            ],
          ),
          const SizedBox(height: 2),
          AmountDisplay(
            amount: amount,
            amountFontSize: 14,
            amountColor: AppColors.white,
          ),
        ],
      ),
    );
  }
}
