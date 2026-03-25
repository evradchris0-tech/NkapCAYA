import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../features/profile/presentation/providers/profile_provider.dart';

/// Contexte résolu pour l'utilisateur connecté : profileId + membershipId actif.
class CurrentMembershipContext {
  final String profileId;
  final String membershipId;
  final String fiscalYearId;
  final double sharesCount;

  const CurrentMembershipContext({
    required this.profileId,
    required this.membershipId,
    required this.fiscalYearId,
    required this.sharesCount,
  });
}

/// Résout la chaîne : JWT userId → GET /members/me → profileId
/// → GET /members/:profileId/memberships → adheresion active.
///
/// Tous les providers (savings, loans, rescue-fund) dépendent de ce provider.
/// En cas d'erreur (pas d'adhésion active), AsyncValue.error est propagé.
final currentMembershipProvider =
    FutureProvider<CurrentMembershipContext>((ref) async {
  // 1. Profil depuis /members/me
  final profile = await ref.watch(myProfileProvider.future);

  // 2. Adhésions du profil
  final memberships = await ref
      .watch(profileRepositoryProvider)
      .getMemberships(profile.id);

  // 3. Sélectionner l'adhésion active du FY courant
  final active = memberships.firstWhere(
    (m) => m.isActive,
    orElse: () => throw Exception(
      'Aucune adhésion active trouvée pour le profil ${profile.memberCode}',
    ),
  );

  return CurrentMembershipContext(
    profileId: profile.id,
    membershipId: active.id,
    fiscalYearId: active.fiscalYearId,
    sharesCount: active.sharesCount,
  );
});
