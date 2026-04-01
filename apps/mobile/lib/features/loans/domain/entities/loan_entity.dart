import 'package:equatable/equatable.dart';

enum LoanStatus { pending, active, closed }

class LoanEntity extends Equatable {
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

  LoanEntity copyWith({
    String? id,
    String? membershipId,
    String? fiscalYearId,
    double? principalAmount,
    double? outstandingBalance,
    double? monthlyRate,
    LoanStatus? status,
    DateTime? requestedAt,
    DateTime? disbursedAt,
    DateTime? dueBeforeDate,
    double? totalInterestAccrued,
    double? totalRepaid,
    String? requestNotes,
  }) {
    return LoanEntity(
      id: id ?? this.id,
      membershipId: membershipId ?? this.membershipId,
      fiscalYearId: fiscalYearId ?? this.fiscalYearId,
      principalAmount: principalAmount ?? this.principalAmount,
      outstandingBalance: outstandingBalance ?? this.outstandingBalance,
      monthlyRate: monthlyRate ?? this.monthlyRate,
      status: status ?? this.status,
      requestedAt: requestedAt ?? this.requestedAt,
      disbursedAt: disbursedAt ?? this.disbursedAt,
      dueBeforeDate: dueBeforeDate ?? this.dueBeforeDate,
      totalInterestAccrued: totalInterestAccrued ?? this.totalInterestAccrued,
      totalRepaid: totalRepaid ?? this.totalRepaid,
      requestNotes: requestNotes ?? this.requestNotes,
    );
  }

  @override
  List<Object?> get props => [
        id,
        membershipId,
        fiscalYearId,
        principalAmount,
        outstandingBalance,
        monthlyRate,
        status,
        requestedAt,
        disbursedAt,
        dueBeforeDate,
        totalInterestAccrued,
        totalRepaid,
        requestNotes,
      ];
}
