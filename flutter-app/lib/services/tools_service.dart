import 'dart:convert';
import 'package:http/http.dart' as http;

class ToolsService {
  final String apiUrl;
  final String apiKey;

  ToolsService({required this.apiUrl, required this.apiKey});

  Map<String, String> get _headers => {
        'Authorization': 'Bearer $apiKey',
        'Content-Type': 'application/json',
      };

  Future<List<Map<String, dynamic>>> listTools() async {
    final response = await http.get(
      Uri.parse('$apiUrl/api/tools/list'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return List<Map<String, dynamic>>.from(data['tools'] ?? []);
    }
    throw Exception('Failed to load tools');
  }

  Future<Map<String, dynamic>> executeTool({
    required String name,
    required Map<String, dynamic> arguments,
  }) async {
    final response = await http.post(
      Uri.parse('$apiUrl/api/tool/exec'),
      headers: _headers,
      body: jsonEncode({
        'name': name,
        'arguments': arguments,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to execute tool');
  }
}
