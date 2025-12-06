# Settings & MCP 界面详细设计文档

## MCPSettingsScreen 完整布局

### 实际界面结构

```
┌─────────────────────────────────────────────────────────┐
│  Header: "MCP Settings"                          [✓]    │
├─────────────────────────────────────────────────────────┤
│  ScrollView (padding: 20)                               │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  MCP Integration                                   │ │
│  │  Model Context Protocol allows AI to use          │ │
│  │  external tools and services                       │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Enable MCP                              [Toggle]  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Max Tool Call Iterations                          │ │
│  │  ┌──────────────────────────────────────────────┐  │ │
│  │  │  2                                           │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  MCP Servers                                             │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  My MCP Server                         [Toggle ON] │ │
│  │  http://localhost:3000                             │ │
│  │  API Key: 12345678••••                             │ │
│  │                                          [Remove]  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Production Server                    [Toggle OFF] │ │
│  │  https://api.example.com                           │ │
│  │                                          [Remove]  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │              + Add Server                          │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  (点击 Add Server 后展开表单)                            │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Server Name                                       │ │
│  │  ┌──────────────────────────────────────────────┐  │ │
│  │  │  My MCP Server                               │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  │                                                    │ │
│  │  Server URL                                        │ │
│  │  ┌──────────────────────────────────────────────┐  │ │
│  │  │  http://localhost:3000                       │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  │                                                    │ │
│  │  API Key (Optional)                                │ │
│  │  ┌──────────────────────────────────────────────┐  │ │
│  │  │  ••••••••••••••••                            │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  │                                                    │ │
│  │                              [Cancel]  [Add]      │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Built-in Tools:                                   │ │
│  │  • web_fetch - Fetch web content                  │ │
│  │                                                    │ │
│  │  External Tools:                                   │ │
│  │  Connected to 1 server(s)                         │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 详细样式定义

#### 1. Section Title
```typescript
{
  fontSize: 24,
  fontWeight: 'bold',
  color: colors.text,
  marginBottom: 8,
}
```

#### 2. Description Text
```typescript
{
  fontSize: 14,
  color: colors.secondaryText,  // #666666 (light) / #8e8e93 (dark)
  lineHeight: 20,
}
```

#### 3. Setting Row (Enable MCP)
```typescript
{
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 12,
  marginBottom: 16,
}
```

#### 4. Server Card
```typescript
{
  backgroundColor: colors.inputBackground,  // #ffffff (light) / #1c1c1e (dark)
  borderRadius: 8,
  padding: 16,
  marginBottom: 12,
}

// Server Header
{
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
}

// Server Name
{
  fontSize: 16,
  fontWeight: '600',
  color: colors.text,
}

// Server URL
{
  fontSize: 14,
  color: colors.secondaryText,
  marginBottom: 4,
}

// API Key Display
{
  fontSize: 12,
  color: colors.secondaryText,
  marginBottom: 8,
}
```

#### 5. Add Server Button
```typescript
{
  backgroundColor: colors.primary,  // #007AFF (light) / #0A84FF (dark)
  padding: 16,
  borderRadius: 8,
  alignItems: 'center',
  marginTop: 8,
}

// Button Text
{
  color: colors.buttonText,  // #ffffff
  fontSize: 16,
  fontWeight: '600',
}
```

#### 6. Add Server Form
```typescript
{
  backgroundColor: colors.inputBackground,
  borderRadius: 8,
  padding: 16,
  marginTop: 8,
}

// Form Actions
{
  flexDirection: 'row',
  justifyContent: 'flex-end',
  marginTop: 16,
  gap: 12,
}

// Cancel Button
{
  paddingVertical: 8,
  paddingHorizontal: 16,
}

// Save Button
{
  backgroundColor: colors.primary,
  paddingVertical: 8,
  paddingHorizontal: 16,
  borderRadius: 6,
}
```

#### 7. Info Section
```typescript
{
  marginTop: 24,
  padding: 16,
  backgroundColor: colors.inputBackground,
  borderRadius: 8,
}

// Info Title
{
  fontSize: 14,
  fontWeight: '600',
  color: colors.text,
  marginBottom: 8,
}

// Info Text
{
  fontSize: 14,
  color: colors.secondaryText,
  lineHeight: 20,
}
```

#### 8. Divider
```typescript
{
  height: 1,
  backgroundColor: colors.border,  // #e0e0e0 (light) / #38383a (dark)
  marginVertical: 24,
}
```

### 交互逻辑

#### 1. Enable MCP Toggle
```typescript
<Switch
  value={mcpEnabled}
  onValueChange={value => {
    setMcpEnabled(value);
    setMCPEnabled(value);  // 保存到 MMKV
  }}
/>
```

#### 2. Add Server Flow
```typescript
// 1. 点击 "+ Add Server" 按钮
setShowAddServer(true);

// 2. 填写表单
setNewServerName('My Server');
setNewServerUrl('http://localhost:3000');
setNewServerApiKey('optional-key');

// 3. 验证 URL
try {
  const parsedUrl = new URL(newServerUrl);
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    Alert.alert('Error', 'Only HTTP/HTTPS supported');
    return;
  }
} catch (e) {
  Alert.alert('Error', 'Invalid URL format');
  return;
}

