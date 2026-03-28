import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../shared/providers/api_providers.dart';
import '../../../../shared/providers/current_membership_provider.dart';
import '../../data/datasources/rescue_fund_remote_datasource.dart';
import '../../data/repositories/rescue_fund_repository_impl.dart';
import '../../domain/entities/rescue_fund_entity.dart';
import '../../domain/repositories/rescue_fund_repository.dart';

final _rescueFundRemoteDataSourceProvider =
    Provider<RescueFundRemoteDataSource>((ref) {
  return RescueFundRemoteDataSourceImpl(
    apiClient: ref.watch(apiClientProvider),
  );
});

// Expose l'interface abstraite — respecte le principe d'inversion des dépendances
final _rescueFundRepositoryProvider = Provider<RescueFundRepository>((ref) {
  return RescueFundRepositoryImpl(
    ref.watch(_rescueFundRemoteDataSourceProvider),
  );
});

/// Solde global du fonds de secours pour l'exercice courant.
/// Nécessite un profil membre pour obtenir le fiscalYearId.
final rescueFundLedgerProvider =
    FutureProvider<RescueFundLedgerEntity>((ref) async {
  final ctx = await ref.watch(currentMembershipProvider.future);
  return ref.watch(_rescueFundRepositoryProvider).getLedger(ctx.fiscalYearId);
});

/// Position individuelle du membre dans le fonds de secours.
/// Retourne null tant que l'endpoint backend n'est pas implémenté.
final rescueFundPositionProvider =
    FutureProvider<RescueFundPositionEntity?>((ref) async {
  final ctx = await ref.watch(currentMembershipProvider.future);
  return ref
      .watch(_rescueFundRepositoryProvider)
      .getPosition(ctx.fiscalYearId, ctx.membershipId);
});
