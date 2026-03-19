import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../data/datasources/savings_remote_datasource.dart';
import '../../data/repositories/savings_repository_impl.dart';
import '../../domain/entities/savings_entity.dart';
import '../../domain/usecases/get_savings_balance_usecase.dart';

final _savingsRemoteDataSourceProvider = Provider<SavingsRemoteDataSource>((
  ref,
) {
  return SavingsRemoteDataSourceImpl(apiClient: ApiClient());
});

final _savingsRepositoryProvider = Provider<SavingsRepositoryImpl>((ref) {
  return SavingsRepositoryImpl(ref.watch(_savingsRemoteDataSourceProvider));
});

final savingsBalanceProvider = FutureProvider<SavingsEntity>((ref) async {
  final useCase = GetSavingsBalanceUseCase(
    ref.watch(_savingsRepositoryProvider),
  );
  return useCase();
});

final savingsTransactionsProvider =
    FutureProvider<List<SavingsTransactionEntity>>((ref) async {
  final repo = ref.watch(_savingsRepositoryProvider);
  return repo.getTransactions();
});
