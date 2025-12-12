import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/settings_provider.dart';

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
                subtitle: const Text('Enable dark theme'),
                value: settings.isDarkMode,
                onChanged: (value) {
                  settings.setDarkMode(value);
                },
              ),
              const Divider(),
              const ListTile(
                title: Text('Amazon Bedrock'),
                subtitle: Text('SwiftChat Server Configuration'),
              ),
              ListTile(
                title: const Text('API URL'),
                subtitle: Text(settings.apiUrl.isEmpty ? 'Not configured' : settings.apiUrl),
                trailing: const Icon(Icons.edit),
                onTap: () => _showApiUrlDialog(context, settings),
              ),
              ListTile(
                title: const Text('API Key'),
                subtitle: Text(settings.apiKey.isEmpty ? 'Not configured' : '••••••••'),
                trailing: const Icon(Icons.edit),
                onTap: () => _showApiKeyDialog(context, settings),
              ),
              ListTile(
                title: const Text('Region'),
                subtitle: Text(settings.region),
                trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                onTap: () => _showRegionDialog(context, settings),
              ),
              const Divider(),
              const ListTile(
                title: Text('Model'),
                subtitle: Text('Select AI model'),
              ),
              ListTile(
                title: const Text('Selected Model'),
                subtitle: Text(settings.selectedModel.isEmpty ? 'Not selected' : settings.selectedModel),
                trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                onTap: () {
                  // TODO: Show model selection
                },
              ),
              const Divider(),
              const ListTile(
                title: Text('About'),
              ),
              const ListTile(
                title: Text('Version'),
                subtitle: Text('2.6.0'),
              ),
            ],
          );
        },
      ),
    );
  }

  void _showApiUrlDialog(BuildContext context, SettingsProvider settings) {
    final controller = TextEditingController(text: settings.apiUrl);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('API URL'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            hintText: 'https://your-api-url.com',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              settings.setApiUrl(controller.text);
              Navigator.pop(context);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showApiKeyDialog(BuildContext context, SettingsProvider settings) {
    final controller = TextEditingController(text: settings.apiKey);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('API Key'),
        content: TextField(
          controller: controller,
          decoration: const InputDecoration(
            hintText: 'Enter your API key',
          ),
          obscureText: true,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              settings.setApiKey(controller.text);
              Navigator.pop(context);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showRegionDialog(BuildContext context, SettingsProvider settings) {
    final regions = [
      'us-east-1',
      'us-west-2',
      'ap-south-1',
      'ap-southeast-1',
      'ap-southeast-2',
      'ap-northeast-1',
      'ca-central-1',
      'eu-central-1',
      'eu-west-2',
      'eu-west-3',
      'sa-east-1',
    ];

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
              final region = regions[index];
              return RadioListTile<String>(
                title: Text(region),
                value: region,
                groupValue: settings.region,
                onChanged: (value) {
                  if (value != null) {
                    settings.setRegion(value);
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
}
