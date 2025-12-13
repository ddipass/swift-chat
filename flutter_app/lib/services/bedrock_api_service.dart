import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_service.dart';
import '../models/message.dart';

class BedrockApiService implements ApiService {
  final String apiUrl;
  final String apiKey;
  final String region;

  BedrockApiService({
    required this.apiUrl,
    required this.apiKey,
    required this.region,
  });

  @override
  Stream<String> sendMessage({
    required String text,
    required List<Message> history,
    String? model,
  }) async* {
    final url = Uri.parse('$apiUrl/api/converse/v3');
    
    final request = http.Request('POST', url);
    request.headers['accept'] = '*/*';
    request.headers['content-type'] = 'application/json';
    request.headers['Authorization'] = 'Bearer $apiKey';
    
    // 构建消息列表
    final messages = history.map((m) => {
      'role': m.isUser ? 'user' : 'assistant',
      'content': [{'text': m.text}],
    }).toList();
    
    final body = {
      'messages': messages,
      'modelId': model ?? 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      'region': region,
    };
    
    request.body = jsonEncode(body);

    try {
      final response = await request.send();
      
      if (response.statusCode != 200) {
        yield 'Error: API request failed (${response.statusCode})';
        return;
      }

      String completeText = '';
      
      await for (final chunk in response.stream.transform(utf8.decoder)) {
        final events = chunk.split('\n\n');
        
        for (final event in events) {
          if (event.trim().isEmpty) continue;
          
          try {
            final json = jsonDecode(event);
            final text = json['contentBlockDelta']?['delta']?['text'];
            
            if (text != null) {
              completeText += text as String;
              yield completeText;
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    } catch (e) {
      yield 'Error: $e';
    }
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
