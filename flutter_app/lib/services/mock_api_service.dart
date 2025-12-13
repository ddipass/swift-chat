import '../models/message.dart';

class MockApiService {
  Future<Message> sendMessage(String text) async {
    // Simulate network delay
    await Future.delayed(const Duration(milliseconds: 500));
    
    // Generate response with Markdown examples
    String response;
    if (text.toLowerCase().contains('code')) {
      response = '''Here's a simple Flutter example:

```dart
void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Demo',
      home: Scaffold(
        appBar: AppBar(title: Text('Hello')),
        body: Center(child: Text('World')),
      ),
    );
  }
}
```

This creates a basic Flutter app with an AppBar and centered text.''';
    } else if (text.toLowerCase().contains('markdown')) {
      response = '''Markdown supports:

**Bold text** and *italic text*

- Bullet point 1
- Bullet point 2
- Bullet point 3

1. Numbered item
2. Another item

Inline `code` and code blocks.''';
    } else {
      response = 'This is a mock AI response to: "$text"';
    }
    
    return Message(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      text: response,
      isUser: false,
      createdAt: DateTime.now(),
    );
  }
}
