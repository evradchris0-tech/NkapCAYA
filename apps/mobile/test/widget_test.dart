import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:caya_mobile/main.dart';

void main() {
  testWidgets('App smoke test — ProviderScope wraps CayaApp',
      (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: CayaApp()));
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
