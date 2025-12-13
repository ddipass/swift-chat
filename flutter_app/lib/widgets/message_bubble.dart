import 'package:flutter/material.dart';
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
    
    return Container(
      margin: const EdgeInsets.only(left: 12, top: 4, bottom: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with avatar and name (AI only)
          if (!message.isUser)
            Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Row(
                children: [
                  Container(
                    width: 22,
                    height: 22,
                    decoration: BoxDecoration(
                      color: colors.primary,
                      borderRadius: BorderRadius.circular(11),
                    ),
                    child: Icon(
                      Icons.smart_toy,
                      size: 14,
                      color: colors.background,
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
          
          // Message content
          Container(
            margin: const EdgeInsets.only(left: 28, right: 16),
            child: message.isUser
                ? _buildUserMessage(context, colors)
                : _buildAIMessage(colors),
          ),
        ],
      ),
    );
  }

  Widget _buildUserMessage(BuildContext context, colors) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.end,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Flexible(
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
        ),
        const SizedBox(width: 6),
        Container(
          width: 22,
          height: 22,
          decoration: BoxDecoration(
            color: colors.primary,
            borderRadius: BorderRadius.circular(11),
          ),
          child: Icon(
            Icons.person,
            size: 14,
            color: colors.background,
          ),
        ),
      ],
    );
  }

  Widget _buildAIMessage(colors) {
    // AI messages don't have bubble background, just plain text
    return Text(
      message.text,
      style: TextStyle(
        fontSize: 16,
        height: 1.625, // lineHeight 26 / fontSize 16
        color: colors.text,
      ),
    );
  }
}
