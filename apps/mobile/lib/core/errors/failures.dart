abstract class Failure {
  final String message;
  final int? statusCode;

  const Failure({required this.message, this.statusCode});

  @override
  String toString() => 'Failure(message: $message, statusCode: $statusCode)';
}

class NetworkFailure extends Failure {
  const NetworkFailure({super.message = 'Erreur réseau. Vérifiez votre connexion.'});
}

class ServerFailure extends Failure {
  const ServerFailure({required super.message, super.statusCode});
}

class UnauthorizedFailure extends Failure {
  const UnauthorizedFailure({super.message = 'Session expirée. Veuillez vous reconnecter.'})
      : super(statusCode: 401);
}

class NotFoundFailure extends Failure {
  const NotFoundFailure({super.message = 'Ressource introuvable.'})
      : super(statusCode: 404);
}

class ValidationFailure extends Failure {
  final Map<String, List<String>>? fieldErrors;

  const ValidationFailure({
    super.message = 'Données invalides.',
    this.fieldErrors,
  }) : super(statusCode: 400);
}

class CacheFailure extends Failure {
  const CacheFailure({super.message = 'Erreur de cache local.'});
}

class UnknownFailure extends Failure {
  const UnknownFailure({super.message = 'Une erreur inattendue est survenue.'});
}
