import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../savings/presentation/providers/savings_provider.dart';
import '../../../loans/presentation/providers/loans_provider.dart';
import '../../../rescue_fund/presentation/providers/rescue_fund_provider.dart';

class DashboardData {
  final double savingsBalance;
  final double principalBalance;
  final double totalInterestReceived;
  final double activeLoansOutstanding;
  final double rescueFundContribution;
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
  // savings et loans peuvent propager NoMemberProfileException → dashboard_page l'affiche
  final savings = await ref.watch(savingsProvider.future);
  final loans = await ref.watch(loansProvider.future);

  // Rescue fund : endpoint en cours de correction (fyId requis) — ne bloque pas le dashboard
  double rescueContrib = 0;
  try {
    final position = await ref.watch(rescueFundPositionProvider.future);
    rescueContrib = position?.paidAmount ?? 0;
  } catch (_) {
    // Silencieux : l'onglet Secours affiche son propre état d'erreur
  }

  final activeLoans = loans.where((l) => l.isActive).toList();
  final outstanding =
      activeLoans.fold<double>(0, (sum, l) => sum + l.outstandingBalance);

  return DashboardData(
    savingsBalance: savings.balance,
    principalBalance: savings.principalBalance,
    totalInterestReceived: savings.totalInterestReceived,
    activeLoansOutstanding: outstanding,
    rescueFundContribution: rescueContrib,
    activeLoansCount: activeLoans.length,
  );
});
