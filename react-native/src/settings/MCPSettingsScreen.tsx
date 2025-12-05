import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Switch,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useTheme, ColorScheme } from '../theme';
import {
  getMCPEnabled,
  setMCPEnabled,
  getMCPServerUrl,
  setMCPServerUrl,
  getMCPApiKey,
  setMCPApiKey,
  getMCPMaxIterations,
  setMCPMaxIterations,
} from '../storage/StorageUtils';
import { refreshMCPTools } from '../mcp/MCPService';
import { CustomTextInput } from '../chat/component/CustomTextInput';

const MCPSettingsScreen = () => {
  const { colors } = useTheme();
  const [mcpEnabled, setMcpEnabled] = useState(getMCPEnabled());
  const [mcpServerUrl, setMcpServerUrl] = useState(getMCPServerUrl());
  const [mcpApiKey, setMcpApiKey] = useState(getMCPApiKey());
  const [mcpMaxIterations, setMcpMaxIterations] = useState(
    getMCPMaxIterations()
  );

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MCP Integration</Text>
          <Text style={styles.description}>
            Model Context Protocol allows AI to use external tools and services
          </Text>
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.label}>Enable MCP</Text>
          <Switch
            value={mcpEnabled}
            onValueChange={value => {
              setMcpEnabled(value);
              setMCPEnabled(value);
            }}
          />
        </View>

        {mcpEnabled && (
          <>
            <CustomTextInput
              label="MCP Server URL"
              value={mcpServerUrl}
              onChangeText={text => {
                setMcpServerUrl(text);
                setMCPServerUrl(text);
              }}
              placeholder="http://localhost:3000"
            />
            <CustomTextInput
              label="MCP API Key (Optional)"
              value={mcpApiKey}
              onChangeText={text => {
                setMcpApiKey(text);
                setMCPApiKey(text);
              }}
              placeholder="Enter API key if required"
              secureTextEntry
            />
            <CustomTextInput
              label="Max Tool Call Iterations"
              value={String(mcpMaxIterations)}
              onChangeText={text => {
                const num = parseInt(text, 10);
                if (!isNaN(num) && num > 0 && num <= 10) {
                  setMcpMaxIterations(num);
                  setMCPMaxIterations(num);
                }
              }}
              placeholder="2"
              keyboardType="numeric"
            />
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                refreshMCPTools();
                if (Platform.OS === 'web') {
                  alert('MCP tools refreshed');
                } else {
                  Alert.alert('Success', 'MCP tools refreshed');
                }
              }}>
              <Text style={styles.buttonText}>Refresh MCP Tools</Text>
            </TouchableOpacity>

            <View style={styles.infoSection}>
              <Text style={styles.infoTitle}>Built-in Tools:</Text>
              <Text style={styles.infoText}>
                • web_fetch - Fetch web content
              </Text>
              <Text style={styles.infoTitleWithMargin}>External Tools:</Text>
              <Text style={styles.infoText}>
                Connect to an MCP server to see available tools
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
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      marginBottom: 16,
    },
    label: {
      fontSize: 16,
      color: colors.text,
    },
    button: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 16,
    },
    buttonText: {
      color: colors.buttonText,
      fontSize: 16,
      fontWeight: '600',
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
    infoTitleWithMargin: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    infoText: {
      fontSize: 14,
      color: colors.secondaryText,
      lineHeight: 20,
    },
  });

export default MCPSettingsScreen;
