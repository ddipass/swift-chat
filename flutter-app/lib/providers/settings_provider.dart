import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/bedrock_api_service.dart';
import 'chat_provider.dart';

class SettingsProvider with ChangeNotifier {
  bool _isDarkMode = false;
  String _apiUrl = '';
  String _apiKey = '';
  String _selectedModel = '';
  String _region = 'us-west-2';
  ChatProvider? _chatProvider;

  bool get isDarkMode => _isDarkMode;
  String get apiUrl => _apiUrl;
  String get apiKey => _apiKey;
  String get selectedModel => _selectedModel;
  String get region => _region;
  bool get isConfigured => _apiUrl.isNotEmpty && _apiKey.isNotEmpty;

  SettingsProvider() {
    _loadSettings();
  }

  void setChatProvider(ChatProvider provider) {
    _chatProvider = provider;
    _updateApiService();
  }

  void _updateApiService() {
    if (_chatProvider != null && isConfigured) {
      final service = BedrockApiService(
        apiUrl: _apiUrl,
        apiKey: _apiKey,
        region: _region,
      );
      _chatProvider!.setApiService(service);
    }
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    _isDarkMode = prefs.getBool('isDarkMode') ?? false;
    _apiUrl = prefs.getString('apiUrl') ?? '';
    _apiKey = prefs.getString('apiKey') ?? '';
    _selectedModel = prefs.getString('selectedModel') ?? '';
    _region = prefs.getString('region') ?? 'us-west-2';
    notifyListeners();
    _updateApiService();
  }

  Future<void> setDarkMode(bool value) async {
    _isDarkMode = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isDarkMode', value);
    notifyListeners();
  }

  Future<void> setApiUrl(String value) async {
    _apiUrl = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('apiUrl', value);
    notifyListeners();
    _updateApiService();
  }

  Future<void> setApiKey(String value) async {
    _apiKey = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('apiKey', value);
    notifyListeners();
    _updateApiService();
  }

  Future<void> setSelectedModel(String value) async {
    _selectedModel = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('selectedModel', value);
    notifyListeners();
  }

  Future<void> setRegion(String value) async {
    _region = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('region', value);
    notifyListeners();
    _updateApiService();
  }
}
