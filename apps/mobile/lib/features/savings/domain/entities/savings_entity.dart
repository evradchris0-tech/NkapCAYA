enum SavingsTransactionType { deposit, withdrawal, interest }

class SavingsEntity {
  final String id;
  final String memberCode;
  final double balance;
  final double totalDeposited;
  final double totalWithdrawn;
  final DateTime lastUpdated;

  const SavingsEntity({
    required this.id,
    required this.memberCode,
    required this.balance,
    required this.totalDeposited,
    required this.totalWithdrawn,
    required this.lastUpdated,
  });
}

class SavingsTransactionEntity {
  final String id;
  final SavingsTransactionType type;
  final double amount;
  final String? reference;
  final String? note;
  final DateTime createdAt;

  const SavingsTransactionEntity({
    required this.id,
    required this.type,
    required this.amount,
    this.reference,
    this.note,
    required this.createdAt,
  });

  bool get isCredit =>
      type == SavingsTransactionType.deposit ||
      type == SavingsTransactionType.interest;
}
