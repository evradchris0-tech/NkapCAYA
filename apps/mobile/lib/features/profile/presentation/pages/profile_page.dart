import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/widgets/loading_widget.dart';
import '../../../../shared/widgets/error_widget.dart';
import '../../../auth/presentation/providers/auth_notifier.dart';
import '../providers/profile_provider.dart';
import '../widgets/profile_header.dart';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(myProfileProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mon Profil'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout_outlined),
            tooltip: 'Déconnexion',
            onPressed: () => _confirmLogout(context, ref),
          ),
        ],
      ),
      body: profileAsync.when(
        loading: () => const LoadingWidget(message: 'Chargement du profil...'),
        error: (e, _) => CayaErrorWidget(
          message: e.toString(),
          onRetry: () => ref.invalidate(myProfileProvider),
        ),
        data: (member) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(myProfileProvider),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: Column(
              children: [
                ProfileHeader(member: member),
                const SizedBox(height: 16),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Informations personnelles',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 12),
                      Card(
                        child: Column(
                          children: [
                            _InfoTile(
                              icon: Icons.phone_outlined,
                              label: 'Téléphone principal',
                              value: member.phone1,
                            ),
                            if (member.phone2 != null) ...[
                              const Divider(height: 1, indent: 56),
                              _InfoTile(
                                icon: Icons.phone_outlined,
                                label: 'Téléphone secondaire',
                                value: member.phone2!,
                              ),
                            ],
                            if (member.neighborhood != null) ...[
                              const Divider(height: 1, indent: 56),
                              _InfoTile(
                                icon: Icons.location_on_outlined,
                                label: 'Quartier',
                                value: member.neighborhood!,
                              ),
                            ],
                            if (member.mobileMoneyNumber != null) ...[
                              const Divider(height: 1, indent: 56),
                              _InfoTile(
                                icon: Icons.account_balance_wallet_outlined,
                                label: member.mobileMoneyType ?? 'Mobile Money',
                                value: member.mobileMoneyNumber!,
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        'Paramètres',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 12),
                      Card(
                        child: Column(
                          children: [
                            ListTile(
                              leading: const Icon(
                                Icons.notifications_outlined,
                                color: AppColors.cayaBlue,
                              ),
                              title: const Text('Notifications'),
                              trailing: const Icon(Icons.chevron_right),
                              onTap: () {},
                            ),
                            const Divider(height: 1, indent: 56),
                            ListTile(
                              leading: const Icon(
                                Icons.lock_outline,
                                color: AppColors.cayaBlue,
                              ),
                              title: const Text('Changer le mot de passe'),
                              trailing: const Icon(Icons.chevron_right),
                              onTap: () {},
                            ),
                            const Divider(height: 1, indent: 56),
                            ListTile(
                              leading: const Icon(
                                Icons.help_outline,
                                color: AppColors.cayaBlue,
                              ),
                              title: const Text('Aide & Support'),
                              trailing: const Icon(Icons.chevron_right),
                              onTap: () {},
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _confirmLogout(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Déconnexion'),
        content: const Text('Voulez-vous vraiment vous déconnecter ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Déconnecter'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await ref.read(authNotifierProvider.notifier).logout();
    }
  }
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoTile({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: AppColors.cayaBlue, size: 22),
      title: Text(
        label,
        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
      ),
      subtitle: Text(
        value,
        style: const TextStyle(fontSize: 14, color: AppColors.textPrimary),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
    );
  }
}
