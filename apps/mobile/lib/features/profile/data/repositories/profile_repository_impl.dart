import '../../domain/entities/member_entity.dart';
import '../../domain/entities/membership_entity.dart';
import '../../domain/repositories/profile_repository.dart';
import '../datasources/profile_remote_datasource.dart';

class ProfileRepositoryImpl implements ProfileRepository {
  final ProfileRemoteDataSource _remoteDataSource;

  const ProfileRepositoryImpl(this._remoteDataSource);

  @override
  Future<MemberEntity> getMyProfile() {
    return _remoteDataSource.getMyProfile();
  }

  @override
  Future<List<MembershipEntity>> getMemberships(String profileId) {
    return _remoteDataSource.getMemberships(profileId);
  }
}
