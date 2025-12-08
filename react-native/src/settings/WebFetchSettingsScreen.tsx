import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useTheme, ColorScheme } from '../theme';
import {
  getFetchTimeout,
  setFetchTimeout,
  getFetchMaxContentLength,
  setFetchMaxContentLength,
  getContentProcessingMode,
  setContentProcessingMode,
  getAISummaryPrompt,
  setAISummaryPrompt,
  getSummaryModel,
  setSummaryModel,
  getRemoveElements,
  setRemoveElements,
  ContentProcessingMode,
  getAllModels,
} from '../storage/StorageUtils';
import CustomTextInput from './CustomTextInput';
import { DropdownItem } from '../types/Chat';
import DropdownComponent from './DropdownComponent';

// Prompt templates
const PROMPT_TEMPLATES = [
  {
    name: 'Default',
    prompt:
      'Extract and summarize the main content from the following HTML. Focus on the key information and remove any navigation, ads, or irrelevant content.',
  },
  {
    name: 'Detailed Summary',
    prompt:
      'Analyze the following HTML and provide a comprehensive summary. Include: 1) Main topic, 2) Key points, 3) Important details, 4) Conclusions. Remove navigation, ads, and boilerplate content.',
  },
  {
    name: 'Brief Overview',
    prompt:
      'Extract the core message from this HTML in 2-3 sentences. Focus only on the most important information.',
  },
  {
    name: 'Structured Data',
    prompt:
      'Extract structured information from this HTML. Identify: Title, Author, Date, Main Content, Key Facts. Format as clear sections.',
  },
  {
    name: 'Technical Content',
    prompt:
      'Extract technical content from this HTML. Focus on: Code examples, API documentation, technical specifications, and implementation details. Preserve code formatting.',
  },
];

