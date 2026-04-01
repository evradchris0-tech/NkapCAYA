import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:caya_mobile/features/tontine/domain/entities/tontine_entity.dart';
import 'package:caya_mobile/shared/providers/tontine_provider.dart';

const kTestTontine = TontineEntity(
  id: 'caya-test',
  name: 'CAYA Test',
  code: 'CAYA-TEST',
  city: 'Yaoundé',
  baseUrl: 'https://example.com/api/v1',
);

ProviderContainer _makeContainer(SharedPreferences prefs) {
  final container = ProviderContainer(overrides: [
    sharedPreferencesProvider.overrideWithValue(prefs),
  ]);
  addTearDown(container.dispose);
  return container;
}

void main() {
  group('TontineNotifier', () {
    test('T01 — état initial null quand aucune préférence enregistrée', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final container = _makeContainer(prefs);

      expect(container.read(tontineProvider), isNull);
    });

    test('T02 — select(tontine) met à jour le state', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final container = _makeContainer(prefs);

      container.read(tontineProvider.notifier).select(kTestTontine);

      expect(container.read(tontineProvider), equals(kTestTontine));
    });

    test('T03 — select(tontine) persiste le JSON dans SharedPreferences', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final container = _makeContainer(prefs);

      container.read(tontineProvider.notifier).select(kTestTontine);

      final raw = prefs.getString('selected_tontine');
      expect(raw, isNotNull);
      final decoded = jsonDecode(raw!) as Map<String, dynamic>;
      expect(decoded['id'], equals('caya-test'));
      expect(decoded['code'], equals('CAYA-TEST'));
    });

    test('T04 — clear() remet le state à null', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final container = _makeContainer(prefs);

      container.read(tontineProvider.notifier).select(kTestTontine);
      container.read(tontineProvider.notifier).clear();

      expect(container.read(tontineProvider), isNull);
    });

    test('T05 — clear() supprime la clé de SharedPreferences', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final container = _makeContainer(prefs);

      container.read(tontineProvider.notifier).select(kTestTontine);
      container.read(tontineProvider.notifier).clear();

      expect(prefs.getString('selected_tontine'), isNull);
    });

    test('T06 — construction avec prefs existantes restaure la tontine (round-trip)', () async {
      final stored = jsonEncode(kTestTontine.toJson());
      SharedPreferences.setMockInitialValues({'selected_tontine': stored});
      final prefs = await SharedPreferences.getInstance();
      final container = _makeContainer(prefs);

      // Wait for _load() synchronous read
      expect(container.read(tontineProvider), equals(kTestTontine));
    });

    test('T07 — JSON corrompu dans SharedPreferences → state null, pas de crash', () async {
      SharedPreferences.setMockInitialValues({'selected_tontine': '{not-valid-json'});
      final prefs = await SharedPreferences.getInstance();
      final container = _makeContainer(prefs);

      expect(container.read(tontineProvider), isNull);
    });
  });
}
