import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_theme.dart';
import '../widgets/login_form.dart';

class LoginPage extends StatelessWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: AppColors.cayaBlueDark,
        body: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFF0F2347),
                AppColors.cayaBlue,
                AppColors.cayaBlueLight,
              ],
              stops: [0.0, 0.5, 1.0],
            ),
          ),
          child: SafeArea(
            child: SingleChildScrollView(
              physics: const ClampingScrollPhysics(),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: MediaQuery.of(context).size.height -
                      MediaQuery.of(context).padding.top -
                      MediaQuery.of(context).padding.bottom,
                ),
                child: IntrinsicHeight(
                  child: Column(
                    children: [
                      const Spacer(flex: 2),

                      // ── Logo + branding ──────────────────────────────────
                      Hero(
                        tag: 'caya_logo',
                        child: Image.asset(
                          'assets/images/caya_logo.png',
                          width: 88,
                          height: 88,
                        ),
                      ),
                      const SizedBox(height: 14),
                      Text(
                        'CAYA',
                        style: GoogleFonts.montserrat(
                          color: AppColors.white,
                          fontSize: 32,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 6,
                        ),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        'Caisse Autonome des Yaourtiers Associés',
                        style: GoogleFonts.lato(
                          color: AppColors.cayaGoldLight.withValues(alpha: 0.9),
                          fontSize: 11.5,
                          letterSpacing: 0.3,
                        ),
                        textAlign: TextAlign.center,
                      ),

                      const Spacer(flex: 2),

                      // ── Carte formulaire (toujours en thème clair) ───────
                      Theme(
                        data: AppTheme.lightTheme,
                        child: Container(
                          margin: const EdgeInsets.symmetric(horizontal: 20),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(28),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.22),
                                blurRadius: 32,
                                offset: const Offset(0, 12),
                              ),
                            ],
                          ),
                          child: Padding(
                            padding: const EdgeInsets.fromLTRB(24, 28, 24, 28),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Connexion',
                                  style: GoogleFonts.montserrat(
                                    color: AppColors.cayaBlue,
                                    fontSize: 22,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Accédez à votre espace membre',
                                  style: GoogleFonts.lato(
                                    color: AppColors.textSecondary,
                                    fontSize: 13,
                                  ),
                                ),
                                const SizedBox(height: 24),
                                const LoginForm(),
                              ],
                            ),
                          ),
                        ),
                      ),

                      const Spacer(flex: 1),

                      // ── Aide ─────────────────────────────────────────────
                      Padding(
                        padding: const EdgeInsets.only(bottom: 24),
                        child: Text(
                          'Problème de connexion ? Contactez votre administrateur.',
                          style: GoogleFonts.lato(
                            color: Colors.white.withValues(alpha: 0.45),
                            fontSize: 11,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
