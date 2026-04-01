import '../entities/member_entity.dart';
import '../entities/membership_entity.dart';

abstract class ProfileRepository {
  Future<MemberEntity> getMyProfile();
  Future<List<MembershipEntity>> getMemberships(String profileId);
}
