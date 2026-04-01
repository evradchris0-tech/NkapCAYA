import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:caya_mobile/main.dart';
import 'package:caya_mobile/shared/providers/tontine_provider.dart';

void main() {
  testWidgets('App smoke test — ProviderScope wraps CayaApp',
      (WidgetTester tester) async {
    // sharedPreferencesProvider nécessite un override en test
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          sharedPreferencesProvider.overrideWithValue(prefs),
        ],
        child: const CayaApp(),
      ),
    );

    // Drain splash timer (2800 ms) so no pending timers remain after test
    await tester.pump(const Duration(seconds: 3));

    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
