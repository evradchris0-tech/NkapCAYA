import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/savings_model.dart';

abstract class SavingsRemoteDataSource {
  Future<SavingsModel> getBalance();
  Future<List<SavingsTransactionModel>> getTransactions({int page = 1, int pageSize = 20});
}

class SavingsRemoteDataSourceImpl implements SavingsRemoteDataSource {
  final ApiClient _apiClient;

  const SavingsRemoteDataSourceImpl({required ApiClient apiClient})
      : _apiClient = apiClient;

  @override
  Future<SavingsModel> getBalance() async {
    final response = await _apiClient.get<Map<String, dynamic>>(ApiConstants.savingsBalance);
    return SavingsModel.fromJson(response.data!);
  }

  @override
  Future<List<SavingsTransactionModel>> getTransactions({
    int page = 1,
    int pageSize = 20,
  }) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      ApiConstants.savingsTransactions,
      queryParameters: {'page': page, 'page_size': pageSize},
    );
    final results = response.data!['results'] as List<dynamic>;
    return results
        .map((e) => SavingsTransactionModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
