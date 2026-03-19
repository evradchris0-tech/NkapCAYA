import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/loan_model.dart';

abstract class LoansRemoteDataSource {
  Future<List<LoanModel>> getMyLoans();
  Future<LoanModel> getLoanById(String id);
}

class LoansRemoteDataSourceImpl implements LoansRemoteDataSource {
  final ApiClient _apiClient;

  const LoansRemoteDataSourceImpl({required ApiClient apiClient})
      : _apiClient = apiClient;

  @override
  Future<List<LoanModel>> getMyLoans() async {
    final response =
        await _apiClient.get<Map<String, dynamic>>(ApiConstants.myLoans);
    final results = response.data!['results'] as List<dynamic>;
    return results
        .map((e) => LoanModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<LoanModel> getLoanById(String id) async {
    final response =
        await _apiClient.get<Map<String, dynamic>>('${ApiConstants.myLoans}$id/');
    return LoanModel.fromJson(response.data!);
  }
}
