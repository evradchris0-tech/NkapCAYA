import 'package:flutter/material.dart';
import '../../features/loans/domain/entities/loan_entity.dart';
import '../../features/profile/domain/entities/membership_entity.dart';
import '../theme/app_colors.dart';

extension LoanStatusX on LoanStatus {
  String get label => switch (this) {
        LoanStatus.pending => 'En attente',
        LoanStatus.active => 'En cours',
        LoanStatus.closed => 'Remboursé',
      };

  Color get color => switch (this) {
        LoanStatus.pending => AppColors.warning,
        LoanStatus.active => AppColors.info,
        LoanStatus.closed => AppColors.success,
      };

  Color get backgroundColor => color.withValues(alpha: 0.12);

  IconData get icon => switch (this) {
        LoanStatus.pending => Icons.schedule_rounded,
        LoanStatus.active => Icons.account_balance_wallet_outlined,
        LoanStatus.closed => Icons.check_circle_outline_rounded,
      };
}

extension MemberStatusX on MemberStatus {
  String get label => switch (this) {
        MemberStatus.active => 'Actif',
        MemberStatus.inactive => 'Inactif',
        MemberStatus.suspended => 'Suspendu',
        MemberStatus.excluded => 'Exclu',
      };

  Color get color => switch (this) {
        MemberStatus.active => AppColors.success,
        MemberStatus.inactive => AppColors.warning,
        MemberStatus.suspended => AppColors.warning,
        MemberStatus.excluded => AppColors.error,
      };

  Color get backgroundColor => color.withValues(alpha: 0.12);

  IconData get icon => switch (this) {
        MemberStatus.active => Icons.check_circle_outline,
        MemberStatus.inactive => Icons.pause_circle_outline,
        MemberStatus.suspended => Icons.block_outlined,
        MemberStatus.excluded => Icons.cancel_outlined,
      };
}
