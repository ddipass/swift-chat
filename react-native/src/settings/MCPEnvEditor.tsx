import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../theme';
import CustomTextInput from './CustomTextInput';

interface MCPEnvEditorProps {
  env: Record<string, string>;
  onChange: (env: Record<string, string>) => void;
  requiredKeys?: string[];
  tips?: string;
}

const MCPEnvEditor: React.FC<MCPEnvEditorProps> = ({
  env,
  onChange,
  requiredKeys = [],
  tips,
}) => {
  const { colors } = useTheme();

  const addVariable = () => {
    Alert.prompt(
      'Add Environment Variable',
      'Enter variable name (e.g., API_KEY)',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: key => {
            if (key && key.trim()) {
              onChange({ ...env, [key.trim()]: '' });
            }
          },
        },
      ]
    );
  };

  const updateVariable = (key: string, value: string) => {
    onChange({ ...env, [key]: value });
  };

  const removeVariable = (key: string) => {
    if (requiredKeys.includes(key)) {
      Alert.alert('Cannot Remove', 'This variable is required by the server');
      return;
    }

    const newEnv = { ...env };
    delete newEnv[key];
    onChange(newEnv);
  };

  const styles = StyleSheet.create({
    container: {
      marginTop: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    title: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    addButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.text + '20',
      borderRadius: 6,
    },
    addButtonText: {
      fontSize: 13,
      color: colors.text,
      fontWeight: '600',
    },
    tips: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 12,
      fontStyle: 'italic',
    },
    varContainer: {
      marginBottom: 12,
      padding: 12,
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    varHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    varKey: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    required: {
      fontSize: 11,
      color: '#ff6b6b',
      marginLeft: 8,
    },
    removeButton: {
      padding: 4,
    },
    removeButtonText: {
      fontSize: 18,
      color: '#ff6b6b',
    },
    emptyText: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: 16,
      fontStyle: 'italic',
    },
  });

  const envKeys = Object.keys(env);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔐 Environment Variables</Text>
        <TouchableOpacity style={styles.addButton} onPress={addVariable}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {tips && <Text style={styles.tips}>💡 {tips}</Text>}

      {envKeys.length === 0 ? (
        <Text style={styles.emptyText}>
          No environment variables. Tap + Add to create one.
        </Text>
      ) : (
        envKeys.map(key => (
          <View key={key} style={styles.varContainer}>
            <View style={styles.varHeader}>
              <Text style={styles.varKey}>
                {key}
                {requiredKeys.includes(key) && (
                  <Text style={styles.required}> *required</Text>
                )}
              </Text>
              {!requiredKeys.includes(key) && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeVariable(key)}>
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
            <CustomTextInput
              label=""
              value={env[key]}
              onChangeText={value => updateVariable(key, value)}
              placeholder={`Enter ${key}`}
              secureTextEntry={
                key.toLowerCase().includes('key') ||
                key.toLowerCase().includes('token') ||
                key.toLowerCase().includes('secret')
              }
            />
          </View>
        ))
      )}
    </View>
  );
};

export default MCPEnvEditor;
