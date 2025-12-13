import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'theme/theme_provider.dart';
import 'navigation/app_router.dart';

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
        return MaterialApp.router(
          title: 'SwiftChat Flutter',
          debugShowCheckedModeBanner: false,
          routerConfig: router,
          theme: ThemeData(
            brightness: themeProvider.isDark ? Brightness.dark : Brightness.light,
            scaffoldBackgroundColor: themeProvider.colors.background,
            textTheme: GoogleFonts.interTextTheme(),
            fontFamily: GoogleFonts.inter().fontFamily,
          ),
        );
      },
    );
  }
}
