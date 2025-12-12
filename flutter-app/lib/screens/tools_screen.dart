import 'package:flutter/material.dart';
import '../services/tools_service.dart';

class ToolsScreen extends StatefulWidget {
  final String apiUrl;
  final String apiKey;

  const ToolsScreen({
    super.key,
    required this.apiUrl,
    required this.apiKey,
  });

  @override
  State<ToolsScreen> createState() => _ToolsScreenState();
}

class _ToolsScreenState extends State<ToolsScreen> {
  late ToolsService _toolsService;
  List<Map<String, dynamic>> _tools = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _toolsService = ToolsService(apiUrl: widget.apiUrl, apiKey: widget.apiKey);
    _loadTools();
  }

  Future<void> _loadTools() async {
    try {
      final tools = await _toolsService.listTools();
      setState(() {
        _tools = tools;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load tools: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Available Tools'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _tools.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.build, size: 64, color: Colors.grey),
                      SizedBox(height: 16),
                      Text('No tools available'),
                      SizedBox(height: 8),
                      Text(
                        'Configure MCP servers to add tools',
                        style: TextStyle(color: Colors.grey),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  itemCount: _tools.length,
                  itemBuilder: (context, index) {
                    final tool = _tools[index];
                    return ExpansionTile(
                      leading: const Icon(Icons.extension),
                      title: Text(tool['name'] ?? 'Unknown'),
                      subtitle: Text(
                        tool['description'] ?? 'No description',
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Description:',
                                style: TextStyle(fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 8),
                              Text(tool['description'] ?? 'No description'),
                              const SizedBox(height: 16),
                              const Text(
                                'Input Schema:',
                                style: TextStyle(fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                tool['inputSchema']?.toString() ?? 'None',
                                style: const TextStyle(
                                  fontFamily: 'monospace',
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    );
                  },
                ),
    );
  }
}
