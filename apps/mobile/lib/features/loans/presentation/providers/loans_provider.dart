import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../shared/providers/api_providers.dart';
import '../../../../shared/providers/current_membership_provider.dart';
import '../../data/datasources/loans_remote_datasource.dart';
import '../../data/repositories/loans_repository_impl.dart';
import '../../domain/entities/loan_entity.dart';
import '../../domain/repositories/loans_repository.dart';
import '../../domain/usecases/get_my_loans_usecase.dart';

final _loansRemoteDataSourceProvider = Provider<LoansRemoteDataSource>((ref) {
  return LoansRemoteDataSourceImpl(apiClient: ref.watch(apiClientProvider));
});

// Expose l'interface abstraite — respecte le principe d'inversion des dépendances
final _loansRepositoryProvider = Provider<LoansRepository>((ref) {
  return LoansRepositoryImpl(ref.watch(_loansRemoteDataSourceProvider));
});

final loansProvider = FutureProvider<List<LoanEntity>>((ref) async {
  final ctx = await ref.watch(currentMembershipProvider.future);
  final useCase = GetLoansUseCase(ref.watch(_loansRepositoryProvider));
  return useCase(ctx.membershipId);
});
