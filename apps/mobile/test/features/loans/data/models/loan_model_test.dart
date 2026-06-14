import 'package:flutter_test/flutter_test.dart';
import 'package:caya_mobile/features/loans/data/models/loan_model.dart';
import 'package:caya_mobile/features/loans/domain/entities/loan_entity.dart';

/// Tests de contrat — vérifient que [LoanModel.fromJson] couvre tout l'enum
/// `LoanStatus` Prisma (PENDING / ACTIVE / PARTIALLY_REPAID / CLOSED).
void main() {
  group('LoanModel.fromJson() — contrat statut prêt', () {
    Map<String, dynamic> loanJson(String status) => {
          'id': 'loan-1',
          'membershipId': 'mem-1',
          'fiscalYearId': 'fy-1',
          'principalAmount': '500000.00',
          'outstandingBalance': '300000.00',
          'monthlyRate': '0.04',
          'status': status,
          'requestedAt': '2025-11-01T00:00:00.000Z',
          'disbursedAt': '2025-11-05T00:00:00.000Z',
          'dueBeforeDate': '2026-08-01T00:00:00.000Z',
          'totalInterestAccrued': '20000.00',
          'totalRepaid': '200000.00',
          'requestNotes': 'Projet',
        };

    test('T01 — PARTIALLY_REPAID est reconnu (et non rétrogradé en pending)', () {
      final m = LoanModel.fromJson(loanJson('PARTIALLY_REPAID'));
      expect(m.status, LoanStatus.partiallyRepaid);
    });

    test('T02 — un prêt partiellement remboursé compte comme « en cours »', () {
      final m = LoanModel.fromJson(loanJson('PARTIALLY_REPAID'));
      expect(m.isActive, isTrue); // → affiche encours + progression
      expect(m.isPartiallyRepaid, isTrue);
    });

    test('T03 — les statuts standards sont correctement mappés', () {
      expect(LoanModel.fromJson(loanJson('ACTIVE')).status, LoanStatus.active);
      expect(LoanModel.fromJson(loanJson('CLOSED')).status, LoanStatus.closed);
      expect(LoanModel.fromJson(loanJson('PENDING')).status, LoanStatus.pending);
    });

    test('T04 — statut inconnu → repli pending (pas de crash)', () {
      expect(LoanModel.fromJson(loanJson('WHATEVER')).status, LoanStatus.pending);
    });

    test('T05 — disbursedAt null est toléré', () {
      final json = loanJson('PENDING')..['disbursedAt'] = null;
      expect(LoanModel.fromJson(json).disbursedAt, isNull);
    });
  });
}
