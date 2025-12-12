class Message {
  final String id;
  final String role; // 'user' or 'assistant'
  String content;
  final DateTime timestamp;
  final List<String>? images;
  final String? videoPath;
  final String? documentPath;

  Message({
    required this.id,
    required this.role,
    required this.content,
    required this.timestamp,
    this.images,
    this.videoPath,
    this.documentPath,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'role': role,
      'content': content,
      'timestamp': timestamp.toIso8601String(),
      'images': images,
      'videoPath': videoPath,
      'documentPath': documentPath,
    };
  }

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['id'],
      role: json['role'],
      content: json['content'],
      timestamp: DateTime.parse(json['timestamp']),
      images: json['images'] != null ? List<String>.from(json['images']) : null,
      videoPath: json['videoPath'],
      documentPath: json['documentPath'],
    );
  }
}
