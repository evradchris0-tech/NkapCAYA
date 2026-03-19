import '../../domain/entities/savings_entity.dart';

class SavingsModel extends SavingsEntity {
  const SavingsModel({
    required super.id,
    required super.memberCode,
    required super.balance,
    required super.totalDeposited,
    required super.totalWithdrawn,
    required super.lastUpdated,
  });

  factory SavingsModel.fromJson(Map<String, dynamic> json) {
    return SavingsModel(
      id: json['id'] as String,
      memberCode: json['member_code'] as String,
      balance: (json['balance'] as num).toDouble(),
      totalDeposited: (json['total_deposited'] as num).toDouble(),
      totalWithdrawn: (json['total_withdrawn'] as num).toDouble(),
      lastUpdated: DateTime.parse(json['last_updated'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'member_code': memberCode,
      'balance': balance,
      'total_deposited': totalDeposited,
      'total_withdrawn': totalWithdrawn,
      'last_updated': lastUpdated.toIso8601String(),
    };
  }
}

class SavingsTransactionModel extends SavingsTransactionEntity {
  const SavingsTransactionModel({
    required super.id,
    required super.type,
    required super.amount,
    super.reference,
    super.note,
    required super.createdAt,
  });

  factory SavingsTransactionModel.fromJson(Map<String, dynamic> json) {
    return SavingsTransactionModel(
      id: json['id'] as String,
      type: _parseType(json['type'] as String),
      amount: (json['amount'] as num).toDouble(),
      reference: json['reference'] as String?,
      note: json['note'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type.name,
      'amount': amount,
      'reference': reference,
      'note': note,
      'created_at': createdAt.toIso8601String(),
    };
  }

  static SavingsTransactionType _parseType(String value) {
    switch (value.toLowerCase()) {
      case 'deposit':
        return SavingsTransactionType.deposit;
      case 'withdrawal':
        return SavingsTransactionType.withdrawal;
      case 'interest':
        return SavingsTransactionType.interest;
      default:
        return SavingsTransactionType.deposit;
    }
  }
}
