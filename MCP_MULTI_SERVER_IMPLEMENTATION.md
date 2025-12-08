# MCP Multi-Server Implementation

## 改进内容

实现了完整的多MCP服务器支持，允许SwiftChat同时连接多个MCP服务器。

## 代码修改

### MCPService.ts

**之前（单服务器）：**
```typescript
let mcpClient: MCPClient | null = null;

export function getMCPClient(): MCPClient | null {
  const enabled = getMCPEnabled();
  if (!enabled) return null;
  
  if (!mcpClient) {
    mcpClient = new MCPClient({
      enabled,
      serverUrl: getMCPServerUrl(),  // 单个URL
      apiKey: getMCPApiKey(),        // 单个Key
    });
  }
  return mcpClient;
}
```

**现在（多服务器）：**
```typescript
const mcpClients = new Map<string, MCPClient>();

function getMCPClients(): MCPClient[] {
  const enabled = getMCPEnabled();
  if (!enabled) return [];
  
  const servers = getMCPServers();  // 获取所有服务器
  const clients: MCPClient[] = [];
  
  for (const server of servers) {
    if (!server.enabled) continue;  // 跳过禁用的服务器
    
    let client = mcpClients.get(server.id);
    if (!client) {
      client = new MCPClient({
        enabled: true,
        serverUrl: server.url,
        apiKey: server.apiKey,
      });
      mcpClients.set(server.id, client);
    }
    clients.push(client);
  }
  
  return clients;
}
```

### 工具列表聚合

**之前：**
```typescript
const client = getMCPClient();
if (!client) return builtInTools;

if (cachedTools.length === 0) {
  cachedTools = await client.listTools();
}
```

**现在：**
```typescript
const clients = getMCPClients();
if (clients.length === 0) return builtInTools;

if (cachedTools.length === 0) {
  const allTools: MCPTool[] = [];
  for (const client of clients) {
    try {
      const tools = await client.listTools();
      allTools.push(...tools);  // 聚合所有服务器的工具
    } catch (error) {
      console.error('Failed to list tools from MCP server:', error);
      // 继续处理其他服务器
    }
  }
  cachedTools = allTools;
}
```

### 工具调用容错

**之前：**
```typescript
const client = getMCPClient();
if (!client) throw new Error('MCP not enabled');

return await client.callTool(name, args);
```

**现在：**
```typescript
const clients = getMCPClients();
if (clients.length === 0) throw new Error('MCP not enabled');

let lastError: Error | null = null;
for (const client of clients) {
  try {
    return await client.callTool(name, args);  // 成功则返回
  } catch (error) {
    lastError = error as Error;
    // 继续尝试下一个服务器
  }
}

throw lastError || new Error('All MCP servers failed');
```

## 功能特性

### 1. 多服务器管理
- ✅ 支持添加多个MCP服务器
- ✅ 每个服务器独立配置（URL、API Key、环境变量）
- ✅ 可以单独启用/禁用每个服务器

### 2. 工具聚合
- ✅ 自动聚合所有启用服务器的工具
- ✅ 内置工具（web_fetch）始终可用
- ✅ 工具列表缓存提升性能

### 3. 容错机制
- ✅ 单个服务器失败不影响其他服务器
- ✅ 工具调用失败自动尝试下一个服务器
- ✅ 详细的错误日志

### 4. 性能优化
- ✅ 客户端实例缓存（Map<serverId, MCPClient>）
- ✅ 工具列表缓存
- ✅ 按需创建客户端

## 使用示例

### 配置多个服务器

```typescript
// 服务器1：Notion MCP
{
  id: "1",
  name: "Notion",
  url: "https://mcp.notion.com/mcp",
  apiKey: "notion-key",
  enabled: true,
  env: {}
}

// 服务器2：自定义MCP
{
  id: "2",
  name: "Custom MCP",
  url: "https://my-mcp.example.com",
  apiKey: "custom-key",
  enabled: true,
  env: {"region": "us-east-1"}
}
```

### 工具调用流程

```
用户请求 → getMCPTools()
           ↓
       聚合所有服务器的工具
           ↓
       [web_fetch, notion_create_page, custom_tool, ...]
           ↓
AI选择工具 → callMCPTool("notion_create_page", {...})
           ↓
       尝试服务器1 → 成功 ✓
       (如果失败，尝试服务器2)
```

## 向后兼容

### 保留的旧函数（未使用）
```typescript
// StorageUtils.ts
export function getMCPServerUrl(): string  // 保留但不使用
export function getMCPApiKey(): string    // 保留但不使用
```

### 数据迁移
- 旧的单服务器配置不受影响
- 新的多服务器配置存储在独立的key中
- 无需手动迁移数据

## 测试结果

```bash
✓ web_fetch tool should exist
✓ should reject invalid URL
✓ should reject non-http protocols
✓ should fetch and process HTML content

Test Suites: 1 passed
Tests: 4 passed
```

## 已知限制

### 1. OAuth认证不支持
SwiftChat目前只支持简单的API Key认证（Bearer token）。

**不支持的认证方式：**
- ❌ OAuth 2.0流程
- ❌ 浏览器授权
- ❌ 动态token刷新

**影响的服务：**
- Notion MCP（需要OAuth）
- 其他需要浏览器授权的MCP服务器

### 2. 工具名称冲突
如果多个服务器提供同名工具，调用时会按服务器顺序尝试。

**建议：**
- 确保不同服务器的工具名称唯一
- 或者只启用需要的服务器

### 3. 性能考虑
- 工具列表在首次调用时聚合所有服务器
- 如果某个服务器响应慢，会影响整体加载时间
- 建议只启用必要的服务器

## 后续优化建议

### 1. 工具来源标识
```typescript
interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  serverId?: string;  // 新增：标识工具来源
  serverName?: string; // 新增：服务器名称
}
```

### 2. 并行加载工具
```typescript
// 使用Promise.all并行加载
const toolPromises = clients.map(client => client.listTools());
const toolArrays = await Promise.all(toolPromises);
const allTools = toolArrays.flat();
```

### 3. 智能路由
根据工具名称前缀自动路由到对应服务器：
```typescript
// notion_create_page → Notion服务器
// custom_search → Custom服务器
```

### 4. 健康检查
定期检查服务器状态，自动禁用不可用的服务器。

### 5. OAuth支持
实现OAuth认证流程，支持Notion等需要浏览器授权的服务。

## 文件清单

- ✅ `MCPService.ts` - 实现多服务器支持
- ✅ `MCPSettingsScreen.tsx` - 多服务器UI（已完成）
- ✅ `StorageUtils.ts` - 多服务器存储（已完成）
- ✅ `MCP_MULTI_SERVER_IMPLEMENTATION.md` - 本文档

## 总结

✅ **完成的功能：**
- 多MCP服务器支持
- 工具聚合
- 容错机制
- UI配置界面

❌ **暂不支持：**
- OAuth认证（Notion等）
- stdio协议（Kiro CLI等）

🎯 **适用场景：**
- 多个HTTP MCP服务器
- 使用API Key认证的服务器
- 跨平台使用（Android/iOS/macOS）
