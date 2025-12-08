import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Switch,
} from 'react-native';
import { useTheme, ColorScheme } from '../theme';
import {
  getPerplexityEnabled,
  setPerplexityEnabled,
  getPerplexityApiKey,
  savePerplexityApiKey,
} from '../storage/StorageUtils';
import CustomTextInput from './CustomTextInput';

const PerplexitySettingsScreen = () => {
  const { colors } = useTheme();
  const [enabled, setEnabled] = useState(getPerplexityEnabled());
  const [apiKey, setApiKey] = useState(getPerplexityApiKey());

  const handleToggle = (value: boolean) => {
    setEnabled(value);
    setPerplexityEnabled(value);
  };

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    savePerplexityApiKey(value);
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
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

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>ℹ️ How to get API Key</Text>
              <Text style={styles.infoText}>
                1. Visit https://www.perplexity.ai/account/api/group{'\n'}
                2. Generate a new API key{'\n'}
                3. Copy and paste it above
              </Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>✨ Features</Text>
              <Text style={styles.infoText}>
                • Real-time web search{'\n'}• Up to 20 results per query{'\n'}•
                Filter by recency (day/week/month/year){'\n'}• Country-specific
                results{'\n'}• Source citations included
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
    infoCard: {
      backgroundColor: colors.inputBackground,
      borderRadius: 6,
      padding: 16,
      marginTop: 16,
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
