import 'package:flutter/foundation.dart';
import '../models/message.dart';
import '../models/conversation.dart';

class ChatProvider with ChangeNotifier {
  List<Conversation> _conversations = [];
  Conversation? _currentConversation;
  bool _isLoading = false;

  List<Conversation> get conversations => _conversations;
  Conversation? get currentConversation => _currentConversation;
  bool get isLoading => _isLoading;

  void setLoading(bool loading) {
    _isLoading = loading;
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
      notifyListeners();
    }
  }

  void updateLastMessage(String content) {
    if (_currentConversation != null && _currentConversation!.messages.isNotEmpty) {
      _currentConversation!.messages.last.content = content;
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
}
