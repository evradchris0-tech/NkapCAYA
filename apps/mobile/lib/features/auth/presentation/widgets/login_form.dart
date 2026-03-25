import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/utils/async_result.dart';
import '../../../../shared/widgets/caya_button.dart';
import '../providers/auth_notifier.dart';

class LoginForm extends ConsumerStatefulWidget {
  const LoginForm({super.key});

  @override
  ConsumerState<LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends ConsumerState<LoginForm> {
  final _formKey = GlobalKey<FormState>();
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    await ref.read(authNotifierProvider.notifier).login(
          identifier: _identifierController.text.trim(),
          password: _passwordController.text,
        );
  }

  /// Convertit un [AppFailure] en message lisible, avec switch exhaustif.
  String _errorMessage(AppFailure failure) => switch (failure) {
        NetworkFailure() =>
          'Pas de connexion réseau. Vérifiez votre connexion.',
        UnauthorizedFailure() => 'Identifiant ou mot de passe incorrect.',
        ValidationFailure() => 'Données invalides. Vérifiez vos informations.',
        ServerFailure() => 'Erreur serveur. Réessayez dans un moment.',
        NotFoundFailure() => 'Compte introuvable.',
        CacheFailure() => 'Erreur locale. Réessayez.',
        UnknownFailure(message: final m) => m,
      };

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(authNotifierProvider);
    final isLoading = state.isLoading;

    // Affichage de l'erreur via switch exhaustif sur AsyncResult
    final errorMessage = switch (state.result) {
      AsyncFailure(failure: final f) => _errorMessage(f),
      _ => null,
    };

    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (errorMessage != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.red.shade200),
              ),
              child: Row(
                children: [
                  Icon(Icons.error_outline,
                      color: Colors.red.shade700, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      errorMessage,
                      style:
                          TextStyle(color: Colors.red.shade700, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],
          TextFormField(
            controller: _identifierController,
            keyboardType: TextInputType.text,
            textInputAction: TextInputAction.next,
            decoration: const InputDecoration(
              labelText: 'Username ou Téléphone',
              prefixIcon: Icon(Icons.person_outline),
            ),
            validator: (v) {
              if (v == null || v.trim().isEmpty) return 'Identifiant requis';
              return null;
            },
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _passwordController,
            obscureText: _obscurePassword,
            textInputAction: TextInputAction.done,
            onFieldSubmitted: (_) => _submit(),
            decoration: InputDecoration(
              labelText: 'Mot de passe',
              prefixIcon: const Icon(Icons.lock_outline),
              suffixIcon: IconButton(
                icon: Icon(
                  _obscurePassword
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                ),
                onPressed: () =>
                    setState(() => _obscurePassword = !_obscurePassword),
              ),
            ),
            validator: (v) {
              if (v == null || v.isEmpty) return 'Mot de passe requis';
              if (v.length < 6) return 'Minimum 6 caractères';
              return null;
            },
          ),
          const SizedBox(height: 28),
          CayaButton(
            label: 'Se connecter',
            onPressed: _submit,
            isLoading: isLoading,
          ),
        ],
      ),
    );
  }
}
