import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

enum CayaButtonVariant { primary, secondary, outlined, text }

class CayaButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final CayaButtonVariant variant;
  final bool isLoading;
  final IconData? leadingIcon;
  final double? width;

  const CayaButton({
    super.key,
    required this.label,
    this.onPressed,
    this.variant = CayaButtonVariant.primary,
    this.isLoading = false,
    this.leadingIcon,
    this.width,
  });

  @override
  Widget build(BuildContext context) {
    final child = isLoading
        ? const SizedBox(
            width: 22,
            height: 22,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: AppColors.white,
            ),
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (leadingIcon != null) ...[
                Icon(leadingIcon, size: 20),
                const SizedBox(width: 8),
              ],
              Text(label),
            ],
          );

    Widget button;
    switch (variant) {
      case CayaButtonVariant.primary:
        button = ElevatedButton(
          onPressed: isLoading ? null : onPressed,
          child: child,
        );
      case CayaButtonVariant.secondary:
        button = ElevatedButton(
          onPressed: isLoading ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.cayaGold,
            foregroundColor: AppColors.textOnGold,
          ),
          child: child,
        );
      case CayaButtonVariant.outlined:
        button = OutlinedButton(
          onPressed: isLoading ? null : onPressed,
          child: child,
        );
      case CayaButtonVariant.text:
        button = TextButton(
          onPressed: isLoading ? null : onPressed,
          child: child,
        );
    }

    if (width != null) {
      return SizedBox(width: width, child: button);
    }
    return button;
  }
}
