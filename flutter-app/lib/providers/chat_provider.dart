import 'package:flutter/foundation.dart';
import '../models/message.dart';
import '../models/conversation.dart';
import '../services/bedrock_api_service.dart';

class ChatProvider with ChangeNotifier {
  List<Conversation> _conversations = [];
  Conversation? _currentConversation;
  bool _isLoading = false;
  String? _error;
  BedrockApiService? _apiService;
  List<Map<String, dynamic>> _models = [];
  String? _selectedModelId;
  String? _systemPrompt;

  List<Conversation> get conversations => _conversations;
  Conversation? get currentConversation => _currentConversation;
  bool get isLoading => _isLoading;
  String? get error => _error;
  List<Map<String, dynamic>> get models => _models;
  String? get selectedModelId => _selectedModelId;
  String? get systemPrompt => _systemPrompt;

  void setApiService(BedrockApiService service) {
    _apiService = service;
    loadModels();
  }

  void setSystemPrompt(String? prompt) {
    _systemPrompt = prompt;
    notifyListeners();
  }

  void setSelectedModel(String modelId) {
    _selectedModelId = modelId;
    notifyListeners();
  }

  Future<void> loadModels() async {
    if (_apiService == null) return;
    
    try {
      _models = await _apiService!.getModels();
      if (_models.isNotEmpty && _selectedModelId == null) {
        _selectedModelId = _models.first['model_id'];
      }
      notifyListeners();
    } catch (e) {
      _error = 'Failed to load models: $e';
      notifyListeners();
    }
  }

  void setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void setError(String? error) {
    _error = error;
    notifyListeners();
  }

  void addConversation(Conversation conversation) {
    _conversations.insert(0, conversation);
    notifyListeners();
  }

  void setCurrentConversation(Conversation? conversation) {
    _currentConversation = conversation;
    notifyListeners();
  }

  void addMessage(Message message) {
    if (_currentConversation != null) {
      _currentConversation!.messages.add(message);
      _currentConversation!.updatedAt = DateTime.now();
      notifyListeners();
    }
  }

  void updateLastMessage(String content) {
    if (_currentConversation != null && _currentConversation!.messages.isNotEmpty) {
      _currentConversation!.messages.last.content += content;
      notifyListeners();
    }
  }

  void deleteConversation(String id) {
    _conversations.removeWhere((c) => c.id == id);
    if (_currentConversation?.id == id) {
      _currentConversation = null;
    }
    notifyListeners();
  }

  Future<void> sendMessage(Message userMessage) async {
    if (_apiService == null || _selectedModelId == null) {
      setError('API service not configured');
      return;
    }

    addMessage(userMessage);
    setLoading(true);
    setError(null);

    // Create assistant message
    final assistantMessage = Message(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      role: 'assistant',
      content: '',
      timestamp: DateTime.now(),
    );
    addMessage(assistantMessage);

    try {
      final stream = _apiService!.converseStream(
        modelId: _selectedModelId!,
        messages: _currentConversation!.messages.where((m) => m.role != 'assistant' || m.content.isNotEmpty).toList(),
        systemPrompt: _systemPrompt,
      );

      await for (final chunk in stream) {
        updateLastMessage(chunk);
      }
    } catch (e) {
      setError('Failed to send message: $e');
      // Remove empty assistant message on error
      if (_currentConversation!.messages.last.content.isEmpty) {
        _currentConversation!.messages.removeLast();
      }
    } finally {
      setLoading(false);
    }
  }
}
