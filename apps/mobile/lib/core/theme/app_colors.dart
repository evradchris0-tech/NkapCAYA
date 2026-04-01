import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Brand colors
  static const Color cayaBlue = Color(0xFF1A3A6B);
  static const Color cayaBlueDark = Color(0xFF0F2347);
  static const Color cayaBlueLight = Color(0xFF2B5EA7);
  static const Color cayaGold = Color(0xFFC9A84C);
  static const Color cayaGoldDark = Color(0xFFA0822C);
  static const Color cayaGoldLight = Color(0xFFE8C96A);

  // Semantic colors
  static const Color success = Color(0xFF2E7D32);
  static const Color successLight = Color(0xFFE8F5E9);
  static const Color error = Color(0xFFC62828);
  static const Color errorLight = Color(0xFFFFEBEE);
  static const Color warning = Color(0xFFE65100);
  static const Color warningLight = Color(0xFFFFF3E0);
  static const Color info = Color(0xFF0277BD);
  static const Color infoLight = Color(0xFFE1F5FE);

  // Neutral
  static const Color white = Color(0xFFFFFFFF);
  static const Color black = Color(0xFF000000);
  static const Color grey50 = Color(0xFFFAFAFA);
  static const Color grey100 = Color(0xFFF5F5F5);
  static const Color grey200 = Color(0xFFEEEEEE);
  static const Color grey300 = Color(0xFFE0E0E0);
  static const Color grey400 = Color(0xFFBDBDBD);
  static const Color grey500 = Color(0xFF9E9E9E);
  static const Color grey600 = Color(0xFF757575);
  static const Color grey700 = Color(0xFF616161);
  static const Color grey800 = Color(0xFF424242);
  static const Color grey900 = Color(0xFF212121);

  // Background & surface
  static const Color background = Color(0xFFF4F6FA);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceVariant = Color(0xFFF0F2F8);

  // Text
  static const Color textPrimary = Color(0xFF1A1A2E);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color textDisabled = Color(0xFFBDBDBD);
  static const Color textOnPrimary = Color(0xFFFFFFFF);
  static const Color textOnGold = Color(0xFF1A1A2E);

  // ── Dark mode palette ────────────────────────────────────────────────────
  static const Color darkBackground = Color(0xFF0F1117);
  static const Color darkSurface = Color(0xFF1C1F26);
  static const Color darkSurfaceVariant = Color(0xFF252830);
  static const Color darkTextPrimary = Color(0xFFE8EAF0);
  static const Color darkTextSecondary = Color(0xFF9BA3B2);
  // Brand colors restent identiques en dark mode
  // Semantic colors restent identiques (success/error/warning/info)
}
