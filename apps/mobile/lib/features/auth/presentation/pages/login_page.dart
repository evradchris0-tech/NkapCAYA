import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../widgets/login_form.dart';

class LoginPage extends StatelessWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.cayaBlue,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              // Header
              const SizedBox(height: 60),
              const Icon(
                Icons.account_balance,
                size: 64,
                color: AppColors.cayaGold,
              ),
              const SizedBox(height: 16),
              const Text(
                'CAYA',
                style: TextStyle(
                  color: AppColors.white,
                  fontSize: 36,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 4,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Club des Amis de Yaoundé',
                style: TextStyle(color: AppColors.cayaGoldLight, fontSize: 14),
              ),
              const SizedBox(height: 48),
              // Form card
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 24),
                padding: const EdgeInsets.all(28),
                decoration: BoxDecoration(
                  color: AppColors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.15),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Connexion',
                      style: Theme.of(context)
                          .textTheme
                          .headlineSmall
                          ?.copyWith(color: AppColors.cayaBlue),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Connectez-vous à votre espace membre',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 28),
                    const LoginForm(),
                  ],
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
