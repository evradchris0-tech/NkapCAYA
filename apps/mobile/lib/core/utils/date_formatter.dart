import 'package:intl/intl.dart';

class DateFormatter {
  DateFormatter._();

  static final DateFormat _displayFormat = DateFormat('dd MMMM yyyy', 'fr_FR');
  static final DateFormat _shortFormat = DateFormat('dd/MM/yyyy', 'fr_FR');
  static final DateFormat _dateTimeFormat = DateFormat('dd/MM/yyyy HH:mm', 'fr_FR');
  static final DateFormat _apiFormat = DateFormat('yyyy-MM-dd');
  static final DateFormat _monthYearFormat = DateFormat('MMMM yyyy', 'fr_FR');

  /// Formats a DateTime for display.
  /// Example: 2024-03-19 → "19 mars 2024"
  static String formatDisplay(DateTime date) => _displayFormat.format(date);

  /// Formats a DateTime in short form.
  /// Example: 2024-03-19 → "19/03/2024"
  static String formatShort(DateTime date) => _shortFormat.format(date);

  /// Formats a DateTime with time.
  /// Example: 2024-03-19 14:30 → "19/03/2024 14:30"
  static String formatDateTime(DateTime date) => _dateTimeFormat.format(date);

  /// Formats a DateTime for API consumption.
  /// Example: 2024-03-19 → "2024-03-19"
  static String formatForApi(DateTime date) => _apiFormat.format(date);

  /// Formats as month and year.
  /// Example: 2024-03-19 → "mars 2024"
  static String formatMonthYear(DateTime date) => _monthYearFormat.format(date);

  /// Parses an API date string.
  static DateTime? parseApiDate(String? value) {
    if (value == null || value.isEmpty) return null;
    try {
      return DateTime.parse(value);
    } catch (_) {
      return null;
    }
  }

  /// Returns a relative label (today, yesterday, or formatted date).
  static String formatRelative(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final target = DateTime(date.year, date.month, date.day);
    final diff = today.difference(target).inDays;
    if (diff == 0) return "Aujourd'hui";
    if (diff == 1) return 'Hier';
    if (diff == -1) return 'Demain';
    return formatDisplay(date);
  }
}
