class AppException implements Exception {
  final String message;
  final int? statusCode;

  const AppException({required this.message, this.statusCode});

  @override
  String toString() =>
      'AppException(message: $message, statusCode: $statusCode)';
}

class NetworkException extends AppException {
  const NetworkException({super.message = 'Erreur réseau.'});
}

class ServerException extends AppException {
  const ServerException({required super.message, super.statusCode});
}

class UnauthorizedException extends AppException {
  const UnauthorizedException({super.message = 'Non autorisé.'})
      : super(statusCode: 401);
}

class NotFoundException extends AppException {
  const NotFoundException({super.message = 'Introuvable.'})
      : super(statusCode: 404);
}

class ValidationException extends AppException {
  final Map<String, List<String>>? fieldErrors;

  const ValidationException({
    super.message = 'Données invalides.',
    this.fieldErrors,
  }) : super(statusCode: 400);
}

class CacheException extends AppException {
  const CacheException({super.message = 'Erreur de stockage local.'});
}
