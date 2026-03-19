import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/amount_display.dart';
import '../../../../shared/widgets/loading_widget.dart';
import '../../../../shared/widgets/error_widget.dart';
import '../providers/savings_provider.dart';
import '../widgets/savings_history_list.dart';

class SavingsPage extends ConsumerWidget {
  const SavingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final balanceAsync = ref.watch(savingsBalanceProvider);
    final transactionsAsync = ref.watch(savingsTransactionsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Mon Épargne')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(savingsBalanceProvider);
          ref.invalidate(savingsTransactionsProvider);
        },
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Balance card
              balanceAsync.when(
                loading: () =>
                    const SizedBox(height: 120, child: LoadingWidget()),
                error: (e, _) => CayaErrorWidget(
                  message: e.toString(),
                  onRetry: () => ref.invalidate(savingsBalanceProvider),
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
                            label: 'Total déposé',
                            amount: savings.totalDeposited,
                            icon: Icons.arrow_downward,
                            color: AppColors.success,
                          ),
                          const SizedBox(width: 16),
                          _StatChip(
                            label: 'Total retiré',
                            amount: savings.totalWithdrawn,
                            icon: Icons.arrow_upward,
                            color: AppColors.errorLight,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Historique',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 12),
              Card(
                child: transactionsAsync.when(
                  loading: () =>
                      const SizedBox(height: 200, child: LoadingWidget()),
                  error: (e, _) => CayaErrorWidget(
                    message: e.toString(),
                    onRetry: () => ref.invalidate(savingsTransactionsProvider),
                  ),
                  data: (transactions) =>
                      SavingsHistoryList(transactions: transactions),
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
