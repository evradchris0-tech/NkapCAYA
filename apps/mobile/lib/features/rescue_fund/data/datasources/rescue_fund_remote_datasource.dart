import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/rescue_fund_model.dart';

abstract class RescueFundRemoteDataSource {
  Future<RescueFundLedgerModel> getLedger();
  Future<RescueFundPositionModel> getPosition(String membershipId);
}

class RescueFundRemoteDataSourceImpl implements RescueFundRemoteDataSource {
  final ApiClient _apiClient;

  const RescueFundRemoteDataSourceImpl({required ApiClient apiClient})
      : _apiClient = apiClient;

  @override
  Future<RescueFundLedgerModel> getLedger() async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      ApiConstants.rescueFund,
    );
    return RescueFundLedgerModel.fromJson(response.data!);
  }

  @override
  Future<RescueFundPositionModel> getPosition(String membershipId) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      ApiConstants.rescueFundPosition(membershipId),
    );
    return RescueFundPositionModel.fromJson(response.data!);
  }
}
