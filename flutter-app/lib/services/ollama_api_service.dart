import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/message.dart';
import 'api_service.dart';

class OllamaApiService implements ApiService {
  final String baseUrl;
  final String? apiKey;

  OllamaApiService({
    required this.baseUrl,
    this.apiKey,
  });

  Map<String, String> get _headers {
    final headers = {'Content-Type': 'application/json'};
    if (apiKey != null && apiKey!.isNotEmpty) {
      headers['Authorization'] = 'Bearer $apiKey';
    }
    return headers;
  }

  @override
  Future<List<Map<String, dynamic>>> getModels() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/tags'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final models = data['models'] as List;
      return models.map((m) => {
        'model_id': m['name'],
        'model_name': m['name'],
      }).toList();
    } else {
      throw Exception('Failed to load models: ${response.statusCode}');
    }
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
      Uri.parse('$baseUrl/api/chat'),
    );

    request.headers.addAll(_headers);
    
    final ollamaMessages = messages.map((m) => {
      'role': m.role,
      'content': m.content,
    }).toList();

    if (systemPrompt != null) {
      ollamaMessages.insert(0, {
        'role': 'system',
        'content': systemPrompt,
      });
    }

    request.body = jsonEncode({
      'model': modelId,
      'messages': ollamaMessages,
      'stream': true,
      'options': {
        'temperature': temperature,
        'num_predict': maxTokens,
      },
    });

    final streamedResponse = await request.send();

    if (streamedResponse.statusCode != 200) {
      throw Exception('Failed to converse: ${streamedResponse.statusCode}');
    }

    await for (var chunk in streamedResponse.stream.transform(utf8.decoder)) {
      final lines = chunk.split('\n');
      for (var line in lines) {
        if (line.trim().isEmpty) continue;
        
        try {
          final json = jsonDecode(line);
          final content = json['message']?['content'];
          if (content != null && content.isNotEmpty) {
            yield content;
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
}
