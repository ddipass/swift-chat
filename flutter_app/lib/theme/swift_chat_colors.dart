import 'package:flutter/material.dart';

/// SwiftChat color scheme - extracted from React Native colors.ts
/// Total: 52 color properties
class SwiftChatColors {
  final Color background;
  final Color surface;
  final Color surfaceSecondary;
  final Color text;
  final Color textSecondary;
  final Color textTertiary;
  final Color border;
  final Color borderLight;
  final Color shadow;
  final Color card;
  final Color input;
  final Color placeholder;
  final Color error;
  final Color success;
  final Color warning;
  final Color info;
  final Color primary;
  final Color primaryLight;
  final Color accent;
  final Color overlay;
  final Color codeBackground;
  final Color selectedBackground;
  final Color selectedBackgroundMac;
  final Color inputBackground;
  final Color labelBackground;
  final Color messageBackground;
  final Color reasoningBackground;
  final Color inputBorder;
  final Color drawerBackground;
  final Color drawerBackgroundMac;
  final Color promptButtonBackground;
  final Color promptButtonBorder;
  final Color promptText;
  final Color promptSelectedBorder;
  final Color promptAddButtonBackground;
  final Color promptAddButtonBorder;
  final Color promptAddText;
  final Color promptDeleteBackground;
  final Color promptDeleteText;
  final Color promptScreenInputBorder;
  final Color promptScreenSaveButton;
  final Color promptScreenSaveButtonText;
  final Color textDarkGray;
  final Color inputToolbarBorder;
  final Color fileListBackground;
  final Color fileItemBorder;
  final Color addButtonBackground;
  final Color chatScreenSplit;

  const SwiftChatColors({
    required this.background,
    required this.surface,
    required this.surfaceSecondary,
    required this.text,
    required this.textSecondary,
    required this.textTertiary,
    required this.border,
    required this.borderLight,
    required this.shadow,
    required this.card,
    required this.input,
    required this.placeholder,
    required this.error,
    required this.success,
    required this.warning,
    required this.info,
    required this.primary,
    required this.primaryLight,
    required this.accent,
    required this.overlay,
    required this.codeBackground,
    required this.selectedBackground,
    required this.selectedBackgroundMac,
    required this.inputBackground,
    required this.labelBackground,
    required this.messageBackground,
    required this.reasoningBackground,
    required this.inputBorder,
    required this.drawerBackground,
    required this.drawerBackgroundMac,
    required this.promptButtonBackground,
    required this.promptButtonBorder,
    required this.promptText,
    required this.promptSelectedBorder,
    required this.promptAddButtonBackground,
    required this.promptAddButtonBorder,
    required this.promptAddText,
    required this.promptDeleteBackground,
    required this.promptDeleteText,
    required this.promptScreenInputBorder,
    required this.promptScreenSaveButton,
    required this.promptScreenSaveButtonText,
    required this.textDarkGray,
    required this.inputToolbarBorder,
    required this.fileListBackground,
    required this.fileItemBorder,
    required this.addButtonBackground,
    required this.chatScreenSplit,
  });

