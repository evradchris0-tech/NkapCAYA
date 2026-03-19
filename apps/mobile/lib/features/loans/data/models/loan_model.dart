import '../../domain/entities/loan_entity.dart';

class LoanModel extends LoanEntity {
  const LoanModel({
    required super.id,
    required super.memberCode,
    required super.amount,
    required super.remainingBalance,
    required super.interestRate,
    required super.durationMonths,
    required super.status,
    required super.requestedAt,
    super.approvedAt,
    super.dueDate,
    super.purpose,
  });

  factory LoanModel.fromJson(Map<String, dynamic> json) {
    return LoanModel(
      id: json['id'] as String,
      memberCode: json['member_code'] as String,
      amount: (json['amount'] as num).toDouble(),
      remainingBalance: (json['remaining_balance'] as num).toDouble(),
      interestRate: (json['interest_rate'] as num).toDouble(),
      durationMonths: json['duration_months'] as int,
      status: _parseStatus(json['status'] as String),
      requestedAt: DateTime.parse(json['requested_at'] as String),
      approvedAt: json['approved_at'] != null
          ? DateTime.parse(json['approved_at'] as String)
          : null,
      dueDate: json['due_date'] != null
          ? DateTime.parse(json['due_date'] as String)
          : null,
      purpose: json['purpose'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'member_code': memberCode,
      'amount': amount,
      'remaining_balance': remainingBalance,
      'interest_rate': interestRate,
      'duration_months': durationMonths,
      'status': status.name,
      'requested_at': requestedAt.toIso8601String(),
      'approved_at': approvedAt?.toIso8601String(),
      'due_date': dueDate?.toIso8601String(),
      'purpose': purpose,
    };
  }

  static LoanStatus _parseStatus(String value) {
    switch (value.toLowerCase()) {
      case 'pending':
        return LoanStatus.pending;
      case 'approved':
        return LoanStatus.approved;
      case 'active':
        return LoanStatus.active;
      case 'repaid':
        return LoanStatus.repaid;
      case 'rejected':
        return LoanStatus.rejected;
      case 'overdue':
        return LoanStatus.overdue;
      default:
        return LoanStatus.pending;
    }
  }
}
