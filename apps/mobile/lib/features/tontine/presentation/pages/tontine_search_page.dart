import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../shared/providers/tontine_provider.dart';
import '../../../../shared/widgets/skeleton.dart';
import '../../domain/entities/tontine_entity.dart';
import '../widgets/tontine_card.dart';

class TontineSearchPage extends ConsumerStatefulWidget {
  const TontineSearchPage({super.key});

  @override
  ConsumerState<TontineSearchPage> createState() => _TontineSearchPageState();
}

class _TontineSearchPageState extends ConsumerState<TontineSearchPage> {
  final _searchController = TextEditingController();
  String _query = '';

  @override
  void initState() {
    super.initState();
    _searchController.addListener(() {
      setState(() => _query = _searchController.text.trim().toLowerCase());
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<TontineEntity> _filter(List<TontineEntity> all) {
    if (_query.isEmpty) return all;
    return all.where((t) {
      return t.name.toLowerCase().contains(_query) ||
          t.code.toLowerCase().contains(_query) ||
          t.city.toLowerCase().contains(_query);
    }).toList();
  }

  void _selectTontine(TontineEntity tontine) {
    ref.read(tontineProvider.notifier).select(tontine);
    context.go(AppConstants.routeLogin);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final searchAsync = ref.watch(tontineSearchProvider);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            // ── Header ──────────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 40, 24, 24),
              child: Column(
                children: [
                  // Logo
                  Image.asset(
                    'assets/images/caya_logo.png',
                    width: 80,
                    height: 80,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    AppConstants.appName,
                    style: theme.textTheme.headlineMedium?.copyWith(
                      color: AppColors.cayaBlue,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Trouvez votre tontine',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                    ),
                  ),
                  const SizedBox(height: 24),
                  // Search field
                  TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Nom, code (ex: CAYA2000) ou ville…',
                      prefixIcon: const Icon(Icons.search_rounded),
                      suffixIcon: _query.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear_rounded),
                              onPressed: _searchController.clear,
                            )
                          : null,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                      filled: true,
                      fillColor: theme.colorScheme.surfaceContainerHighest,
                    ),
                    textInputAction: TextInputAction.search,
                  ),
                ],
              ),
            ),

            // ── Results ─────────────────────────────────────────────────────
            Expanded(
              child: searchAsync.when(
                loading: () => const SkeletonList(count: 3),
                error: (_, __) => _buildEmpty(theme),
                data: (tontines) {
                  final results = _filter(tontines);
                  if (results.isEmpty) return _buildEmpty(theme);
                  return ListView.builder(
                    padding: const EdgeInsets.only(bottom: 24),
                    itemCount: results.length,
                    itemBuilder: (context, index) {
                      final tontine = results[index];
                      return TontineCard(
                        tontine: tontine,
                        onSelected: () => _selectTontine(tontine),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmpty(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.search_off_rounded,
            size: 52,
            color: theme.colorScheme.onSurface.withValues(alpha: 0.25),
          ),
          const SizedBox(height: 12),
          Text(
            'Aucune tontine trouvée',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurface.withValues(alpha: 0.5),
            ),
          ),
        ],
      ),
    );
  }
}
