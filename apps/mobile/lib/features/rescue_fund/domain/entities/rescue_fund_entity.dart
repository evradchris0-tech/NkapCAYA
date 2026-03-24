/// Position individuelle du membre dans le fonds de secours.
class RescueFundPositionEntity {
  final String id;
  final String membershipId;
  final String fiscalYearId;
  final double paidAmount; // total versé sur l'exercice
  final double balance; // solde courant (après décaissements)
  final double refillDebt; // dette de renflouement éventuelle
  final DateTime updatedAt;

  const RescueFundPositionEntity({
    required this.id,
    required this.membershipId,
    required this.fiscalYearId,
    required this.paidAmount,
    required this.balance,
    required this.refillDebt,
    required this.updatedAt,
  });
}

/// Solde global du fonds de secours pour l'exercice.
class RescueFundLedgerEntity {
  final String id;
  final String fiscalYearId;
  final double totalBalance;
  final int memberCount;
  final double minimumPerMember;
  final double targetPerMember;

  const RescueFundLedgerEntity({
    required this.id,
    required this.fiscalYearId,
    required this.totalBalance,
    required this.memberCount,
    required this.minimumPerMember,
    required this.targetPerMember,
  });
}
