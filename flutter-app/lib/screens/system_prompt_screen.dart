import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:uuid/uuid.dart';
import '../providers/chat_provider.dart';
import '../models/system_prompt.dart';

class SystemPromptScreen extends StatefulWidget {
  const SystemPromptScreen({super.key});

  @override
  State<SystemPromptScreen> createState() => _SystemPromptScreenState();
}

class _SystemPromptScreenState extends State<SystemPromptScreen> {
  final _uuid = const Uuid();
  List<SystemPrompt> _prompts = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPrompts();
  }

  Future<void> _loadPrompts() async {
    final chatProvider = context.read<ChatProvider>();
    final prompts = await chatProvider.loadSystemPrompts();
    setState(() {
      _prompts = prompts;
      _isLoading = false;
    });
  }

  void _showAddDialog() {
    final nameController = TextEditingController();
    final promptController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add System Prompt'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: const InputDecoration(
                  labelText: 'Name',
                  hintText: 'e.g., Code Expert',
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: promptController,
                decoration: const InputDecoration(
                  labelText: 'Prompt',
                  hintText: 'Enter system prompt...',
                ),
                maxLines: 5,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              if (nameController.text.isNotEmpty && promptController.text.isNotEmpty) {
                final prompt = SystemPrompt(
                  id: _uuid.v4(),
                  name: nameController.text,
                  prompt: promptController.text,
                  order: _prompts.length,
                );
                
                final chatProvider = context.read<ChatProvider>();
                await chatProvider.saveSystemPrompt(prompt);
                await _loadPrompts();
                
                if (mounted) Navigator.pop(context);
              }
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }

  void _showEditDialog(SystemPrompt prompt) {
    final nameController = TextEditingController(text: prompt.name);
    final promptController = TextEditingController(text: prompt.prompt);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Edit System Prompt'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: const InputDecoration(labelText: 'Name'),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: promptController,
                decoration: const InputDecoration(labelText: 'Prompt'),
                maxLines: 5,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              if (nameController.text.isNotEmpty && promptController.text.isNotEmpty) {
                final updated = prompt.copyWith(
                  name: nameController.text,
                  prompt: promptController.text,
                );
                
                final chatProvider = context.read<ChatProvider>();
                await chatProvider.saveSystemPrompt(updated);
                await _loadPrompts();
                
                if (mounted) Navigator.pop(context);
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _deletePrompt(SystemPrompt prompt) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Prompt'),
        content: Text('Are you sure you want to delete "${prompt.name}"?'),
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
      final chatProvider = context.read<ChatProvider>();
      await chatProvider.deleteSystemPrompt(prompt.id);
      await _loadPrompts();
    }
  }

  void _selectPrompt(SystemPrompt prompt) {
    final chatProvider = context.read<ChatProvider>();
    chatProvider.setSystemPrompt(prompt.prompt);
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Selected: ${prompt.name}')),
    );
    
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('System Prompts'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: _showAddDialog,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _prompts.isEmpty
              ? const Center(child: Text('No system prompts'))
              : ReorderableListView.builder(
                  itemCount: _prompts.length,
                  onReorder: (oldIndex, newIndex) async {
                    setState(() {
                      if (newIndex > oldIndex) newIndex--;
                      final item = _prompts.removeAt(oldIndex);
                      _prompts.insert(newIndex, item);
                    });
                    
                    final chatProvider = context.read<ChatProvider>();
                    await chatProvider.updateSystemPromptOrder(_prompts);
                  },
                  itemBuilder: (context, index) {
                    final prompt = _prompts[index];
                    return ListTile(
                      key: ValueKey(prompt.id),
                      leading: const Icon(Icons.drag_handle),
                      title: Text(prompt.name),
                      subtitle: Text(
                        prompt.prompt,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (!prompt.isBuiltIn)
                            IconButton(
                              icon: const Icon(Icons.edit),
                              onPressed: () => _showEditDialog(prompt),
                            ),
                          if (!prompt.isBuiltIn)
                            IconButton(
                              icon: const Icon(Icons.delete),
                              onPressed: () => _deletePrompt(prompt),
                            ),
                        ],
                      ),
                      onTap: () => _selectPrompt(prompt),
                    );
                  },
                ),
    );
  }
}
