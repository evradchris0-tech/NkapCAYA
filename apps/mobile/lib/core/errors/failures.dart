/// Hiérarchie d'erreurs sealed (Dart 3) — le compilateur impose un switch exhaustif.
///
/// Usage :
/// ```dart
/// switch (failure) {
///   case NetworkFailure()      => 'Pas de connexion',
///   case UnauthorizedFailure() => 'Session expirée',
///   case ValidationFailure(fieldErrors: final e) => ...,
///   case ServerFailure(statusCode: final code)   => 'Erreur $code',
///   case NotFoundFailure()     => 'Introuvable',
///   case CacheFailure()        => 'Erreur cache',
///   case UnknownFailure(message: final m) => m,
/// }
/// ```
sealed class AppFailure {
  const AppFailure();
}

final class NetworkFailure extends AppFailure {
  final String message;
  const NetworkFailure({
    this.message = 'Erreur réseau. Vérifiez votre connexion.',
  });
}

final class ServerFailure extends AppFailure {
  final String message;
  final int statusCode;
  const ServerFailure({required this.message, this.statusCode = 500});
}

final class UnauthorizedFailure extends AppFailure {
  final String message;
  const UnauthorizedFailure({
    this.message = 'Session expirée. Veuillez vous reconnecter.',
  });
}

final class NotFoundFailure extends AppFailure {
  final String message;
  const NotFoundFailure({this.message = 'Ressource introuvable.'});
}

final class ValidationFailure extends AppFailure {
  final String message;
  final Map<String, List<String>>? fieldErrors;
  const ValidationFailure({
    this.message = 'Données invalides.',
    this.fieldErrors,
  });
}

final class CacheFailure extends AppFailure {
  final String message;
  const CacheFailure({this.message = 'Erreur de cache local.'});
}

final class UnknownFailure extends AppFailure {
  final String message;
  const UnknownFailure({this.message = 'Une erreur inattendue est survenue.'});
}

/// Convertit un [AppFailure] en message lisible par l'utilisateur.
String failureMessage(AppFailure failure) => switch (failure) {
      NetworkFailure(message: final m) => m,
      UnauthorizedFailure(message: final m) => m,
      ValidationFailure(message: final m) => m,
      ServerFailure(message: final m) => m,
      NotFoundFailure(message: final m) => m,
      CacheFailure(message: final m) => m,
      UnknownFailure(message: final m) => m,
    };
