import '../entities/savings_entity.dart';

abstract class SavingsRepository {
  Future<SavingsEntity> getSavings(String membershipId);
}
