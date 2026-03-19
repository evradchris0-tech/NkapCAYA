import '../entities/member_entity.dart';

abstract class ProfileRepository {
  Future<MemberEntity> getMyProfile();
  Future<MemberEntity> updateProfile({String? phone, String? address});
}
