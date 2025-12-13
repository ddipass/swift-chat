import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../screens/chat_screen.dart';
import '../screens/settings_screen.dart';
import '../widgets/app_drawer.dart';

// Drawer state provider
class DrawerStateProvider extends ChangeNotifier {
  bool _isDrawerVisible = true;

  bool get isDrawerVisible => _isDrawerVisible;

  void toggleDrawer() {
    _isDrawerVisible = !_isDrawerVisible;
    notifyListeners();
  }

  void showDrawer() {
    _isDrawerVisible = true;
    notifyListeners();
  }

  void hideDrawer() {
    _isDrawerVisible = false;
    notifyListeners();
  }
}

final router = GoRouter(
  initialLocation: '/chat/-1',
  routes: [
    ShellRoute(
      builder: (context, state, child) {
        return ChangeNotifierProvider(
          create: (_) => DrawerStateProvider(),
          child: MainLayout(child: child),
        );
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
    final drawerState = Provider.of<DrawerStateProvider>(context);

    if (isMobile) {
      return Scaffold(
        drawer: const AppDrawer(),
        body: child,
      );
    } else {
      // Desktop: permanent drawer with toggle support
      return Scaffold(
        body: Row(
          children: [
            if (drawerState.isDrawerVisible) const AppDrawer(),
            Expanded(child: child),
          ],
        ),
      );
    }
  }
}
