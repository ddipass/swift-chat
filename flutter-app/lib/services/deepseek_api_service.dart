import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/message.dart';
import 'api_service.dart';

class DeepSeekApiService implements ApiService {
  final String apiKey;
  static const String baseUrl = 'https://api.deepseek.com';

  DeepSeekApiService({required this.apiKey});

  Map<String, String> get _headers => {
        'Authorization': 'Bearer $apiKey',
        'Content-Type': 'application/json',
      };

  @override
  Future<List<Map<String, dynamic>>> getModels() async {
    return [
      {'model_id': 'deepseek-chat', 'model_name': 'DeepSeek Chat'},
      {'model_id': 'deepseek-reasoner', 'model_name': 'DeepSeek Reasoner'},
    ];
  }

  @override
  Stream<String> converseStream({
    required String modelId,
    required List<Message> messages,
    String? systemPrompt,
    double temperature = 1.0,
    int maxTokens = 4096,
  }) async* {
    final request = http.Request(
      'POST',
      Uri.parse('$baseUrl/chat/completions'),
    );

    request.headers.addAll(_headers);

    final apiMessages = <Map<String, dynamic>>[];
    
    if (systemPrompt != null) {
      apiMessages.add({
        'role': 'system',
        'content': systemPrompt,
      });
    }

    for (final m in messages) {
      apiMessages.add({
        'role': m.role == 'assistant' ? 'assistant' : 'user',
        'content': m.content,
      });
    }

    request.body = jsonEncode({
      'model': modelId,
      'messages': apiMessages,
      'temperature': temperature,
      'max_tokens': maxTokens,
      'stream': true,
    });

    final streamedResponse = await request.send();

    if (streamedResponse.statusCode != 200) {
      throw Exception('Failed to converse: ${streamedResponse.statusCode}');
    }

    await for (var chunk in streamedResponse.stream.transform(utf8.decoder)) {
      final lines = chunk.split('\n');
      for (var line in lines) {
        if (line.startsWith('data: ')) {
          final data = line.substring(6);
          if (data.trim() == '[DONE]') continue;
          
          try {
            final json = jsonDecode(data);
            final content = json['choices']?[0]?['delta']?['content'];
            if (content != null) {
              yield content;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }
}
