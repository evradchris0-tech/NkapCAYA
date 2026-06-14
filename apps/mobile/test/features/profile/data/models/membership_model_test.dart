import 'package:flutter_test/flutter_test.dart';
import 'package:caya_mobile/features/profile/data/models/membership_model.dart';
import 'package:caya_mobile/features/profile/domain/entities/membership_entity.dart';

/// Tests de contrat — vérifient que [MembershipModel.fromJson] reste aligné sur
/// la réponse réelle de `GET /members/:id/memberships`
/// (Membership Prisma + relation `shareCommitment` incluse).
void main() {
  group('MembershipModel.fromJson() — contrat API', () {
    Map<String, dynamic> membershipJson() => {
          'id': 'ms-1',
          'profileId': 'prof-1', // champ Prisma réel (pas `memberProfileId`)
          'fiscalYearId': 'fy-1',
          'status': 'ACTIVE',
          'joinedAt': '2025-10-01T00:00:00.000Z',
          'joinedAtMonth': 1,
          'enrollmentType': 'NEW',
          'shareCommitment': {
            'sharesCount': '2.00',
            'monthlyAmount': '200000.00',
          },
          'fiscalYear': {'id': 'fy-1', 'label': '2025-2026', 'status': 'ACTIVE'},
        };

    test('T01 — `profileId` (API) est mappé vers memberProfileId', () {
      final m = MembershipModel.fromJson(membershipJson());
      expect(m.memberProfileId, 'prof-1');
    });

    test('T02 — sharesCount provient de la relation shareCommitment imbriquée', () {
      final m = MembershipModel.fromJson(membershipJson());
      expect(m.sharesCount, 2);
    });

    test('T03 — sans shareCommitment : repli sharesCount=1, pas de crash', () {
      final json = membershipJson()..remove('shareCommitment');
      final m = MembershipModel.fromJson(json);
      expect(m.sharesCount, 1);
    });

    test('T04 — status ACTIVE → MemberStatus.active', () {
      expect(MembershipModel.fromJson(membershipJson()).status,
          MemberStatus.active);
    });

    test('T05 — tolère un `memberProfileId` à plat (compat ascendante)', () {
      final json = membershipJson()
        ..remove('profileId')
        ..['memberProfileId'] = 'prof-9';
      expect(MembershipModel.fromJson(json).memberProfileId, 'prof-9');
    });
  });
}
