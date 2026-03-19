import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../shared/widgets/loading_widget.dart';
import '../../../../shared/widgets/error_widget.dart';
import '../../domain/entities/loan_entity.dart';
import '../providers/loans_provider.dart';
import '../widgets/loan_card.dart';

class LoansPage extends ConsumerWidget {
  const LoansPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final loansAsync = ref.watch(myLoansProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Mes Prêts')),
      body: loansAsync.when(
        loading: () => const LoadingWidget(message: 'Chargement des prêts...'),
        error: (e, _) => CayaErrorWidget(
          message: e.toString(),
          onRetry: () => ref.invalidate(myLoansProvider),
        ),
        data: (loans) {
          if (loans.isEmpty) {
            return const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.account_balance_outlined, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Text(
                    'Aucun prêt pour le moment',
                    style: TextStyle(color: Colors.grey, fontSize: 15),
                  ),
                ],
              ),
            );
          }

          final active = loans.where((l) => l.isActive || l.isOverdue).toList();
          final others = loans.where((l) => !l.isActive && !l.isOverdue).toList();

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(myLoansProvider),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (active.isNotEmpty) ...[
                  _sectionTitle(context, 'En cours'),
                  const SizedBox(height: 8),
                  ...active.map((l) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: LoanCard(loan: l),
                      )),
                  const SizedBox(height: 8),
                ],
                if (others.isNotEmpty) ...[
                  _sectionTitle(context, 'Historique'),
                  const SizedBox(height: 8),
                  ...others.map((l) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: LoanCard(loan: l),
                      )),
                ],
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _sectionTitle(BuildContext context, String title) {
    return Text(title, style: Theme.of(context).textTheme.titleMedium);
  }
}
