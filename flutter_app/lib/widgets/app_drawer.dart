import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/theme_provider.dart';
import '../screens/settings_screen.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  // Calculate drawer width matching React Native logic:
  // const minWidth = screenWidth > screenHeight ? screenHeight : screenWidth;
  // const width = minWidth > 434 ? 300 : minWidth * 0.83;
  double _calculateDrawerWidth(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final minWidth = size.width > size.height ? size.height : size.width;
    return minWidth > 434 ? 300 : minWidth * 0.83;
  }

  @override
  Widget build(BuildContext context) {
    final colors = Provider.of<ThemeProvider>(context).colors;
    final drawerWidth = _calculateDrawerWidth(context);

    return Drawer(
      width: drawerWidth,
      backgroundColor: colors.drawerBackground,
      child: SafeArea(
        child: Column(
          children: [
            // Chat button
            ListTile(
              leading: Image.asset(
                Provider.of<ThemeProvider>(context).isDark
                    ? 'assets/bedrock_dark.png'
                    : 'assets/bedrock.png',
                width: 24,
                height: 24,
              ),
              title: Text(
                'Chat',
                style: TextStyle(
                  color: colors.text,
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
              onTap: () {
                Navigator.of(context).pop();
              },
            ),
            
            const Divider(),
            
            // History section header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'History',
                  style: TextStyle(
                    color: colors.textSecondary,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
            
            // History list (simplified - empty for now)
            Expanded(
              child: Center(
                child: Text(
                  'No history yet',
                  style: TextStyle(
                    color: colors.textTertiary,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
            
            const Divider(),
            
            // Settings button
            ListTile(
              leading: Icon(Icons.settings, color: colors.text, size: 24),
              title: Text(
                'Settings',
                style: TextStyle(
                  color: colors.text,
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
              onTap: () {
                Navigator.of(context).pop();
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (context) => const SettingsScreen(),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
