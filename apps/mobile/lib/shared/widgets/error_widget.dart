import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/theme/app_colors.dart';
import '../providers/current_membership_provider.dart';

class CayaErrorWidget extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;
  final Object? error;

  const CayaErrorWidget({
    super.key,
    required this.message,
    this.onRetry,
    this.error,
  });

  @override
  Widget build(BuildContext context) {
    final isNoProfile = error is NoMemberProfileException ||
        message.contains('profil membre') ||
        message.contains('adhésion');

    final color = isNoProfile ? AppColors.cayaBlue : AppColors.error;
    final bgColor = isNoProfile
        ? AppColors.cayaBlue.withValues(alpha: 0.07)
        : AppColors.error.withValues(alpha: 0.07);
    final icon =
        isNoProfile ? Icons.person_off_outlined : Icons.error_outline_rounded;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: color.withValues(alpha: 0.2)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 32, color: color),
              ),
              const SizedBox(height: 16),
              Text(
                message,
                textAlign: TextAlign.center,
                style: GoogleFonts.lato(
                  fontSize: 14,
                  color: AppColors.textSecondary,
                  height: 1.5,
                ),
              ),
              if (onRetry != null && !isNoProfile) ...[
                const SizedBox(height: 20),
                OutlinedButton.icon(
                  onPressed: onRetry,
                  icon: const Icon(Icons.refresh, size: 16),
                  label: const Text('Réessayer'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: color,
                    side: BorderSide(color: color),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 10,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
