import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../theme/theme_provider.dart';
import '../models/chat_history.dart';

class AppDrawer extends StatefulWidget {
  const AppDrawer({super.key});

  @override
  State<AppDrawer> createState() => _AppDrawerState();
}

class _AppDrawerState extends State<AppDrawer> {
  List<ChatHistoryItem> _historyItems = [];
  int? _selectedId;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  void _loadHistory() {
    // Mock data for now
    setState(() {
      _historyItems = [
        ChatHistoryItem(id: -1, title: 'Today', isSection: true),
        ChatHistoryItem(id: 1, title: 'How to use Flutter?', mode: 'text'),
        ChatHistoryItem(id: 2, title: 'Generate a logo', mode: 'image'),
        ChatHistoryItem(id: -2, title: 'Yesterday', isSection: true),
        ChatHistoryItem(id: 3, title: 'Explain React Native', mode: 'text'),
      ];
    });
  }

  double _calculateDrawerWidth(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final minWidth = size.width > size.height ? size.height : size.width;
    return minWidth > 434 ? 300 : minWidth * 0.83;
  }

  Widget _buildButton({
    required String text,
    required String iconPath,
    required VoidCallback onTap,
  }) {
    final themeProvider = Provider.of<ThemeProvider>(context);
    final colors = themeProvider.colors;

    return InkWell(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 12),
        padding: const EdgeInsets.symmetric(horizontal: 18),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.asset(
                iconPath,
                width: 24,
                height: 24,
              ),
            ),
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

  Widget _buildHistoryItem(ChatHistoryItem item) {
    final colors = Provider.of<ThemeProvider>(context).colors;
    final isSelected = _selectedId == item.id;

    return InkWell(
      onTap: () {
        setState(() => _selectedId = item.id);
        context.go('/chat/${item.id}?mode=${item.mode}');
      },
      onLongPress: () {
        _showDeleteDialog(item.id);
      },
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? colors.selectedBackgroundMac : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          item.title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            color: colors.text,
            fontSize: 16,
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    final colors = Provider.of<ThemeProvider>(context).colors;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 1,
            color: colors.border,
          ),
          const SizedBox(height: 17),
          Text(
            title,
            style: TextStyle(
              color: colors.textSecondary,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  void _showDeleteDialog(int id) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Message'),
        content: const Text('You cannot undo this action.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              setState(() {
                _historyItems.removeWhere((item) => item.id == id);
              });
              Navigator.pop(context);
            },
            child: const Text('Delete'),
          ),
        ],
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
            // Header buttons
            _buildButton(
              text: 'Chat',
              iconPath: themeProvider.isDark
                  ? 'bedrock_dark.png'
                  : 'bedrock.png',
              onTap: () => context.go('/chat/-1?mode=text'),
            ),
            _buildButton(
              text: 'Image',
              iconPath: themeProvider.isDark
                  ? 'image_dark.png'
                  : 'image.png',
              onTap: () => context.go('/chat/-1?mode=image'),
            ),

            // History list
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(vertical: 4),
                itemCount: _historyItems.length,
                itemBuilder: (context, index) {
                  final item = _historyItems[index];
                  if (item.isSection) {
                    return _buildSectionHeader(item.title);
                  } else {
                    return _buildHistoryItem(item);
                  }
                },
              ),
            ),

            // Footer buttons
            _buildButton(
              text: 'Settings',
              iconPath: themeProvider.isDark
                  ? 'settings_dark.png'
                  : 'settings.png',
              onTap: () => context.go('/settings'),
            ),
            _buildButton(
              text: 'Tools',
              iconPath: themeProvider.isDark
                  ? 'settings_dark.png'
                  : 'settings.png',
              onTap: () {},
            ),
            _buildButton(
              text: 'MCP Servers',
              iconPath: themeProvider.isDark
                  ? 'settings_dark.png'
                  : 'settings.png',
              onTap: () {},
            ),
          ],
        ),
      ),
    );
  }
}
