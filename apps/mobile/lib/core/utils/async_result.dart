import '../errors/failures.dart';

/// État sealed pour les mutations async (login, submit, etc.).
/// Utilisé dans les [StateNotifier] à la place des enums ad-hoc.
///
/// ```dart
/// switch (state.result) {
///   case AsyncIdle()    => Text('Prêt'),
///   case AsyncLoading() => CircularProgressIndicator(),
///   case AsyncSuccess(data: final u) => Text('Bienvenue ${u.name}'),
///   case AsyncFailure(failure: final f) => Text(failureMessage(f)),
/// }
/// ```
sealed class AsyncResult<T> {
  const AsyncResult();
}

/// Aucune opération en cours.
final class AsyncIdle<T> extends AsyncResult<T> {
  const AsyncIdle();
}

/// Opération en cours.
final class AsyncLoading<T> extends AsyncResult<T> {
  const AsyncLoading();
}

/// Opération réussie.
final class AsyncSuccess<T> extends AsyncResult<T> {
  final T data;
  const AsyncSuccess(this.data);
}

/// Opération échouée avec un [AppFailure] typé.
final class AsyncFailure<T> extends AsyncResult<T> {
  final AppFailure failure;
  const AsyncFailure(this.failure);
}
