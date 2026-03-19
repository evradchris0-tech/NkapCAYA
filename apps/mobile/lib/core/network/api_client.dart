import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/api_constants.dart';
import '../errors/exceptions.dart';

class ApiClient {
  late final Dio _dio;
  final FlutterSecureStorage _storage;

  ApiClient({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: const Duration(
          milliseconds: ApiConstants.connectTimeoutMs,
        ),
        receiveTimeout: const Duration(
          milliseconds: ApiConstants.receiveTimeoutMs,
        ),
        sendTimeout: const Duration(milliseconds: ApiConstants.sendTimeoutMs),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );
    _dio.interceptors.addAll([
      _AuthInterceptor(_storage, _dio),
      LogInterceptor(requestBody: true, responseBody: true, error: true),
    ]);
  }

  Dio get dio => _dio;

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.get<T>(
        path,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleDioException(e);
    }
  }

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await _dio.post<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _handleDioException(e);
    }
  }

  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Options? options,
  }) async {
    try {
      return await _dio.put<T>(path, data: data, options: options);
    } on DioException catch (e) {
      throw _handleDioException(e);
    }
  }

  Future<Response<T>> patch<T>(
    String path, {
    dynamic data,
    Options? options,
  }) async {
    try {
      return await _dio.patch<T>(path, data: data, options: options);
    } on DioException catch (e) {
      throw _handleDioException(e);
    }
  }

  Future<Response<T>> delete<T>(String path, {Options? options}) async {
    try {
      return await _dio.delete<T>(path, options: options);
    } on DioException catch (e) {
      throw _handleDioException(e);
    }
  }

  AppException _handleDioException(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.sendTimeout:
        return const NetworkException(message: 'Délai de connexion dépassé.');
      case DioExceptionType.connectionError:
        return const NetworkException();
      case DioExceptionType.badResponse:
        final statusCode = e.response?.statusCode;
        final message = _extractErrorMessage(e.response?.data);
        if (statusCode == 401) return UnauthorizedException(message: message);
        if (statusCode == 404) return NotFoundException(message: message);
        if (statusCode == 400) {
          return ValidationException(
            message: message,
            fieldErrors: _extractFieldErrors(e.response?.data),
          );
        }
        return ServerException(message: message, statusCode: statusCode);
      default:
        return AppException(message: e.message ?? 'Erreur inconnue.');
    }
  }

  String _extractErrorMessage(dynamic data) {
    if (data is Map) {
      return data['detail']?.toString() ??
          data['message']?.toString() ??
          data['error']?.toString() ??
          'Erreur serveur.';
    }
    return 'Erreur serveur.';
  }

  Map<String, List<String>>? _extractFieldErrors(dynamic data) {
    if (data is Map<String, dynamic>) {
      final result = <String, List<String>>{};
      data.forEach((key, value) {
        if (value is List) {
          result[key] = value.map((e) => e.toString()).toList();
        }
      });
      return result.isNotEmpty ? result : null;
    }
    return null;
  }
}

class _AuthInterceptor extends Interceptor {
  final FlutterSecureStorage _storage;
  final Dio _dio;
  late final Dio _refreshDio;
  bool _isRefreshing = false;

  _AuthInterceptor(this._storage, this._dio) {
    // Dio séparé sans interceptor pour le refresh — évite les boucles infinies
    _refreshDio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );
  }

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await _storage.read(key: ApiConstants.accessTokenKey);
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401 && !_isRefreshing) {
      final refreshed = await _tryRefreshToken();
      if (refreshed) {
        final token = await _storage.read(key: ApiConstants.accessTokenKey);
        err.requestOptions.headers['Authorization'] = 'Bearer $token';
        final response = await _dio.fetch(err.requestOptions);
        handler.resolve(response);
        return;
      }
    }
    handler.next(err);
  }

  Future<bool> _tryRefreshToken() async {
    if (_isRefreshing) return false;
    _isRefreshing = true;
    try {
      final refresh = await _storage.read(key: ApiConstants.refreshTokenKey);
      if (refresh == null) return false;
      final response = await _refreshDio.post(
        ApiConstants.tokenRefresh,
        data: {'refreshToken': refresh},
      );
      final tokens = response.data['tokens'] as Map<String, dynamic>?;
      if (tokens == null) return false;
      final newAccess = tokens['access'] as String?;
      final newRefresh = tokens['refresh'] as String?;
      if (newAccess != null) {
        await _storage.write(
          key: ApiConstants.accessTokenKey,
          value: newAccess,
        );
        if (newRefresh != null) {
          await _storage.write(
            key: ApiConstants.refreshTokenKey,
            value: newRefresh,
          );
        }
        return true;
      }
      return false;
    } catch (_) {
      return false;
    } finally {
      _isRefreshing = false;
    }
  }
}
