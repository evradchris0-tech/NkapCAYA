import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/amount_display.dart';

class RescueFundBalance extends StatelessWidget {
  final double memberContribution;
  final double totalFund;
  final double pendingRequests;

  const RescueFundBalance({
    super.key,
    required this.memberContribution,
    required this.totalFund,
    required this.pendingRequests,
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
            'Ma contribution',
            style: TextStyle(color: Colors.white70, fontSize: 12),
          ),
          const SizedBox(height: 4),
          AmountDisplay(
            amount: memberContribution,
            amountFontSize: 28,
            amountColor: AppColors.white,
          ),
          const SizedBox(height: 16),
          const Divider(color: Colors.white24),
          const SizedBox(height: 12),
          Row(
            children: [
              _FundStat(label: 'Fonds total', amount: totalFund),
              const SizedBox(width: 24),
              _FundStat(label: 'Demandes en cours', amount: pendingRequests),
            ],
          ),
        ],
      ),
    );
  }
}

class _FundStat extends StatelessWidget {
  final String label;
  final double amount;

  const _FundStat({required this.label, required this.amount});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(color: Colors.white60, fontSize: 11),
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
