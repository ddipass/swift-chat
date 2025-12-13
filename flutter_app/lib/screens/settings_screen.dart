import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/theme_provider.dart';
import '../widgets/custom_text_field.dart';
import '../widgets/custom_dropdown.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  String _apiUrl = '';
  String _apiKey = '';
  String _region = 'us-east-1';
  String _textModel = 'anthropic.claude-3-5-sonnet-20241022-v2:0';
  
  final List<DropdownItem> _regions = [
    DropdownItem(label: 'US East (N. Virginia)', value: 'us-east-1'),
    DropdownItem(label: 'US West (Oregon)', value: 'us-west-2'),
    DropdownItem(label: 'Asia Pacific (Tokyo)', value: 'ap-northeast-1'),
    DropdownItem(label: 'Asia Pacific (Singapore)', value: 'ap-southeast-1'),
    DropdownItem(label: 'Europe (Frankfurt)', value: 'eu-central-1'),
  ];

  final List<DropdownItem> _textModels = [
    DropdownItem(label: 'Claude 3.5 Sonnet v2', value: 'anthropic.claude-3-5-sonnet-20241022-v2:0'),
    DropdownItem(label: 'Claude 3.5 Haiku', value: 'anthropic.claude-3-5-haiku-20241022-v1:0'),
    DropdownItem(label: 'Nova Pro', value: 'amazon.nova-pro-v1:0'),
    DropdownItem(label: 'Nova Lite', value: 'amazon.nova-lite-v1:0'),
  ];

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _apiUrl = prefs.getString('apiUrl') ?? '';
      _apiKey = prefs.getString('apiKey') ?? '';
      _region = prefs.getString('region') ?? 'us-east-1';
      _textModel = prefs.getString('textModel') ?? 'anthropic.claude-3-5-sonnet-20241022-v2:0';
    });
  }

  Future<void> _saveSettings() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('apiUrl', _apiUrl);
    await prefs.setString('apiKey', _apiKey);
    await prefs.setString('region', _region);
    await prefs.setString('textModel', _textModel);
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Settings saved')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = Provider.of<ThemeProvider>(context).colors;

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        backgroundColor: colors.surface,
        elevation: 0,
        title: Text(
          'Settings',
          style: TextStyle(
            color: colors.text,
            fontSize: 17,
            fontWeight: FontWeight.w600,
          ),
        ),
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: colors.text),
          onPressed: () => context.go('/chat/-1'),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.check, color: colors.text),
            onPressed: _saveSettings,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Amazon Bedrock',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: colors.text,
              ),
            ),
            const SizedBox(height: 16),
            
            CustomTextField(
              label: 'API URL',
              value: _apiUrl,
              placeholder: 'https://your-api.com',
              colors: colors,
              onChanged: (value) => setState(() => _apiUrl = value),
            ),
            const SizedBox(height: 16),
            
            CustomTextField(
              label: 'API Key',
              value: _apiKey,
              placeholder: 'Enter your API key',
              obscureText: true,
              colors: colors,
              onChanged: (value) => setState(() => _apiKey = value),
            ),
            const SizedBox(height: 16),
            
            CustomDropdown(
              label: 'Region',
              value: _region,
              items: _regions,
              colors: colors,
              onChanged: (value) => setState(() => _region = value!),
            ),
            const SizedBox(height: 16),
            
            CustomDropdown(
              label: 'Text Model',
              value: _textModel,
              items: _textModels,
              colors: colors,
              onChanged: (value) => setState(() => _textModel = value!),
            ),
            const SizedBox(height: 32),
            
            if (_apiUrl.isEmpty || _apiKey.isEmpty)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: colors.surface,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: colors.error),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline, color: colors.error, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Please enter API URL and API Key',
                        style: TextStyle(fontSize: 14, color: colors.error),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