  /// Light theme colors
  static const light = SwiftChatColors(
    background: Color(0xFFFFFFFF),
    surface: Color(0xFFF5F5F5),
    surfaceSecondary: Color(0xFFF9F9F9),
    text: Color(0xFF000000),
    textSecondary: Color(0xFF666666),
    textTertiary: Color(0xFF999999),
    border: Color(0xFFE0E0E0),
    borderLight: Color(0xFFEAEAEA),
    shadow: Color(0x1A000000), // rgba(0,0,0,0.1)
    card: Color(0xFFFFFFFF),
    input: Color(0xFFF8F8F8),
    placeholder: Color(0xFF999999),
    error: Color(0xFFFF4444),
    success: Color(0xFF00C851),
    warning: Color(0xFFFFBB33),
    info: Color(0xFF33B5E5),
    primary: Color(0xFF007AFF),
    primaryLight: Color(0xFFE3F2FD),
    accent: Color(0xFFFF6B6B),
    overlay: Color(0x80000000), // rgba(0,0,0,0.5)
    codeBackground: Color(0xFFF8F8F8),
    selectedBackground: Color(0xFFF5F5F5),
    selectedBackgroundMac: Color(0xFFECECEC),
    inputBackground: Color(0xFFFFFFFF),
    labelBackground: Color(0xFFFFFFFF),
    messageBackground: Color(0xFFF2F2F2),
    reasoningBackground: Color(0xFFF3F3F3),
    inputBorder: Color(0xFF808080),
    drawerBackground: Color(0x00000000), // transparent
    drawerBackgroundMac: Color(0xFFF9F9F9),
    promptButtonBackground: Color(0xFFE8E8E8),
    promptButtonBorder: Color(0xFFE8E8E8),
    promptText: Color(0xFF333333),
    promptSelectedBorder: Color(0xFF000000),
    promptAddButtonBackground: Color(0xFFFFFFFF),
    promptAddButtonBorder: Color(0xFF666666),
    promptAddText: Color(0xFF666666),
    promptDeleteBackground: Color(0xFF666666),
    promptDeleteText: Color(0xFFFFFFFF),
    promptScreenInputBorder: Color(0xFFE0E0E0),
    promptScreenSaveButton: Color(0xFF007AFF),
    promptScreenSaveButtonText: Color(0xFFFFFFFF),
    textDarkGray: Color(0xFF333333),
    inputToolbarBorder: Color(0xFF000000),
    fileListBackground: Color(0xFFFFFFFF),
    fileItemBorder: Color(0xFFE0E0E0),
    addButtonBackground: Color(0xFFF0F0F0),
    chatScreenSplit: Color(0xFFC7C7C7),
  );

  /// Dark theme colors
  static const dark = SwiftChatColors(
    background: Color(0xFF000000),
    surface: Color(0xFF1A1A1A),
    surfaceSecondary: Color(0xFF2A2A2A),
    text: Color(0xFFFFFFFF),
    textSecondary: Color(0xFFCCCCCC),
    textTertiary: Color(0xFF888888),
    border: Color(0xFF333333),
    borderLight: Color(0xFF444444),
    shadow: Color(0x1AFFFFFF), // rgba(255,255,255,0.1)
    card: Color(0xFF1A1A1A),
    input: Color(0xFF2A2A2A),
    placeholder: Color(0xFF888888),
    error: Color(0xFFFF6B6B),
    success: Color(0xFF51CF66),
    warning: Color(0xFFFFD43B),
    info: Color(0xFF74C0FC),
    primary: Color(0xFF0099FF),
    primaryLight: Color(0xFF1A1A2E),
    accent: Color(0xFFFF7979),
    overlay: Color(0xCC000000), // rgba(0,0,0,0.8)
    codeBackground: Color(0xFF1A1A1A),
    selectedBackground: Color(0xFF2A2A2A),
    selectedBackgroundMac: Color(0xFF333333),
    inputBackground: Color(0xFF000000),
    labelBackground: Color(0xFF000000),
    messageBackground: Color(0xFF2A2A2A),
    reasoningBackground: Color(0xFF2A2A2A),
    inputBorder: Color(0xFF555555),
    drawerBackground: Color(0xFF000000),
    drawerBackgroundMac: Color(0xFF000000),
    promptButtonBackground: Color(0xFF333333),
    promptButtonBorder: Color(0xFF333333),
    promptText: Color(0xFFCCCCCC),
    promptSelectedBorder: Color(0xFFCCCCCC),
    promptAddButtonBackground: Color(0xFF2A2A2A),
    promptAddButtonBorder: Color(0xFFCCCCCC),
    promptAddText: Color(0xFFCCCCCC),
    promptDeleteBackground: Color(0xFF888888),
    promptDeleteText: Color(0xFFFFFFFF),
    promptScreenInputBorder: Color(0xFF444444),
    promptScreenSaveButton: Color(0xFF0099FF),
    promptScreenSaveButtonText: Color(0xFFFFFFFF),
    textDarkGray: Color(0xFFCCCCCC),
    inputToolbarBorder: Color(0xFFCCCCCC),
    fileListBackground: Color(0xFF000000),
    fileItemBorder: Color(0xFFCCCCCC),
    addButtonBackground: Color(0xFF333333),
    chatScreenSplit: Color(0xFF404040),
  );
}
