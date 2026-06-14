import 'package:flutter_test/flutter_test.dart';
import 'package:caya_mobile/features/savings/data/models/savings_model.dart';

/// Tests de contrat — vérifient que [SavingsModel.fromJson] reste aligné sur la
/// réponse réelle de l'API (`GET /savings/:membershipId` → SavingsLedger Prisma,
/// champs camelCase, Decimal sérialisés en chaîne).
void main() {
  group('SavingsModel.fromJson() — contrat API', () {
    // Réponse réelle (champs du modèle Prisma SavingsLedger)
    Map<String, dynamic> ledgerJson() => {
          'id': 'led-1',
          'membershipId': 'mem-1',
          'balance': '150000.00',
          'principalBalance': '120000.00',
          'totalInterestReceived': '30000.00',
          'lastUpdatedAt': '2026-06-14T10:30:00.000Z',
          'version': 1,
        };

    test('T01 — parse les montants Decimal (string) en double', () {
      final m = SavingsModel.fromJson(ledgerJson());
      expect(m.id, 'led-1');
      expect(m.membershipId, 'mem-1');
      expect(m.balance, 150000);
      expect(m.principalBalance, 120000);
      expect(m.totalInterestReceived, 30000);
    });

    test('T02 — lit `lastUpdatedAt` (champ Prisma réel), pas `updatedAt`', () {
      final m = SavingsModel.fromJson(ledgerJson());
      expect(m.updatedAt.year, 2026);
      expect(m.updatedAt.month, 6);
      expect(m.updatedAt.day, 14);
    });

    test('T03 — date absente : pas de crash, repli sur une date courante', () {
      final json = ledgerJson()..remove('lastUpdatedAt');
      final m = SavingsModel.fromJson(json); // ne doit pas lever
      expect(
        m.updatedAt.isAfter(DateTime.now().subtract(const Duration(minutes: 1))),
        isTrue,
      );
    });

    test('T04 — tolère un montant fourni en nombre (et non en chaîne)', () {
      final json = ledgerJson()..['balance'] = 150000;
      expect(SavingsModel.fromJson(json).balance, 150000);
    });
  });
}
