import 'package:flutter_test/flutter_test.dart';

import 'package:caya_mobile/shared/providers/auth_provider.dart';

void main() {
  group('AuthStateNotifier', () {
    late AuthStateNotifier notifier;

    setUp(() {
      notifier = AuthStateNotifier();
    });

    test('T01 — état initial : isAuthenticated=false, userId=null, role=null', () {
      expect(notifier.state.isAuthenticated, isFalse);
      expect(notifier.state.userId, isNull);
      expect(notifier.state.role, isNull);
    });

    test('T02 — setAuthenticated met à jour tous les champs', () {
      notifier.setAuthenticated(userId: 'u-001', role: 'TRESORIER');

      expect(notifier.state.isAuthenticated, isTrue);
      expect(notifier.state.userId, equals('u-001'));
      expect(notifier.state.role, equals('TRESORIER'));
    });

    test('T03 — deux appels successifs à setAuthenticated → le second écrase le premier', () {
      notifier.setAuthenticated(userId: 'u-001', role: 'TRESORIER');
      notifier.setAuthenticated(userId: 'u-002', role: 'PRESIDENT');

      expect(notifier.state.userId, equals('u-002'));
      expect(notifier.state.role, equals('PRESIDENT'));
    });

    test('T04 — setUnauthenticated après authentification → retour à l\'état initial', () {
      notifier.setAuthenticated(userId: 'u-001', role: 'TRESORIER');
      notifier.setUnauthenticated();

      expect(notifier.state.isAuthenticated, isFalse);
      expect(notifier.state.userId, isNull);
      expect(notifier.state.role, isNull);
    });

    test('T05 — setUnauthenticated sur état déjà déconnecté → pas d\'exception', () {
      expect(() => notifier.setUnauthenticated(), returnsNormally);
      expect(notifier.state.isAuthenticated, isFalse);
    });
  });
}
