import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_highlight/flutter_highlight.dart';
import 'package:flutter_highlight/themes/github.dart';
import 'package:flutter_highlight/themes/monokai-sublime.dart';
import 'package:provider/provider.dart';
import '../models/message.dart';
import '../theme/theme_provider.dart';

class MessageBubble extends StatelessWidget {
  final Message message;

  const MessageBubble({
    super.key,
    required this.message,
  });

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
          if (!message.isUser)
            Padding(
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
                ],
              ),
            ),
          
          // Message content (marked_box)
          Container(
            margin: const EdgeInsets.only(left: 28, right: 16),
            child: message.isUser
                ? _buildUserMessage(context, colors)
                : _buildAIMessage(context, colors, isDark),
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
          message.text,
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
        data: message.text,
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
