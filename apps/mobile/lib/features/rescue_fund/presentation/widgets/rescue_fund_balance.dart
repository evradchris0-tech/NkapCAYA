import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/amount_display.dart';

class RescueFundBalance extends StatelessWidget {
  final double? memberContribution; // null si endpoint position indisponible
  final double totalFund;
  final double? memberBalance;
  final double? refillDebt;

  const RescueFundBalance({
    super.key,
    required this.memberContribution,
    required this.totalFund,
    required this.memberBalance,
    required this.refillDebt,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF2E7D32), Color(0xFF1B5E20)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.volunteer_activism, color: AppColors.white, size: 20),
              SizedBox(width: 8),
              Text(
                'Fonds de Secours',
                style: TextStyle(
                  color: AppColors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Text(
            'Ma contribution (exercice)',
            style: TextStyle(color: Colors.white70, fontSize: 12),
          ),
          const SizedBox(height: 4),
          memberContribution != null
              ? AmountDisplay(
                  amount: memberContribution!,
                  amountFontSize: 28,
                  amountColor: AppColors.white,
                )
              : const Text(
                  '—',
                  style: TextStyle(
                    color: AppColors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                  ),
                ),
          if (refillDebt != null && refillDebt! > 0) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.orange.withValues(alpha: 0.25),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'Dette de renflouement : ${refillDebt!.toStringAsFixed(0)} XAF',
                style:
                    const TextStyle(color: Colors.orangeAccent, fontSize: 12),
              ),
            ),
          ],
          const SizedBox(height: 16),
          const Divider(color: Colors.white24),
          const SizedBox(height: 12),
          Row(
            children: [
              _FundStat(label: 'Fonds total', amount: totalFund),
              const SizedBox(width: 24),
              _FundStat(label: 'Mon solde net', amount: memberBalance),
            ],
          ),
        ],
      ),
    );
  }
}

class _FundStat extends StatelessWidget {
  final String label;
  final double? amount;

  const _FundStat({required this.label, required this.amount});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: const TextStyle(color: Colors.white60, fontSize: 11)),
          const SizedBox(height: 2),
          amount != null
              ? AmountDisplay(
                  amount: amount!,
                  amountFontSize: 14,
                  amountColor: AppColors.white,
                )
              : const Text(
                  '—',
                  style: TextStyle(color: Colors.white60, fontSize: 14),
                ),
        ],
      ),
    );
  }
}
