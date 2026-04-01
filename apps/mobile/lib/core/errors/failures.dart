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
  @override
  String toString() => message;
}

final class ServerFailure extends AppFailure {
  final String message;
  final int statusCode;
  const ServerFailure({required this.message, this.statusCode = 500});
  @override
  String toString() =>
      message.isNotEmpty ? message : 'Erreur serveur ($statusCode).';
}

final class UnauthorizedFailure extends AppFailure {
  final String message;
  const UnauthorizedFailure({
    this.message = 'Session expirée. Veuillez vous reconnecter.',
  });
  @override
  String toString() => message;
}

final class NotFoundFailure extends AppFailure {
  final String message;
  const NotFoundFailure({this.message = 'Ressource introuvable.'});
  @override
  String toString() => message;
}

final class ValidationFailure extends AppFailure {
  final String message;
  final Map<String, List<String>>? fieldErrors;
  const ValidationFailure({
    this.message = 'Données invalides.',
    this.fieldErrors,
  });
  @override
  String toString() => message;
}

final class CacheFailure extends AppFailure {
  final String message;
  const CacheFailure({this.message = 'Erreur de cache local.'});
  @override
  String toString() => message;
}

final class UnknownFailure extends AppFailure {
  final String message;
  const UnknownFailure({this.message = 'Une erreur inattendue est survenue.'});
  @override
  String toString() =>
      message.isNotEmpty ? message : 'Une erreur inattendue est survenue.';
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
