import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/mcp_server.dart';

class MCPService {
  final String apiUrl;
  final String apiKey;

  MCPService({required this.apiUrl, required this.apiKey});

  Map<String, String> get _headers => {
        'Authorization': 'Bearer $apiKey',
        'Content-Type': 'application/json',
      };

  Future<List<MCPServer>> getServers() async {
    final response = await http.get(
      Uri.parse('$apiUrl/api/mcp/servers'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final servers = data['servers'] as List;
      return servers.map((s) => MCPServer(
        id: s['server_id'],
        name: s['name'],
        command: '',
        args: [],
        status: s['status'],
        toolCount: s['tool_count'] ?? 0,
      )).toList();
    }
    throw Exception('Failed to load MCP servers');
  }

  Future<Map<String, dynamic>> addServer(MCPServer server) async {
    final response = await http.post(
      Uri.parse('$apiUrl/api/mcp/servers'),
      headers: _headers,
      body: jsonEncode({
        'name': server.name,
        'command': server.command,
        'args': server.args,
        'env': server.env,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to add MCP server');
  }

  Future<void> deleteServer(String serverId) async {
    final response = await http.delete(
      Uri.parse('$apiUrl/api/mcp/servers/$serverId'),
      headers: _headers,
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to delete MCP server');
    }
  }

  Future<List<MCPTool>> getTools(String serverId) async {
    final response = await http.get(
      Uri.parse('$apiUrl/api/mcp/servers/$serverId/tools'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final tools = data['tools'] as List;
      return tools.map((t) => MCPTool.fromJson(t)).toList();
    }
    throw Exception('Failed to load tools');
  }
}
