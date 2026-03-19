enum MemberStatus { active, suspended, inactive }

class MemberEntity {
  final String id;
  final String memberCode;
  final String firstName;
  final String lastName;
  final String email;
  final String? phone;
  final String? photoUrl;
  final String profession;
  final String? address;
  final DateTime joinDate;
  final MemberStatus status;
  final int contributionMonths;

  const MemberEntity({
    required this.id,
    required this.memberCode,
    required this.firstName,
    required this.lastName,
    required this.email,
    this.phone,
    this.photoUrl,
    required this.profession,
    this.address,
    required this.joinDate,
    required this.status,
    required this.contributionMonths,
  });

  String get fullName => '$firstName $lastName';
  bool get isActive => status == MemberStatus.active;
}
