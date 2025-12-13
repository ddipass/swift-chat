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
    } else if (text.toLowerCase().contains('latex') || 
               text.toLowerCase().contains('formula') ||
               text.toLowerCase().contains('equation') ||
               text.toLowerCase().contains('数学')) {
      response = '''Here are some LaTeX formula examples:

Inline formula: The quadratic formula is \$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}\$

Block formula:

\$\$
E = mc^2
\$\$

Another example with summation:

\$\$
\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
\$\$

And the Pythagorean theorem: \$a^2 + b^2 = c^2\$''';
      reasoning = '''To render LaTeX formulas, I need to:
1. Use \$ for inline formulas
2. Use \$\$ for block formulas
3. Escape backslashes properly
4. Ensure proper spacing''';
    } else if (text.toLowerCase().contains('mix') || 
               text.toLowerCase().contains('all') ||
               text.toLowerCase().contains('混合')) {
      response = '''Here's a comprehensive example with **all formats**:

## 1. Text Formatting
This is **bold** and this is *italic* text.

## 2. Code Block
\`\`\`dart
void main() {
  print('Hello Flutter!');
}
\`\`\`

## 3. LaTeX Formula
The quadratic formula is \$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}\$

Block formula:
\$\$
E = mc^2
\$\$

## 4. Table
| Feature | Status |
|---------|--------|
| Code | ✅ |
| LaTeX | ✅ |
| Table | ✅ |

## 5. List
- Item 1
- Item 2
- Item 3

All formats work together!''';
      reasoning = '''To demonstrate mixed formats, I combined:
1. Markdown headers and text formatting
2. Code blocks with syntax highlighting
3. LaTeX formulas (inline and block)
4. Tables with proper alignment
5. Lists for organization''';
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
