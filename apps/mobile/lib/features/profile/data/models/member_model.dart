import '../../domain/entities/member_entity.dart';

class MemberModel extends MemberEntity {
  const MemberModel({
    required super.id,
    required super.memberCode,
    required super.userId,
    required super.firstName,
    required super.lastName,
    required super.phone1,
    super.phone2,
    super.neighborhood,
    super.locationDetail,
    super.mobileMoneyType,
    super.mobileMoneyNumber,
    super.sponsorId,
    required super.userRole,
    required super.userIsActive,
  });

  // NestJS retourne du camelCase
  factory MemberModel.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>? ?? {};
    return MemberModel(
      id: json['id'] as String,
      memberCode: json['memberCode'] as String,
      userId: json['userId'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      phone1: json['phone1'] as String,
      phone2: json['phone2'] as String?,
      neighborhood: json['neighborhood'] as String?,
      locationDetail: json['locationDetail'] as String?,
      mobileMoneyType: json['mobileMoneyType'] as String?,
      mobileMoneyNumber: json['mobileMoneyNumber'] as String?,
      sponsorId: json['sponsorId'] as String?,
      userRole: user['role'] as String? ?? 'MEMBRE',
      userIsActive: user['isActive'] as bool? ?? true,
    );
  }
}
