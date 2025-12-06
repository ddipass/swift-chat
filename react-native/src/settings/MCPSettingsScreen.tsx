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
  KeyboardAvoidingView,
} from 'react-native';
import { useTheme, ColorScheme } from '../theme';
import {
  getMCPEnabled,
  setMCPEnabled,
  getMCPMaxIterations,
  setMCPMaxIterations,
  getMCPServers,
  addMCPServer,
  updateMCPServer,
  removeMCPServer,
  MCPServer,
} from '../storage/StorageUtils';
import CustomTextInput from './CustomTextInput';

const MCPSettingsScreen = () => {
  const { colors } = useTheme();
  const [mcpEnabled, setMcpEnabled] = useState(getMCPEnabled());
  const [mcpMaxIterations, setMcpMaxIterations] = useState(
    getMCPMaxIterations()
  );
  const [servers, setServers] = useState<MCPServer[]>(getMCPServers());
  const [showAddServer, setShowAddServer] = useState(false);
  const [newServerName, setNewServerName] = useState('');
  const [newServerUrl, setNewServerUrl] = useState('');
  const [newServerApiKey, setNewServerApiKey] = useState('');

  const handleAddServer = () => {
    if (!newServerName || !newServerUrl) {
      if (Platform.OS === 'web') {
        alert('Please enter server name and URL');
      } else {
        Alert.alert('Error', 'Please enter server name and URL');
      }
      return;
    }

    // Validate URL format
    try {
      const parsedUrl = new URL(newServerUrl);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        if (Platform.OS === 'web') {
          alert('Invalid URL: Only HTTP/HTTPS protocols are supported');
        } else {
          Alert.alert(
            'Error',
            'Invalid URL: Only HTTP/HTTPS protocols are supported'
          );
        }
        return;
      }
    } catch (e) {
      if (Platform.OS === 'web') {
        alert('Invalid URL format');
      } else {
        Alert.alert('Error', 'Invalid URL format');
      }
      return;
    }

    const newServer: MCPServer = {
      id: Date.now().toString(),
      name: newServerName,
      url: newServerUrl,
      apiKey: newServerApiKey,
      enabled: true,
    };

    addMCPServer(newServer);
    setServers([...servers, newServer]);
    setShowAddServer(false);
    setNewServerName('');
    setNewServerUrl('');
    setNewServerApiKey('');
  };

  const handleToggleServer = (serverId: string, enabled: boolean) => {
    updateMCPServer(serverId, { enabled });
    setServers(servers.map(s => (s.id === serverId ? { ...s, enabled } : s)));
  };

  const handleRemoveServer = (serverId: string, serverName: string) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Remove server "${serverName}"?`);
      if (confirmed) {
        removeMCPServer(serverId);
        setServers(servers.filter(s => s.id !== serverId));
      }
    } else {
      Alert.Alert.alert(
        'Error',
        'Remove Server',
        `Remove server "${serverName}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              removeMCPServer(serverId);
              setServers(servers.filter(s => s.id !== serverId));
            },
          },
        ]
      );
    }
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView style={styles.container}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MCP Integration</Text>
            <Text style={styles.description}>
              Model Context Protocol allows AI to use external tools and
              services
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

              <View style={styles.divider} />

              <Text style={styles.sectionSubtitle}>MCP Servers</Text>

              {servers.length === 0 && !showAddServer && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No MCP Servers</Text>
                  <Text style={styles.emptyDescription}>
                    Add an MCP server to enable external tools and services
                  </Text>
                </View>
              )}

              {servers.map(server => (
                <View key={server.id} style={styles.serverCard}>
                  <View style={styles.serverHeader}>
                    <Text style={styles.serverName}>{server.name}</Text>
                    <Switch
                      value={server.enabled}
                      onValueChange={enabled =>
                        handleToggleServer(server.id, enabled)
                      }
                    />
                  </View>
                  <Text style={styles.serverUrl}>{server.url}</Text>
                  {server.apiKey && (
                    <Text style={styles.serverApiKey}>
                      API Key: {server.apiKey.substring(0, 8)}••••
                    </Text>
                  )}
                  <View style={styles.serverActions}>
                    <TouchableOpacity
                      style={styles.removeButton}
                      activeOpacity={0.7}
                      onPress={() =>
                        handleRemoveServer(server.id, server.name)
                      }>
                      <Text style={styles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {!showAddServer && (
                <TouchableOpacity
                  style={styles.addButton}
                  activeOpacity={0.7}
                  onPress={() => setShowAddServer(true)}>
                  <Text style={styles.addButtonText}>+ Add Server</Text>
                </TouchableOpacity>
              )}

              {showAddServer && (
                <View style={styles.addServerForm}>
                  <CustomTextInput
                    label="Server Name"
                    value={newServerName}
                    onChangeText={setNewServerName}
                    placeholder="My MCP Server"
                  />
                  <CustomTextInput
                    label="Server URL"
                    value={newServerUrl}
                    onChangeText={setNewServerUrl}
                    placeholder="http://localhost:3000"
                    autoCapitalize="none"
                  />
                  <CustomTextInput
                    label="API Key (Optional)"
                    value={newServerApiKey}
                    onChangeText={setNewServerApiKey}
                    placeholder="Enter API key if required"
                    secureTextEntry
                  />
                  <View style={styles.formActions}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      activeOpacity={0.7}
                      onPress={() => {
                        setShowAddServer(false);
                        setNewServerName('');
                        setNewServerUrl('');
                        setNewServerApiKey('');
                      }}>
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveButton}
                      activeOpacity={0.7}
                      onPress={handleAddServer}>
                      <Text style={styles.saveButtonText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.divider} />

              <View style={styles.infoSection}>
                <Text style={styles.infoTitle}>Built-in Tools:</Text>
                <Text style={styles.infoText}>
                  • web_fetch - Fetch web content
                </Text>
                <Text style={styles.infoTitleWithMargin}>External Tools:</Text>
                <Text style={styles.infoText}>
                  {servers.filter(s => s.enabled).length > 0
                    ? `Connected to ${
                        servers.filter(s => s.enabled).length
                      } server(s)`
                    : 'No servers connected'}
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardView: {
      flex: 1,
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
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 24,
    },
    serverCard: {
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
    },
    serverHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    serverName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    serverUrl: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    serverApiKey: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    serverActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    removeButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    removeButtonText: {
      color: colors.error || '#FF3B30',
      fontSize: 14,
      fontWeight: '500',
    },
    addButton: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 8,
    },
    addButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    addServerForm: {
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
      padding: 16,
      marginTop: 8,
    },
    formActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 16,
      gap: 12,
    },
    cancelButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    cancelButtonText: {
      color: colors.textSecondary,
      fontSize: 16,
      fontWeight: '500',
    },
    saveButton: {
      backgroundColor: colors.primary,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 6,
    },
    saveButtonText: {
      color: '#ffffff',
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
      color: colors.textSecondary,
      lineHeight: 20,
    },
    emptyState: {
      padding: 32,
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 8,
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    emptyDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

export default MCPSettingsScreen;
