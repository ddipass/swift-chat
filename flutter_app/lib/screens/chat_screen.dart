import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/message.dart';
import '../services/mock_api_service.dart';
import '../services/bedrock_api_service.dart';
import '../services/api_service.dart';
import '../widgets/message_bubble.dart';
import '../theme/theme_provider.dart';
import '../navigation/app_router.dart';

class ChatScreen extends StatefulWidget {
  final int sessionId;
  final int tapIndex;
  final String mode;

  const ChatScreen({
    super.key,
    this.sessionId = -1,
    this.tapIndex = 1,
    this.mode = 'text',
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final List<Message> _messages = [];
  final TextEditingController _textController = TextEditingController();
  ApiService _apiService = MockApiService();
  final ScrollController _scrollController = ScrollController();
  bool _isLoading = false;
  String _streamingText = '';

  @override
  void initState() {
    super.initState();
    _initApiService();
  }

  Future<void> _initApiService() async {
    final prefs = await SharedPreferences.getInstance();
    final apiUrl = prefs.getString('apiUrl') ?? '';
    final apiKey = prefs.getString('apiKey') ?? '';
    final region = prefs.getString('region') ?? 'us-east-1';
    
    if (apiUrl.isNotEmpty && apiKey.isNotEmpty) {
      setState(() {
        _apiService = BedrockApiService(
          apiUrl: apiUrl,
          apiKey: apiKey,
          region: region,
        );
      });
    }
  }

  void _handleRegenerate() async {
    if (_messages.isEmpty || _isLoading) return;
    
    String? lastUserMessage;
    for (var msg in _messages) {
      if (msg.isUser) {
        lastUserMessage = msg.text;
        break;
      }
    }
    
    if (lastUserMessage == null) return;

    setState(() {
      if (_messages.isNotEmpty && !_messages[0].isUser) {
        _messages.removeAt(0);
      }
      _isLoading = true;
      _streamingText = '';
    });

    final prefs = await SharedPreferences.getInstance();
    final model = prefs.getString('textModel') ?? 'anthropic.claude-3-5-sonnet-20241022-v2:0';

    try {
      await for (final responseText in _apiService.sendMessage(
        text: lastUserMessage,
        history: _messages.reversed.toList(),
        model: model,
      )) {
        setState(() {
          _streamingText = responseText;
        });
      }
      
      if (_streamingText.isNotEmpty) {
        setState(() {
          _messages.insert(0, Message(
            id: const Uuid().v4(),
            text: _streamingText,
            isUser: false,
            createdAt: DateTime.now(),
          ));
          _streamingText = '';
          _isLoading = false;
        });
        _scrollToBottom();
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
        _streamingText = '';
      });
    }
  }

  void _handleSend() async {
    final text = _textController.text.trim();
    if (text.isEmpty || _isLoading) return;

    final userMessage = Message(
      id: const Uuid().v4(),
      text: text,
      isUser: true,
      createdAt: DateTime.now(),
    );

    setState(() {
      _messages.insert(0, userMessage);
      _isLoading = true;
      _streamingText = '';
    });

    _textController.clear();
    _scrollToBottom();

    final prefs = await SharedPreferences.getInstance();
    final model = prefs.getString('textModel') ?? 'anthropic.claude-3-5-sonnet-20241022-v2:0';

    try {
      await for (final responseText in _apiService.sendMessage(
        text: text,
        history: _messages.reversed.toList(),
        model: model,
      )) {
        setState(() {
          _streamingText = responseText;
        });
      }
      
      // 完成后添加到消息列表
      if (_streamingText.isNotEmpty) {
        setState(() {
          _messages.insert(0, Message(
            id: const Uuid().v4(),
            text: _streamingText,
            isUser: false,
            createdAt: DateTime.now(),
          ));
          _streamingText = '';
          _isLoading = false;
        });
        _scrollToBottom();
      }
    } catch (e) {
      setState(() {
        _messages.insert(0, Message(
          id: const Uuid().v4(),
          text: 'Error: $e',
          isUser: false,
          createdAt: DateTime.now(),
        ));
        _streamingText = '';
        _isLoading = false;
      });
    }
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        0,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = Provider.of<ThemeProvider>(context).colors;
    final size = MediaQuery.of(context).size;
    final minWidth = size.width > size.height ? size.height : size.width;
    final isMobile = minWidth <= 434;

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        backgroundColor: colors.surface,
        elevation: 0,
        toolbarHeight: 44,
        leading: Builder(
          builder: (context) => IconButton(
            icon: Icon(Icons.menu, color: colors.text, size: 24),
            onPressed: () {
              if (isMobile) {
                // Mobile: toggle Scaffold drawer
                final scaffoldState = Scaffold.of(context);
                if (scaffoldState.isDrawerOpen) {
                  Navigator.of(context).pop();
                } else {
                  scaffoldState.openDrawer();
                }
              } else {
                // Desktop: toggle permanent drawer
                Provider.of<DrawerStateProvider>(context, listen: false).toggleDrawer();
              }
            },
            padding: EdgeInsets.zero,
          ),
        ),
        title: Text(
          'Chat',
          style: TextStyle(
            color: colors.text,
            fontSize: 17,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        actions: [
          // New chat button
          IconButton(
            icon: Icon(Icons.edit_outlined, color: colors.text, size: 22),
            onPressed: () {
              setState(() {
                _messages.clear();
              });
            },
            padding: EdgeInsets.zero,
          ),
          // Theme toggle button
          IconButton(
            icon: Icon(
              Provider.of<ThemeProvider>(context).isDark
                  ? Icons.light_mode
                  : Icons.dark_mode,
              color: colors.text,
              size: 22,
            ),
            onPressed: () =>
                Provider.of<ThemeProvider>(context, listen: false)
                    .toggleTheme(),
            padding: EdgeInsets.zero,
          ),
        ],
      ),
      body: Column(
        children: [
          // Message list
          Expanded(
            child: _messages.isEmpty
                ? Center(
                    child: Text(
                      'No messages yet.\nStart a conversation!',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: colors.textSecondary,
                        fontSize: 16,
                      ),
                    ),
                  )
                : ListView.builder(
                    controller: _scrollController,
                    reverse: true,
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemCount: _messages.length + (_streamingText.isNotEmpty ? 1 : 0),
                    itemBuilder: (context, index) {
                      // 显示流式消息
                      if (index == 0 && _streamingText.isNotEmpty) {
                        return MessageBubble(
                          message: Message(
                            id: 'streaming',
                            text: _streamingText,
                            isUser: false,
                            createdAt: DateTime.now(),
                          ),
                          isLastAIMessage: false,
                        );
                      }
                      
                      final msgIndex = _streamingText.isNotEmpty ? index - 1 : index;
                      final message = _messages[msgIndex];
                      final isLastAIMessage = msgIndex == 0 && !message.isUser && _streamingText.isEmpty;
                      
                      return MessageBubble(
                        message: message,
                        isLastAIMessage: isLastAIMessage,
                        onRegenerate: isLastAIMessage ? _handleRegenerate : null,
                      );
                    },
                  ),
          ),

          // Loading indicator
          if (_isLoading)
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Row(
                children: [
                  const SizedBox(width: 12),
                  SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(colors.primary),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'AI is thinking...',
                    style: TextStyle(
                      color: colors.textSecondary,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),

          // Input toolbar
          Container(
            decoration: BoxDecoration(
              color: colors.surface,
              border: Border(
                top: BorderSide(color: colors.border, width: 0.5),
              ),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _textController,
                    decoration: InputDecoration(
                      hintText: 'Type a message...',
                      hintStyle: TextStyle(color: colors.placeholder),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide(color: colors.border),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide(color: colors.border),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide(color: colors.primary, width: 2),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                      filled: true,
                      fillColor: colors.inputBackground,
                    ),
                    style: TextStyle(color: colors.text),
                    maxLines: null,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => _handleSend(),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  onPressed: _isLoading ? null : _handleSend,
                  icon: Icon(
                    Icons.send,
                    color: _isLoading ? colors.textTertiary : colors.primary,
                  ),
                  style: IconButton.styleFrom(
                    backgroundColor: colors.surface,
                    shape: const CircleBorder(),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
