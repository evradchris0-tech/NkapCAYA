import '../../domain/entities/savings_entity.dart';

class SavingsModel extends SavingsEntity {
  const SavingsModel({
    required super.id,
    required super.membershipId,
    required super.balance,
    required super.principalBalance,
    required super.totalInterestReceived,
    required super.updatedAt,
  });

  factory SavingsModel.fromJson(Map<String, dynamic> json) {
    return SavingsModel(
      id: json['id'] as String,
      membershipId: json['membershipId'] as String,
      balance: double.tryParse(json['balance']?.toString() ?? '0') ?? 0,
      principalBalance:
          double.tryParse(json['principalBalance']?.toString() ?? '0') ?? 0,
      totalInterestReceived:
          double.tryParse(json['totalInterestReceived']?.toString() ?? '0') ??
              0,
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }
}

class SavingsTransactionModel extends SavingsTransactionEntity {
  const SavingsTransactionModel({
    required super.id,
    required super.type,
    required super.amount,
    required super.balanceAfter,
    required super.reference,
    super.notes,
    required super.createdAt,
  });

  factory SavingsTransactionModel.fromJson(Map<String, dynamic> json) {
    return SavingsTransactionModel(
      id: json['id'] as String,
      type: json['type'] as String? ?? 'EPARGNE',
      amount: double.tryParse(json['amount']?.toString() ?? '0') ?? 0,
      balanceAfter:
          double.tryParse(json['balanceAfter']?.toString() ?? '0') ?? 0,
      reference: json['reference'] as String? ?? '',
      notes: json['notes'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}
