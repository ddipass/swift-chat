class Message {
  final String id;
  final String role; // 'user' or 'assistant'
  String content;
  final DateTime timestamp;
  final List<MessageContent>? contents;

  Message({
    required this.id,
    required this.role,
    required this.content,
    required this.timestamp,
    this.contents,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'role': role,
      'content': content,
      'timestamp': timestamp.toIso8601String(),
      'contents': contents?.map((c) => c.toJson()).toList(),
    };
  }

  Map<String, dynamic> toApiJson() {
    if (contents != null && contents!.isNotEmpty) {
      return {
        'role': role,
        'content': contents!.map((c) => c.toApiJson()).toList(),
      };
    }
    return {
      'role': role,
      'content': [
        {'text': content}
      ],
    };
  }

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['id'],
      role: json['role'],
      content: json['content'],
      timestamp: DateTime.parse(json['timestamp']),
      contents: json['contents'] != null
          ? (json['contents'] as List)
              .map((c) => MessageContent.fromJson(c))
              .toList()
          : null,
    );
  }
}

class MessageContent {
  final String type; // 'text', 'image', 'document', 'video'
  final String? text;
  final String? imageSource; // base64 or url
  final String? documentSource;
  final String? videoSource;
  final String? format; // 'png', 'jpeg', 'pdf', etc.

  MessageContent({
    required this.type,
    this.text,
    this.imageSource,
    this.documentSource,
    this.videoSource,
    this.format,
  });

  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'text': text,
      'imageSource': imageSource,
      'documentSource': documentSource,
      'videoSource': videoSource,
      'format': format,
    };
  }

  Map<String, dynamic> toApiJson() {
    switch (type) {
      case 'text':
        return {'text': text};
      case 'image':
        return {
          'image': {
            'format': format ?? 'png',
            'source': {'bytes': imageSource}
          }
        };
      case 'document':
        return {
          'document': {
            'format': format ?? 'pdf',
            'name': 'document',
            'source': {'bytes': documentSource}
          }
        };
      case 'video':
        return {
          'video': {
            'format': format ?? 'mp4',
            'source': {'bytes': videoSource}
          }
        };
      default:
        return {'text': text ?? ''};
    }
  }

  factory MessageContent.fromJson(Map<String, dynamic> json) {
    return MessageContent(
      type: json['type'],
      text: json['text'],
      imageSource: json['imageSource'],
      documentSource: json['documentSource'],
      videoSource: json['videoSource'],
      format: json['format'],
    );
  }
}
