import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'theme/theme_provider.dart';
import 'screens/chat_screen.dart';
import 'widgets/app_drawer.dart';

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
          home: kIsWeb ? const PermanentDrawerLayout() : const ChatScreen(),
        );
      },
    );
  }
}

// Permanent drawer layout for Web (like macOS)
class PermanentDrawerLayout extends StatelessWidget {
  const PermanentDrawerLayout({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const AppDrawer(),
        const Expanded(
          child: ChatScreen(showDrawerButton: false),
        ),
      ],
    );
  }
}
