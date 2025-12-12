import 'package:flutter/foundation.dart';
import '../models/message.dart';
import '../models/conversation.dart';
import '../models/system_prompt.dart';
import '../services/api_service.dart';
import '../services/database_service.dart';
import '../services/file_service.dart';

class ChatProvider with ChangeNotifier {
  List<Conversation> _conversations = [];
  Conversation? _currentConversation;
  bool _isLoading = false;
  String? _error;
  ApiService? _apiService;
  final DatabaseService _dbService = DatabaseService();
  final FileService _fileService = FileService();
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
  FileService get fileService => _fileService;

  ChatProvider() {
    _loadConversations();
  }

  Future<void> _loadConversations() async {
    _conversations = await _dbService.loadConversations();
    notifyListeners();
  }

  void setApiService(ApiService service) {
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

  Future<void> addConversation(Conversation conversation) async {
    _conversations.insert(0, conversation);
    await _dbService.saveConversation(conversation);
    notifyListeners();
  }

  void setCurrentConversation(Conversation? conversation) {
    _currentConversation = conversation;
    notifyListeners();
  }

  Future<void> addMessage(Message message) async {
    if (_currentConversation != null) {
      _currentConversation!.messages.add(message);
      _currentConversation!.updatedAt = DateTime.now();
      await _dbService.saveMessage(_currentConversation!.id, message);
      await _dbService.saveConversation(_currentConversation!);
      notifyListeners();
    }
  }

  void updateLastMessage(String content) {
    if (_currentConversation != null && _currentConversation!.messages.isNotEmpty) {
      _currentConversation!.messages.last.content += content;
      notifyListeners();
    }
  }

  Future<void> saveLastMessage() async {
    if (_currentConversation != null && _currentConversation!.messages.isNotEmpty) {
      final lastMessage = _currentConversation!.messages.last;
      await _dbService.saveMessage(_currentConversation!.id, lastMessage);
    }
  }

  Future<void> deleteConversation(String id) async {
    _conversations.removeWhere((c) => c.id == id);
    if (_currentConversation?.id == id) {
      _currentConversation = null;
    }
    await _dbService.deleteConversation(id);
    notifyListeners();
  }

  Future<void> sendMessage(Message userMessage) async {
    if (_apiService == null || _selectedModelId == null) {
      setError('API service not configured');
      return;
    }

    await addMessage(userMessage);
    setLoading(true);
    setError(null);

    final assistantMessage = Message(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      role: 'assistant',
      content: '',
      timestamp: DateTime.now(),
    );
    await addMessage(assistantMessage);

    try {
      final stream = _apiService!.converseStream(
        modelId: _selectedModelId!,
        messages: _currentConversation!.messages
            .where((m) => m.role != 'assistant' || m.content.isNotEmpty)
            .toList(),
        systemPrompt: _systemPrompt,
      );

      await for (final chunk in stream) {
        updateLastMessage(chunk);
      }

      await saveLastMessage();
    } catch (e) {
      setError('Failed to send message: $e');
      if (_currentConversation!.messages.last.content.isEmpty) {
        _currentConversation!.messages.removeLast();
      }
    } finally {
      setLoading(false);
    }
  }

  // System Prompt methods
  Future<List<SystemPrompt>> loadSystemPrompts() async {
    return await _dbService.loadSystemPrompts();
  }

  Future<void> saveSystemPrompt(SystemPrompt prompt) async {
    await _dbService.saveSystemPrompt(prompt);
  }

  Future<void> deleteSystemPrompt(String id) async {
    await _dbService.deleteSystemPrompt(id);
  }

  Future<void> updateSystemPromptOrder(List<SystemPrompt> prompts) async {
    await _dbService.updateSystemPromptOrder(prompts);
  }
}
