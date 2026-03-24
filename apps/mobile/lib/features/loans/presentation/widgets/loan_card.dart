import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/currency_formatter.dart';
import '../../../../core/utils/date_formatter.dart';
import '../../domain/entities/loan_entity.dart';

class LoanCard extends StatelessWidget {
  final LoanEntity loan;
  final VoidCallback? onTap;

  const LoanCard({super.key, required this.loan, this.onTap});

  @override
  Widget build(BuildContext context) {
    final statusColor = _statusColor(loan.status);
    final repaidAmount = loan.principalAmount - loan.outstandingBalance;
    final progressValue =
        loan.principalAmount > 0 ? repaidAmount / loan.principalAmount : 0.0;

    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    CurrencyFormatter.format(loan.principalAmount),
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.cayaBlue,
                    ),
                  ),
                  _StatusBadge(status: loan.status, color: statusColor),
                ],
              ),
              if (loan.requestNotes != null) ...[
                const SizedBox(height: 4),
                Text(
                  loan.requestNotes!,
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 13,
                  ),
                ),
              ],
              const SizedBox(height: 12),
              Row(
                children: [
                  _InfoChip(
                    label: 'Taux mensuel',
                    value:
                        '${(loan.monthlyRate * 100).toStringAsFixed(0)}%',
                  ),
                  const SizedBox(width: 16),
                  _InfoChip(
                    label: 'Échéance',
                    value: DateFormatter.formatShort(loan.dueBeforeDate),
                  ),
                ],
              ),
              if (loan.isActive) ...[
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Restant : ${CurrencyFormatter.format(loan.outstandingBalance)}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    Text(
                      '${(progressValue * 100).toStringAsFixed(0)}% remboursé',
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.success,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                LinearProgressIndicator(
                  value: progressValue.clamp(0.0, 1.0),
                  backgroundColor: AppColors.grey200,
                  color: AppColors.success,
                  borderRadius: BorderRadius.circular(4),
                  minHeight: 6,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Color _statusColor(LoanStatus status) {
    switch (status) {
      case LoanStatus.active:
        return AppColors.cayaBlue;
      case LoanStatus.pending:
        return AppColors.warning;
      case LoanStatus.closed:
        return AppColors.grey500;
    }
  }
}

class _StatusBadge extends StatelessWidget {
  final LoanStatus status;
  final Color color;

  const _StatusBadge({required this.status, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        _label(status),
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  String _label(LoanStatus status) {
    switch (status) {
      case LoanStatus.pending:
        return 'En attente';
      case LoanStatus.active:
        return 'En cours';
      case LoanStatus.closed:
        return 'Soldé';
    }
  }
}

class _InfoChip extends StatelessWidget {
  final String label;
  final String value;

  const _InfoChip({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 10, color: AppColors.textSecondary),
        ),
        Text(
          value,
          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }
}
