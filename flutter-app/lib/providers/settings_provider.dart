import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../services/bedrock_api_service.dart';
import '../services/ollama_api_service.dart';
import '../services/deepseek_api_service.dart';
import '../services/openai_api_service.dart';
import 'chat_provider.dart';

class SettingsProvider with ChangeNotifier {
  bool _isDarkMode = false;
  ApiProvider _selectedProvider = ApiProvider.bedrock;
  
  // Bedrock
  String _bedrockApiUrl = '';
  String _bedrockApiKey = '';
  String _bedrockRegion = 'us-west-2';
  
  // Ollama
  String _ollamaBaseUrl = 'http://localhost:11434';
  String _ollamaApiKey = '';
  
  // DeepSeek
  String _deepseekApiKey = '';
  
  // OpenAI
  String _openaiApiKey = '';
  String _openaiBaseUrl = '';
  
  ChatProvider? _chatProvider;

  bool get isDarkMode => _isDarkMode;
  ApiProvider get selectedProvider => _selectedProvider;
  
  String get bedrockApiUrl => _bedrockApiUrl;
  String get bedrockApiKey => _bedrockApiKey;
  String get bedrockRegion => _bedrockRegion;
  
  String get ollamaBaseUrl => _ollamaBaseUrl;
  String get ollamaApiKey => _ollamaApiKey;
  
  String get deepseekApiKey => _deepseekApiKey;
  
  String get openaiApiKey => _openaiApiKey;
  String get openaiBaseUrl => _openaiBaseUrl;
  
  bool get isConfigured {
    switch (_selectedProvider) {
      case ApiProvider.bedrock:
        return _bedrockApiUrl.isNotEmpty && _bedrockApiKey.isNotEmpty;
      case ApiProvider.ollama:
        return _ollamaBaseUrl.isNotEmpty;
      case ApiProvider.deepseek:
        return _deepseekApiKey.isNotEmpty;
      case ApiProvider.openai:
        return _openaiApiKey.isNotEmpty;
    }
  }

  SettingsProvider() {
    _loadSettings();
  }

  void setChatProvider(ChatProvider provider) {
    _chatProvider = provider;
    _updateApiService();
  }

  void _updateApiService() {
    if (_chatProvider == null || !isConfigured) return;

    ApiService? service;
    
    switch (_selectedProvider) {
      case ApiProvider.bedrock:
        service = BedrockApiService(
          apiUrl: _bedrockApiUrl,
          apiKey: _bedrockApiKey,
          region: _bedrockRegion,
        );
        break;
      case ApiProvider.ollama:
        service = OllamaApiService(
          baseUrl: _ollamaBaseUrl,
          apiKey: _ollamaApiKey.isEmpty ? null : _ollamaApiKey,
        );
        break;
      case ApiProvider.deepseek:
        service = DeepSeekApiService(apiKey: _deepseekApiKey);
        break;
      case ApiProvider.openai:
        service = OpenAIApiService(
          apiKey: _openaiApiKey,
          baseUrl: _openaiBaseUrl.isEmpty ? null : _openaiBaseUrl,
        );
        break;
    }

    if (service != null) {
      _chatProvider!.setApiService(service);
    }
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    _isDarkMode = prefs.getBool('isDarkMode') ?? false;
    _selectedProvider = ApiProvider.values[prefs.getInt('selectedProvider') ?? 0];
    
    _bedrockApiUrl = prefs.getString('bedrockApiUrl') ?? '';
    _bedrockApiKey = prefs.getString('bedrockApiKey') ?? '';
    _bedrockRegion = prefs.getString('bedrockRegion') ?? 'us-west-2';
    
    _ollamaBaseUrl = prefs.getString('ollamaBaseUrl') ?? 'http://localhost:11434';
    _ollamaApiKey = prefs.getString('ollamaApiKey') ?? '';
    
    _deepseekApiKey = prefs.getString('deepseekApiKey') ?? '';
    
    _openaiApiKey = prefs.getString('openaiApiKey') ?? '';
    _openaiBaseUrl = prefs.getString('openaiBaseUrl') ?? '';
    
    notifyListeners();
    _updateApiService();
  }

  Future<void> setDarkMode(bool value) async {
    _isDarkMode = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isDarkMode', value);
    notifyListeners();
  }

  Future<void> setSelectedProvider(ApiProvider provider) async {
    _selectedProvider = provider;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('selectedProvider', provider.index);
    notifyListeners();
    _updateApiService();
  }

  // Bedrock
  Future<void> setBedrockApiUrl(String value) async {
    _bedrockApiUrl = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('bedrockApiUrl', value);
    notifyListeners();
    if (_selectedProvider == ApiProvider.bedrock) _updateApiService();
  }

  Future<void> setBedrockApiKey(String value) async {
    _bedrockApiKey = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('bedrockApiKey', value);
    notifyListeners();
    if (_selectedProvider == ApiProvider.bedrock) _updateApiService();
  }

  Future<void> setBedrockRegion(String value) async {
    _bedrockRegion = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('bedrockRegion', value);
    notifyListeners();
    if (_selectedProvider == ApiProvider.bedrock) _updateApiService();
  }

  // Ollama
  Future<void> setOllamaBaseUrl(String value) async {
    _ollamaBaseUrl = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('ollamaBaseUrl', value);
    notifyListeners();
    if (_selectedProvider == ApiProvider.ollama) _updateApiService();
  }

  Future<void> setOllamaApiKey(String value) async {
    _ollamaApiKey = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('ollamaApiKey', value);
    notifyListeners();
    if (_selectedProvider == ApiProvider.ollama) _updateApiService();
  }

  // DeepSeek
  Future<void> setDeepSeekApiKey(String value) async {
    _deepseekApiKey = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('deepseekApiKey', value);
    notifyListeners();
    if (_selectedProvider == ApiProvider.deepseek) _updateApiService();
  }

  // OpenAI
  Future<void> setOpenAIApiKey(String value) async {
    _openaiApiKey = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('openaiApiKey', value);
    notifyListeners();
    if (_selectedProvider == ApiProvider.openai) _updateApiService();
  }

  Future<void> setOpenAIBaseUrl(String value) async {
    _openaiBaseUrl = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('openaiBaseUrl', value);
    notifyListeners();
    if (_selectedProvider == ApiProvider.openai) _updateApiService();
  }
}
