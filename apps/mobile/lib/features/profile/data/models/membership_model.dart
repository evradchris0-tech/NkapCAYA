import '../../domain/entities/membership_entity.dart';

class MembershipModel extends MembershipEntity {
  const MembershipModel({
    required super.id,
    required super.fiscalYearId,
    required super.memberProfileId,
    required super.status,
    required super.enrollmentType,
    required super.joinedAt,
    required super.joinedAtMonth,
    required super.sharesCount,
  });

  factory MembershipModel.fromJson(Map<String, dynamic> json) {
    // L'API renvoie `profileId` (champ Prisma) ; on tolère `memberProfileId`.
    final shareCommitment = json['shareCommitment'] as Map<String, dynamic>?;
    return MembershipModel(
      id: json['id'] as String,
      fiscalYearId: json['fiscalYearId'] as String,
      memberProfileId:
          (json['profileId'] ?? json['memberProfileId']) as String? ?? '',
      status: _parseStatus(json['status'] as String? ?? 'ACTIVE'),
      enrollmentType: json['enrollmentType'] as String? ?? 'NEW',
      joinedAt: DateTime.parse(json['joinedAt'] as String),
      joinedAtMonth: json['joinedAtMonth'] as int? ?? 1,
      // `sharesCount` provient de la relation ShareCommitment (objet imbriqué),
      // avec repli sur une clé à plat au cas où l'API l'aplatirait.
      sharesCount: double.tryParse(
            (shareCommitment?['sharesCount'] ?? json['sharesCount'])
                    ?.toString() ??
                '1',
          ) ??
          1,
    );
  }

  static MemberStatus _parseStatus(String value) {
    switch (value.toUpperCase()) {
      case 'INACTIVE':
        return MemberStatus.inactive;
      case 'SUSPENDED':
        return MemberStatus.suspended;
      case 'EXCLUDED':
        return MemberStatus.excluded;
      case 'ACTIVE':
      default:
        return MemberStatus.active;
    }
  }
}
