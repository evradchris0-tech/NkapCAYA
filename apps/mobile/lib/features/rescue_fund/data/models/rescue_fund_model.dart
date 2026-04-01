import '../../domain/entities/rescue_fund_entity.dart';

class RescueFundPositionModel extends RescueFundPositionEntity {
  const RescueFundPositionModel({
    required super.id,
    required super.membershipId,
    required super.fiscalYearId,
    required super.paidAmount,
    required super.balance,
    required super.refillDebt,
    required super.updatedAt,
  });

  factory RescueFundPositionModel.fromJson(Map<String, dynamic> json) {
    return RescueFundPositionModel(
      id: json['id'] as String,
      membershipId: json['membershipId'] as String,
      fiscalYearId: json['fiscalYearId'] as String,
      paidAmount: double.tryParse(json['paidAmount']?.toString() ?? '0') ?? 0,
      balance: double.tryParse(json['balance']?.toString() ?? '0') ?? 0,
      refillDebt: double.tryParse(json['refillDebt']?.toString() ?? '0') ?? 0,
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }
}

class RescueFundLedgerModel extends RescueFundLedgerEntity {
  const RescueFundLedgerModel({
    required super.id,
    required super.fiscalYearId,
    required super.totalBalance,
    required super.memberCount,
    required super.minimumPerMember,
    required super.targetPerMember,
  });

  factory RescueFundLedgerModel.fromJson(Map<String, dynamic> json) {
    return RescueFundLedgerModel(
      id: json['id'] as String,
      fiscalYearId: json['fiscalYearId'] as String,
      totalBalance:
          double.tryParse(json['totalBalance']?.toString() ?? '0') ?? 0,
      memberCount: json['memberCount'] as int? ?? 0,
      minimumPerMember:
          double.tryParse(json['minimumPerMember']?.toString() ?? '0') ?? 0,
      targetPerMember:
          double.tryParse(json['targetPerMember']?.toString() ?? '0') ?? 0,
    );
  }
}
