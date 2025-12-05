import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useTheme, ColorScheme } from '../theme';
import {
  getFetchTimeout,
  setFetchTimeout,
  getFetchMaxContentLength,
  setFetchMaxContentLength,
} from '../storage/StorageUtils';
import { CustomTextInput } from '../chat/component/CustomTextInput';

const WebFetchSettingsScreen = () => {
  const { colors } = useTheme();
  const [timeout, setTimeout] = useState(String(getFetchTimeout() / 1000));
  const [maxLength, setMaxLength] = useState(
    String(getFetchMaxContentLength())
  );

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

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How it works:</Text>
          <Text style={styles.infoText}>
            1. Fetches content from the specified URL
          </Text>
          <Text style={styles.infoText}>
            2. Removes scripts, styles, and other non-content elements
          </Text>
          <Text style={styles.infoText}>3. Extracts main text content</Text>
          <Text style={styles.infoText}>
            4. Limits to configured maximum length
          </Text>
          <Text style={styles.infoText}>
            5. Returns clean text for AI processing
          </Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Current Settings:</Text>
          <Text style={styles.infoText}>• Timeout: {timeout} seconds</Text>
          <Text style={styles.infoText}>
            • Max Length: {maxLength} characters
          </Text>
        </View>
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
    infoSection: {
      marginTop: 24,
      padding: 16,
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
    },
    infoTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    infoText: {
      fontSize: 14,
      color: colors.secondaryText,
      lineHeight: 20,
      marginBottom: 4,
    },
  });

export default WebFetchSettingsScreen;
