import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/member_model.dart';
import '../models/membership_model.dart';

abstract class ProfileRemoteDataSource {
  Future<MemberModel> getMyProfile();
  Future<List<MembershipModel>> getMemberships(String profileId);
}

class ProfileRemoteDataSourceImpl implements ProfileRemoteDataSource {
  final ApiClient _apiClient;

  const ProfileRemoteDataSourceImpl({required ApiClient apiClient})
      : _apiClient = apiClient;

  @override
  Future<MemberModel> getMyProfile() async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      ApiConstants.memberProfile,
    );
    return MemberModel.fromJson(response.data!);
  }

  @override
  Future<List<MembershipModel>> getMemberships(String profileId) async {
    final response = await _apiClient.get<List<dynamic>>(
      ApiConstants.memberMemberships(profileId),
    );
    return (response.data ?? [])
        .cast<Map<String, dynamic>>()
        .map(MembershipModel.fromJson)
        .toList();
  }
}
