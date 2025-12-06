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
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Web Fetch Settings</Text>
          <Text style={styles.description}>
            Configure how web content is fetched and processed
          </Text>
        </View>

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

        <View style={styles.divider} />

        <Text style={styles.sectionSubtitle}>Content Processing Mode</Text>

        <TouchableOpacity
          style={styles.radioOption}
          onPress={() => handleModeChange('regex')}>
          <View style={styles.radio}>
            {mode === 'regex' && <View style={styles.radioSelected} />}
          </View>
          <View style={styles.radioContent}>
            <Text style={styles.radioLabel}>Regex - Fast, basic cleaning</Text>
            <Text style={styles.radioDescription}>
              Remove HTML tags using regex patterns. Fast and free.
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.radioOption}
          onPress={() => handleModeChange('ai_summary')}>
          <View style={styles.radio}>
            {mode === 'ai_summary' && <View style={styles.radioSelected} />}
          </View>
          <View style={styles.radioContent}>
            <Text style={styles.radioLabel}>
              AI Summary - Smart content extraction
            </Text>
            <Text style={styles.radioDescription}>
              Use AI to intelligently extract and summarize content. Uses
              tokens.
            </Text>
          </View>
        </TouchableOpacity>

        {mode === 'ai_summary' && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionSubtitle}>AI Summary Settings</Text>

            <DropdownComponent
              label="Summary Model (for web fetch only)"
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
              Separate from your chat model. Won't affect conversation context.
            </Text>

            <Text style={styles.label}>Summary Prompt Template</Text>
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

            <Text style={styles.label}>Custom Prompt (Editable)</Text>
            <TextInput
              style={styles.promptInput}
              value={summaryPrompt}
              onChangeText={text => {
                setSummaryPrompt(text);
                setAISummaryPrompt(text);
              }}
              placeholder="Enter custom summary prompt or select a template above"
              multiline
              numberOfLines={6}
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.hint}>
              💡 Tip: Select a template above or write your own custom prompt
            </Text>
          </>
        )}

        {mode === 'regex' && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionSubtitle}>Regex Settings</Text>

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
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    sectionSubtitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    description: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    hint: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: -8,
      marginBottom: 16,
      marginLeft: 4,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 24,
    },
    radioOption: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
      padding: 12,
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
    },
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.primary,
      marginRight: 12,
      marginTop: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioSelected: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
    },
    radioContent: {
      flex: 1,
    },
    radioLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 4,
    },
    radioDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    label: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
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
      backgroundColor: colors.surface,
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
    modelSelector: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.inputBackground,
      padding: 16,
      borderRadius: 8,
      marginBottom: 8,
    },
    modelText: {
      fontSize: 16,
      color: colors.text,
    },
    modelArrow: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    modelPicker: {
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
      marginBottom: 16,
      maxHeight: 200,
    },
    modelOption: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modelOptionText: {
      fontSize: 16,
      color: colors.text,
    },
    promptInput: {
      backgroundColor: colors.inputBackground,
      color: colors.text,
      padding: 12,
      borderRadius: 8,
      fontSize: 14,
      minHeight: 120,
      textAlignVertical: 'top',
      marginBottom: 16,
    },
  });

export default WebFetchSettingsScreen;
