import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/date_formatter.dart';
import '../../domain/entities/member_entity.dart';

class ProfileHeader extends StatelessWidget {
  final MemberEntity member;

  const ProfileHeader({super.key, required this.member});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.cayaBlue, AppColors.cayaBlueDark],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Column(
        children: [
          // Avatar
          CircleAvatar(
            radius: 44,
            backgroundColor: AppColors.cayaGold.withValues(alpha: 0.3),
            backgroundImage: member.photoUrl != null
                ? CachedNetworkImageProvider(member.photoUrl!)
                : null,
            child: member.photoUrl == null
                ? Text(
                    _initials(member.fullName),
                    style: const TextStyle(
                      color: AppColors.white,
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                    ),
                  )
                : null,
          ),
          const SizedBox(height: 12),
          Text(
            member.fullName,
            style: const TextStyle(
              color: AppColors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            member.memberCode,
            style: const TextStyle(
              color: AppColors.cayaGoldLight,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 4),
          _StatusBadge(status: member.status),
          const SizedBox(height: 16),
          // Stats row
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _Stat(label: 'Profession', value: member.profession),
              const SizedBox(width: 4),
              Container(width: 1, height: 28, color: Colors.white24),
              const SizedBox(width: 4),
              _Stat(
                label: 'Membre depuis',
                value: DateFormatter.formatMonthYear(member.joinDate),
              ),
              const SizedBox(width: 4),
              Container(width: 1, height: 28, color: Colors.white24),
              const SizedBox(width: 4),
              _Stat(
                label: 'Cotisations',
                value: '${member.contributionMonths} mois',
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _initials(String name) {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
    }
    return name.substring(0, name.length >= 2 ? 2 : 1).toUpperCase();
  }
}

class _StatusBadge extends StatelessWidget {
  final MemberStatus status;

  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final color = status == MemberStatus.active
        ? AppColors.success
        : status == MemberStatus.suspended
            ? AppColors.warning
            : AppColors.grey500;
    final label = status == MemberStatus.active
        ? 'Actif'
        : status == MemberStatus.suspended
            ? 'Suspendu'
            : 'Inactif';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.5)),
      ),
      child: Text(label, style: TextStyle(color: color, fontSize: 12)),
    );
  }
}

class _Stat extends StatelessWidget {
  final String label;
  final String value;

  const _Stat({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Text(
            value,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppColors.white,
              fontWeight: FontWeight.w600,
              fontSize: 12,
            ),
          ),
          Text(
            label,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white60, fontSize: 10),
          ),
        ],
      ),
    );
  }
}
