# MCP UI Enhancement Summary

## 问题分析

你提供的Kiro CLI MCP配置格式：
```json
{
  "command": "uvx",
  "args": ["awslabs.core-mcp-server@latest"],
  "env": {
    "FASTMCP_LOG_LEVEL": "ERROR"
  }
}
```

与SwiftChat当前的MCP实现存在**架构差异**：

| 特性 | Kiro CLI | SwiftChat |
|------|----------|-----------|
| 连接方式 | 本地进程启动 | HTTP/HTTPS URL |
| 配置内容 | command + args + env | url + apiKey |
| 适用场景 | 桌面CLI工具 | 移动/桌面应用 |

## 解决方案

由于SwiftChat是移动端应用（Android/iOS/macOS），**不适合直接执行命令行启动MCP服务器**。因此采用了**增强现有HTTP方式**的方案：

### 新增功能

1. **Environment Variables字段**
   - 支持以JSON格式配置环境变量
   - 用于记录MCP服务器所需的环境变量配置
   - 在服务器列表中显示已配置的环境变量

2. **UI改进**
   - 添加"Environment Variables (Optional)"输入框
   - 支持多行输入JSON格式的环境变量
   - 显示提示文本："Enter environment variables as JSON object"
   - 在服务器列表中显示环境变量键名

## 代码修改

### 1. StorageUtils.ts
```typescript
export interface MCPServer {
  id: string;
  name: string;
  url: string;
  apiKey: string;
  enabled: boolean;
  env?: Record<string, string>; // 新增：环境变量支持
}
```

### 2. MCPSettingsScreen.tsx

**新增状态：**
```typescript
const [newServerEnv, setNewServerEnv] = useState('');
```

**增强验证逻辑：**
- 解析并验证JSON格式的环境变量
- 确保环境变量是对象类型（非数组）
- 提供友好的错误提示

**UI增强：**
- 添加环境变量输入框（multiline）
- 在服务器列表中显示环境变量键名
- 添加提示文本说明JSON格式要求

**样式新增：**
```typescript
serverEnv: {
  fontSize: 12,
  color: colors.textSecondary,
  marginTop: 2,
  fontStyle: 'italic',
},
hintText: {
  fontSize: 12,
  color: colors.textSecondary,
  marginTop: -8,
  marginBottom: 8,
},
```

## UI风格一致性

所有新增UI元素都遵循Settings页面的设计规范：

- ✅ 使用统一的padding: 20px
- ✅ 使用统一的margin: 10/12/16px
- ✅ 使用CustomTextInput组件
- ✅ 使用colors主题系统
- ✅ 保持简洁的列表项设计
- ✅ 统一的按钮样式和交互

## 使用示例

### 配置AWS Core MCP Server
```
Server Name: AWS Core MCP
Server URL: http://localhost:3000
API Key: (留空)
Environment Variables:
{
  "FASTMCP_LOG_LEVEL": "ERROR"
}
```

### 配置Perplexity MCP Server
```
Server Name: Perplexity
Server URL: http://localhost:3001
API Key: (留空)
Environment Variables:
{
  "PERPLEXITY_API_KEY": "pplx-your-api-key-here",
  "PERPLEXITY_TIMEOUT_MS": "600000"
}
```

### 配置Notion MCP Server
```
Server Name: Notion
Server URL: https://mcp.notion.com/mcp
API Key: your-notion-api-key
Environment Variables: (留空)
```

## 使用流程

1. **在本地启动MCP服务器**
   - 使用Kiro CLI、Docker或其他方式启动
   - 记录服务器的HTTP URL（如 http://localhost:3000）

2. **在SwiftChat中配置**
   - 打开Settings → MCP Settings
   - 点击"+ Add Server"
   - 填写服务器名称、URL、API Key（可选）
   - 填写环境变量（可选，JSON格式）
   - 点击"Add"保存

3. **启用并使用**
   - 切换开关启用服务器
   - MCP工具将在聊天中可用

## 注意事项

1. **环境变量的作用**
   - SwiftChat中的环境变量字段主要用于**记录和文档化**
   - 实际的环境变量需要在**启动MCP服务器时设置**
   - SwiftChat通过HTTP连接到已运行的MCP服务器

2. **与Kiro CLI的区别**
   - Kiro CLI会自动启动MCP服务器进程
   - SwiftChat需要手动启动MCP服务器
   - SwiftChat只负责连接到HTTP端点

3. **移动设备访问**
   - 在移动设备上使用时，不能使用`localhost`
   - 需要使用电脑的局域网IP地址（如 http://192.168.1.100:3000）

## 文件清单

- ✅ `StorageUtils.ts` - 添加env字段到MCPServer接口
- ✅ `MCPSettingsScreen.tsx` - 增强UI支持环境变量配置
- ✅ `MCP_CONFIGURATION_GUIDE.md` - 详细使用指南
- ✅ `MCP_UI_ENHANCEMENT_SUMMARY.md` - 本文档

## 测试建议

1. 添加不带环境变量的服务器
2. 添加带环境变量的服务器
3. 测试无效JSON格式的错误提示
4. 验证环境变量在列表中正确显示
5. 测试编辑和删除功能
6. 验证数据持久化

## 后续优化建议

1. **可视化环境变量编辑器**
   - 提供键值对输入界面，避免手写JSON
   - 添加常用环境变量模板

2. **服务器状态检测**
   - 添加"Test Connection"按钮
   - 显示服务器在线/离线状态

3. **导入/导出配置**
   - 支持从Kiro CLI配置文件导入
   - 导出SwiftChat MCP配置

4. **服务器分组**
   - 支持将服务器分组管理
   - 快速启用/禁用整组服务器
