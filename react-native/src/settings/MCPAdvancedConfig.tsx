import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme';
import CustomTextInput from './CustomTextInput';
import CustomDropdown from './DropdownComponent';
import { DropdownItem } from '../types/Chat';
import { DEFAULT_ADVANCED_CONFIG } from '../tools/MCPPresets';

interface MCPAdvancedConfigProps {
  config: any;
  onChange: (config: any) => void;
}

const MCPAdvancedConfig: React.FC<MCPAdvancedConfigProps> = ({
  config,
  onChange,
}) => {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const logLevelData: DropdownItem[] = [
    { label: 'ERROR (Recommended)', value: 'ERROR' },
    { label: 'INFO', value: 'INFO' },
    { label: 'DEBUG (Verbose)', value: 'DEBUG' },
  ];

  const updateConfig = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  const styles = StyleSheet.create({
    container: {
      marginTop: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    headerText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    arrow: {
      fontSize: 18,
      color: colors.text,
    },
    content: {
      marginTop: 12,
      padding: 16,
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
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
    hint: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
      fontStyle: 'italic',
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginVertical: 8,
    },
    switchLabel: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}>
        <Text style={styles.headerText}>⚙️ Advanced Settings</Text>
        <Text style={styles.arrow}>{expanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.content}>
          {/* Timeout Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⏱️ Timeout Settings</Text>

            <CustomTextInput
              label="Initialization Timeout (seconds)"
              value={String(config.timeout ?? DEFAULT_ADVANCED_CONFIG.timeout)}
              onChangeText={text =>
                updateConfig('timeout', parseInt(text) || 60)
              }
              keyboardType="numeric"
              placeholder="60"
            />
            <Text style={styles.hint}>
              Time to wait for server to start. First run may take longer
              (30-60s for package download).
            </Text>

            <CustomTextInput
              label="Tool Execution Timeout (seconds)"
              value={String(
                config.toolTimeout ?? DEFAULT_ADVANCED_CONFIG.toolTimeout
              )}
              onChangeText={text =>
                updateConfig('toolTimeout', parseInt(text) || 30)
              }
              keyboardType="numeric"
              placeholder="30"
            />
            <Text style={styles.hint}>
              Maximum time for a single tool call. Increase for slow operations.
            </Text>
          </View>

          {/* Auto Restart */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔄 Auto Restart</Text>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Enable auto restart</Text>
              <Switch
                value={
                  config.autoRestart ?? DEFAULT_ADVANCED_CONFIG.autoRestart
                }
                onValueChange={value => updateConfig('autoRestart', value)}
              />
            </View>
            <Text style={styles.hint}>
              Automatically restart server if it crashes.
            </Text>

            {(config.autoRestart ?? DEFAULT_ADVANCED_CONFIG.autoRestart) && (
              <>
                <CustomTextInput
                  label="Max Restarts"
                  value={String(
                    config.maxRestarts ?? DEFAULT_ADVANCED_CONFIG.maxRestarts
                  )}
                  onChangeText={text =>
                    updateConfig('maxRestarts', parseInt(text) || 3)
                  }
                  keyboardType="numeric"
                  placeholder="3"
                />

                <CustomTextInput
                  label="Restart Delay (seconds)"
                  value={String(
                    config.restartDelay ?? DEFAULT_ADVANCED_CONFIG.restartDelay
                  )}
                  onChangeText={text =>
                    updateConfig('restartDelay', parseInt(text) || 5)
                  }
                  keyboardType="numeric"
                  placeholder="5"
                />
              </>
            )}
          </View>

          {/* Working Directory */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📁 Working Directory</Text>

            <CustomTextInput
              label="Working Directory (optional)"
              value={config.workingDirectory || ''}
              onChangeText={text => updateConfig('workingDirectory', text)}
              placeholder="/tmp or /path/to/directory"
            />
            <Text style={styles.hint}>
              Leave empty to use default. Required for filesystem-based tools.
            </Text>
          </View>

          {/* Logging */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Logging</Text>

            <CustomDropdown
              label="Log Level"
              data={logLevelData}
              value={config.logLevel ?? DEFAULT_ADVANCED_CONFIG.logLevel}
              onChange={(item: DropdownItem) =>
                updateConfig('logLevel', item.value)
              }
              placeholder="Select log level"
            />
            <Text style={styles.hint}>
              ERROR: Only errors (recommended for production){'\n'}
              INFO: General information{'\n'}
              DEBUG: Detailed debugging (verbose)
            </Text>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Enable debug mode</Text>
              <Switch
                value={
                  config.enableDebug ?? DEFAULT_ADVANCED_CONFIG.enableDebug
                }
                onValueChange={value => updateConfig('enableDebug', value)}
              />
            </View>
            <Text style={styles.hint}>
              Show detailed logs for troubleshooting. May impact performance.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default MCPAdvancedConfig;
