import '../models/message.dart';

abstract class ApiService {
  Future<List<Map<String, dynamic>>> getModels();
  
  Stream<String> converseStream({
    required String modelId,
    required List<Message> messages,
    String? systemPrompt,
    double temperature = 1.0,
    int maxTokens = 4096,
  });
}

enum ApiProvider {
  bedrock,
  ollama,
  deepseek,
  openai,
}
