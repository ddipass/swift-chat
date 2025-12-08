# 代码清理建议

## 当前架构分析

### MCP/Tools 相关文件

```
react-native/src/mcp/
├── BackendToolsClient.ts      # 后端工具客户端（通过 MCP）
├── BuiltInTools.ts            # 统一工具接口（优先后端，回退客户端）
├── PerplexityTools.ts         # Perplexity 客户端直接调用
├── MCPClient.ts               # MCP HTTP 客户端
├── MCPOAuth.ts                # MCP OAuth 认证
├── MCPService.ts              # MCP 服务管理
└── ToolDebugUtils.ts          # 工具调试工具
```

### 当前工作流程

```
用户调用工具
    ↓
getBuiltInToolsAsync()
    ↓
检查后端配置 (apiUrl + apiKey)
    ↓
    ├─ 有配置 → BackendToolsClient → 后端 API → MCP Manager
    │                                              ↓
    │                                         MCP Servers
    │                                         ├─ Perplexity (stdio)
    │                                         ├─ web_fetch (builtin)
    │                                         └─ 其他 MCP servers
    │
    └─ 无配置/失败 → getBuiltInTools() → 客户端工具
                                          ├─ PerplexityTools (直接 API)
                                          ├─ web_fetch (客户端)
                                          └─ 其他客户端工具
```

## 清理建议

### ✅ 推荐：保留当前架构（最小改动）

**理由：**
1. **回退机制有价值** - 当后端不可用时，客户端工具可以继续工作
2. **离线场景** - 用户可能在没有后端的情况下使用
3. **开发测试** - 客户端工具便于快速测试
4. **代码已经清晰** - `getBuiltInToolsAsync()` 已经实现了优先级逻辑

**需要做的：**
- ✅ 添加清晰的注释说明两种方式
- ✅ 在文档中说明使用场景
- ✅ 保持现有代码不变

### 📝 建议改进

#### 1. 添加注释到关键文件

**BuiltInTools.ts:**
```typescript
/**
 * Built-in Tools - 统一工具接口
 * 
 * 工作模式：
 * 1. 优先使用后端工具（通过 BackendToolsClient）
 *    - 需要配置 apiUrl 和 apiKey
 *    - 工具由后端 MCP Manager 管理
 *    - 支持 MCP stdio/OAuth servers
 * 
 * 2. 回退到客户端工具（直接调用）
 *    - 当后端未配置或不可用时
 *    - 工具直接在客户端执行
 *    - 包括 Perplexity 直接 API 调用
 * 
 * 使用场景：
 * - 生产环境：推荐使用后端模式（更安全、统一管理）
 * - 开发测试：可以使用客户端模式（快速测试）
 * - 离线场景：自动回退到客户端模式
 */
```

**PerplexityTools.ts:**
```typescript
/**
 * Perplexity Tools - 客户端直接调用
 * 
 * 注意：这是客户端直接调用 Perplexity API 的实现
 * 
 * 推荐使用方式：
 * - 生产环境：使用 MCP 方式（通过后端）
 *   在 MCPSettings 中添加 Perplexity MCP server
 * 
 * - 开发/测试：可以使用此客户端实现
 *   在 PerplexitySettings 中配置 API Key
 * 
 * 此文件作为回退方案保留，当后端不可用时自动使用
 */
```

**BackendToolsClient.ts:**
```typescript
/**
 * Backend Tools Client - 后端工具 API 客户端
 * 
 * 通过 HTTP API 与后端 ToolManager 通信
 * 后端负责管理所有 MCP servers 和内置工具
 * 
 * 优势：
 * - 统一管理：所有工具由后端统一管理
 * - 安全性：API Key 不暴露在客户端
 * - MCP 支持：支持 stdio 和 OAuth transport
 * - 可扩展：易于添加新的 MCP servers
 */
```

#### 2. 在 PerplexitySettingsScreen 添加说明

```typescript
<View style={styles.infoBox}>
  <Text style={styles.infoText}>
    💡 推荐使用 MCP 方式：
    {'\n'}前往 MCP Settings，点击 "Add Perplexity" 按钮
    {'\n'}
    {'\n'}当前配置为客户端直接调用（回退方案）
  </Text>
  <TouchableOpacity 
    style={styles.linkButton}
    onPress={() => navigation.navigate('MCPSettings')}>
    <Text style={styles.linkText}>→ 前往 MCP Settings</Text>
  </TouchableOpacity>
</View>
```

#### 3. 在 MCPSettingsScreen 添加说明

```typescript
<View style={styles.infoBox}>
  <Text style={styles.infoText}>
    ℹ️ MCP (Model Context Protocol) 统一管理所有工具
    {'\n'}
    {'\n'}• Perplexity: 点击 "Add Perplexity" 快速配置
    {'\n'}• 其他服务: 点击 "Add Server" 手动配置
    {'\n'}
    {'\n'}配置后工具将通过后端执行，更安全可靠
  </Text>
</View>
```

### ❌ 不推荐：激进清理

**不推荐删除的文件：**
- ❌ PerplexityTools.ts - 作为回退方案保留
- ❌ MCPClient.ts - 可能用于直接 HTTP MCP 连接
- ❌ 客户端工具实现 - 回退机制需要

**理由：**
- 破坏回退机制
- 降低系统健壮性
- 影响离线使用场景
- 增加维护成本（需要处理更多边界情况）

## 配置优先级说明

### 当前优先级（推荐保持）

```
1. 后端工具（BackendToolsClient）
   ├─ 检查: apiUrl && apiKey
   ├─ 优势: 统一管理、安全、MCP 支持
   └─ 失败时 → 回退到客户端

2. 客户端工具（PerplexityTools 等）
   ├─ 检查: 各工具的配置（如 Perplexity API Key）
   ├─ 优势: 快速、离线可用
   └─ 作为回退方案
```

### 用户配置指南

**推荐配置（生产环境）：**
1. 配置后端服务器（Settings > Amazon Bedrock > SwiftChat Server）
2. 在 MCP Settings 中添加 Perplexity MCP
3. 其他工具也通过 MCP 添加

**备用配置（开发/测试）：**
1. 直接在 Perplexity Settings 配置 API Key
2. 工具将在客户端执行

## 代码质量改进

### 已完成 ✅
- ✅ 统一工具接口（BuiltInTool）
- ✅ 优先级逻辑（后端优先，客户端回退）
- ✅ 错误处理和日志
- ✅ 类型安全（TypeScript）

### 可选改进 📋
- [ ] 添加工具执行统计（成功率、响应时间）
- [ ] 添加工具缓存（减少重复调用）
- [ ] 添加配置验证（检查配置是否有效）
- [ ] 添加工具版本管理（支持工具升级）

## 总结

**推荐方案：保留当前架构 + 添加注释和说明**

**优点：**
- ✅ 最小改动，风险低
- ✅ 保持回退机制，健壮性高
- ✅ 支持多种使用场景
- ✅ 代码已经清晰，只需添加注释

**需要做的：**
1. 在关键文件添加注释（5分钟）
2. 在设置界面添加说明（10分钟）
3. 更新用户文档（5分钟）

**总工作量：约 20 分钟**

这样既保持了代码的灵活性和健壮性，又让用户清楚地了解两种方式的区别和使用场景。
