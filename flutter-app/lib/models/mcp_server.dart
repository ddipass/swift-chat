class MCPServer {
  final String id;
  String name;
  String command;
  List<String> args;
  Map<String, String>? env;
  String status; // 'active', 'error', 'pending'
  int toolCount;

  MCPServer({
    required this.id,
    required this.name,
    required this.command,
    required this.args,
    this.env,
    this.status = 'pending',
    this.toolCount = 0,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'command': command,
      'args': args.join(','),
      'env': env != null ? env!.entries.map((e) => '${e.key}=${e.value}').join(',') : null,
      'status': status,
      'toolCount': toolCount,
    };
  }

  factory MCPServer.fromJson(Map<String, dynamic> json) {
    return MCPServer(
      id: json['id'],
      name: json['name'],
      command: json['command'],
      args: (json['args'] as String).split(','),
      env: json['env'] != null 
          ? Map.fromEntries((json['env'] as String).split(',').map((e) {
              final parts = e.split('=');
              return MapEntry(parts[0], parts[1]);
            }))
          : null,
      status: json['status'] ?? 'pending',
      toolCount: json['toolCount'] ?? 0,
    );
  }
}

class MCPTool {
  final String name;
  final String description;
  final Map<String, dynamic> inputSchema;

  MCPTool({
    required this.name,
    required this.description,
    required this.inputSchema,
  });

  factory MCPTool.fromJson(Map<String, dynamic> json) {
    return MCPTool(
      name: json['name'],
      description: json['description'],
      inputSchema: json['inputSchema'] ?? {},
    );
  }
}
