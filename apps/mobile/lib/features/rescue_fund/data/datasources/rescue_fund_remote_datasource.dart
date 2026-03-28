import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/rescue_fund_model.dart';

abstract class RescueFundRemoteDataSource {
  Future<RescueFundLedgerModel> getLedger(String fyId);
  Future<RescueFundPositionModel?> getPosition(String fyId, String membershipId);
}

class RescueFundRemoteDataSourceImpl implements RescueFundRemoteDataSource {
  final ApiClient _apiClient;

  const RescueFundRemoteDataSourceImpl({required ApiClient apiClient})
      : _apiClient = apiClient;

  @override
  Future<RescueFundLedgerModel> getLedger(String fyId) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      ApiConstants.rescueFundLedger(fyId),
    );
    return RescueFundLedgerModel.fromJson(response.data!);
  }

  @override
  Future<RescueFundPositionModel?> getPosition(
    String fyId,
    String membershipId,
  ) async {
    // Endpoint non implémenté côté backend — retourne null
    // TODO: implémenter GET /fiscal-years/:fyId/rescue-fund/positions/:membershipId
    return null;
  }
}
