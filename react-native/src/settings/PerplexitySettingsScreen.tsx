import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Switch,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useTheme, ColorScheme } from '../theme';
import {
  getPerplexityEnabled,
  setPerplexityEnabled,
  getPerplexityApiKey,
  savePerplexityApiKey,
  getPerplexityBaseUrl,
  savePerplexityBaseUrl,
  getPerplexityEnabledTools,
  savePerplexityEnabledTools,
  getPerplexityToolDescriptions,
  savePerplexityToolDescriptions,
  PerplexityToolDescription,
} from '../storage/StorageUtils';
import CustomTextInput from './CustomTextInput';
import { getDefaultToolDescriptions } from '../mcp/PerplexityTools';
import { PerplexitySearchClient } from '../search/PerplexitySearch';
import { getBuiltInTools } from '../mcp/BuiltInTools';

const AVAILABLE_TOOLS = [
  {
    id: 'search',
    name: 'Search',
    description: 'Direct web search (~5s)',
    timeout: '30s',
  },
  {
    id: 'ask',
    name: 'Ask',
    description: 'Conversational AI with web search (~10s)',
    timeout: '60s',
  },
  {
    id: 'research',
    name: 'Research',
    description: 'Deep comprehensive research (~200s)',
    timeout: '5min',
  },
  {
    id: 'reason',
    name: 'Reason',
    description: 'Advanced reasoning (~30s)',
    timeout: '90s',
  },
];

