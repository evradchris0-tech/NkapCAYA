import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../savings/presentation/providers/savings_provider.dart';
import '../../../loans/presentation/providers/loans_provider.dart';
import '../../../rescue_fund/presentation/providers/rescue_fund_provider.dart';

class DashboardData {
  final double savingsBalance; // SavingsLedger.balance
  final double principalBalance; // versements bruts
  final double totalInterestReceived;
  final double activeLoansOutstanding; // Σ outstandingBalance des prêts ACTIVE
  final double rescueFundContribution; // paidAmount de la position membre
  final int activeLoansCount;

  const DashboardData({
    required this.savingsBalance,
    required this.principalBalance,
    required this.totalInterestReceived,
    required this.activeLoansOutstanding,
    required this.rescueFundContribution,
    required this.activeLoansCount,
  });
}

final dashboardProvider = FutureProvider<DashboardData>((ref) async {
  final savings = await ref.watch(savingsProvider.future);
  final loans = await ref.watch(loansProvider.future);
  final position = await ref.watch(rescueFundPositionProvider.future);

  final activeLoans = loans.where((l) => l.isActive).toList();
  final outstanding =
      activeLoans.fold<double>(0, (sum, l) => sum + l.outstandingBalance);

  return DashboardData(
    savingsBalance: savings.balance,
    principalBalance: savings.principalBalance,
    totalInterestReceived: savings.totalInterestReceived,
    activeLoansOutstanding: outstanding,
    rescueFundContribution: position.paidAmount,
    activeLoansCount: activeLoans.length,
  );
});
