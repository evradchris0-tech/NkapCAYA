enum LoanStatus { pending, approved, active, repaid, rejected, overdue }

class LoanEntity {
  final String id;
  final String memberCode;
  final double amount;
  final double remainingBalance;
  final double interestRate;
  final int durationMonths;
  final LoanStatus status;
  final DateTime requestedAt;
  final DateTime? approvedAt;
  final DateTime? dueDate;
  final String? purpose;

  const LoanEntity({
    required this.id,
    required this.memberCode,
    required this.amount,
    required this.remainingBalance,
    required this.interestRate,
    required this.durationMonths,
    required this.status,
    required this.requestedAt,
    this.approvedAt,
    this.dueDate,
    this.purpose,
  });

  bool get isActive => status == LoanStatus.active;
  bool get isOverdue => status == LoanStatus.overdue;
  double get totalWithInterest => amount * (1 + interestRate);
}
