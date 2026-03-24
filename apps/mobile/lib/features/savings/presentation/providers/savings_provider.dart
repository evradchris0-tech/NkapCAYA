import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../shared/providers/api_providers.dart';
import '../../../../shared/providers/current_membership_provider.dart';
import '../../data/datasources/savings_remote_datasource.dart';
import '../../data/repositories/savings_repository_impl.dart';
import '../../domain/entities/savings_entity.dart';
import '../../domain/usecases/get_savings_balance_usecase.dart';

final _savingsRemoteDataSourceProvider = Provider<SavingsRemoteDataSource>((
  ref,
) {
  return SavingsRemoteDataSourceImpl(apiClient: ref.watch(apiClientProvider));
});

final _savingsRepositoryProvider = Provider<SavingsRepositoryImpl>((ref) {
  return SavingsRepositoryImpl(ref.watch(_savingsRemoteDataSourceProvider));
});

final savingsProvider = FutureProvider<SavingsEntity>((ref) async {
  final ctx = await ref.watch(currentMembershipProvider.future);
  final useCase = GetSavingsUseCase(ref.watch(_savingsRepositoryProvider));
  return useCase(ctx.membershipId);
});
