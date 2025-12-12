import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/settings_provider.dart';
import '../services/api_service.dart';
import 'mcp_servers_screen.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: Consumer<SettingsProvider>(
        builder: (context, settings, _) {
          return ListView(
            children: [
              SwitchListTile(
                title: const Text('Dark Mode'),
                value: settings.isDarkMode,
                onChanged: (value) => settings.setDarkMode(value),
              ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.extension),
                title: const Text('MCP Servers'),
                subtitle: const Text('Manage MCP server connections'),
                trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                onTap: () {
                  if (settings.selectedProvider == ApiProvider.bedrock &&
                      settings.isConfigured) {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => MCPServersScreen(
                          apiUrl: settings.bedrockApiUrl,
                          apiKey: settings.bedrockApiKey,
                        ),
                      ),
                    );
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('MCP only available with Bedrock API'),
                      ),
                    );
                  }
                },
              ),
              const Divider(),              const ListTile(
                title: Text('API Provider'),
                subtitle: Text('Select your AI provider'),
              ),
              ...ApiProvider.values.map((provider) {
                return RadioListTile<ApiProvider>(
                  title: Text(_getProviderName(provider)),
                  value: provider,
                  groupValue: settings.selectedProvider,
                  onChanged: (value) {
                    if (value != null) settings.setSelectedProvider(value);
                  },
                );
              }),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.extension),
                title: const Text('MCP Servers'),
                subtitle: const Text('Manage MCP server connections'),
                trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                onTap: () {
                  if (settings.selectedProvider == ApiProvider.bedrock &&
                      settings.isConfigured) {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => MCPServersScreen(
                          apiUrl: settings.bedrockApiUrl,
                          apiKey: settings.bedrockApiKey,
                        ),
                      ),
                    );
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('MCP only available with Bedrock API'),
                      ),
                    );
                  }
                },
              ),
              const Divider(),              if (settings.selectedProvider == ApiProvider.bedrock)
                _BedrockSettings(),
              if (settings.selectedProvider == ApiProvider.ollama)
                _OllamaSettings(),
              if (settings.selectedProvider == ApiProvider.deepseek)
                _DeepSeekSettings(),
              if (settings.selectedProvider == ApiProvider.openai)
                _OpenAISettings(),
            ],
          );
        },
      ),
    );
  }

  String _getProviderName(ApiProvider provider) {
    switch (provider) {
      case ApiProvider.bedrock:
        return 'Amazon Bedrock';
      case ApiProvider.ollama:
        return 'Ollama';
      case ApiProvider.deepseek:
        return 'DeepSeek';
      case ApiProvider.openai:
        return 'OpenAI';
    }
  }
}

class _BedrockSettings extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsProvider>();
    return Column(
      children: [
        ListTile(
          title: const Text('API URL'),
          subtitle: Text(settings.bedrockApiUrl.isEmpty ? 'Not configured' : settings.bedrockApiUrl),
          trailing: const Icon(Icons.edit),
          onTap: () => _showDialog(context, 'API URL', settings.bedrockApiUrl, settings.setBedrockApiUrl),
        ),
        ListTile(
          title: const Text('API Key'),
          subtitle: Text(settings.bedrockApiKey.isEmpty ? 'Not configured' : '••••••••'),
          trailing: const Icon(Icons.edit),
          onTap: () => _showDialog(context, 'API Key', settings.bedrockApiKey, settings.setBedrockApiKey, obscure: true),
        ),
        ListTile(
          title: const Text('Region'),
          subtitle: Text(settings.bedrockRegion),
          trailing: const Icon(Icons.arrow_forward_ios, size: 16),
          onTap: () => _showRegionDialog(context, settings),
        ),
      ],
    );
  }

  void _showRegionDialog(BuildContext context, SettingsProvider settings) {
    final regions = ['us-east-1', 'us-west-2', 'ap-south-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ca-central-1', 'eu-central-1', 'eu-west-2', 'eu-west-3', 'sa-east-1'];
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Select Region'),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: regions.length,
            itemBuilder: (context, index) {
              return RadioListTile<String>(
                title: Text(regions[index]),
                value: regions[index],
                groupValue: settings.bedrockRegion,
                onChanged: (value) {
                  if (value != null) {
                    settings.setBedrockRegion(value);
                    Navigator.pop(context);
                  }
                },
              );
            },
          ),
        ),
      ),
    );
  }

  void _showDialog(BuildContext context, String title, String value, Function(String) onSave, {bool obscure = false}) {
    final controller = TextEditingController(text: value);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: TextField(
          controller: controller,
          obscureText: obscure,
          decoration: InputDecoration(hintText: 'Enter $title'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              onSave(controller.text);
              Navigator.pop(context);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}

class _OllamaSettings extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsProvider>();
    return Column(
      children: [
        ListTile(
          title: const Text('Base URL'),
          subtitle: Text(settings.ollamaBaseUrl),
          trailing: const Icon(Icons.edit),
          onTap: () => _showDialog(context, 'Base URL', settings.ollamaBaseUrl, settings.setOllamaBaseUrl),
        ),
        ListTile(
          title: const Text('API Key (Optional)'),
          subtitle: Text(settings.ollamaApiKey.isEmpty ? 'Not set' : '••••••••'),
          trailing: const Icon(Icons.edit),
          onTap: () => _showDialog(context, 'API Key', settings.ollamaApiKey, settings.setOllamaApiKey, obscure: true),
        ),
      ],
    );
  }

  void _showDialog(BuildContext context, String title, String value, Function(String) onSave, {bool obscure = false}) {
    final controller = TextEditingController(text: value);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: TextField(
          controller: controller,
          obscureText: obscure,
          decoration: InputDecoration(hintText: 'Enter $title'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              onSave(controller.text);
              Navigator.pop(context);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}

class _DeepSeekSettings extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsProvider>();
    return ListTile(
      title: const Text('API Key'),
      subtitle: Text(settings.deepseekApiKey.isEmpty ? 'Not configured' : '••••••••'),
      trailing: const Icon(Icons.edit),
      onTap: () => _showDialog(context, 'API Key', settings.deepseekApiKey, settings.setDeepSeekApiKey),
    );
  }

  void _showDialog(BuildContext context, String title, String value, Function(String) onSave) {
    final controller = TextEditingController(text: value);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: TextField(
          controller: controller,
          obscureText: true,
          decoration: InputDecoration(hintText: 'Enter $title'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              onSave(controller.text);
              Navigator.pop(context);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}

class _OpenAISettings extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final settings = context.watch<SettingsProvider>();
    return Column(
      children: [
        ListTile(
          title: const Text('API Key'),
          subtitle: Text(settings.openaiApiKey.isEmpty ? 'Not configured' : '••••••••'),
          trailing: const Icon(Icons.edit),
          onTap: () => _showDialog(context, 'API Key', settings.openaiApiKey, settings.setOpenAIApiKey, obscure: true),
        ),
        ListTile(
          title: const Text('Base URL (Optional)'),
          subtitle: Text(settings.openaiBaseUrl.isEmpty ? 'Default: api.openai.com' : settings.openaiBaseUrl),
          trailing: const Icon(Icons.edit),
          onTap: () => _showDialog(context, 'Base URL', settings.openaiBaseUrl, settings.setOpenAIBaseUrl),
        ),
      ],
    );
  }

  void _showDialog(BuildContext context, String title, String value, Function(String) onSave, {bool obscure = false}) {
    final controller = TextEditingController(text: value);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: TextField(
          controller: controller,
          obscureText: obscure,
          decoration: InputDecoration(hintText: 'Enter $title'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              onSave(controller.text);
              Navigator.pop(context);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }
}
