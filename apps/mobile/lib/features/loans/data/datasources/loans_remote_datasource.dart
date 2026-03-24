import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/loan_model.dart';

abstract class LoansRemoteDataSource {
  Future<List<LoanModel>> getLoans(String membershipId);
}

class LoansRemoteDataSourceImpl implements LoansRemoteDataSource {
  final ApiClient _apiClient;

  const LoansRemoteDataSourceImpl({required ApiClient apiClient})
      : _apiClient = apiClient;

  @override
  Future<List<LoanModel>> getLoans(String membershipId) async {
    final response = await _apiClient.get<List<dynamic>>(
      ApiConstants.loans,
      queryParameters: {'membershipId': membershipId},
    );
    return (response.data ?? [])
        .cast<Map<String, dynamic>>()
        .map(LoanModel.fromJson)
        .toList();
  }
}