// 4. 创建新服务器
const newServer: MCPServer = {
  id: Date.now().toString(),
  name: newServerName,
  url: newServerUrl,
  apiKey: newServerApiKey,
  enabled: true,
};

// 5. 保存
addMCPServer(newServer);
setServers([...servers, newServer]);
```

#### 3. Toggle Server
```typescript
handleToggleServer(serverId, enabled) {
  updateMCPServer(serverId, { enabled });
  setServers(servers.map(s => 
    s.id === serverId ? { ...s, enabled } : s
  ));
}
```

#### 4. Remove Server
```typescript
Alert.alert('Remove Server', `Remove "${serverName}"?`, [
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
```

### 数据结构

#### MCPServer Interface
```typescript
interface MCPServer {
  id: string;           // 唯一标识符
  name: string;         // 服务器名称
  url: string;          // 服务器 URL
  apiKey?: string;      // 可选的 API Key
  enabled: boolean;     // 是否启用
}
```

#### Storage Functions
```typescript
// 获取所有服务器
getMCPServers(): MCPServer[]

// 添加服务器
addMCPServer(server: MCPServer): void

// 更新服务器
updateMCPServer(id: string, updates: Partial<MCPServer>): void

// 删除服务器
removeMCPServer(id: string): void

// 获取/设置 MCP 启用状态
getMCPEnabled(): boolean
setMCPEnabled(enabled: boolean): void

// 获取/设置最大迭代次数
getMCPMaxIterations(): number
setMCPMaxIterations(iterations: number): void
```

---

## SettingsScreen 主要部分

### 实际界面结构（部分展示）

```
┌─────────────────────────────────────────────────────────┐
│  Header: "Settings"                              [✓]    │
├─────────────────────────────────────────────────────────┤
│  ScrollView                                              │
│                                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Amazon Bedrock                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                          │
│  Config Mode                                             │
│  ┌────────────────────────────────────────────────────┐ │
│  │  ○ SwiftChat Server                                │ │
│  │  ● Bedrock API Key                                 │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  (如果选择 SwiftChat Server)                             │
│  API URL                                                 │
│  ┌────────────────────────────────────────────────────┐ │
│  │  https://xxx.awsapprunner.com                      │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  API Key                                                 │
│  ┌────────────────────────────────────────────────────┐ │
│  │  ••••••••••••••••                                  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  (如果选择 Bedrock API Key)                              │
│  Bedrock API Key                                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │  ••••••••••••••••                                  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Region                                                  │
│  ┌────────────────────────────────────────────────────┐ │
│  │  us-east-1                                    ▼   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │           Refresh Models                           │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Ollama                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                          │
│  Server URL                                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │  http://localhost:11434                            │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  API Key (Optional)                                      │
│  ┌────────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  DeepSeek                                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                          │
│  API Key                                                 │
│  ┌────────────────────────────────────────────────────┐ │
│  │  ••••••••••••••••                                  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  OpenAI                                                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                          │
│  API Key                                                 │
│  ┌────────────────────────────────────────────────────┐ │
│  │  ••••••••••••••••                                  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Use Proxy                                   [Toggle]   │
│                                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  OpenAI Compatible                                       │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Config #1                                    [✕]  │ │
│  │  Base URL: https://api.example.com                 │ │
│  │  API Key: ••••••••                                 │ │
│  │  Models: gpt-4, gpt-3.5-turbo                      │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │              + Add Configuration                   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Chat Model                                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Claude 3.5 Sonnet v2                         ▼   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Thinking Mode                               [Toggle]   │
│                                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Image Model                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Amazon Nova Canvas                           ▼   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Image Size                                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │  1024x1024                                    ▼   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Voice                                                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                          │
│  Voice ID                                                │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Matthew (US English, Male)               ▼       │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  MCP Tools                                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                          │
│  Enable MCP Tools                            [Toggle]   │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Configure MCP Settings                       →   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Web Fetch                                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Configure Web Fetch Settings                 →   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Preferences                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                          │
│  Haptic Feedback                             [Toggle]   │
│  Theme                                       [Toggle]   │
│                                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Data Management                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Token Usage                                  →   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Clear All Data                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  About                                                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                          │
│  Version 2.6.0 (点击检查更新)                            │
│  GitHub Repository                                       │
│  Documentation                                           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 关键特性

1. **分组清晰** - 使用粗分隔线区分不同配置区域
2. **条件显示** - 根据配置模式显示不同的输入框
3. **即时保存** - 输入框失焦时自动保存到 MMKV
4. **自动刷新** - 配置变更后自动刷新模型列表
5. **导航跳转** - MCP 和 Web Fetch 可跳转到详细配置页面

---

## 总结

### MCPSettingsScreen 特点
- ✅ 支持多个 MCP 服务器
- ✅ 每个服务器可独立启用/禁用
- ✅ URL 验证
- ✅ API Key 可选
- ✅ 显示内置工具和外部工具统计

### SettingsScreen 特点
- ✅ 支持 5 种模型提供商
- ✅ OpenAI Compatible 最多 10 个配置
- ✅ 自动保存和刷新
- ✅ 模块化设计，易于扩展
- ✅ 完整的数据管理功能
