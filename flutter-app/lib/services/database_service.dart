import 'dart:convert';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/conversation.dart';
import '../models/message.dart';
import '../models/system_prompt.dart';

class DatabaseService {
  static Database? _database;
  static const String _dbName = 'swiftchat.db';
  static const int _dbVersion = 2;

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, _dbName);

    return await openDatabase(
      path,
      version: _dbVersion,
      onCreate: _onCreate,
      onUpgrade: _onUpgrade,
    );
  }

  Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE conversations (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        contents TEXT,
        FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE
      )
    ''');

    await db.execute('''
      CREATE TABLE system_prompts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        prompt TEXT NOT NULL,
        is_built_in INTEGER NOT NULL DEFAULT 0,
        "order" INTEGER NOT NULL DEFAULT 0
      )
    ''');

    await db.execute('''
      CREATE INDEX idx_messages_conversation ON messages(conversation_id)
    ''');

    await db.execute('''
      CREATE INDEX idx_prompts_order ON system_prompts("order")
    ''');

    // Insert built-in prompts
    for (final prompt in BuiltInPrompts.prompts) {
      await db.insert('system_prompts', prompt.toJson());
    }
  }

  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      await db.execute('''
        CREATE TABLE system_prompts (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          prompt TEXT NOT NULL,
          is_built_in INTEGER NOT NULL DEFAULT 0,
          "order" INTEGER NOT NULL DEFAULT 0
        )
      ''');

      await db.execute('''
        CREATE INDEX idx_prompts_order ON system_prompts("order")
      ''');

      for (final prompt in BuiltInPrompts.prompts) {
        await db.insert('system_prompts', prompt.toJson());
      }
    }
  }

  // Conversations
  Future<void> saveConversation(Conversation conversation) async {
    final db = await database;
    await db.insert(
      'conversations',
      {
        'id': conversation.id,
        'title': conversation.title,
        'created_at': conversation.createdAt.millisecondsSinceEpoch,
        'updated_at': conversation.updatedAt.millisecondsSinceEpoch,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );

    for (final message in conversation.messages) {
      await saveMessage(conversation.id, message);
    }
  }

  Future<List<Conversation>> loadConversations() async {
    final db = await database;
    final conversationMaps = await db.query(
      'conversations',
      orderBy: 'updated_at DESC',
    );

    final conversations = <Conversation>[];
    for (final map in conversationMaps) {
      final messages = await loadMessages(map['id'] as String);
      conversations.add(Conversation(
        id: map['id'] as String,
        title: map['title'] as String,
        messages: messages,
        createdAt: DateTime.fromMillisecondsSinceEpoch(map['created_at'] as int),
        updatedAt: DateTime.fromMillisecondsSinceEpoch(map['updated_at'] as int),
      ));
    }

    return conversations;
  }

  Future<void> deleteConversation(String id) async {
    final db = await database;
    await db.delete('messages', where: 'conversation_id = ?', whereArgs: [id]);
    await db.delete('conversations', where: 'id = ?', whereArgs: [id]);
  }

  // Messages
  Future<void> saveMessage(String conversationId, Message message) async {
    final db = await database;
    await db.insert(
      'messages',
      {
        'id': message.id,
        'conversation_id': conversationId,
        'role': message.role,
        'content': message.content,
        'timestamp': message.timestamp.millisecondsSinceEpoch,
        'contents': message.contents != null
            ? jsonEncode(message.contents!.map((c) => c.toJson()).toList())
            : null,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<Message>> loadMessages(String conversationId) async {
    final db = await database;
    final messageMaps = await db.query(
      'messages',
      where: 'conversation_id = ?',
      whereArgs: [conversationId],
      orderBy: 'timestamp ASC',
    );

    return messageMaps.map((map) {
      List<MessageContent>? contents;
      if (map['contents'] != null) {
        final contentsList = jsonDecode(map['contents'] as String) as List;
        contents = contentsList.map((c) => MessageContent.fromJson(c)).toList();
      }

      return Message(
        id: map['id'] as String,
        role: map['role'] as String,
        content: map['content'] as String,
        timestamp: DateTime.fromMillisecondsSinceEpoch(map['timestamp'] as int),
        contents: contents,
      );
    }).toList();
  }

  // System Prompts
  Future<void> saveSystemPrompt(SystemPrompt prompt) async {
    final db = await database;
    await db.insert(
      'system_prompts',
      prompt.toJson(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<SystemPrompt>> loadSystemPrompts() async {
    final db = await database;
    final maps = await db.query(
      'system_prompts',
      orderBy: '"order" ASC',
    );

    return maps.map((map) => SystemPrompt.fromJson(map)).toList();
  }

  Future<void> deleteSystemPrompt(String id) async {
    final db = await database;
    await db.delete('system_prompts', where: 'id = ? AND is_built_in = 0', whereArgs: [id]);
  }

  Future<void> updateSystemPromptOrder(List<SystemPrompt> prompts) async {
    final db = await database;
    final batch = db.batch();
    
    for (int i = 0; i < prompts.length; i++) {
      batch.update(
        'system_prompts',
        {'order': i},
        where: 'id = ?',
        whereArgs: [prompts[i].id],
      );
    }
    
    await batch.commit();
  }

  Future<void> close() async {
    final db = await database;
    await db.close();
  }
}
