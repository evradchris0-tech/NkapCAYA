import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/amount_display.dart';

class KpiCard extends StatelessWidget {
  final String title;
  final num amount;
  final IconData icon;
  final Color iconColor;
  final Color backgroundColor;
  final String? subtitle;
  final VoidCallback? onTap;

  const KpiCard({
    super.key,
    required this.title,
    required this.amount,
    required this.icon,
    this.iconColor = AppColors.cayaBlue,
    this.backgroundColor = AppColors.surface,
    this.subtitle,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      color: backgroundColor,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 13,
                      color: AppColors.textSecondary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: iconColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(icon, size: 20, color: iconColor),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              AmountDisplay(
                amount: amount,
                amountFontSize: 20,
                amountColor: iconColor,
              ),
              if (subtitle != null) ...[
                const SizedBox(height: 4),
                Text(
                  subtitle!,
                  style: const TextStyle(
                    fontSize: 11,
                    color: AppColors.textSecondary,
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
