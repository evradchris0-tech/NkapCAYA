enum MemberStatus { active, inactive, suspended, excluded }

class MembershipEntity {
  final String id;
  final String fiscalYearId;
  final String memberProfileId;
  final MemberStatus status;
  final String enrollmentType;
  final DateTime joinedAt;
  final int joinedAtMonth;
  final double sharesCount;

  const MembershipEntity({
    required this.id,
    required this.fiscalYearId,
    required this.memberProfileId,
    required this.status,
    required this.enrollmentType,
    required this.joinedAt,
    required this.joinedAtMonth,
    required this.sharesCount,
  });

  bool get isActive => status == MemberStatus.active;
}
