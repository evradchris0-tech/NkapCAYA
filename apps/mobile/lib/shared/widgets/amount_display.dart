import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/currency_formatter.dart';

class AmountDisplay extends StatelessWidget {
  final num amount;
  final String? label;
  final double amountFontSize;
  final double labelFontSize;
  final Color amountColor;
  final bool compact;

  const AmountDisplay({
    super.key,
    required this.amount,
    this.label,
    this.amountFontSize = 24,
    this.labelFontSize = 12,
    this.amountColor = AppColors.cayaBlue,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final formatted = compact
        ? CurrencyFormatter.formatCompact(amount)
        : CurrencyFormatter.format(amount);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (label != null)
          Text(
            label!,
            style: TextStyle(
              fontSize: labelFontSize,
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
        if (label != null) const SizedBox(height: 4),
        Text(
          formatted,
          style: TextStyle(
            fontSize: amountFontSize,
            color: amountColor,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}
