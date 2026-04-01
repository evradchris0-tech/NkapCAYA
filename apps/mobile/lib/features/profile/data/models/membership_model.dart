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
    return MembershipModel(
      id: json['id'] as String,
      fiscalYearId: json['fiscalYearId'] as String,
      memberProfileId: json['memberProfileId'] as String,
      status: _parseStatus(json['status'] as String? ?? 'ACTIVE'),
      enrollmentType: json['enrollmentType'] as String? ?? 'REGULAR',
      joinedAt: DateTime.parse(json['joinedAt'] as String),
      joinedAtMonth: json['joinedAtMonth'] as int? ?? 1,
      sharesCount: double.tryParse(json['sharesCount']?.toString() ?? '1') ?? 1,
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
