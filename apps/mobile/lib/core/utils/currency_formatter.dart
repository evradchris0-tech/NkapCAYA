import 'package:intl/intl.dart';

class CurrencyFormatter {
  CurrencyFormatter._();

  static final NumberFormat _formatter = NumberFormat.currency(
    locale: 'fr_CM',
    symbol: 'XAF',
    decimalDigits: 0,
  );

  static final NumberFormat _compactFormatter = NumberFormat.compactCurrency(
    locale: 'fr_CM',
    symbol: 'XAF',
    decimalDigits: 0,
  );

  /// Formats an amount as XAF currency.
  /// Example: 100000 → "100 000 XAF"
  static String format(num amount) {
    return _formatter.format(amount);
  }

  /// Formats an amount in compact form.
  /// Example: 1500000 → "1,5M XAF"
  static String formatCompact(num amount) {
    return _compactFormatter.format(amount);
  }

  /// Returns a plain formatted number without currency symbol.
  /// Example: 100000 → "100 000"
  static String formatNumber(num amount) {
    return NumberFormat('#,##0', 'fr_CM').format(amount);
  }

  /// Parses a formatted string back to a number.
  static num? parse(String value) {
    try {
      final cleaned =
          value.replaceAll(RegExp(r'[^\d,.]'), '').replaceAll(',', '.');
      return num.parse(cleaned);
    } catch (_) {
      return null;
    }
  }
}
