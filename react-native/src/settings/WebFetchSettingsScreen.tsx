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
import { CustomTextInput } from '../chat/component/CustomTextInput';
import { Model } from '../types/Chat';

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
  const [showModelPicker, setShowModelPicker] = useState(false);

  const allModels = getAllModels();
  const textModels = allModels.textModel || [];

  const handleModeChange = (newMode: ContentProcessingMode) => {
    setMode(newMode);
    setContentProcessingMode(newMode);
  };

  const handleModelSelect = (model: Model) => {
    setSummaryModelState(model);
    setSummaryModel(model);
    setShowModelPicker(false);
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

            <Text style={styles.label}>Summary Model (for web fetch only)</Text>
            <TouchableOpacity
              style={styles.modelSelector}
              onPress={() => setShowModelPicker(!showModelPicker)}>
              <Text style={styles.modelText}>{summaryModel.modelName}</Text>
              <Text style={styles.modelArrow}>▼</Text>
            </TouchableOpacity>
            <Text style={styles.hint}>
              Separate from your chat model. Won't affect conversation context.
            </Text>

            {showModelPicker && (
              <View style={styles.modelPicker}>
                {textModels.map(model => (
                  <TouchableOpacity
                    key={model.modelId}
                    style={styles.modelOption}
                    onPress={() => handleModelSelect(model)}>
                    <Text style={styles.modelOptionText}>
                      {model.modelName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.label}>Summary Prompt</Text>
            <TextInput
              style={styles.promptInput}
              value={summaryPrompt}
              onChangeText={text => {
                setSummaryPrompt(text);
                setAISummaryPrompt(text);
              }}
              placeholder="Enter summary prompt"
              multiline
              numberOfLines={8}
              placeholderTextColor={colors.secondaryText}
            />
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
      color: colors.secondaryText,
      lineHeight: 20,
    },
    hint: {
      fontSize: 12,
      color: colors.secondaryText,
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
      color: colors.secondaryText,
      lineHeight: 18,
    },
    label: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
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
      color: colors.secondaryText,
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
