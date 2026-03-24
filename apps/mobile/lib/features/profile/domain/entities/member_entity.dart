class MemberEntity {
  final String id; // MemberProfile.id
  final String memberCode;
  final String userId;
  final String firstName;
  final String lastName;
  final String phone1;
  final String? phone2;
  final String? neighborhood;
  final String? locationDetail;
  final String? mobileMoneyType;
  final String? mobileMoneyNumber;
  final String? sponsorId;
  // Relations imbriquées
  final String userRole;
  final bool userIsActive;

  const MemberEntity({
    required this.id,
    required this.memberCode,
    required this.userId,
    required this.firstName,
    required this.lastName,
    required this.phone1,
    this.phone2,
    this.neighborhood,
    this.locationDetail,
    this.mobileMoneyType,
    this.mobileMoneyNumber,
    this.sponsorId,
    required this.userRole,
    required this.userIsActive,
  });

  String get fullName => '$firstName $lastName';
}
