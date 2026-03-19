import '../../domain/entities/member_entity.dart';

class MemberModel extends MemberEntity {
  const MemberModel({
    required super.id,
    required super.memberCode,
    required super.firstName,
    required super.lastName,
    required super.email,
    super.phone,
    super.photoUrl,
    required super.profession,
    super.address,
    required super.joinDate,
    required super.status,
    required super.contributionMonths,
  });

  factory MemberModel.fromJson(Map<String, dynamic> json) {
    return MemberModel(
      id: json['id'] as String,
      memberCode: json['member_code'] as String,
      firstName: json['first_name'] as String,
      lastName: json['last_name'] as String,
      email: json['email'] as String,
      phone: json['phone'] as String?,
      photoUrl: json['photo_url'] as String?,
      profession: json['profession'] as String? ?? '',
      address: json['address'] as String?,
      joinDate: DateTime.parse(json['join_date'] as String),
      status: _parseStatus(json['status'] as String? ?? 'active'),
      contributionMonths: json['contribution_months'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'member_code': memberCode,
      'first_name': firstName,
      'last_name': lastName,
      'email': email,
      'phone': phone,
      'photo_url': photoUrl,
      'profession': profession,
      'address': address,
      'join_date': joinDate.toIso8601String(),
      'status': status.name,
      'contribution_months': contributionMonths,
    };
  }

  static MemberStatus _parseStatus(String value) {
    switch (value.toLowerCase()) {
      case 'active':
        return MemberStatus.active;
      case 'suspended':
        return MemberStatus.suspended;
      case 'inactive':
        return MemberStatus.inactive;
      default:
        return MemberStatus.active;
    }
  }
}
