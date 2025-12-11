import * as React from 'react';
import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { CustomHeaderRightButton } from '../chat/component/CustomHeaderRightButton.tsx';
import { RouteParamList } from '../types/RouteTypes.ts';
import CustomTextInput from './CustomTextInput.tsx';
import CustomDropdown from './DropdownComponent.tsx';
import { DropdownItem } from '../types/Chat.ts';
import { useTheme } from '../theme';
import {
  getWebFetchMode,
  saveWebFetchMode,
  getWebFetchSummaryModel,
  saveWebFetchSummaryModel,
  getWebFetchSummaryPrompt,
  saveWebFetchSummaryPrompt,
  getWebFetchRegexRemoveElements,
  saveWebFetchRegexRemoveElements,
  getToolTimeout,
  saveToolTimeout,
  getToolCacheTTL,
  saveToolCacheTTL,
  getToolMaxRetries,
  saveToolMaxRetries,
  getToolDebugEnabled,
  saveToolDebugEnabled,
  getToolMaxContentLength,
  saveToolMaxContentLength,
  getToolFollowRedirects,
  saveToolFollowRedirects,
  getAllModels,
} from '../storage/StorageUtils.ts';

const ToolsSettingsScreen = () => {
  const navigation = useNavigation<NavigationProp<RouteParamList>>();
  const { colors } = useTheme();

  // Preset prompts
  const presetPrompts = [
    {
      label: 'Concise Summary',
      value:
        'Please provide a concise summary of the following web page content. Focus on the main topics and key information only.',
    },
    {
      label: 'Detailed Summary',
      value:
        'Please summarize the following web page content. Focus on the main topics, key information, and important details. Keep it concise but comprehensive.',
    },
    {
      label: 'Key Points',
      value:
        'Extract the key points and main ideas from the following web page content. Present them as a bullet list.',
    },
    {
      label: 'Technical Analysis',
      value:
        'Analyze the following web page content from a technical perspective. Focus on technical details, specifications, and implementation information.',
    },
    {
      label: 'Custom',
      value: '',
    },
  ];

  // Web Fetch Settings
  const [mode, setMode] = useState<'regex' | 'ai_summary'>(getWebFetchMode());
  const [summaryModel, setSummaryModel] = useState(getWebFetchSummaryModel());
  const [summaryPrompt, setSummaryPrompt] = useState(
    getWebFetchSummaryPrompt()
  );
  const [selectedPromptPreset, setSelectedPromptPreset] = useState('Custom');
  const [regexRemoveElements, setRegexRemoveElements] = useState(
    getWebFetchRegexRemoveElements()
  );

  // Performance Settings
  const [timeout, setTimeout] = useState(getToolTimeout());
  const [cacheTTL, setCacheTTL] = useState(getToolCacheTTL());
  const [maxRetries, setMaxRetries] = useState(getToolMaxRetries());
  const [maxContentLength, setMaxContentLength] = useState(
    getToolMaxContentLength()
  );
  const [followRedirects, setFollowRedirects] = useState(
    getToolFollowRedirects()
  );
  const [debugEnabled, setDebugEnabled] = useState(getToolDebugEnabled());

  // Get available models for summary
  const allModels = getAllModels();
  const summaryModelData: DropdownItem[] = allModels.textModel.map(model => ({
    label: model.modelName,
    value: model.modelId,
  }));

  const handleSave = () => {
    // Save Web Fetch Settings
    saveWebFetchMode(mode);
    saveWebFetchSummaryModel(summaryModel);
    saveWebFetchSummaryPrompt(summaryPrompt);
    saveWebFetchRegexRemoveElements(regexRemoveElements);

    // Save Performance Settings
    saveToolTimeout(timeout);
    saveToolCacheTTL(cacheTTL);
    saveToolMaxRetries(maxRetries);
    saveToolMaxContentLength(maxContentLength);
    saveToolFollowRedirects(followRedirects);
    saveToolDebugEnabled(debugEnabled);

    navigation.goBack();
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <CustomHeaderRightButton onPress={handleSave} iconName="checkmark" />
      ),
    });
  }, [
    navigation,
    mode,
    summaryModel,
    summaryPrompt,
    regexRemoveElements,
    timeout,
    cacheTTL,
    maxRetries,
    maxContentLength,
    followRedirects,
    debugEnabled,
  ]);

  const styles = StyleSheet.create({
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
    firstLabel: {
      marginBottom: 12,
    },
    middleLabel: {
      marginTop: 10,
      marginBottom: 12,
    },
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginVertical: 10,
    },
    configSwitchContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: colors.background,
      borderRadius: 8,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 2,
    },
    configSwitchButton: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 6,
      margin: 2,
    },
    configSwitchButtonActive: {
      backgroundColor: colors.text + 'CC',
    },
    configSwitchText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    configSwitchTextActive: {
      color: colors.background,
      fontWeight: '600',
    },
    versionContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginVertical: 10,
      paddingBottom: 60,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={[styles.label, styles.firstLabel]}>🌐 Web Fetch</Text>

        <View style={styles.configSwitchContainer}>
          <TouchableOpacity
            style={[
              styles.configSwitchButton,
              mode === 'regex' && styles.configSwitchButtonActive,
            ]}
            activeOpacity={0.7}
            onPress={() => setMode('regex')}>
            <Text
              style={[
                styles.configSwitchText,
                mode === 'regex' && styles.configSwitchTextActive,
              ]}>
              Regex (Fast)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.configSwitchButton,
              mode === 'ai_summary' && styles.configSwitchButtonActive,
            ]}
            activeOpacity={0.7}
            onPress={() => setMode('ai_summary')}>
            <Text
              style={[
                styles.configSwitchText,
                mode === 'ai_summary' && styles.configSwitchTextActive,
              ]}>
              AI Summary (Detailed)
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'ai_summary' && (
          <>
            <CustomDropdown
              label="Summary Model"
              data={summaryModelData}
              value={summaryModel}
              onChange={(item: DropdownItem) => {
                setSummaryModel(item.value);
              }}
              placeholder="Select a model"
            />

            <CustomDropdown
              label="Prompt Template"
              data={presetPrompts.map(p => ({
                label: p.label,
                value: p.label,
              }))}
              value={selectedPromptPreset}
              onChange={(item: DropdownItem) => {
                setSelectedPromptPreset(item.value);
                const preset = presetPrompts.find(p => p.label === item.value);
                if (preset && preset.value) {
                  setSummaryPrompt(preset.value);
                }
              }}
              placeholder="Select a template"
            />

            <CustomTextInput
              label="Summary Prompt (editable)"
              value={summaryPrompt}
              onChangeText={text => {
                setSummaryPrompt(text);
                setSelectedPromptPreset('Custom');
              }}
              placeholder="Enter summary prompt"
              multiline={true}
              numberOfLines={4}
            />
          </>
        )}

        <CustomTextInput
          label="Regex Remove Elements (comma separated)"
          value={regexRemoveElements}
          onChangeText={setRegexRemoveElements}
          placeholder="script,style,nav,footer,header,aside,iframe,noscript"
        />

        <Text style={[styles.label, styles.middleLabel]}>⚡ Performance</Text>

        <CustomTextInput
          label="Timeout (seconds)"
          value={String(timeout)}
          onChangeText={text => {
            const num = parseInt(text) || 60;
            setTimeout(num);
          }}
          keyboardType="numeric"
          placeholder="60"
        />

        <CustomTextInput
          label="Cache TTL (seconds)"
          value={String(cacheTTL)}
          onChangeText={text => {
            const num = parseInt(text) || 3600;
            setCacheTTL(num);
          }}
          keyboardType="numeric"
          placeholder="3600"
        />

        <CustomTextInput
          label="Max Content Length (characters)"
          value={String(maxContentLength)}
          onChangeText={text => {
            const num = parseInt(text) || 50000;
            setMaxContentLength(num);
          }}
          keyboardType="numeric"
          placeholder="50000"
        />

        <CustomTextInput
          label="Max Retries"
          value={String(maxRetries)}
          onChangeText={text => {
            const num = parseInt(text) || 3;
            setMaxRetries(num);
          }}
          keyboardType="numeric"
          placeholder="3"
        />

        <View style={styles.switchContainer}>
          <Text style={styles.label}>Follow Redirects</Text>
          <Switch value={followRedirects} onValueChange={setFollowRedirects} />
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.label}>Enable Debug Mode</Text>
          <Switch value={debugEnabled} onValueChange={setDebugEnabled} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ToolsSettingsScreen;
