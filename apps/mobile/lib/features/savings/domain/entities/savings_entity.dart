class SavingsEntity {
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
}

class SavingsTransactionEntity {
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
}