const WebFetchSettingsScreen = () => {
  const { colors } = useTheme();
  const [timeout, setTimeout] = useState(String(getFetchTimeout() / 1000));
  const [maxLength, setMaxLength] = useState(
    String(getFetchMaxContentLength())
  );
  const [mode, setMode] = useState<ContentProcessingMode>(
    getContentProcessingMode()
  );
  const [summaryPrompt, setSummaryPrompt] = useState(getAISummaryPrompt());
  const [summaryModel, setSummaryModelState] = useState(getSummaryModel());
  const [removeElements, setRemoveElementsState] = useState(
    getRemoveElements()
  );

  const allModels = getAllModels();
  const textModels = allModels.textModel || [];

  // Convert models to dropdown items
  const modelDropdownItems: DropdownItem[] = textModels.map(model => ({
    label: model.modelName,
    value: model.modelId,
  }));

  const handleModeChange = (newMode: ContentProcessingMode) => {
    setMode(newMode);
    setContentProcessingMode(newMode);
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 60 }}>
        <CustomTextInput
          label="Timeout (seconds)"
          value={timeout}
          onChangeText={text => {
            const num = parseInt(text, 10);
            if (!isNaN(num) && num >= 10 && num <= 300) {
              setTimeout(text);
              setFetchTimeout(num * 1000);
            }
          }}
          placeholder="60"
          keyboardType="numeric"
        />
        <Text style={styles.hint}>Range: 10-300 seconds</Text>

        <CustomTextInput
          label="Max Content Length (characters)"
          value={maxLength}
          onChangeText={text => {
            const num = parseInt(text, 10);
            if (!isNaN(num) && num >= 1000 && num <= 50000) {
              setMaxLength(text);
              setFetchMaxContentLength(num);
            }
          }}
          placeholder="5000"
          keyboardType="numeric"
        />
        <Text style={styles.hint}>Range: 1000-50000 characters</Text>

        <Text style={styles.middleLabel}>Content Processing Mode</Text>

        <View style={styles.modeSwitch}>
          <TouchableOpacity
            style={[
              styles.modeSwitchButton,
              mode === 'regex' && styles.modeSwitchButtonActive,
            ]}
            activeOpacity={0.7}
            onPress={() => handleModeChange('regex')}>
            <Text
              style={[
                styles.modeSwitchText,
                mode === 'regex' && styles.modeSwitchTextActive,
              ]}>
              Regex
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeSwitchButton,
              mode === 'ai_summary' && styles.modeSwitchButtonActive,
            ]}
            activeOpacity={0.7}
            onPress={() => handleModeChange('ai_summary')}>
            <Text
              style={[
                styles.modeSwitchText,
                mode === 'ai_summary' && styles.modeSwitchTextActive,
              ]}>
              AI Summary
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Current Configuration</Text>
          <Text style={styles.infoCardText}>
            • Mode: {mode === 'regex' ? 'Regex' : 'AI Summary'}
          </Text>
          {mode === 'ai_summary' && (
            <Text style={styles.infoCardText}>
              • Summary Model: {summaryModel?.modelName || 'Not selected'}
            </Text>
          )}
          <Text style={styles.infoCardText}>
            •{' '}
            {mode === 'regex'
              ? 'Fast HTML tag removal. Free and instant.'
              : summaryModel?.modelName
              ? 'AI will extract and summarize content. Falls back to Regex if AI fails.'
              : '⚠️ Please select a Summary Model above'}
          </Text>
        </View>

        {mode === 'ai_summary' && (
          <>
            <DropdownComponent
              label="Summary Model"
              data={modelDropdownItems}
              value={summaryModel.modelId}
              onChange={(item: DropdownItem) => {
                const selectedModel = textModels.find(
                  m => m.modelId === item.value
                );
                if (selectedModel) {
                  setSummaryModelState(selectedModel);
                  setSummaryModel(selectedModel);
                }
              }}
              placeholder="Select a model"
            />
            <Text style={styles.hint}>
              ⚠️ Important: You must select a Summary Model for AI mode to work.
              If not selected, it will fall back to Regex mode.
            </Text>

            <Text style={styles.label}>Prompt Template</Text>
            <View style={styles.templateButtons}>
              {PROMPT_TEMPLATES.map(template => (
                <TouchableOpacity
                  key={template.name}
                  style={[
                    styles.templateButton,
                    summaryPrompt === template.prompt &&
                      styles.templateButtonActive,
                  ]}
                  onPress={() => {
                    setSummaryPrompt(template.prompt);
                    setAISummaryPrompt(template.prompt);
                  }}>
                  <Text
                    style={[
                      styles.templateButtonText,
                      summaryPrompt === template.prompt &&
                        styles.templateButtonTextActive,
                    ]}>
                    {template.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Custom Prompt</Text>
            <TextInput
              style={styles.promptInput}
              value={summaryPrompt}
              onChangeText={text => {
                setSummaryPrompt(text);
                setAISummaryPrompt(text);
              }}
              placeholder="Enter custom summary prompt"
              multiline
              numberOfLines={6}
              placeholderTextColor={colors.textSecondary}
            />
          </>
        )}

        {mode === 'regex' && (
          <>
            <CustomTextInput
              label="Remove Elements (comma separated)"
              value={removeElements}
              onChangeText={text => {
                setRemoveElementsState(text);
                setRemoveElements(text);
              }}
              placeholder="script,style,nav,footer,aside"
            />
            <Text style={styles.hint}>
              HTML elements to remove from content
            </Text>
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
    label: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    hint: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: -8,
      marginBottom: 16,
      marginLeft: 4,
    },
    middleLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginTop: 10,
      marginBottom: 12,
    },
    modeSwitch: {
      flexDirection: 'row',
      backgroundColor: colors.inputBackground,
      borderRadius: 6,
      padding: 4,
      marginBottom: 16,
    },
    modeSwitchButton: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 4,
      alignItems: 'center',
    },
    modeSwitchButtonActive: {
      backgroundColor: colors.primary,
    },
    modeSwitchText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    modeSwitchTextActive: {
      color: '#ffffff',
    },
    templateButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    templateButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.inputBackground,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    templateButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    templateButtonText: {
      fontSize: 13,
      color: colors.text,
      fontWeight: '500',
    },
    templateButtonTextActive: {
      color: '#ffffff',
    },
    promptInput: {
      backgroundColor: colors.inputBackground,
      color: colors.text,
      padding: 12,
      borderRadius: 6,
      fontSize: 14,
      minHeight: 120,
      textAlignVertical: 'top',
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.inputBorder,
    },
    infoCard: {
      backgroundColor: colors.inputBackground,
      borderRadius: 6,
      padding: 12,
      marginBottom: 16,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    infoCardTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    infoCardText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
  });

export default WebFetchSettingsScreen;
