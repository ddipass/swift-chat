import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'swift_chat_colors.dart';

class ThemeProvider extends ChangeNotifier {
  bool _isDark = false;
  
  bool get isDark => _isDark;
  SwiftChatColors get colors => _isDark ? SwiftChatColors.dark : SwiftChatColors.light;

  ThemeProvider() {
    _loadTheme();
  }

  Future<void> _loadTheme() async {
    final prefs = await SharedPreferences.getInstance();
    _isDark = prefs.getBool('isDark') ?? false;
    notifyListeners();
  }

  Future<void> toggleTheme() async {
    _isDark = !_isDark;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isDark', _isDark);
    notifyListeners();
  }
}
