import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/chat_provider.dart';
import '../providers/settings_provider.dart';
import '../models/message.dart';
import '../models/conversation.dart';
import '../widgets/markdown_viewer.dart';
import 'package:uuid/uuid.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final _uuid = const Uuid();
  List<MessageContent> _attachments = [];

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _pickImages() async {
    final chatProvider = context.read<ChatProvider>();
    final contents = await chatProvider.fileService.pickImages();
    if (contents != null) {
      setState(() {
        _attachments.addAll(contents);
      });
    }
  }

  Future<void> _pickDocument() async {
    final chatProvider = context.read<ChatProvider>();
    final content = await chatProvider.fileService.pickDocument();
    if (content != null) {
      setState(() {
        _attachments.add(content);
      });
    }
  }

  Future<void> _pickVideo() async {
    final chatProvider = context.read<ChatProvider>();
    final content = await chatProvider.fileService.pickVideo();
    if (content != null) {
      setState(() {
        _attachments.add(content);
      });
    }
  }

  void _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty && _attachments.isEmpty) return;

    final chatProvider = context.read<ChatProvider>();
    final settings = context.read<SettingsProvider>();

    if (!settings.isConfigured) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please configure API settings first')),
      );
      return;
    }

    if (chatProvider.currentConversation == null) {
      final conversation = Conversation(
        id: _uuid.v4(),
        title: text.length > 30 ? '${text.substring(0, 30)}...' : text,
        messages: [],
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      await chatProvider.addConversation(conversation);
      chatProvider.setCurrentConversation(conversation);
    }

    final contents = <MessageContent>[];
    if (_attachments.isNotEmpty) {
      contents.addAll(_attachments);
    }
    if (text.isNotEmpty) {
      contents.add(MessageContent(type: 'text', text: text));
    }

    final userMessage = Message(
      id: _uuid.v4(),
      role: 'user',
      content: text,
      timestamp: DateTime.now(),
      contents: contents,
    );
    
    _messageController.clear();
    setState(() {
      _attachments.clear();
    });
    
    await chatProvider.sendMessage(userMessage);
    _scrollToBottom();
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('SwiftChat'),
        actions: [
          Consumer<ChatProvider>(
            builder: (context, chat, _) {
              if (chat.models.isEmpty) return const SizedBox();
              return PopupMenuButton<String>(
                icon: const Icon(Icons.model_training),
                tooltip: 'Select Model',
                onSelected: (modelId) {
                  chat.setSelectedModel(modelId);
                },
                itemBuilder: (context) {
                  return chat.models.map((model) {
                    final isSelected = model['model_id'] == chat.selectedModelId;
                    return PopupMenuItem<String>(
                      value: model['model_id'],
                      child: Row(
                        children: [
                          if (isSelected)
                            const Icon(Icons.check, size: 16),
                          if (isSelected)
                            const SizedBox(width: 8),
                          Expanded(
                            child: Text(model['model_name'] ?? model['model_id']),
                          ),
                        ],
                      ),
                    );
                  }).toList();
                },
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: 'New Chat',
            onPressed: () {
              context.read<ChatProvider>().setCurrentConversation(null);
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Consumer<ChatProvider>(
            builder: (context, chat, _) {
              if (chat.error != null) {
                return Container(
                  color: Colors.red.shade100,
                  padding: const EdgeInsets.all(8),
                  child: Row(
                    children: [
                      const Icon(Icons.error, color: Colors.red),
                      const SizedBox(width: 8),
                      Expanded(child: Text(chat.error!)),
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => chat.setError(null),
                      ),
                    ],
                  ),
                );
              }
              return const SizedBox();
            },
          ),
          Expanded(
            child: Consumer<ChatProvider>(
              builder: (context, chatProvider, _) {
                final messages = chatProvider.currentConversation?.messages ?? [];
                
                if (messages.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.chat_bubble_outline, 
                          size: 64, 
                          color: Theme.of(context).colorScheme.primary.withOpacity(0.5)
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Start a conversation',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Supports text, images, documents, and videos',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                          ),
                        ),
                      ],
                    ),
                  );
                }

                return ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.all(16),
                  itemCount: messages.length,
                  itemBuilder: (context, index) {
                    final message = messages[index];
                    return _MessageBubble(message: message, isDark: isDark);
                  },
                );
              },
            ),
          ),
          if (_attachments.isNotEmpty)
            Container(
              height: 100,
              padding: const EdgeInsets.all(8),
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: _attachments.length,
                itemBuilder: (context, index) {
                  final attachment = _attachments[index];
                  return _AttachmentPreview(
                    attachment: attachment,
                    onRemove: () {
                      setState(() {
                        _attachments.removeAt(index);
                      });
                    },
                  );
                },
              ),
            ),
          Consumer<ChatProvider>(
            builder: (context, chat, _) {
              if (chat.isLoading) {
                return const LinearProgressIndicator();
              }
              return const SizedBox();
            },
          ),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: Row(
              children: [
                PopupMenuButton(
                  icon: const Icon(Icons.attach_file),
                  tooltip: 'Attach File',
                  itemBuilder: (context) => [
                    const PopupMenuItem(
                      value: 'image',
                      child: Row(
                        children: [
                          Icon(Icons.image),
                          SizedBox(width: 8),
                          Text('Images'),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'document',
                      child: Row(
                        children: [
                          Icon(Icons.description),
                          SizedBox(width: 8),
                          Text('Document'),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'video',
                      child: Row(
                        children: [
                          Icon(Icons.videocam),
                          SizedBox(width: 8),
                          Text('Video'),
                        ],
                      ),
                    ),
                  ],
                  onSelected: (value) {
                    switch (value) {
                      case 'image':
                        _pickImages();
                        break;
                      case 'document':
                        _pickDocument();
                        break;
                      case 'video':
                        _pickVideo();
                        break;
                    }
                  },
                ),
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: const InputDecoration(
                      hintText: 'Type a message...',
                      border: InputBorder.none,
                    ),
                    maxLines: null,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.send),
                  onPressed: _sendMessage,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final Message message;
  final bool isDark;

  const _MessageBubble({required this.message, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final isUser = message.role == 'user';
    
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        decoration: BoxDecoration(
          color: isUser
              ? Theme.of(context).colorScheme.primaryContainer
              : Theme.of(context).colorScheme.surfaceVariant,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (message.contents != null)
              ...message.contents!.map((content) {
                if (content.type == 'image' && content.imageSource != null) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.memory(
                        base64Decode(content.imageSource!),
                        fit: BoxFit.cover,
                      ),
                    ),
                  );
                }
                return const SizedBox();
              }),
            if (message.content.isNotEmpty)
              isUser
                  ? SelectableText(
                      message.content,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.onPrimaryContainer,
                      ),
                    )
                  : MarkdownViewer(
                      data: message.content,
                      isDark: isDark,
                    ),
          ],
        ),
      ),
    );
  }
}

class _AttachmentPreview extends StatelessWidget {
  final MessageContent attachment;
  final VoidCallback onRemove;

  const _AttachmentPreview({
    required this.attachment,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 80,
      margin: const EdgeInsets.only(right: 8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey),
      ),
      child: Stack(
        children: [
          if (attachment.type == 'image' && attachment.imageSource != null)
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.memory(
                base64Decode(attachment.imageSource!),
                fit: BoxFit.cover,
                width: 80,
                height: 80,
              ),
            )
          else
            Center(
              child: Icon(
                attachment.type == 'document' ? Icons.description : Icons.videocam,
                size: 40,
              ),
            ),
          Positioned(
            top: 4,
            right: 4,
            child: GestureDetector(
              onTap: onRemove,
              child: Container(
                padding: const EdgeInsets.all(2),
                decoration: const BoxDecoration(
                  color: Colors.red,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.close, size: 16, color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
