import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/currency_formatter.dart';

class PaymentsPage extends StatefulWidget {
  const PaymentsPage({super.key});

  @override
  State<PaymentsPage> createState() => _PaymentsPageState();
}

class _PaymentsPageState extends State<PaymentsPage>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text('Paiements'),
        centerTitle: false,
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(
              icon: Icon(Icons.phone_android_outlined),
              text: 'Orange Money',
            ),
            Tab(
              icon: Icon(Icons.sim_card_outlined),
              text: 'MTN MoMo',
            ),
          ],
          indicatorColor: AppColors.cayaGold,
          labelColor: AppColors.cayaBlue,
          unselectedLabelColor: AppColors.textSecondary,
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          _MobileMoneyTab(provider: MobileMoneyProvider.orange),
          _MobileMoneyTab(provider: MobileMoneyProvider.mtn),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Provider enum
// ---------------------------------------------------------------------------
enum MobileMoneyProvider {
  orange,
  mtn;

  String get displayName => switch (this) {
        MobileMoneyProvider.orange => 'Orange Money',
        MobileMoneyProvider.mtn => 'MTN Mobile Money',
      };

  Color get brandColor => switch (this) {
        MobileMoneyProvider.orange => const Color(0xFFFF6600),
        MobileMoneyProvider.mtn => const Color(0xFFFFCC00),
      };

  Color get brandTextColor => switch (this) {
        MobileMoneyProvider.orange => Colors.white,
        MobileMoneyProvider.mtn => Colors.black87,
      };

  IconData get icon => switch (this) {
        MobileMoneyProvider.orange => Icons.phone_android_outlined,
        MobileMoneyProvider.mtn => Icons.sim_card_outlined,
      };
}

// ---------------------------------------------------------------------------
// Mobile Money Tab
// ---------------------------------------------------------------------------
class _MobileMoneyTab extends StatefulWidget {
  final MobileMoneyProvider provider;
  const _MobileMoneyTab({required this.provider});

  @override
  State<_MobileMoneyTab> createState() => _MobileMoneyTabState();
}

class _MobileMoneyTabState extends State<_MobileMoneyTab> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  final _referenceController = TextEditingController();
  bool _isLoading = false;

  // Historique fictif pour la V1 UI
  final List<_PaymentHistoryItem> _history = [
    _PaymentHistoryItem(
      amount: 15000,
      reference: 'CM2024001',
      date: DateTime(2024, 3, 19),
      status: 'Réussi',
    ),
    _PaymentHistoryItem(
      amount: 10000,
      reference: 'CM2024002',
      date: DateTime(2024, 3, 5),
      status: 'Réussi',
    ),
  ];

  @override
  void dispose() {
    _amountController.dispose();
    _referenceController.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    // Simulation — aucun appel API pour la V1
    Future.delayed(const Duration(milliseconds: 800), () {
      if (!mounted) return;
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text(
            'Fonctionnalité en cours d\'activation — intégration API à venir.',
          ),
          backgroundColor: AppColors.cayaBlue,
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final provider = widget.provider;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ── Provider banner ────────────────────────────────────────────
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: BoxDecoration(
              color: provider.brandColor,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                Icon(provider.icon, color: provider.brandTextColor, size: 32),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      provider.displayName,
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: provider.brandTextColor,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'Intégration API en cours',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: provider.brandTextColor.withValues(alpha: 0.75),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // ── Payment form ────────────────────────────────────────────────
          Card(
            elevation: 1,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Effectuer un paiement',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 16),
                    // Amount
                    TextFormField(
                      controller: _amountController,
                      keyboardType: TextInputType.number,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                      ],
                      decoration: InputDecoration(
                        labelText: 'Montant (XAF)',
                        prefixIcon: const Icon(Icons.payments_outlined),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      validator: (v) {
                        if (v == null || v.isEmpty) {
                          return 'Veuillez saisir un montant';
                        }
                        final amount = int.tryParse(v);
                        if (amount == null || amount <= 0) {
                          return 'Montant invalide';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 12),
                    // Reference
                    TextFormField(
                      controller: _referenceController,
                      decoration: InputDecoration(
                        labelText: 'Référence (optionnel)',
                        prefixIcon: const Icon(Icons.tag_outlined),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),
                    // Submit button
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        onPressed: _isLoading ? null : _submit,
                        style: FilledButton.styleFrom(
                          backgroundColor: provider.brandColor,
                          foregroundColor: provider.brandTextColor,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        icon: _isLoading
                            ? SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: provider.brandTextColor,
                                ),
                              )
                            : const Icon(Icons.send_rounded),
                        label: Text(
                          _isLoading ? 'Traitement…' : 'Confirmer le paiement',
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          const SizedBox(height: 20),

          // ── History ─────────────────────────────────────────────────────
          Text(
            'Historique des paiements',
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 10),
          ..._history.map((item) => _PaymentTile(item: item)),
          if (_history.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Text(
                  'Aucun paiement enregistré',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurface.withValues(alpha: 0.45),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Payment history item model & tile
// ---------------------------------------------------------------------------
class _PaymentHistoryItem {
  final int amount;
  final String reference;
  final DateTime date;
  final String status;
  const _PaymentHistoryItem({
    required this.amount,
    required this.reference,
    required this.date,
    required this.status,
  });
}

class _PaymentTile extends StatelessWidget {
  final _PaymentHistoryItem item;
  const _PaymentTile({required this.item});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      elevation: 0,
      color: theme.colorScheme.surfaceContainerLowest,
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: ListTile(
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: AppColors.success.withValues(alpha: 0.12),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.check_circle_outline,
              color: AppColors.success, size: 20),
        ),
        title: Text(
          CurrencyFormatter.format(item.amount.toDouble()),
          style:
              theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
        ),
        subtitle: Text(
          'Réf : ${item.reference}',
          style: theme.textTheme.labelSmall?.copyWith(
            color: theme.colorScheme.onSurface.withValues(alpha: 0.55),
          ),
        ),
        trailing: Text(
          '${item.date.day.toString().padLeft(2, '0')}/${item.date.month.toString().padLeft(2, '0')}/${item.date.year}',
          style: theme.textTheme.labelSmall,
        ),
      ),
    );
  }
}
