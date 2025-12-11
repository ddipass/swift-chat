import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Linking,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { RouteParamList } from '../types/RouteTypes.ts';
import { useTheme } from '../theme';
import { MCPClient, MCPServer, MCPServerConfig } from '../tools/MCPClient.ts';
import { MCP_PRESETS, MCPPreset } from '../tools/MCPPresets.ts';
import { getApiUrl, getApiKey } from '../storage/StorageUtils.ts';

const MCPServersScreen = () => {
  const navigation = useNavigation<NavigationProp<RouteParamList>>();
  const { colors, isDark } = useTheme();
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPresets, setShowPresets] = useState(false);
  const [authDialogServer, setAuthDialogServer] = useState<{
    server: MCPServer;
    authUrl: string;
  } | null>(null);

  const mcpClient = new MCPClient(getApiUrl(), getApiKey());

  useEffect(() => {
    loadServers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 轮询 connecting 状态的服务器
  useEffect(() => {
    const connectingServers = servers.filter(s => s.status === 'connecting');
    if (connectingServers.length === 0) {
      return;
    }

    const interval = setInterval(async () => {
      await loadServers();
    }, 3000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servers]);

  const loadServers = async () => {
    try {
      setLoading(true);
      const serverList = await mcpClient.listServers();
      setServers(serverList);
    } catch (error) {
      Alert.alert('Error', `Failed to load servers: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const addServer = () => {
    setShowPresets(true);
  };

  const addFromPreset = (preset: MCPPreset) => {
    setShowPresets(false);
    navigation.navigate('MCPServerConfig', {
      preset,
      onSave: async (config: Record<string, unknown>) => {
        await addServerWithConfig({
          ...config,
          callback_base_url: getApiUrl(),
        });
      },
    });
  };

  const addServerWithConfig = async (config: Record<string, unknown>) => {
    try {
      const result = await mcpClient.addServer(
        config as unknown as MCPServerConfig
      );

      if (result.status === 'pending_auth' && result.auth_url) {
        await loadServers();
        // 找到新添加的服务器
        const newServer = servers.find(s => s.server_id === result.server_id);
        if (newServer) {
          setAuthDialogServer({ server: newServer, authUrl: result.auth_url });
        }
      } else {
        await loadServers();
      }
    } catch (error) {
      Alert.alert('Error', `Failed to add server: ${error}`);
    }
  };

  const handleServerPress = async (server: MCPServer) => {
    if (server.status === 'active') {
      // 查看工具列表
      try {
        const tools = await mcpClient.getServerTools(server.server_id);
        navigation.navigate('MCPServerTools', {
          serverId: server.server_id,
          serverName: server.name,
          tools,
        });
      } catch (error) {
        Alert.alert('Error', `Failed to load tools: ${error}`);
      }
    } else if (server.status === 'pending_auth') {
      // 显示授权对话框
      setAuthDialogServer({ server, authUrl: '' });
    } else if (server.status === 'error') {
      // 显示错误
      Alert.alert(
        'Connection Error',
        `Server "${server.name}" failed to connect.`,
        [
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteServer(server),
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleServerLongPress = (server: MCPServer) => {
    Alert.alert('Delete Server', `Delete "${server.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteServer(server),
      },
    ]);
  };

  const deleteServer = async (server: MCPServer) => {
    try {
      await mcpClient.removeServer(server.server_id);
      await loadServers();
    } catch (error) {
      Alert.alert('Error', `Failed to delete server: ${error}`);
    }
  };

  const checkAuthStatus = async (serverId: string) => {
    await loadServers();
    const server = servers.find(s => s.server_id === serverId);
    if (server?.status === 'active') {
      setAuthDialogServer(null);
      Alert.alert('Success', 'Server is now active!');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4CAF50';
      case 'pending_auth':
        return '#FF9800';
      case 'connecting':
        return '#9E9E9E';
      case 'error':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'pending_auth':
        return 'Pending Auth';
      case 'connecting':
        return 'Connecting';
      case 'error':
        return 'Error';
      default:
        return status;
    }
  };

  const isRemoteServer = (name: string) => {
    return (
      name.includes('http') ||
      name.includes('Notion') ||
      name.includes('Remote')
    );
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      padding: 20,
    },
    addButton: {
      backgroundColor: colors.text,
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 20,
    },
    addButtonText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: '600',
    },
    // Settings 风格列表项
    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginVertical: 10,
    },
    leftContent: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    label: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    typeBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 3,
      marginLeft: 8,
    },
    typeBadgeText: {
      fontSize: 10,
      color: '#fff',
      fontWeight: '600',
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 6,
    },
    text: {
      fontSize: 14,
      fontWeight: '400',
      color: colors.textSecondary,
    },
    arrowImage: {
      width: 16,
      height: 16,
      transform: [{ scaleX: -1 }],
      opacity: 0.6,
      marginLeft: 8,
    },
    separator: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 10,
    },
    emptyText: {
      textAlign: 'center',
      color: colors.textSecondary,
      marginTop: 40,
      fontSize: 14,
    },
    // Badge colors
    remoteBadge: {
      backgroundColor: '#4A90E2',
    },
    localBadge: {
      backgroundColor: '#7B68EE',
    },
    loadingIndicator: {
      marginLeft: 8,
    },
    presetScrollView: {
      maxHeight: 400,
    },
    // 预设列表
    presetsTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 12,
    },
    presetItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginVertical: 10,
    },
    presetLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    presetIcon: {
      fontSize: 24,
      marginRight: 12,
    },
    presetInfo: {
      flex: 1,
    },
    presetName: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    presetDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    // 对话框
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    dialogContainer: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 20,
      width: '80%',
      maxWidth: 400,
    },
    dialogTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    dialogText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 20,
      lineHeight: 20,
    },
    dialogButton: {
      padding: 12,
      borderRadius: 6,
      alignItems: 'center',
      marginBottom: 8,
    },
    primaryButton: {
      backgroundColor: colors.text,
    },
    secondaryButton: {
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dialogButtonText: {
      fontSize: 14,
      fontWeight: '500',
    },
    primaryButtonText: {
      color: colors.background,
    },
    secondaryButtonText: {
      color: colors.text,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <TouchableOpacity style={styles.addButton} onPress={addServer}>
          <Text style={styles.addButtonText}>Add MCP Server</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color={colors.text} />
        ) : servers.length === 0 ? (
          <Text style={styles.emptyText}>No MCP servers configured</Text>
        ) : (
          servers.map((server, index) => (
            <React.Fragment key={server.server_id}>
              <TouchableOpacity
                style={styles.itemContainer}
                onPress={() => handleServerPress(server)}
                onLongPress={() => handleServerLongPress(server)}>
                <View style={styles.leftContent}>
                  <View style={styles.titleRow}>
                    <Text style={styles.label}>{server.name}</Text>
                    <View
                      style={[
                        styles.typeBadge,
                        isRemoteServer(server.name)
                          ? styles.remoteBadge
                          : styles.localBadge,
                      ]}>
                      <Text style={styles.typeBadgeText}>
                        {isRemoteServer(server.name) ? 'Remote' : 'Local'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: getStatusColor(server.status) },
                      ]}
                    />
                    <Text style={styles.text}>
                      {server.tool_count}{' '}
                      {server.tool_count === 1 ? 'tool' : 'tools'} •{' '}
                      {getStatusText(server.status)}
                    </Text>
                    {server.status === 'connecting' && (
                      <ActivityIndicator
                        size="small"
                        color={colors.textSecondary}
                        style={styles.loadingIndicator}
                      />
                    )}
                  </View>
                </View>
                <Image
                  style={styles.arrowImage}
                  source={
                    isDark
                      ? require('../assets/arrow_dark.png')
                      : require('../assets/arrow.png')
                  }
                />
              </TouchableOpacity>
              {index < servers.length - 1 && <View style={styles.separator} />}
            </React.Fragment>
          ))
        )}
      </ScrollView>

      {/* 预设选择对话框 */}
      <Modal visible={showPresets} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.dialogContainer}>
            <Text style={styles.dialogTitle}>Select MCP Server</Text>
            <ScrollView style={styles.presetScrollView}>
              {MCP_PRESETS.map(preset => (
                <TouchableOpacity
                  key={preset.id}
                  style={styles.presetItem}
                  onPress={() => addFromPreset(preset)}>
                  <View style={styles.presetLeft}>
                    <Text style={styles.presetIcon}>{preset.icon}</Text>
                    <View style={styles.presetInfo}>
                      <Text style={styles.presetName}>{preset.name}</Text>
                      <Text style={styles.presetDescription}>
                        {preset.description}
                      </Text>
                    </View>
                  </View>
                  <Image
                    style={styles.arrowImage}
                    source={
                      isDark
                        ? require('../assets/arrow_dark.png')
                        : require('../assets/arrow.png')
                    }
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.dialogButton, styles.secondaryButton]}
              onPress={() => setShowPresets(false)}>
              <Text
                style={[styles.dialogButtonText, styles.secondaryButtonText]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* OAuth 授权对话框 */}
      <Modal
        visible={authDialogServer !== null}
        transparent
        animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.dialogContainer}>
            <Text style={styles.dialogTitle}>Authorization Required</Text>
            <Text style={styles.dialogText}>
              {authDialogServer?.server.name} requires OAuth authorization.
              Please open your browser to complete the authorization.
            </Text>
            {authDialogServer?.authUrl && (
              <TouchableOpacity
                style={[styles.dialogButton, styles.primaryButton]}
                onPress={() => Linking.openURL(authDialogServer.authUrl)}>
                <Text
                  style={[styles.dialogButtonText, styles.primaryButtonText]}>
                  Open Browser
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.dialogButton, styles.secondaryButton]}
              onPress={() =>
                authDialogServer &&
                checkAuthStatus(authDialogServer.server.server_id)
              }>
              <Text
                style={[styles.dialogButtonText, styles.secondaryButtonText]}>
                Check Status
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dialogButton, styles.secondaryButton]}
              onPress={() => setAuthDialogServer(null)}>
              <Text
                style={[styles.dialogButtonText, styles.secondaryButtonText]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default MCPServersScreen;
