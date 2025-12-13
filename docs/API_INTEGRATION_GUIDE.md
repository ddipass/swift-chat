# SwiftChat API 集成指南

## 概述

本文档说明如何在Week 3将Flutter UI与现有后端API集成。

---

## 现有API接口

### 1. 文本聊天 (流式)

**接口**: `POST {apiUrl}/api/chat/stream`

**请求头**:
```
Content-Type: application/json
X-API-Key: {apiKey}
```

**请求体**:
```json
{
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Hello"
        }
      ]
    }
  ],
  "model": "anthropic.claude-3-5-sonnet-20241022-v2:0",
  "region": "us-east-1",
  "systemPrompt": "You are a helpful assistant"
}
```

**响应**: Server-Sent Events (SSE)

```
data: {"type":"content_block_delta","delta":{"type":"text","text":"Hello"}}

data: {"type":"message_delta","usage":{"output_tokens":10}}

data: {"type":"message_stop"}
```

---

### 2. 图片生成

**接口**: `POST {apiUrl}/api/image/generate`

**请求体**:
```json
{
  "prompt": "A beautiful sunset",
  "model": "amazon.nova-canvas-v1:0",
  "region": "us-east-1",
  "size": "1024x1024"
}
```

**响应**:
```json
{
  "imageUrl": "https://...",
  "seed": 12345
}
```

---

### 3. 模型列表

**接口**: `GET {apiUrl}/api/models?region={region}`

**响应**:
```json
{
  "textModels": [
    {
      "modelId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
      "modelName": "Claude 3.5 Sonnet v2"
    }
  ],
  "imageModels": [
    {
      "modelId": "amazon.nova-canvas-v1:0",
      "modelName": "Nova Canvas"
    }
  ]
}
```

---

## Flutter实现

### 1. API服务接口定义

```dart
// lib/services/api_service.dart

abstract class ApiService {
  /// 发送文本消息 (流式)
  Stream<ChatResponse> sendMessage({
    required List<Message> messages,
    required String model,
    required String region,
    String? systemPrompt,
  });

  /// 生成图片
  Future<ImageResponse> generateImage({
    required String prompt,
    required String model,
    required String region,
    String? size,
  });

  /// 获取模型列表
  Future<ModelList> getModels({
    required String region,
  });
}

class ChatResponse {
  final String? text;
  final String? reasoning;
  final Usage? usage;
  final bool isComplete;

  ChatResponse({
    this.text,
    this.reasoning,
    this.usage,
    this.isComplete = false,
  });
}

class Usage {
  final int inputTokens;
  final int outputTokens;
  final int totalTokens;

  Usage({
    required this.inputTokens,
    required this.outputTokens,
    required this.totalTokens,
  });
}
```

---

### 2. Bedrock API实现

```dart
// lib/services/bedrock_api_service.dart

import 'package:http/http.dart' as http;
import 'dart:convert';

class BedrockApiService implements ApiService {
  final String apiUrl;
  final String apiKey;

  BedrockApiService({
    required this.apiUrl,
    required this.apiKey,
  });

  @override
  Stream<ChatResponse> sendMessage({
    required List<Message> messages,
    required String model,
    required String region,
    String? systemPrompt,
  }) async* {
    final url = Uri.parse('$apiUrl/api/chat/stream');
    
    final request = http.Request('POST', url);
    request.headers['Content-Type'] = 'application/json';
    request.headers['X-API-Key'] = apiKey;
    
    request.body = jsonEncode({
      'messages': messages.map((m) => m.toJson()).toList(),
      'model': model,
      'region': region,
      if (systemPrompt != null) 'systemPrompt': systemPrompt,
    });

    final response = await request.send();
    
    if (response.statusCode != 200) {
      throw Exception('API request failed: ${response.statusCode}');
    }

    // 处理SSE流
    await for (final chunk in response.stream.transform(utf8.decoder)) {
      final lines = chunk.split('\n');
      
      for (final line in lines) {
        if (line.startsWith('data: ')) {
          final data = line.substring(6);
          if (data.trim().isEmpty) continue;
          
          try {
            final json = jsonDecode(data);
            
            if (json['type'] == 'content_block_delta') {
              yield ChatResponse(
                text: json['delta']['text'],
                isComplete: false,
              );
            } else if (json['type'] == 'message_delta') {
              final usage = json['usage'];
              if (usage != null) {
                yield ChatResponse(
                  usage: Usage(
                    inputTokens: usage['input_tokens'] ?? 0,
                    outputTokens: usage['output_tokens'] ?? 0,
                    totalTokens: (usage['input_tokens'] ?? 0) + 
                                 (usage['output_tokens'] ?? 0),
                  ),
                  isComplete: false,
                );
              }
            } else if (json['type'] == 'message_stop') {
              yield ChatResponse(isComplete: true);
            }
          } catch (e) {
            print('Error parsing SSE data: $e');
          }
        }
      }
    }
  }

  @override
  Future<ImageResponse> generateImage({
    required String prompt,
    required String model,
    required String region,
    String? size,
  }) async {
    final url = Uri.parse('$apiUrl/api/image/generate');
    
    final response = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: jsonEncode({
        'prompt': prompt,
        'model': model,
        'region': region,
        if (size != null) 'size': size,
      }),
    );

    if (response.statusCode != 200) {
      throw Exception('Image generation failed: ${response.statusCode}');
    }

    final json = jsonDecode(response.body);
    return ImageResponse(
      imageUrl: json['imageUrl'],
      seed: json['seed'],
    );
  }

  @override
  Future<ModelList> getModels({
    required String region,
  }) async {
    final url = Uri.parse('$apiUrl/api/models?region=$region');
    
    final response = await http.get(
      url,
      headers: {
        'X-API-Key': apiKey,
      },
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to load models: ${response.statusCode}');
    }

    final json = jsonDecode(response.body);
    return ModelList.fromJson(json);
  }
}
```

