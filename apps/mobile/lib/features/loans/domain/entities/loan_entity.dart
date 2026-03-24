enum LoanStatus { pending, active, closed }

class LoanEntity {
  final String id;
  final String membershipId;
  final String fiscalYearId;
  final double principalAmount;
  final double outstandingBalance;
  final double monthlyRate; // ex: 0.04 = 4%
  final LoanStatus status;
  final DateTime requestedAt;
  final DateTime? disbursedAt;
  final DateTime dueBeforeDate;
  final double totalInterestAccrued;
  final double totalRepaid;
  final String? requestNotes;

  const LoanEntity({
    required this.id,
    required this.membershipId,
    required this.fiscalYearId,
    required this.principalAmount,
    required this.outstandingBalance,
    required this.monthlyRate,
    required this.status,
    required this.requestedAt,
    this.disbursedAt,
    required this.dueBeforeDate,
    required this.totalInterestAccrued,
    required this.totalRepaid,
    this.requestNotes,
  });

  bool get isActive => status == LoanStatus.active;
  bool get isPending => status == LoanStatus.pending;
  bool get isClosed => status == LoanStatus.closed;
}
