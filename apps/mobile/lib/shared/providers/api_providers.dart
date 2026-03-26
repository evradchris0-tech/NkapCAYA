import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/network/api_client.dart';
import 'tontine_provider.dart';

/// Instance unique de FlutterSecureStorage partagée entre tous les modules.
/// Le token refresh dépend de cette instance — une seule doit exister.
final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage();
});

/// Instance unique d'ApiClient.
/// Le baseUrl est résolu dynamiquement depuis la tontine sélectionnée ;
/// à défaut, on utilise la valeur du fichier .env (fallback dev local).
final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(secureStorageProvider);
  final tontine = ref.watch(tontineProvider);
  final baseUrl = tontine?.baseUrl ??
      dotenv.env['API_BASE_URL'] ??
      'https://nkapcaya-prod.up.railway.app/api/v1';
  return ApiClient(baseUrl: baseUrl, storage: storage);
});
