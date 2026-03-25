import 'package:flutter/material.dart';

/// Widget qui anime l'apparition d'un élément de liste en cascade.
///
/// Usage :
/// ```dart
/// ListView.builder(
///   itemBuilder: (context, index) => AnimatedListItem(
///     index: index,
///     child: MyCard(item: items[index]),
///   ),
/// )
/// ```
///
/// Chaque item apparaît avec un décalage de `index × 80ms` — l'effet cascade
/// donne l'impression que la liste se construit progressivement.
class AnimatedListItem extends StatefulWidget {
  final int index;
  final Widget child;
  final Duration itemDuration;
  final Duration delayStep;

  const AnimatedListItem({
    super.key,
    required this.index,
    required this.child,
    this.itemDuration = const Duration(milliseconds: 350),
    this.delayStep = const Duration(milliseconds: 80),
  });

  @override
  State<AnimatedListItem> createState() => _AnimatedListItemState();
}

class _AnimatedListItemState extends State<AnimatedListItem>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _fade;
  late final Animation<Offset> _slide;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: widget.itemDuration,
    );

    _fade = CurvedAnimation(parent: _controller, curve: Curves.easeOut);

    _slide = Tween<Offset>(
      begin: const Offset(0, 0.15),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic));

    // Délai en cascade : chaque item attend index × delayStep avant de démarrer
    final delay = widget.delayStep * widget.index;
    Future.delayed(delay, () {
      if (mounted) _controller.forward();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fade,
      child: SlideTransition(
        position: _slide,
        // Le child est const — instancié une seule fois, réutilisé dans le builder
        child: widget.child,
      ),
    );
  }
}
