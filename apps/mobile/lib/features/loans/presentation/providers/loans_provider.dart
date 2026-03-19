import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../data/datasources/loans_remote_datasource.dart';
import '../../data/repositories/loans_repository_impl.dart';
import '../../domain/entities/loan_entity.dart';
import '../../domain/usecases/get_my_loans_usecase.dart';

final _loansRemoteDataSourceProvider = Provider<LoansRemoteDataSource>((ref) {
  return LoansRemoteDataSourceImpl(apiClient: ApiClient());
});

final _loansRepositoryProvider = Provider<LoansRepositoryImpl>((ref) {
  return LoansRepositoryImpl(ref.watch(_loansRemoteDataSourceProvider));
});

final myLoansProvider = FutureProvider<List<LoanEntity>>((ref) async {
  final useCase = GetMyLoansUseCase(ref.watch(_loansRepositoryProvider));
  return useCase();
});
