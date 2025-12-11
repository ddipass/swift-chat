import * as React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RouteParamList } from '../types/RouteTypes.ts';
import { useTheme } from '../theme';
import { MCPClient, MCPTool } from '../tools/MCPClient.ts';
import { getApiUrl, getApiKey } from '../storage/StorageUtils.ts';

type MCPServerToolsRouteProp = RouteProp<RouteParamList, 'MCPServerTools'>;

const MCPServerToolsScreen = () => {
  const route = useRoute<MCPServerToolsRouteProp>();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { serverId, serverName, tools } = route.params;

  const mcpClient = new MCPClient(getApiUrl(), getApiKey());

  const deleteServer = () => {
    Alert.alert('Delete Server', `Delete "${serverName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await mcpClient.removeServer(serverId);
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', `Failed to delete server: ${error}`);
          }
        },
      },
    ]);
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
    header: {
      marginBottom: 20,
    },
    serverName: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    toolCount: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    toolItem: {
      marginVertical: 10,
    },
    toolName: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 4,
    },
    toolDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
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
    deleteButton: {
      backgroundColor: '#F44336',
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 20,
    },
    deleteButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.serverName}>{serverName}</Text>
          <Text style={styles.toolCount}>
            {tools.length} {tools.length === 1 ? 'tool' : 'tools'} available
          </Text>
        </View>

        {tools.length === 0 ? (
          <Text style={styles.emptyText}>No tools available</Text>
        ) : (
          tools.map((tool: MCPTool, index: number) => (
            <React.Fragment key={tool.name}>
              <View style={styles.toolItem}>
                <Text style={styles.toolName}>{tool.name}</Text>
                <Text style={styles.toolDescription}>{tool.description}</Text>
              </View>
              {index < tools.length - 1 && <View style={styles.separator} />}
            </React.Fragment>
          ))
        )}

        <TouchableOpacity style={styles.deleteButton} onPress={deleteServer}>
          <Text style={styles.deleteButtonText}>Delete Server</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MCPServerToolsScreen;
