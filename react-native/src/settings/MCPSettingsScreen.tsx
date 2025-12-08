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
        // @ts-expect-error - alert is available in web
        alert('Please enter server name and URL');
      } else {
        Alert.alert('Error', 'Please enter server name and URL');
      }
      return;
    }

    // Check name length
    if (newServerName.length < 2 || newServerName.length > 50) {
      if (Platform.OS === 'web') {
        // @ts-expect-error - alert is available in web
        alert('Server name must be 2-50 characters');
      } else {
        Alert.alert('Error', 'Server name must be 2-50 characters');
      }
      return;
    }

    // Check for duplicate name
    if (servers.some(s => s.name === newServerName)) {
      if (Platform.OS === 'web') {
        // @ts-expect-error - alert is available in web
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
          // @ts-expect-error - alert is available in web
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
        // @ts-expect-error - alert is available in web
        alert('Invalid URL format');
      } else {
        Alert.alert('Error', 'Invalid URL format');
      }
      return;
    }

    // Check for duplicate URL
    if (servers.some(s => s.url === newServerUrl)) {
      if (Platform.OS === 'web') {
        // @ts-expect-error - alert is available in web
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
      // @ts-expect-error - window.confirm is available in web
      const confirmed = window.confirm(`Remove server "${serverName}"?`);
      if (confirmed) {
        removeMCPServer(serverId);
        setServers(servers.filter(s => s.id !== serverId));
      }
    } else {
      Alert.alert('Remove Server', `Remove server "${serverName}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeMCPServer(serverId);
            setServers(servers.filter(s => s.id !== serverId));
          },
        },
      ]);
    }
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView style={styles.container}>
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

              <Text style={styles.middleLabel}>MCP Servers</Text>

              {servers.length === 0 && !showAddServer && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>
                    No MCP servers configured
                  </Text>
                </View>
              )}

              {servers.map(server => (
                <View key={server.id} style={styles.serverItem}>
                  <View style={styles.serverRow}>
                    <View style={styles.serverInfo}>
                      <Text style={styles.serverName}>{server.name}</Text>
                      <Text style={styles.serverUrl}>{server.url}</Text>
                    </View>
                    <Switch
                      value={server.enabled}
                      onValueChange={enabled =>
                        handleToggleServer(server.id, enabled)
                      }
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    activeOpacity={0.7}
                    onPress={() => handleRemoveServer(server.id, server.name)}>
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
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
    middleLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginTop: 10,
      marginBottom: 12,
    },
    emptyState: {
      padding: 20,
      alignItems: 'center',
      backgroundColor: colors.inputBackground,
      borderRadius: 6,
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    serverItem: {
      backgroundColor: colors.inputBackground,
      borderRadius: 6,
      padding: 12,
      marginBottom: 12,
    },
    serverRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    serverInfo: {
      flex: 1,
      marginRight: 12,
    },
    serverName: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 4,
    },
    serverUrl: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    removeButton: {
      paddingVertical: 4,
    },
    removeButtonText: {
      color: colors.error || '#FF3B30',
      fontSize: 14,
    },
    addButton: {
      backgroundColor: colors.primary,
      padding: 14,
      borderRadius: 6,
      alignItems: 'center',
      marginTop: 4,
    },
    addButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '500',
    },
    addServerForm: {
      backgroundColor: colors.inputBackground,
      borderRadius: 6,
      padding: 16,
      marginTop: 4,
    },
    formActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 12,
      gap: 12,
    },
    cancelButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    cancelButtonText: {
      color: colors.textSecondary,
      fontSize: 16,
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
      fontWeight: '500',
    },
  });

export default MCPSettingsScreen;
