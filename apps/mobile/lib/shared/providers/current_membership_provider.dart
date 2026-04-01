import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/errors/failures.dart';
import '../../features/profile/domain/entities/membership_entity.dart';
import '../../features/profile/presentation/providers/profile_provider.dart';

/// Exception métier : l'utilisateur connecté n'a pas de profil membre actif.
/// Distincte de AppFailure pour permettre un affichage spécifique dans l'UI
/// (ex: SUPER_ADMIN sans adhésion).
class NoMemberProfileException implements Exception {
  final String message;
  const NoMemberProfileException([
    this.message =
        'Votre compte n\'est pas lié à un profil membre.\nContactez votre administrateur.',
  ]);
  @override
  String toString() => message;
}

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
/// → GET /members/:profileId/memberships → adhésion active.
///
/// Si l'utilisateur n'a pas de profil membre (ex: SUPER_ADMIN sans adhésion),
/// lève [NoMemberProfileException] pour un affichage adapté dans l'UI.
final currentMembershipProvider =
    FutureProvider<CurrentMembershipContext>((ref) async {
  try {
    // 1. Profil depuis GET /members/me
    final profile = await ref.watch(myProfileProvider.future);

    // 2. Adhésions du profil
    final memberships =
        await ref.watch(profileRepositoryProvider).getMemberships(profile.id);

    // 3. Sélectionner l'adhésion active
    MembershipEntity? active;
    for (final m in memberships) {
      if (m.isActive) {
        active = m;
        break;
      }
    }
    if (active == null) {
      throw const NoMemberProfileException(
        'Aucune adhésion active trouvée pour ce compte.',
      );
    }

    return CurrentMembershipContext(
      profileId: profile.id,
      membershipId: active.id,
      fiscalYearId: active.fiscalYearId,
      sharesCount: active.sharesCount,
    );
  } on NoMemberProfileException {
    rethrow;
  } on NotFoundFailure {
    // L'utilisateur n'a pas de profil membre (ex: SUPER_ADMIN)
    throw const NoMemberProfileException();
  }
});
