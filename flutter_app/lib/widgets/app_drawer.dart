import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/theme_provider.dart';
import '../screens/settings_screen.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  double _calculateDrawerWidth(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final minWidth = size.width > size.height ? size.height : size.width;
    return minWidth > 434 ? 300 : minWidth * 0.83;
  }

  Widget _buildButton(BuildContext context, String text, Widget icon, VoidCallback onTap) {
    final colors = Provider.of<ThemeProvider>(context).colors;
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        child: Row(
          children: [
            icon,
            const SizedBox(width: 8),
            Text(
              text,
              style: TextStyle(
                color: colors.text,
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);
    final colors = themeProvider.colors;
    final drawerWidth = _calculateDrawerWidth(context);

    return Container(
      width: drawerWidth,
      color: colors.drawerBackgroundMac,
      child: SafeArea(
        child: Column(
          children: [
            _buildButton(
              context,
              'Chat',
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.asset(
                  themeProvider.isDark ? 'assets/bedrock_dark.png' : 'assets/bedrock.png',
                  width: 24,
                  height: 24,
                ),
              ),
              () {},
            ),
            _buildButton(
              context,
              'Image',
              Icon(Icons.image, size: 24, color: colors.text),
              () {},
            ),
            Expanded(child: ListView()),
            _buildButton(
              context,
              'Settings',
              Icon(Icons.settings, size: 24, color: colors.text),
              () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (context) => const SettingsScreen()),
                );
              },
            ),
            _buildButton(
              context,
              'Tools',
              Icon(Icons.build, size: 24, color: colors.text),
              () {},
            ),
            _buildButton(
              context,
              'MCP Servers',
              Icon(Icons.dns, size: 24, color: colors.text),
              () {},
            ),
          ],
        ),
      ),
    );
  }
}
