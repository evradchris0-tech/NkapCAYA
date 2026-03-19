import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/member_model.dart';

abstract class ProfileRemoteDataSource {
  Future<MemberModel> getMyProfile();
  Future<MemberModel> updateProfile(Map<String, dynamic> data);
}

class ProfileRemoteDataSourceImpl implements ProfileRemoteDataSource {
  final ApiClient _apiClient;

  const ProfileRemoteDataSourceImpl({required ApiClient apiClient})
      : _apiClient = apiClient;

  @override
  Future<MemberModel> getMyProfile() async {
    final response =
        await _apiClient.get<Map<String, dynamic>>(ApiConstants.myProfile);
    return MemberModel.fromJson(response.data!);
  }

  @override
  Future<MemberModel> updateProfile(Map<String, dynamic> data) async {
    final response = await _apiClient.patch<Map<String, dynamic>>(
      ApiConstants.myProfile,
      data: data,
    );
    return MemberModel.fromJson(response.data!);
  }
}
