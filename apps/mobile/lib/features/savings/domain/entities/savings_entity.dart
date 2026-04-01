import 'package:equatable/equatable.dart';

class SavingsEntity extends Equatable {
  final String id;
  final String membershipId;
  final double balance; // principal + intérêts
  final double principalBalance; // versements bruts
  final double totalInterestReceived;
  final DateTime updatedAt;

  const SavingsEntity({
    required this.id,
    required this.membershipId,
    required this.balance,
    required this.principalBalance,
    required this.totalInterestReceived,
    required this.updatedAt,
  });

  SavingsEntity copyWith({
    String? id,
    String? membershipId,
    double? balance,
    double? principalBalance,
    double? totalInterestReceived,
    DateTime? updatedAt,
  }) {
    return SavingsEntity(
      id: id ?? this.id,
      membershipId: membershipId ?? this.membershipId,
      balance: balance ?? this.balance,
      principalBalance: principalBalance ?? this.principalBalance,
      totalInterestReceived:
          totalInterestReceived ?? this.totalInterestReceived,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [
        id,
        membershipId,
        balance,
        principalBalance,
        totalInterestReceived,
        updatedAt,
      ];
}

class SavingsTransactionEntity extends Equatable {
  final String id;
  final String type; // TransactionType Prisma (EPARGNE, INTEREST_CREDIT, …)
  final double amount;
  final double balanceAfter;
  final String reference;
  final String? notes;
  final DateTime createdAt;

  const SavingsTransactionEntity({
    required this.id,
    required this.type,
    required this.amount,
    required this.balanceAfter,
    required this.reference,
    this.notes,
    required this.createdAt,
  });

  bool get isCredit => type == 'EPARGNE' || type == 'INTEREST_CREDIT';

  SavingsTransactionEntity copyWith({
    String? id,
    String? type,
    double? amount,
    double? balanceAfter,
    String? reference,
    String? notes,
    DateTime? createdAt,
  }) {
    return SavingsTransactionEntity(
      id: id ?? this.id,
      type: type ?? this.type,
      amount: amount ?? this.amount,
      balanceAfter: balanceAfter ?? this.balanceAfter,
      reference: reference ?? this.reference,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  List<Object?> get props =>
      [id, type, amount, balanceAfter, reference, notes, createdAt];
}
