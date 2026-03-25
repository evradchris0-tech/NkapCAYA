import '../../domain/entities/loan_entity.dart';

class LoanModel extends LoanEntity {
  const LoanModel({
    required super.id,
    required super.membershipId,
    required super.fiscalYearId,
    required super.principalAmount,
    required super.outstandingBalance,
    required super.monthlyRate,
    required super.status,
    required super.requestedAt,
    super.disbursedAt,
    required super.dueBeforeDate,
    required super.totalInterestAccrued,
    required super.totalRepaid,
    super.requestNotes,
  });

  factory LoanModel.fromJson(Map<String, dynamic> json) {
    return LoanModel(
      id: json['id'] as String,
      membershipId: json['membershipId'] as String,
      fiscalYearId: json['fiscalYearId'] as String,
      principalAmount:
          double.tryParse(json['principalAmount']?.toString() ?? '0') ?? 0,
      outstandingBalance:
          double.tryParse(json['outstandingBalance']?.toString() ?? '0') ?? 0,
      monthlyRate: double.tryParse(json['monthlyRate']?.toString() ?? '0') ?? 0,
      status: _parseStatus(json['status'] as String? ?? 'PENDING'),
      requestedAt: DateTime.parse(json['requestedAt'] as String),
      disbursedAt: json['disbursedAt'] != null
          ? DateTime.parse(json['disbursedAt'] as String)
          : null,
      dueBeforeDate: DateTime.parse(json['dueBeforeDate'] as String),
      totalInterestAccrued:
          double.tryParse(json['totalInterestAccrued']?.toString() ?? '0') ?? 0,
      totalRepaid: double.tryParse(json['totalRepaid']?.toString() ?? '0') ?? 0,
      requestNotes: json['requestNotes'] as String?,
    );
  }

  static LoanStatus _parseStatus(String value) {
    switch (value.toUpperCase()) {
      case 'ACTIVE':
        return LoanStatus.active;
      case 'CLOSED':
        return LoanStatus.closed;
      case 'PENDING':
      default:
        return LoanStatus.pending;
    }
  }
}