const PerplexitySettingsScreen = () => {
  const { colors } = useTheme();
  const [enabled, setEnabled] = useState(getPerplexityEnabled());
  const [apiKey, setApiKey] = useState(getPerplexityApiKey());
  const [baseUrl, setBaseUrl] = useState(getPerplexityBaseUrl());
  const [enabledTools, setEnabledTools] = useState<string[]>(
    getPerplexityEnabledTools()
  );
  const [toolDescriptions, setToolDescriptions] =
    useState<PerplexityToolDescription>(getPerplexityToolDescriptions());
  const [editingTool, setEditingTool] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    duration?: number;
  } | null>(null);
  const [registeredTools, setRegisteredTools] = useState<string[]>([]);

  const defaultDescriptions = getDefaultToolDescriptions();

  useEffect(() => {
    const tools = getBuiltInTools()
      .filter(t => t.name.startsWith('perplexity_'))
      .map(t => t.name);
    setRegisteredTools(tools);
  }, [enabled, enabledTools]);

  const handleToggle = (value: boolean) => {
    setEnabled(value);
    setPerplexityEnabled(value);
  };

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    savePerplexityApiKey(value);
  };

  const handleBaseUrlChange = (value: string) => {
    setBaseUrl(value);
    savePerplexityBaseUrl(value);
  };

  const testConnection = async () => {
    if (!apiKey) {
      setTestResult({
        success: false,
        message: 'API key is required',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);
    const startTime = Date.now();

    try {
      const client = new PerplexitySearchClient(apiKey, baseUrl);
      await client.search({ query: 'test' }, 5000);

      setTestResult({
        success: true,
        message: 'Connected successfully',
        duration: Date.now() - startTime,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      let detailedMessage = `${errorMsg}`;
      if (errorStack) {
        detailedMessage += `\n\nStack: ${errorStack
          .split('\n')
          .slice(0, 3)
          .join('\n')}`;
      }
      detailedMessage += `\n\nAPI URL: ${baseUrl}/search`;

      setTestResult({
        success: false,
        message: detailedMessage,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleToolToggle = (toolId: string) => {
    const newTools = enabledTools.includes(toolId)
      ? enabledTools.filter(t => t !== toolId)
      : [...enabledTools, toolId];

    setEnabledTools(newTools);
    savePerplexityEnabledTools(newTools);
  };

  const handleDescriptionChange = (toolId: string, value: string) => {
    const newDescriptions = { ...toolDescriptions, [toolId]: value };
    setToolDescriptions(newDescriptions);
    savePerplexityToolDescriptions(newDescriptions);
  };

  const handleResetDescription = (toolId: string) => {
    const newDescriptions = { ...toolDescriptions };
    delete newDescriptions[toolId as keyof PerplexityToolDescription];
    setToolDescriptions(newDescriptions);
    savePerplexityToolDescriptions(newDescriptions);
    setEditingTool(null);
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}>
        <View style={styles.settingRow}>
          <Text style={styles.label}>Enable Perplexity Search</Text>
          <Switch value={enabled} onValueChange={handleToggle} />
        </View>

        {enabled && (
          <>
            <CustomTextInput
              label="API Key"
              value={apiKey}
              onChangeText={handleApiKeyChange}
              placeholder="pplx-your-api-key-here"
              secureTextEntry
            />

            <CustomTextInput
              label="Base URL"
              value={baseUrl}
              onChangeText={handleBaseUrlChange}
              placeholder="https://api.perplexity.ai"
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.testButton, testing && styles.testButtonDisabled]}
              onPress={testConnection}
              disabled={testing}>
              {testing ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.testButtonText}>Test Connection</Text>
              )}
            </TouchableOpacity>

            {testResult && (
              <View
                style={[
                  styles.testResult,
                  testResult.success
                    ? styles.testResultSuccess
                    : styles.testResultError,
                ]}>
                <Text
                  style={[
                    styles.testResultText,
                    testResult.success
                      ? styles.testResultTextSuccess
                      : styles.testResultTextError,
                  ]}>
                  {testResult.success ? '✅' : '❌'} {testResult.message}
                  {testResult.duration && ` (${testResult.duration}ms)`}
                </Text>
              </View>
            )}

            <Text style={styles.sectionLabel}>Available Tools</Text>

            {AVAILABLE_TOOLS.map(tool => {
              const customDesc =
                toolDescriptions[tool.id as keyof PerplexityToolDescription];
              const currentDesc =
                customDesc ||
                defaultDescriptions[
                  tool.id as keyof typeof defaultDescriptions
                ];
              const isEditing = editingTool === tool.id;

              return (
                <View key={tool.id} style={styles.toolItem}>
                  <View style={styles.toolInfo}>
                    <View style={styles.toolHeader}>
                      <Text style={styles.toolName}>{tool.name}</Text>
                      <TouchableOpacity
                        onPress={() =>
                          setEditingTool(isEditing ? null : tool.id)
                        }>
                        <Text style={styles.editButton}>
                          {isEditing ? '✓' : '✎'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {isEditing ? (
                      <View>
                        <TextInput
                          value={currentDesc}
                          onChangeText={value =>
                            handleDescriptionChange(tool.id, value)
                          }
                          placeholder="Tool description for AI"
                          placeholderTextColor={colors.textSecondary}
                          multiline
                          style={[
                            styles.descriptionInput,
                            { color: colors.text },
                          ]}
                        />
                        {customDesc && (
                          <TouchableOpacity
                            onPress={() => handleResetDescription(tool.id)}
                            style={styles.resetButtonContainer}>
                            <Text style={styles.resetButton}>
                              Reset to default
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ) : (
                      <>
                        <Text style={styles.toolDescription}>
                          {currentDesc}
                        </Text>
                        <Text style={styles.toolTimeout}>
                          Timeout: {tool.timeout}
                        </Text>
                      </>
                    )}
                  </View>
                  <Switch
                    value={enabledTools.includes(tool.id)}
                    onValueChange={() => handleToolToggle(tool.id)}
                  />
                </View>
              );
            })}

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>
                ✎ Customize Tool Descriptions
              </Text>
              <Text style={styles.infoText}>
                • Click ✎ to edit how AI understands each tool{'\n'}• Customize
                descriptions to guide AI selection{'\n'}• Reset to default
                anytime
              </Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>⚠️ Important</Text>
              <Text style={styles.infoText}>
                • Research tool may take up to 5 minutes{'\n'}• Chat will wait
                for the response{'\n'}• Don't close the app during research
                {'\n'}• Use Ask for quick questions
              </Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>ℹ️ How to get API Key</Text>
              <Text style={styles.infoText}>
                1. Visit https://www.perplexity.ai/account/api/group{'\n'}
                2. Generate a new API key{'\n'}
                3. Copy and paste it above
              </Text>
            </View>

            <View style={styles.debugSection}>
              <Text style={styles.debugTitle}>🔧 Debug Information</Text>

              <Text style={styles.debugLabel}>Configuration Status:</Text>
              <Text style={styles.debugItem}>
                • Enabled: {enabled ? '✅ Yes' : '❌ No'}
              </Text>
              <Text style={styles.debugItem}>
                • API Key: {apiKey ? '✅ Configured' : '❌ Not configured'}
              </Text>
              <Text style={styles.debugItem}>
                • Selected Tools:{' '}
                {enabledTools.length > 0
                  ? `✅ ${enabledTools.join(', ')}`
                  : '❌ None'}
              </Text>

              <Text style={styles.debugLabel}>
                Base URL: <Text style={styles.debugValue}>{baseUrl}</Text>
              </Text>

              <Text style={styles.debugLabel}>
                Registered Tools ({registeredTools.length}):
              </Text>
              {registeredTools.length > 0 ? (
                registeredTools.map(tool => (
                  <Text key={tool} style={styles.debugItem}>
                    • {tool}
                  </Text>
                ))
              ) : (
                <Text style={styles.debugItem}>
                  ⚠️ No tools registered - Check configuration above
                </Text>
              )}

              {testResult && (
                <>
                  <Text style={styles.debugLabel}>Connection Test:</Text>
                  <Text
                    style={
                      testResult.success
                        ? styles.debugSuccess
                        : styles.debugError
                    }>
                    {testResult.success ? '✅' : '❌'} {testResult.message}
                    {testResult.duration && ` (${testResult.duration}ms)`}
                  </Text>
                </>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      padding: 20,
    },
    contentContainer: {
      paddingBottom: 60,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 10,
    },
    label: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    sectionLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginTop: 20,
      marginBottom: 12,
    },
    toolItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.inputBackground,
      borderRadius: 6,
      padding: 12,
      marginBottom: 12,
    },
    toolInfo: {
      flex: 1,
      marginRight: 12,
    },
    toolHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    toolName: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.text,
    },
    editButton: {
      fontSize: 18,
      color: colors.primary,
      paddingHorizontal: 8,
    },
    descriptionInput: {
      minHeight: 80,
      padding: 12,
      backgroundColor: colors.background,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 8,
      textAlignVertical: 'top',
    },
    resetButton: {
      fontSize: 12,
      color: colors.primary,
      marginTop: 4,
    },
    resetButtonContainer: {
      marginTop: 8,
    },
    toolDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    toolTimeout: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    infoCard: {
      backgroundColor: colors.inputBackground,
      borderRadius: 6,
      padding: 16,
      marginTop: 16,
      marginBottom: 16,
    },
    infoTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    infoText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    testButton: {
      backgroundColor: colors.primary,
      borderRadius: 6,
      padding: 12,
      alignItems: 'center',
      marginTop: 16,
    },
    testButtonDisabled: {
      opacity: 0.6,
    },
    testButtonText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '600',
    },
    testResult: {
      borderRadius: 6,
      padding: 12,
      marginTop: 12,
    },
    testResultSuccess: {
      backgroundColor: colors.inputBackground,
      borderLeftWidth: 3,
      borderLeftColor: '#4CAF50',
    },
    testResultError: {
      backgroundColor: colors.inputBackground,
      borderLeftWidth: 3,
      borderLeftColor: '#F44336',
    },
    testResultText: {
      fontSize: 13,
    },
    testResultTextSuccess: {
      color: '#4CAF50',
    },
    testResultTextError: {
      color: '#F44336',
    },
    debugSection: {
      backgroundColor: colors.inputBackground,
      borderRadius: 6,
      padding: 16,
      marginTop: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    debugTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    debugLabel: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.text,
      marginTop: 8,
      marginBottom: 4,
    },
    debugValue: {
      fontWeight: '400',
      color: colors.textSecondary,
      fontFamily: 'monospace',
    },
    debugItem: {
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: 8,
      marginVertical: 2,
      fontFamily: 'monospace',
    },
    debugSuccess: {
      fontSize: 12,
      color: '#4CAF50',
      marginLeft: 8,
    },
    debugError: {
      fontSize: 12,
      color: '#F44336',
      marginLeft: 8,
    },
  });

export default PerplexitySettingsScreen;