---

### 3. 在UI中使用

```dart
// lib/screens/chat_screen.dart

class ChatScreen extends StatefulWidget {
  @override
  _ChatScreenState createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  late ApiService _apiService;
  final List<Message> _messages = [];
  String _currentResponse = '';

  @override
  void initState() {
    super.initState();
    
    // 从配置中读取API信息
    final apiUrl = // 从SharedPreferences读取
    final apiKey = // 从SharedPreferences读取
    
    _apiService = BedrockApiService(
      apiUrl: apiUrl,
      apiKey: apiKey,
    );
  }

  Future<void> _sendMessage(String text) async {
    final userMessage = Message(
      role: 'user',
      content: text,
      isUser: true,
    );
    
    setState(() {
      _messages.insert(0, userMessage);
      _currentResponse = '';
    });

    try {
      await for (final response in _apiService.sendMessage(
        messages: _messages.reversed.toList(),
        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        region: 'us-east-1',
      )) {
        setState(() {
          if (response.text != null) {
            _currentResponse += response.text!;
          }
          
          if (response.isComplete) {
            _messages.insert(0, Message(
              role: 'assistant',
              content: _currentResponse,
              isUser: false,
              usage: response.usage,
            ));
            _currentResponse = '';
          }
        });
      }
    } catch (e) {
      // 错误处理
      print('Error: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('发送失败: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              reverse: true,
              itemCount: _messages.length + (_currentResponse.isNotEmpty ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == 0 && _currentResponse.isNotEmpty) {
                  return MessageBubble(
                    text: _currentResponse,
                    isUser: false,
                    isStreaming: true,
                  );
                }
                
                final message = _messages[index - (_currentResponse.isNotEmpty ? 1 : 0)];
                return MessageBubble(
                  text: message.content,
                  isUser: message.isUser,
                );
              },
            ),
          ),
          InputToolbar(
            onSend: _sendMessage,
          ),
        ],
      ),
    );
  }
}
```

---

## 错误处理

### 常见错误

1. **401 Unauthorized**: API Key错误
2. **404 Not Found**: API URL错误
3. **500 Internal Server Error**: 后端错误
4. **超时**: 网络问题

### 处理策略

```dart
try {
  await for (final response in _apiService.sendMessage(...)) {
    // 处理响应
  }
} on TimeoutException {
  // 超时处理
  showError('请求超时，请检查网络连接');
} on http.ClientException {
  // 网络错误
  showError('网络连接失败');
} catch (e) {
  // 其他错误
  showError('发送失败: $e');
}
```

---

## 测试清单

### Week 3 Day 1-2: 文本聊天
- [ ] 能发送消息到后端
- [ ] 流式响应能逐字显示
- [ ] Token统计正确显示
- [ ] 错误处理正常
- [ ] 超时处理正常

### Week 3 Day 3: 图片生成
- [ ] 能生成图片
- [ ] 进度条正常显示
- [ ] 图片能保存
- [ ] 错误处理正常

### Week 3 Day 4: 数据持久化
- [ ] 历史记录能保存
- [ ] 重启后数据还在
- [ ] 能切换不同会话

### Week 3 Day 5: 配置持久化
- [ ] 设置能保存
- [ ] 重启后配置保持

### Week 3 Day 6-7: 集成测试
- [ ] 端到端测试通过
- [ ] 性能测试通过
- [ ] 可以发布内测版本

---

**参考源码**: `react-native/src/api/bedrock-api.ts`

**最后更新**: 2025-12-13
