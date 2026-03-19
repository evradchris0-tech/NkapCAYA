import '../../domain/entities/member_entity.dart';
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
  Future<MemberEntity> updateProfile({String? phone, String? address}) {
    final data = <String, dynamic>{};
    if (phone != null) data['phone'] = phone;
    if (address != null) data['address'] = address;
    return _remoteDataSource.updateProfile(data);
  }
}
