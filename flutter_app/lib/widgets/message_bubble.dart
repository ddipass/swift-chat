import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_highlight/flutter_highlight.dart';
import 'package:flutter_highlight/themes/github.dart';
import 'package:flutter_highlight/themes/monokai-sublime.dart';
import 'package:provider/provider.dart';
import '../models/message.dart';
import '../theme/theme_provider.dart';

class MessageBubble extends StatefulWidget {
  final Message message;
  final bool isLastAIMessage;
  final VoidCallback? onRegenerate;

  const MessageBubble({
    super.key,
    required this.message,
    this.isLastAIMessage = false,
    this.onRegenerate,
  });

  @override
  State<MessageBubble> createState() => _MessageBubbleState();
}

class _MessageBubbleState extends State<MessageBubble> {
  bool _titleCopied = false;
  bool _messageCopied = false;
  bool _reasoningCopied = false;
  bool _reasoningExpanded = false;

  void _copyTitle() {
    Clipboard.setData(const ClipboardData(text: 'AI Assistant'));
    setState(() => _titleCopied = true);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _titleCopied = false);
    });
  }

  void _copyMessage() {
    Clipboard.setData(ClipboardData(text: widget.message.text));
    setState(() => _messageCopied = true);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _messageCopied = false);
    });
  }

  void _copyReasoning() {
    if (widget.message.reasoning != null) {
      Clipboard.setData(ClipboardData(text: widget.message.reasoning!));
      setState(() => _reasoningCopied = true);
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) setState(() => _reasoningCopied = false);
      });
    }
  }

  void _toggleReasoning() {
    setState(() => _reasoningExpanded = !_reasoningExpanded);
  }

  @override
  Widget build(BuildContext context) {
    final colors = Provider.of<ThemeProvider>(context).colors;
    final isDark = Provider.of<ThemeProvider>(context).isDark;
    
    return Container(
      margin: const EdgeInsets.only(left: 12, top: 4, bottom: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with avatar and name (AI only)
          if (!widget.message.isUser)
            GestureDetector(
              onTap: _copyTitle,
              child: Padding(
                padding: const EdgeInsets.only(bottom: 0),
                child: Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(11),
                      child: Image.asset(
                        isDark ? 'bedrock_dark.png' : 'bedrock.png',
                        width: 22,
                        height: 22,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'AI Assistant',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                        color: colors.text,
                      ),
                    ),
                    if (_titleCopied) ...[
                      const SizedBox(width: 6),
                      Image.asset(
                        isDark ? 'done_dark.png' : 'done.png',
                        width: 14,
                        height: 14,
                      ),
                    ],
                  ],
                ),
              ),
            ),
          
          // Message content with long-press
          GestureDetector(
            onLongPress: _copyMessage,
            child: Container(
              margin: const EdgeInsets.only(left: 28, right: 16),
              child: widget.message.isUser
                  ? _buildUserMessage(context, colors)
                  : _buildAIMessage(context, colors, isDark),
            ),
          ),
          
          // Reasoning section (AI only)
          if (!widget.message.isUser && widget.message.reasoning != null && widget.message.reasoning!.isNotEmpty)
            Container(
              margin: const EdgeInsets.only(left: 28, right: 16, top: 8),
              decoration: BoxDecoration(
                color: colors.reasoningBackground,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Reasoning header
                  GestureDetector(
                    onTap: _toggleReasoning,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      child: Row(
                        children: [
                          // Arrow icon
                          AnimatedRotation(
                            turns: _reasoningExpanded ? 0.75 : 0.5,
                            duration: const Duration(milliseconds: 200),
                            child: Icon(
                              Icons.arrow_back_ios,
                              size: 14,
                              color: colors.textSecondary,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'Reasoning',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                              color: colors.text,
                            ),
                          ),
                          const Spacer(),
                          // Copy button
                          GestureDetector(
                            onTap: _copyReasoning,
                            child: Image.asset(
                              _reasoningCopied
                                  ? (isDark ? 'done_dark.png' : 'done.png')
                                  : 'copy_grey.png',
                              width: 14,
                              height: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  // Reasoning content
                  if (_reasoningExpanded)
                    Container(
                      padding: const EdgeInsets.all(12),
                      child: MarkdownBody(
                        data: widget.message.reasoning!,
                        selectable: true,
                        styleSheet: MarkdownStyleSheet(
                          p: TextStyle(
                            fontSize: 14,
                            height: 1.5,
                            color: colors.textSecondary,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          
          // Regenerate button (last AI message only)
          if (!widget.message.isUser && widget.isLastAIMessage && widget.onRegenerate != null)
            Padding(
              padding: const EdgeInsets.only(left: 28, top: 8),
              child: GestureDetector(
                onTap: widget.onRegenerate,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: colors.borderLight,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.refresh, size: 16, color: colors.textSecondary),
                      const SizedBox(width: 4),
                      Text(
                        'Regenerate',
                        style: TextStyle(
                          fontSize: 14,
                          color: colors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          
          // Copy feedback for long-press
          if (_messageCopied)
            Padding(
              padding: EdgeInsets.only(
                left: widget.message.isUser ? 0 : 28,
                right: widget.message.isUser ? 16 : 0,
                top: 4,
              ),
              child: Align(
                alignment: widget.message.isUser ? Alignment.centerRight : Alignment.centerLeft,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Image.asset(
                      isDark ? 'done_dark.png' : 'done.png',
                      width: 14,
                      height: 14,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Copied',
                      style: TextStyle(
                        fontSize: 12,
                        color: colors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildUserMessage(BuildContext context, colors) {
    // User message: right-aligned with background
    return Align(
      alignment: Alignment.centerRight,
      child: Container(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        margin: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: colors.messageBackground,
          borderRadius: BorderRadius.circular(22),
        ),
        child: Text(
          widget.message.text,
          style: TextStyle(
            fontSize: 16,
            height: 1.5, // lineHeight 24 / fontSize 16
            color: colors.text,
          ),
        ),
      ),
    );
  }

  Widget _buildAIMessage(BuildContext context, colors, bool isDark) {
    // AI message: Markdown rendering with code blocks
    return Container(
      margin: const EdgeInsets.only(top: 1),
      child: MarkdownBody(
        data: widget.message.text,
        selectable: true,
        styleSheet: MarkdownStyleSheet(
          p: TextStyle(
            fontSize: 16,
            height: 1.625, // lineHeight 26 / fontSize 16
            color: colors.text,
            fontWeight: FontWeight.w300,
          ),
          code: TextStyle(
            fontSize: 14,
            backgroundColor: colors.codeBackground,
            color: colors.text,
            fontFamily: 'monospace',
          ),
          codeblockDecoration: BoxDecoration(
            color: colors.codeBackground,
            borderRadius: BorderRadius.circular(8),
          ),
          codeblockPadding: const EdgeInsets.all(12),
        ),
        builders: {
          'code': CodeBlockBuilder(isDark: isDark, colors: colors),
        },
      ),
    );
  }
}

/// Custom code block builder with syntax highlighting and copy button
class CodeBlockBuilder extends MarkdownElementBuilder {
  final bool isDark;
  final dynamic colors;

  CodeBlockBuilder({required this.isDark, required this.colors});

  @override
  Widget visitElementAfter(element, preferredStyle) {
    final String code = element.textContent;
    final String? language = element.attributes['class']?.replaceFirst('language-', '');

    return _CodeBlock(
      code: code,
      language: language ?? 'code',
      isDark: isDark,
      colors: colors,
    );
  }
}

class _CodeBlock extends StatefulWidget {
  final String code;
  final String language;
  final bool isDark;
  final dynamic colors;

  const _CodeBlock({
    required this.code,
    required this.language,
    required this.isDark,
    required this.colors,
  });

  @override
  State<_CodeBlock> createState() => _CodeBlockState();
}

class _CodeBlockState extends State<_CodeBlock> {
  bool _copied = false;

  void _copyCode() {
    Clipboard.setData(ClipboardData(text: widget.code));
    setState(() => _copied = true);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) setState(() => _copied = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: widget.colors.codeBackground,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header with language label and copy button
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: widget.colors.borderLight,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(8),
                topRight: Radius.circular(8),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  widget.language,
                  style: TextStyle(
                    fontSize: 12,
                    color: widget.colors.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                GestureDetector(
                  onTap: _copyCode,
                  child: Image.asset(
                    _copied
                        ? (widget.isDark ? 'done_dark.png' : 'done.png')
                        : (widget.isDark ? 'copy_grey.png' : 'copy.png'),
                    width: 16,
                    height: 16,
                  ),
                ),
              ],
            ),
          ),
          // Code content
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.all(12),
            child: HighlightView(
              widget.code,
              language: widget.language == 'code' ? 'plaintext' : widget.language,
              theme: widget.isDark ? monokaiSublimeTheme : githubTheme,
              padding: EdgeInsets.zero,
              textStyle: const TextStyle(
                fontSize: 14,
                fontFamily: 'monospace',
                height: 1.43, // lineHeight 20 / fontSize 14
              ),
            ),
          ),
        ],
      ),
    );
  }
}
