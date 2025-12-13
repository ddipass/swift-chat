import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'theme/theme_provider.dart';
import 'theme/swift_chat_colors.dart';

void main() {
  runApp(
    ChangeNotifierProvider(
      create: (_) => ThemeProvider(),
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        return MaterialApp(
          title: 'SwiftChat Flutter',
          debugShowCheckedModeBanner: false,
          theme: ThemeData(
            brightness: themeProvider.isDark ? Brightness.dark : Brightness.light,
            scaffoldBackgroundColor: themeProvider.colors.background,
            textTheme: GoogleFonts.interTextTheme(),
            fontFamily: GoogleFonts.inter().fontFamily,
          ),
          home: const ThemeTestScreen(),
        );
      },
    );
  }
}

class ThemeTestScreen extends StatelessWidget {
  const ThemeTestScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);
    final colors = themeProvider.colors;

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        backgroundColor: colors.surface,
        title: Text(
          'SwiftChat Theme Test',
          style: TextStyle(color: colors.text),
        ),
        actions: [
          IconButton(
            icon: Icon(
              themeProvider.isDark ? Icons.light_mode : Icons.dark_mode,
              color: colors.text,
            ),
            onPressed: () => themeProvider.toggleTheme(),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '✅ Week 1 Day 1-2 Complete!',
              style: TextStyle(
                color: colors.success,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Theme: ${themeProvider.isDark ? 'Dark 🌙' : 'Light ☀️'}',
              style: TextStyle(
                color: colors.text,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Total colors: 52',
              style: TextStyle(
                color: colors.textSecondary,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Tap the theme icon ☝️ to toggle',
              style: TextStyle(
                color: colors.textTertiary,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 32),
            _buildColorPreview('Background', colors.background, colors),
            _buildColorPreview('Surface', colors.surface, colors),
            _buildColorPreview('Text', colors.text, colors),
            _buildColorPreview('Primary', colors.primary, colors),
            _buildColorPreview('Success', colors.success, colors),
            _buildColorPreview('Error', colors.error, colors),
            _buildColorPreview('Message BG', colors.messageBackground, colors),
          ],
        ),
      ),
    );
  }

  Widget _buildColorPreview(String name, Color color, SwiftChatColors colors) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: color,
              border: Border.all(color: colors.border),
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          const SizedBox(width: 16),
          Text(
            name,
            style: TextStyle(
              color: colors.text,
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }
}
