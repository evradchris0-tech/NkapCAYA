import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/network/api_client.dart';

/// Instance unique de FlutterSecureStorage partagée entre tous les modules.
/// Le token refresh dépend de cette instance — une seule doit exister.
final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage();
});

/// Instance unique d'ApiClient. L'intercepteur d'authentification utilise le
/// même SecureStorage que [secureStorageProvider], ce qui garantit que les
/// tokens écrits au login sont bien lus par le client HTTP.
final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(secureStorageProvider);
  return ApiClient(storage: storage);
});
