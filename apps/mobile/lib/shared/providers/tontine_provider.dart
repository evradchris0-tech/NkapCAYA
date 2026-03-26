import 'dart:convert';
import 'package:flutter/foundation.dart' show kDebugMode;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../features/tontine/domain/entities/tontine_entity.dart';
import '../../features/tontine/data/datasources/tontine_remote_datasource.dart';

// ---------------------------------------------------------------------------
// Tontines connues — fallback si l'API /public/tontine-info est indisponible.
// En mode debug, une entrée locale est ajoutée si LOCAL_BASE_URL est défini
// dans le fichier .env (ex: LOCAL_BASE_URL=http://192.168.1.X:3000/api/v1).
// ---------------------------------------------------------------------------
List<TontineEntity> get kKnownTontines {
  final localUrl = kDebugMode ? dotenv.env['LOCAL_BASE_URL'] : null;
  return [
    if (localUrl != null && localUrl.isNotEmpty)
      TontineEntity(
        id: 'caya-local',
        name: 'CAYA — Serveur local',
        code: 'CAYA-DEV',
        city: 'Dev · ${localUrl.replaceAll(RegExp(r'https?://'), '').split('/').first}',
        baseUrl: localUrl,
        activeMembersCount: null,
      ),
    const TontineEntity(
      id: 'caya',
      name: 'Caisse Autonome des Yaourtiers Associés',
      code: 'CAYA',
      city: 'Yaoundé',
      baseUrl: 'https://nkapcaya-prod.up.railway.app/api/v1',
      activeMembersCount: null,
    ),
  ];
}

// ---------------------------------------------------------------------------
// Tontine search provider — appelle GET /public/tontine-info
// ---------------------------------------------------------------------------
final _tontineDataSourceProvider = Provider<TontineRemoteDataSource>(
  (_) => TontineRemoteDataSourceImpl(),
);

/// FutureProvider qui récupère les tontines disponibles depuis l'API publique.
/// En cas d'erreur (réseau, serveur), retombe sur [kKnownTontines].
final tontineSearchProvider = FutureProvider<List<TontineEntity>>((ref) async {
  final dataSource = ref.watch(_tontineDataSourceProvider);
  try {
    return await dataSource.fetchAvailableTontines();
  } catch (_) {
    return kKnownTontines;
  }
});

// ---------------------------------------------------------------------------
// SharedPreferences provider
// ---------------------------------------------------------------------------
final sharedPreferencesProvider = Provider<SharedPreferences>((ref) {
  throw UnimplementedError(
    'Override sharedPreferencesProvider in ProviderScope overrides',
  );
});

// ---------------------------------------------------------------------------
// TontineNotifier
// ---------------------------------------------------------------------------
const _kTontineKey = 'selected_tontine';

class TontineNotifier extends StateNotifier<TontineEntity?> {
  TontineNotifier(this._prefs) : super(null) {
    _load();
  }

  final SharedPreferences _prefs;

  void _load() {
    final raw = _prefs.getString(_kTontineKey);
    if (raw != null) {
      try {
        state = TontineEntity.fromJson(
          jsonDecode(raw) as Map<String, dynamic>,
        );
      } catch (_) {
        state = null;
      }
    }
  }

  void select(TontineEntity tontine) {
    state = tontine;
    _prefs.setString(_kTontineKey, jsonEncode(tontine.toJson()));
  }

  void clear() {
    state = null;
    _prefs.remove(_kTontineKey);
  }
}

final tontineProvider =
    StateNotifierProvider<TontineNotifier, TontineEntity?>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider);
  return TontineNotifier(prefs);
});
