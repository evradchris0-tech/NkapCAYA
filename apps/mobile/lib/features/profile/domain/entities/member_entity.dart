import 'package:equatable/equatable.dart';

class MemberEntity extends Equatable {
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

  MemberEntity copyWith({
    String? id,
    String? memberCode,
    String? userId,
    String? firstName,
    String? lastName,
    String? phone1,
    String? phone2,
    String? neighborhood,
    String? locationDetail,
    String? mobileMoneyType,
    String? mobileMoneyNumber,
    String? sponsorId,
    String? userRole,
    bool? userIsActive,
  }) {
    return MemberEntity(
      id: id ?? this.id,
      memberCode: memberCode ?? this.memberCode,
      userId: userId ?? this.userId,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      phone1: phone1 ?? this.phone1,
      phone2: phone2 ?? this.phone2,
      neighborhood: neighborhood ?? this.neighborhood,
      locationDetail: locationDetail ?? this.locationDetail,
      mobileMoneyType: mobileMoneyType ?? this.mobileMoneyType,
      mobileMoneyNumber: mobileMoneyNumber ?? this.mobileMoneyNumber,
      sponsorId: sponsorId ?? this.sponsorId,
      userRole: userRole ?? this.userRole,
      userIsActive: userIsActive ?? this.userIsActive,
    );
  }

  @override
  List<Object?> get props => [
        id,
        memberCode,
        userId,
        firstName,
        lastName,
        phone1,
        phone2,
        neighborhood,
        locationDetail,
        mobileMoneyType,
        mobileMoneyNumber,
        sponsorId,
        userRole,
        userIsActive,
      ];
}
