import 'package:flutter_test/flutter_test.dart';

import 'package:caya_mobile/core/errors/exceptions.dart';
import 'package:caya_mobile/core/errors/failures.dart';
import 'package:caya_mobile/features/loans/data/datasources/loans_remote_datasource.dart';
import 'package:caya_mobile/features/loans/data/models/loan_model.dart';
import 'package:caya_mobile/features/loans/data/repositories/loans_repository_impl.dart';

// ── Mock manuel — pas de mockito ni de code generation ──────────────────────

class _MockLoansDataSource implements LoansRemoteDataSource {
  Future<List<LoanModel>> Function(String)? onGetLoans;

  @override
  Future<List<LoanModel>> getLoans(String membershipId) async {
    if (onGetLoans != null) return onGetLoans!(membershipId);
    return [];
  }
}

void main() {
  group('LoansRepositoryImpl.getLoans()', () {
    late _MockLoansDataSource source;
    late LoansRepositoryImpl repo;

    setUp(() {
      source = _MockLoansDataSource();
      repo = LoansRepositoryImpl(source);
    });

    test('T01 — happy path : délègue au datasource et retourne le résultat', () async {
      source.onGetLoans = (_) async => [];
      final result = await repo.getLoans('mem-1');
      expect(result, isEmpty);
    });

    test('T02 — NetworkException → NetworkFailure (message conservé)', () {
      source.onGetLoans =
          (_) => throw const NetworkException(message: 'timeout réseau');

      expect(
        () => repo.getLoans('mem-1'),
        throwsA(
          isA<NetworkFailure>().having(
            (f) => f.message,
            'message',
            'timeout réseau',
          ),
        ),
      );
    });

    test('T03 — UnauthorizedException → UnauthorizedFailure', () {
      source.onGetLoans =
          (_) => throw const UnauthorizedException(message: 'token expiré');

      expect(
        () => repo.getLoans('mem-1'),
        throwsA(isA<UnauthorizedFailure>()),
      );
    });

    test('T04 — NotFoundException → NotFoundFailure', () {
      source.onGetLoans =
          (_) => throw const NotFoundException(message: 'membre introuvable');

      expect(
        () => repo.getLoans('mem-1'),
        throwsA(isA<NotFoundFailure>()),
      );
    });

    test('T05 — ValidationException → ValidationFailure avec fieldErrors conservés', () {
      source.onGetLoans = (_) => throw const ValidationException(
            message: 'données invalides',
            fieldErrors: {
              'membershipId': ['Champ requis'],
            },
          );

      expect(
        () => repo.getLoans('mem-1'),
        throwsA(
          isA<ValidationFailure>().having(
            (f) => f.fieldErrors,
            'fieldErrors',
            containsPair('membershipId', ['Champ requis']),
          ),
        ),
      );
    });

    test('T06 — Exception générique → UnknownFailure', () {
      source.onGetLoans = (_) => throw Exception('erreur inconnue');

      expect(
        () => repo.getLoans('mem-1'),
        throwsA(isA<UnknownFailure>()),
      );
    });
  });
}
