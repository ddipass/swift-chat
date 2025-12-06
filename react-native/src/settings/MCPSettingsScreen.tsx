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

// Spacing system
const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

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

    // Check name length
    if (newServerName.length < 2 || newServerName.length > 50) {
      if (Platform.OS === 'web') {
        alert('Server name must be 2-50 characters');
      } else {
        Alert.alert('Error', 'Server name must be 2-50 characters');
      }
      return;
    }

    // Check for duplicate name
    if (servers.some(s => s.name === newServerName)) {
      if (Platform.OS === 'web') {
        alert('Server name already exists');
      } else {
        Alert.alert('Error', 'Server name already exists');
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

    // Check for duplicate URL
    if (servers.some(s => s.url === newServerUrl)) {
      if (Platform.OS === 'web') {
        alert('Server URL already exists');
      } else {
        Alert.alert('Error', 'Server URL already exists');
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
                    <View style={styles.serverNameContainer}>
                      <Text style={styles.serverName}>{server.name}</Text>
                      {server.enabled && (
                        <View style={styles.statusBadge}>
                          <Text style={styles.statusText}>● Active</Text>
                        </View>
                      )}
                    </View>
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
      padding: spacing.lg,
    },
    section: {
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    sectionSubtitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.lg,
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
      paddingVertical: spacing.md,
      marginBottom: spacing.lg,
    },
    label: {
      fontSize: 16,
      color: colors.text,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.xl,
    },
    serverCard: {
      backgroundColor: colors.inputBackground,
      borderRadius: spacing.sm,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    serverHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    serverNameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: spacing.md,
    },
    serverName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    statusBadge: {
      marginLeft: spacing.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      backgroundColor: colors.success + '20',
      borderRadius: 4,
    },
    statusText: {
      fontSize: 11,
      color: colors.success,
      fontWeight: '500',
    },
    serverUrl: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    serverApiKey: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    serverActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    removeButton: {
      paddingVertical: 6,
      paddingHorizontal: spacing.md,
    },
    removeButtonText: {
      color: colors.error || '#FF3B30',
      fontSize: 14,
      fontWeight: '500',
    },
    addButton: {
      backgroundColor: colors.primary,
      padding: spacing.lg,
      borderRadius: spacing.sm,
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    addButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    addServerForm: {
      backgroundColor: colors.inputBackground,
      borderRadius: spacing.sm,
      padding: spacing.lg,
      marginTop: spacing.sm,
    },
    formActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: spacing.lg,
      gap: spacing.md,
    },
    cancelButton: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    cancelButtonText: {
      color: colors.textSecondary,
      fontSize: 16,
      fontWeight: '500',
    },
    saveButton: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: 6,
    },
    saveButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    infoSection: {
      marginTop: spacing.xl,
      padding: spacing.lg,
      backgroundColor: colors.inputBackground,
      borderRadius: spacing.sm,
    },
    infoTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    infoTitleWithMargin: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    infoText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    emptyState: {
      padding: spacing.xxl,
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: spacing.sm,
      marginBottom: spacing.lg,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    emptyDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

export default MCPSettingsScreen;
