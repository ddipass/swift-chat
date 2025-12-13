import '../models/message.dart';

class MockApiService {
  Future<Message> sendMessage(String text) async {
    // Simulate network delay
    await Future.delayed(const Duration(milliseconds: 500));
    
    // Generate response with Markdown examples
    String response;
    String? reasoning;
    
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
      reasoning = '''To create a Flutter app, I need to:
1. Define the main() entry point
2. Create a StatelessWidget for the app structure
3. Use MaterialApp as the root widget
4. Add a Scaffold with AppBar and body''';
    } else if (text.toLowerCase().contains('markdown')) {
      response = '''Markdown supports:

**Bold text** and *italic text*

- Bullet point 1
- Bullet point 2
- Bullet point 3

1. Numbered item
2. Another item

Inline `code` and code blocks.''';
      reasoning = '''For Markdown demonstration, I should show:
- Text formatting (bold, italic)
- Lists (bullets and numbers)
- Code examples (inline and blocks)''';
    } else if (text.toLowerCase().contains('table') || text.toLowerCase().contains('表格')) {
      response = '''Here's a comparison table:

| Feature | React Native | Flutter |
|---------|-------------|---------|
| Language | JavaScript | Dart |
| Performance | Good | Excellent |
| Hot Reload | ✅ Yes | ✅ Yes |
| Native UI | ✅ Yes | ❌ No |

Tables are great for comparing data!''';
      reasoning = '''To create a table, I need to:
1. Define column headers with pipes |
2. Add separator row with dashes
3. Fill in data rows
4. Ensure proper alignment''';
    } else {
      response = 'This is a mock AI response to: "$text"';
      reasoning = 'This is a general query, so I provide a helpful response.';
    }
    
    return Message(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      text: response,
      isUser: false,
      createdAt: DateTime.now(),
      reasoning: reasoning,
    );
  }
}
