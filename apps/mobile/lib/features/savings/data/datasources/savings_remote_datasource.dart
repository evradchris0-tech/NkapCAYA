import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/savings_model.dart';

abstract class SavingsRemoteDataSource {
  Future<SavingsModel> getSavings(String membershipId);
}

class SavingsRemoteDataSourceImpl implements SavingsRemoteDataSource {
  final ApiClient _apiClient;

  const SavingsRemoteDataSourceImpl({required ApiClient apiClient})
      : _apiClient = apiClient;

  @override
  Future<SavingsModel> getSavings(String membershipId) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      ApiConstants.savings(membershipId),
    );
    return SavingsModel.fromJson(response.data!);
  }
}
