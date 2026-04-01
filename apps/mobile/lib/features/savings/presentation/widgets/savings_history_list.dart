import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/currency_formatter.dart';
import '../../../../core/utils/date_formatter.dart';
import '../../domain/entities/savings_entity.dart';

class SavingsHistoryList extends StatelessWidget {
  final List<SavingsTransactionEntity> transactions;

  const SavingsHistoryList({super.key, required this.transactions});

  @override
  Widget build(BuildContext context) {
    if (transactions.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Text(
            'Aucune transaction',
            style: TextStyle(color: AppColors.textSecondary),
          ),
        ),
      );
    }

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: transactions.length,
      separatorBuilder: (_, __) => const Divider(height: 1, indent: 64),
      itemBuilder: (context, index) {
        final tx = transactions[index];
        final isCredit = tx.isCredit;
        return ListTile(
          leading: CircleAvatar(
            backgroundColor: (isCredit ? AppColors.success : AppColors.error)
                .withValues(alpha: 0.1),
            child: Icon(
              isCredit ? Icons.arrow_downward : Icons.arrow_upward,
              color: isCredit ? AppColors.success : AppColors.error,
              size: 18,
            ),
          ),
          title: Text(
            _typeLabel(tx.type),
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
          ),
          subtitle: Text(
            DateFormatter.formatRelative(tx.createdAt),
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textSecondary,
            ),
          ),
          trailing: Text(
            '${isCredit ? '+' : '-'} ${CurrencyFormatter.format(tx.amount)}',
            style: TextStyle(
              color: isCredit ? AppColors.success : AppColors.error,
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
          ),
        );
      },
    );
  }

  String _typeLabel(String type) {
    switch (type) {
      case 'EPARGNE':
        return 'Dépôt épargne';
      case 'INTEREST_CREDIT':
        return 'Intérêts distribués';
      case 'INSCRIPTION':
        return 'Frais d\'inscription';
      case 'COTISATION':
        return 'Cotisation';
      case 'SECOURS':
        return 'Fonds de secours';
      default:
        return type;
    }
  }
}
