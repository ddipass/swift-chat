import 'api_service.dart';
import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
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

  Map<String, String> get _headers => {
        'Authorization': 'Bearer $apiKey',
        'Content-Type': 'application/json',
      };

  /// 获取可用模型列表
  Future<List<Map<String, dynamic>>> getModels() async {
    final response = await http.post(
      Uri.parse('$apiUrl/api/models'),
      headers: _headers,
      body: jsonEncode({'region': region}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return List<Map<String, dynamic>>.from(data['models'] ?? []);
    } else {
      throw Exception('Failed to load models: ${response.statusCode}');
    }
  }

  /// 流式对话
  Stream<String> converseStream({
    required String modelId,
    required List<Message> messages,
    String? systemPrompt,
    double temperature = 1.0,
    int maxTokens = 4096,
  }) async* {
    final request = http.Request(
      'POST',
      Uri.parse('$apiUrl/api/converse/v3'),
    );

    request.headers.addAll(_headers);
    request.body = jsonEncode({
      'model_id': modelId,
      'messages': messages.map((m) => m.toApiJson()).toList(),
      'system': systemPrompt != null ? [{'text': systemPrompt}] : null,
      'temperature': temperature,
      'max_tokens': maxTokens,
      'region': region,
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
          if (data.trim().isNotEmpty && data != '[DONE]') {
            try {
              final json = jsonDecode(data);
              if (json['type'] == 'content_block_delta') {
                final text = json['delta']?['text'];
                if (text != null) {
                  yield text;
                }
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    }
  }

  /// 生成图片
  Future<Map<String, dynamic>> generateImage({
    required String prompt,
    String? negativePrompt,
    int width = 1024,
    int height = 1024,
    int numberOfImages = 1,
  }) async {
    final response = await http.post(
      Uri.parse('$apiUrl/api/image/generate'),
      headers: _headers,
      body: jsonEncode({
        'prompt': prompt,
        'negative_prompt': negativePrompt,
        'width': width,
        'height': height,
        'number_of_images': numberOfImages,
        'region': region,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to generate image: ${response.statusCode}');
    }
  }

  /// 检查升级
  Future<Map<String, dynamic>?> checkUpgrade(String currentVersion) async {
    try {
      final response = await http.post(
        Uri.parse('$apiUrl/api/upgrade'),
        headers: _headers,
        body: jsonEncode({'version': currentVersion}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['has_update'] == true) {
          return data;
        }
      }
    } catch (e) {
      // Ignore upgrade check errors
    }
    return null;
  }
}
