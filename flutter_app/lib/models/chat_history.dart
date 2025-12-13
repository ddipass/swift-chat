class ChatHistoryItem {
  final int id;
  final String title;
  final String mode;
  final bool isSection;

  ChatHistoryItem({
    required this.id,
    required this.title,
    this.mode = 'text',
    this.isSection = false,
  });
}
