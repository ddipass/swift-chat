class Message {
  final String id;
  final String text;
  final bool isUser;
  final DateTime createdAt;
  final String? reasoning; // AI reasoning content

  Message({
    required this.id,
    required this.text,
    required this.isUser,
    required this.createdAt,
    this.reasoning,
  });
}
