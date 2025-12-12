import 'package:flutter/material.dart';
import '../models/mcp_server.dart';
import '../services/mcp_service.dart';

class MCPServersScreen extends StatefulWidget {
  final String apiUrl;
  final String apiKey;

  const MCPServersScreen({
    super.key,
    required this.apiUrl,
    required this.apiKey,
  });

  @override
  State<MCPServersScreen> createState() => _MCPServersScreenState();
}

class _MCPServersScreenState extends State<MCPServersScreen> {
  late MCPService _mcpService;
  List<MCPServer> _servers = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _mcpService = MCPService(apiUrl: widget.apiUrl, apiKey: widget.apiKey);
    _loadServers();
  }

  Future<void> _loadServers() async {
    try {
      final servers = await _mcpService.getServers();
      setState(() {
        _servers = servers;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load servers: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('MCP Servers'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _servers.isEmpty
              ? const Center(child: Text('No MCP servers configured'))
              : ListView.builder(
                  itemCount: _servers.length,
                  itemBuilder: (context, index) {
                    final server = _servers[index];
                    return ListTile(
                      leading: Icon(
                        server.status == 'active' ? Icons.check_circle : Icons.error,
                        color: server.status == 'active' ? Colors.green : Colors.red,
                      ),
                      title: Text(server.name),
                      subtitle: Text('${server.toolCount} tools'),
                      trailing: IconButton(
                        icon: const Icon(Icons.delete),
                        onPressed: () => _deleteServer(server),
                      ),
                    );
                  },
                ),
    );
  }

  Future<void> _deleteServer(MCPServer server) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Server'),
        content: Text('Delete ${server.name}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await _mcpService.deleteServer(server.id);
        await _loadServers();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to delete: $e')),
          );
        }
      }
    }
  }
}
