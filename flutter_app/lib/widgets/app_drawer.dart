import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/theme_provider.dart';
import '../screens/settings_screen.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  // Calculate drawer width matching React Native logic
  double _calculateDrawerWidth(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final minWidth = size.width > size.height ? size.height : size.width;
    return minWidth > 434 ? 300 : minWidth * 0.83;
  }

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);
    final colors = themeProvider.colors;
    final drawerWidth = _calculateDrawerWidth(context);

    return Container(
      width: drawerWidth,
      color: colors.drawerBackgroundMac, // Use Mac background for web
      child: SafeArea(
        child: Column(
          children: [
            // Chat button
            InkWell(
              onTap: () {
                Navigator.of(context).pop();
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                child: Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.asset(
                        themeProvider.isDark
                            ? 'assets/bedrock_dark.png'
                            : 'assets/bedrock.png',
                        width: 24,
                        height: 24,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Chat',
                      style: TextStyle(
                        color: colors.text,
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            // Image button
            InkWell(
              onTap: () {
                Navigator.of(context).pop();
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                child: Row(
                  children: [
                    Icon(
                      Icons.image,
                      size: 24,
                      color: colors.text,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Image',
                      style: TextStyle(
                        color: colors.text,
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            // History list (empty for now)
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 4),
                children: const [],
              ),
            ),
            
            // Settings button
            InkWell(
              onTap: () {
                Navigator.of(context).pop();
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (context) => const SettingsScreen(),
                  ),
                );
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                child: Row(
                  children: [
                    Icon(
                      Icons.settings,
                      size: 24,
                      color: colors.text,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Settings',
                      style: TextStyle(
                        color: colors.text,
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            // Tools button
            InkWell(
              onTap: () {
                Navigator.of(context).pop();
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                child: Row(
                  children: [
                    Icon(
                      Icons.settings,
                      size: 24,
                      color: colors.text,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Tools',
                      style: TextStyle(
                        color: colors.text,
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            // MCP Servers button
            InkWell(
              onTap: () {
                Navigator.of(context).pop();
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                child: Row(
                  children: [
                    Icon(
                      Icons.settings,
                      size: 24,
                      color: colors.text,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'MCP Servers',
                      style: TextStyle(
                        color: colors.text,
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
