import 'package:hive_flutter/hive_flutter.dart';
import '../models/conversation.dart';
import '../models/message.dart';
import '../models/system_prompt.dart';

class StorageService {
  static const String _conversationsBox = 'conversations';
  static const String _messagesBox = 'messages';
  static const String _promptsBox = 'prompts';

  static Future<void> init() async {
    await Hive.initFlutter();
    await Hive.openBox(_conversationsBox);
    await Hive.openBox(_messagesBox);
    await Hive.openBox(_promptsBox);
    
    // Initialize built-in prompts
    final promptsBox = Hive.box(_promptsBox);
    if (promptsBox.isEmpty) {
      for (final prompt in BuiltInPrompts.prompts) {
        await promptsBox.put(prompt.id, prompt.toJson());
      }
    }
  }

  // Conversations
  Future<void> saveConversation(Conversation conversation) async {
    final box = Hive.box(_conversationsBox);
    await box.put(conversation.id, conversation.toJson());
    
    // Save messages
    final messagesBox = Hive.box(_messagesBox);
    for (final message in conversation.messages) {
      await messagesBox.put('${conversation.id}_${message.id}', message.toJson());
    }
  }

  Future<List<Conversation>> loadConversations() async {
    final box = Hive.box(_conversationsBox);
    final messagesBox = Hive.box(_messagesBox);
    
    final conversations = <Conversation>[];
    for (final key in box.keys) {
      final data = box.get(key);
      final messages = <Message>[];
      
      for (final msgKey in messagesBox.keys) {
        if (msgKey.toString().startsWith('${key}_')) {
          messages.add(Message.fromJson(messagesBox.get(msgKey)));
        }
      }
      
      messages.sort((a, b) => a.timestamp.compareTo(b.timestamp));
      
      conversations.add(Conversation(
        id: data['id'],
        title: data['title'],
        messages: messages,
        createdAt: DateTime.fromMillisecondsSinceEpoch(data['created_at']),
        updatedAt: DateTime.fromMillisecondsSinceEpoch(data['updated_at']),
      ));
    }
    
    conversations.sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
    return conversations;
  }

  Future<void> deleteConversation(String id) async {
    final box = Hive.box(_conversationsBox);
    final messagesBox = Hive.box(_messagesBox);
    
    await box.delete(id);
    
    final keysToDelete = messagesBox.keys.where((k) => k.toString().startsWith('${id}_')).toList();
    for (final key in keysToDelete) {
      await messagesBox.delete(key);
    }
  }

  // System Prompts
  Future<void> saveSystemPrompt(SystemPrompt prompt) async {
    final box = Hive.box(_promptsBox);
    await box.put(prompt.id, prompt.toJson());
  }

  Future<List<SystemPrompt>> loadSystemPrompts() async {
    final box = Hive.box(_promptsBox);
    final prompts = <SystemPrompt>[];
    
    for (final key in box.keys) {
      prompts.add(SystemPrompt.fromJson(box.get(key)));
    }
    
    prompts.sort((a, b) => a.order.compareTo(b.order));
    return prompts;
  }

  Future<void> deleteSystemPrompt(String id) async {
    final box = Hive.box(_promptsBox);
    final prompt = SystemPrompt.fromJson(box.get(id));
    if (!prompt.isBuiltIn) {
      await box.delete(id);
    }
  }

  Future<void> updateSystemPromptOrder(List<SystemPrompt> prompts) async {
    final box = Hive.box(_promptsBox);
    for (int i = 0; i < prompts.length; i++) {
      final prompt = prompts[i].copyWith(order: i);
      await box.put(prompt.id, prompt.toJson());
    }
  }
}
