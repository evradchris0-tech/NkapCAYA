import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../../domain/entities/tontine_entity.dart';

/// Datasource public — aucune authentification requise.
/// Appelle GET /public/tontine-info sur l'URL de découverte (.env).
abstract class TontineRemoteDataSource {
  /// Retourne la liste des tontines disponibles depuis le serveur de découverte.
  Future<List<TontineEntity>> fetchAvailableTontines();
}

class TontineRemoteDataSourceImpl implements TontineRemoteDataSource {
  TontineRemoteDataSourceImpl();

  /// Crée un Dio sans intercepteur d'authentification.
  Dio _buildPublicDio(String baseUrl) {
    return Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );
  }

  @override
  Future<List<TontineEntity>> fetchAvailableTontines() async {
    final discoveryUrl =
        dotenv.env['API_BASE_URL'] ?? 'http://192.168.1.33:3000/api/v1';
    final dio = _buildPublicDio(discoveryUrl);

    final response =
        await dio.get<Map<String, dynamic>>('/public/tontine-info');
    final data = response.data!;
    return [TontineEntity.fromJson(data)];
  }
}
