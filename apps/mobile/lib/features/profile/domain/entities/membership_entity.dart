import 'package:equatable/equatable.dart';

enum MemberStatus { active, inactive, suspended, excluded }

class MembershipEntity extends Equatable {
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

  MembershipEntity copyWith({
    String? id,
    String? fiscalYearId,
    String? memberProfileId,
    MemberStatus? status,
    String? enrollmentType,
    DateTime? joinedAt,
    int? joinedAtMonth,
    double? sharesCount,
  }) {
    return MembershipEntity(
      id: id ?? this.id,
      fiscalYearId: fiscalYearId ?? this.fiscalYearId,
      memberProfileId: memberProfileId ?? this.memberProfileId,
      status: status ?? this.status,
      enrollmentType: enrollmentType ?? this.enrollmentType,
      joinedAt: joinedAt ?? this.joinedAt,
      joinedAtMonth: joinedAtMonth ?? this.joinedAtMonth,
      sharesCount: sharesCount ?? this.sharesCount,
    );
  }

  @override
  List<Object?> get props => [
        id,
        fiscalYearId,
        memberProfileId,
        status,
        enrollmentType,
        joinedAt,
        joinedAtMonth,
        sharesCount,
      ];
}
