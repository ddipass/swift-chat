import '../models/message.dart';
import 'api_service.dart';

class MockApiService implements ApiService {
  @override
  Stream<String> sendMessage({
    required String text,
    required List<Message> history,
    String? model,
  }) async* {
    await Future.delayed(const Duration(milliseconds: 500));
    
    final response = _generateResponse(text.toLowerCase());
    
    for (int i = 0; i < response.length; i += 5) {
      await Future.delayed(const Duration(milliseconds: 30));
      final end = i + 5 > response.length ? response.length : i + 5;
      yield response.substring(0, end);
    }
  }

  String _generateResponse(String text) {
    if (text.contains('code')) {
      return '''Here's a Flutter example:

\`\`\`dart
void main() {
  runApp(MyApp());
}
\`\`\`

This creates a basic app.''';
    } else if (text.contains('table')) {
      return '''Here's a table:

| Feature | Status |
|---------|--------|
| Chat | ✅ |
| API | ✅ |''';
    }
    
    return 'This is a mock response to: "$text"';
  }

  @override
  Stream<ImageGenerationProgress> generateImage({
    required String prompt,
    String? model,
  }) {
    throw UnimplementedError();
  }

  @override
  Future<List<ModelInfo>> getModels() {
    throw UnimplementedError();
  }

  @override
  Future<TokenUsage> getTokenUsage() {
    return Future.value(TokenUsage(
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    ));
  }
}
