import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../shared/providers/api_providers.dart';
import '../../../../shared/providers/current_membership_provider.dart';
import '../../data/datasources/rescue_fund_remote_datasource.dart';
import '../../data/repositories/rescue_fund_repository_impl.dart';
import '../../domain/entities/rescue_fund_entity.dart';

final _rescueFundRemoteDataSourceProvider =
    Provider<RescueFundRemoteDataSource>((ref) {
  return RescueFundRemoteDataSourceImpl(
    apiClient: ref.watch(apiClientProvider),
  );
});

final _rescueFundRepositoryProvider =
    Provider<RescueFundRepositoryImpl>((ref) {
  return RescueFundRepositoryImpl(
    ref.watch(_rescueFundRemoteDataSourceProvider),
  );
});

/// Solde global du fonds de secours de l'exercice courant.
final rescueFundLedgerProvider =
    FutureProvider<RescueFundLedgerEntity>((ref) async {
  final repo = ref.watch(_rescueFundRepositoryProvider);
  return repo.getLedger();
});

/// Position individuelle du membre connecté dans le fonds de secours.
final rescueFundPositionProvider =
    FutureProvider<RescueFundPositionEntity>((ref) async {
  final ctx = await ref.watch(currentMembershipProvider.future);
  final repo = ref.watch(_rescueFundRepositoryProvider);
  return repo.getPosition(ctx.membershipId);
});
