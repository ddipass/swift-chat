import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../screens/chat_screen.dart';
import '../screens/settings_screen.dart';

final router = GoRouter(
  initialLocation: '/chat/-1',
  routes: [
    ShellRoute(
      builder: (context, state, child) {
        return MainLayout(child: child);
      },
      routes: [
        GoRoute(
          path: '/chat/:sessionId',
          builder: (context, state) {
            final sessionId = int.parse(state.pathParameters['sessionId'] ?? '-1');
            final tapIndex = int.parse(state.uri.queryParameters['tapIndex'] ?? '1');
            final mode = state.uri.queryParameters['mode'] ?? 'text';
            return ChatScreen(
              sessionId: sessionId,
              tapIndex: tapIndex,
              mode: mode,
            );
          },
        ),
        GoRoute(
          path: '/settings',
          builder: (context, state) => const SettingsScreen(),
        ),
      ],
    ),
  ],
);

class MainLayout extends StatelessWidget {
  final Widget child;

  const MainLayout({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final minWidth = size.width > size.height ? size.height : size.width;
    final isMobile = minWidth <= 434;

    if (isMobile) {
      return Scaffold(
        drawer: const AppDrawer(),
        body: child,
      );
    } else {
      return Scaffold(
        body: Row(
          children: [
            const AppDrawer(),
            Expanded(child: child),
          ],
        ),
      );
    }
  }
}

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 300,
      color: Colors.grey[900],
      child: const Center(child: Text('Drawer', style: TextStyle(color: Colors.white))),
    );
  }
}
