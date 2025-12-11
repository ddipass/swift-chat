import React, { useState, useLayoutEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';
import {
  NavigationProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { RouteParamList } from '../types/RouteTypes';
import { useTheme } from '../theme';
import CustomTextInput from './CustomTextInput';
import { CustomHeaderRightButton } from '../chat/component/CustomHeaderRightButton';
import MCPEnvEditor from './MCPEnvEditor';
import MCPAdvancedConfig from './MCPAdvancedConfig';
import { MCPPreset, DEFAULT_ADVANCED_CONFIG } from '../tools/MCPPresets';

const MCPServerConfigScreen = () => {
  const navigation = useNavigation<NavigationProp<RouteParamList>>();
  const route = useRoute();
  const { colors } = useTheme();
  const { preset, onSave } = route.params as {
    preset: MCPPreset;
    onSave: (config: any) => void;
  };

  const [name, setName] = useState(preset.config.name);
  const [command, setCommand] = useState(preset.config.command);
  const [args, setArgs] = useState(preset.config.args.join(' '));
  const [env, setEnv] = useState(preset.config.env || {});
  const [advancedConfig, setAdvancedConfig] = useState({
    timeout: preset.config.timeout ?? DEFAULT_ADVANCED_CONFIG.timeout,
    toolTimeout:
      preset.config.toolTimeout ?? DEFAULT_ADVANCED_CONFIG.toolTimeout,
    autoRestart:
      preset.config.autoRestart ?? DEFAULT_ADVANCED_CONFIG.autoRestart,
    maxRestarts:
      preset.config.maxRestarts ?? DEFAULT_ADVANCED_CONFIG.maxRestarts,
    restartDelay:
      preset.config.restartDelay ?? DEFAULT_ADVANCED_CONFIG.restartDelay,
    workingDirectory:
      preset.config.workingDirectory ??
      DEFAULT_ADVANCED_CONFIG.workingDirectory,
    logLevel: preset.config.logLevel ?? DEFAULT_ADVANCED_CONFIG.logLevel,
    enableDebug:
      preset.config.enableDebug ?? DEFAULT_ADVANCED_CONFIG.enableDebug,
  });

  const handleSave = () => {
    // 验证必填字段
    if (!name.trim()) {
      Alert.alert('Error', 'Server name is required');
      return;
    }

    if (!command.trim()) {
      Alert.alert('Error', 'Command is required');
      return;
    }

    // 验证必需的环境变量
    if (preset.requiresEnv) {
      for (const key of preset.requiresEnv) {
        if (!env[key] || !env[key].trim()) {
          Alert.alert('Error', `${key} is required`);
          return;
        }
      }
    }

    const config = {
      name: name.trim(),
      command: command.trim(),
      args: args.split(' ').filter(a => a.trim()),
      env,
      ...advancedConfig,
      oauth: preset.config.oauth,
    };

    onSave(config);
    navigation.goBack();
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <CustomHeaderRightButton
          onPress={handleSave}
          imageSource={
            colors.text === '#000000'
              ? require('../assets/done.png')
              : require('../assets/done_dark.png')
          }
        />
      ),
    });
  }, [navigation, name, command, args, env, advancedConfig, colors]);

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      padding: 20,
    },
    icon: {
      fontSize: 48,
      textAlign: 'center',
      marginBottom: 8,
    },
    presetName: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 4,
    },
    description: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    tips: {
      fontSize: 13,
      color: '#ff9800',
      backgroundColor: '#ff980020',
      padding: 12,
      borderRadius: 8,
      marginBottom: 20,
    },
    section: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    versionContainer: {
      paddingBottom: 60,
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.icon}>{preset.icon}</Text>
        <Text style={styles.presetName}>{preset.name}</Text>
        <Text style={styles.description}>{preset.description}</Text>

        {preset.tips && <Text style={styles.tips}>💡 {preset.tips}</Text>}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Basic Configuration</Text>

          <CustomTextInput
            label="Server Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter server name"
          />

          <CustomTextInput
            label="Command"
            value={command}
            onChangeText={setCommand}
            placeholder="npx or uvx"
          />

          <CustomTextInput
            label="Arguments (space separated)"
            value={args}
            onChangeText={setArgs}
            placeholder="-y @modelcontextprotocol/server-name"
            multiline
          />
        </View>

        <MCPEnvEditor
          env={env}
          onChange={setEnv}
          requiredKeys={preset.requiresEnv}
          tips={
            preset.requiresEnv
              ? `Required: ${preset.requiresEnv.join(', ')}`
              : undefined
          }
        />

        <MCPAdvancedConfig
          config={advancedConfig}
          onChange={setAdvancedConfig}
        />

        <View style={styles.versionContainer} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default MCPServerConfigScreen;
