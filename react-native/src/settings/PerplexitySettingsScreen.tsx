import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Switch,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useTheme, ColorScheme } from '../theme';
import {
  getPerplexityEnabled,
  setPerplexityEnabled,
  getPerplexityApiKey,
  savePerplexityApiKey,
  getPerplexityEnabledTools,
  savePerplexityEnabledTools,
  getPerplexityToolDescriptions,
  savePerplexityToolDescriptions,
  PerplexityToolDescription,
} from '../storage/StorageUtils';
import CustomTextInput from './CustomTextInput';
import { getDefaultToolDescriptions } from '../mcp/PerplexityTools';

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
  const [enabledTools, setEnabledTools] = useState<string[]>(
    getPerplexityEnabledTools()
  );
  const [toolDescriptions, setToolDescriptions] =
    useState<PerplexityToolDescription>(getPerplexityToolDescriptions());
  const [editingTool, setEditingTool] = useState<string | null>(null);

  const defaultDescriptions = getDefaultToolDescriptions();

  const handleToggle = (value: boolean) => {
    setEnabled(value);
    setPerplexityEnabled(value);
  };

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    savePerplexityApiKey(value);
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
  });

export default PerplexitySettingsScreen;
