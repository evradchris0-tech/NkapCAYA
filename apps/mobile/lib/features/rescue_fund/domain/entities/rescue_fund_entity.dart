import 'package:equatable/equatable.dart';

/// Position individuelle du membre dans le fonds de secours.
class RescueFundPositionEntity extends Equatable {
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

  RescueFundPositionEntity copyWith({
    String? id,
    String? membershipId,
    String? fiscalYearId,
    double? paidAmount,
    double? balance,
    double? refillDebt,
    DateTime? updatedAt,
  }) {
    return RescueFundPositionEntity(
      id: id ?? this.id,
      membershipId: membershipId ?? this.membershipId,
      fiscalYearId: fiscalYearId ?? this.fiscalYearId,
      paidAmount: paidAmount ?? this.paidAmount,
      balance: balance ?? this.balance,
      refillDebt: refillDebt ?? this.refillDebt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [
        id,
        membershipId,
        fiscalYearId,
        paidAmount,
        balance,
        refillDebt,
        updatedAt,
      ];
}

/// Solde global du fonds de secours pour l'exercice.
class RescueFundLedgerEntity extends Equatable {
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

  RescueFundLedgerEntity copyWith({
    String? id,
    String? fiscalYearId,
    double? totalBalance,
    int? memberCount,
    double? minimumPerMember,
    double? targetPerMember,
  }) {
    return RescueFundLedgerEntity(
      id: id ?? this.id,
      fiscalYearId: fiscalYearId ?? this.fiscalYearId,
      totalBalance: totalBalance ?? this.totalBalance,
      memberCount: memberCount ?? this.memberCount,
      minimumPerMember: minimumPerMember ?? this.minimumPerMember,
      targetPerMember: targetPerMember ?? this.targetPerMember,
    );
  }

  @override
  List<Object?> get props => [
        id,
        fiscalYearId,
        totalBalance,
        memberCount,
        minimumPerMember,
        targetPerMember,
      ];
}
