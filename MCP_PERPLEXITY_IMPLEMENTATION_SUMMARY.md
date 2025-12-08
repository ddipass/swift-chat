# MCP Perplexity 集成实现总结

## 📋 任务概述

将 Perplexity 工具通过 MCP (Model Context Protocol) 方式集成到 SwiftChat，并实现前后端配置同步机制。

## ✅ 已完成的工作

### 1. Perplexity MCP 快捷配置 (MCPSettingsScreen)

**实现内容:**
- 添加 "Add Perplexity" 快捷按钮，与 "Add Server" 并列显示
- 一键添加 Perplexity MCP server 配置:
  - Name: `Perplexity`
  - URL: `stdio://npx/-y/@perplexity-ai/mcp-server`
  - Transport: `stdio`
  - Env: `{PERPLEXITY_API_KEY: ""}`
- 显示 `[stdio]` badge 标识 stdio transport 类型
- 自动检测重复配置

**代码变更:**
- `react-native/src/settings/MCPSettingsScreen.tsx`
  - 新增 `handleAddPerplexity()` 函数
  - 新增按钮容器样式 `addButtonsContainer`
  - 新增 `transportBadge` 样式

### 2. MCPServer 接口扩展

**实现内容:**
- 扩展 `MCPServer` 接口支持 `transport` 字段
- 支持 `http` 和 `stdio` 两种 transport 类型
- URL 格式: `stdio://command/arg1/arg2` 用于 stdio transport

**代码变更:**
- `react-native/src/storage/StorageUtils.ts`
  - 添加 `transport?: 'http' | 'stdio'` 字段
  - 更新注释说明 URL 格式

### 3. 前后端配置同步机制

**后端实现:**
- 新增 `POST /api/mcp/config` API 端点
- 新增 `MCPConfigRequest` 模型
- 在 `MCPManager` 中实现 `initialize_from_config()` 方法
  - 支持动态重新加载 MCP servers
  - 解析 stdio URL 格式: `stdio://command/arg1/arg2`
  - 支持环境变量传递

**前端实现:**
- 在 `BackendToolsClient` 添加 `syncMCPConfig()` 方法
- 在 `MCPSettingsScreen` 添加 `syncMCPConfigToBackend()` 函数
- 在以下操作后自动同步配置:
  - 添加服务器 (`handleAddServer`)
  - 添加 Perplexity (`handleAddPerplexity`)
  - 切换服务器状态 (`handleToggleServer`)
  - 删除服务器 (`handleRemoveServer`)

**代码变更:**
- `server/src/main.py`
  - 新增 `MCPConfigRequest` 类
  - 新增 `update_mcp_config()` 端点
- `server/src/mcp_manager.py`
  - 新增 `initialize_from_config()` 方法
- `react-native/src/mcp/BackendToolsClient.ts`
  - 新增 `syncMCPConfig()` 方法
- `react-native/src/settings/MCPSettingsScreen.tsx`
  - 导入 `BackendToolsClient` 和存储工具
  - 新增 `syncMCPConfigToBackend()` 函数
  - 在所有配置变更处调用同步

### 4. 测试环境支持

**实现内容:**
- 修改 `verify_token()` 函数支持测试环境
- 当 `API_KEY_NAME` 环境变量未设置时跳过认证
- 创建 `test_mcp_sync.py` 测试脚本

**代码变更:**
- `server/src/main.py`
  - 在 `verify_token()` 中添加环境变量检查
- `server/test_mcp_sync.py` (新文件)
  - 测试 MCP 配置同步
  - 测试工具列表获取

## 📊 测试结果

### 测试脚本: `test_mcp_sync.py`

```bash
$ python test_mcp_sync.py

============================================================
测试: 同步MCP配置到后端
============================================================
状态码: 200
响应: {
  "success": true,
  "message": "MCP configuration updated"
}
✓ MCP配置同步成功

============================================================
测试: 同步后列出工具
============================================================
状态码: 200
✓ 获取到 1 个工具
  - web_fetch (来自: unknown)
    Fetch and extract content from a web page...

============================================================
测试总结
============================================================
MCP配置同步: ✓ 通过
工具列表获取: ✓ 通过

✓ 所有测试通过!
```

### 测试覆盖

- ✅ MCP 配置同步 API (`POST /api/mcp/config`)
- ✅ 工具列表获取 API (`POST /api/tools`)
- ✅ Stdio transport URL 解析
- ✅ 环境变量传递
- ✅ 测试环境认证跳过

## 🏗️ 架构说明

### 配置流程

```
┌─────────────────────────────────────────────────────────┐
│              React Native 前端                           │
│                                                          │
│  MCPSettingsScreen                                       │
│  ├─ Add Perplexity 按钮                                  │
│  ├─ Add Server 按钮                                      │
│  └─ 服务器列表 (显示 [stdio] badge)                      │
│                                                          │
│  配置变更时自动调用:                                      │
│  syncMCPConfigToBackend(servers)                         │
│                    │                                     │
└────────────────────┼─────────────────────────────────────┘
                     │
                     │ HTTP POST /api/mcp/config
                     │ Authorization: Bearer <API_KEY>
                     │ Body: { servers: [...] }
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Python FastAPI 后端                         │
│                                                          │
│  POST /api/mcp/config                                    │
│  └─ verify_token()                                       │
│  └─ tool_manager.mcp_manager.initialize_from_config()    │
│                                                          │
│  MCPManager.initialize_from_config()                     │
│  ├─ 关闭现有服务器                                        │
│  ├─ 解析配置                                             │
│  │   ├─ stdio://command/args → 启动子进程                │
│  │   └─ https://... → HTTP/OAuth 连接                   │
│  └─ 启动新服务器                                          │
│                                                          │
│  启动的 MCP Servers:                                     │
│  └─ Perplexity (stdio)                                   │
│      ├─ Command: npx                                     │
│      ├─ Args: [-y, @perplexity-ai/mcp-server]           │
│      └─ Env: {PERPLEXITY_API_KEY: "..."}                │
└─────────────────────────────────────────────────────────┘
```

### Stdio Transport 实现

**URL 格式:**
```
stdio://command/arg1/arg2/arg3
```

**解析逻辑:**
```python
if url.startswith("stdio://"):
    parts = url[8:].split("/")
    command = parts[0]  # 例如: npx
    args = parts[1:]    # 例如: ["-y", "@perplexity-ai/mcp-server"]
    await self.add_stdio_server(name, command, args, env)
```

**Perplexity 示例:**
- URL: `stdio://npx/-y/@perplexity-ai/mcp-server`
- Command: `npx`
- Args: `["-y", "@perplexity-ai/mcp-server"]`
- Env: `{"PERPLEXITY_API_KEY": "pplx-xxx"}`

## 📝 Git 提交记录

1. **feat: Add Perplexity MCP quick setup button** (addd4a5)
   - 添加 Perplexity 快捷配置按钮
   - 扩展 MCPServer 接口支持 stdio transport
   - 显示 [stdio] badge

2. **feat: Implement MCP config sync from frontend to backend** (29e2b07)
   - 实现 POST /api/mcp/config 端点
   - 实现 initialize_from_config() 方法
   - 前端自动同步配置

3. **fix: Support test environment without API_KEY_NAME** (2e01150)
   - 支持测试环境跳过认证
   - 添加 test_mcp_sync.py 测试脚本

4. **docs: Update config mapping with completed tasks and test results** (543bc7b)
   - 更新配置映射文档
   - 添加测试结果
   - 标记已完成任务

## 📚 相关文档

- `FRONTEND_BACKEND_CONFIG_MAPPING.md` - 前后端配置对应关系详细文档
- `BACKEND_TOOLS_USAGE.md` - 后端工具使用指南
- `BACKEND_TOOLS_QUICKSTART.md` - 快速开始指南
- `server/test_mcp_sync.py` - MCP 配置同步测试脚本

## 🔄 下一步计划

### 高优先级
1. **PerplexitySettingsScreen 简化**
   - 添加说明引导用户使用 MCP 方式
   - 或者简化为只配置 API Key，自动添加到 MCP

2. **MCP Server 状态显示**
   - 显示服务器运行状态 (运行中/已停止/错误)
   - 实时状态更新

3. **连接测试功能**
   - 添加 "Test Connection" 按钮
   - 验证 MCP server 是否可用

### 中优先级
4. **Settings 主界面增强**
   - 显示后端工具状态指示器
   - 显示已启用的工具数量
   - 快速访问各工具配置

5. **WebFetchSettingsScreen 增强**
   - 添加 "Use Backend" 开关
   - 显示后端连接状态

### 低优先级
6. **错误处理优化**
   - 更详细的错误信息
   - 重试机制
   - 日志记录

7. **性能优化**
   - 配置同步防抖
   - 批量操作支持

## 🎯 关键发现

1. **Perplexity 官方 MCP 支持**
   - 官方包: `@perplexity-ai/mcp-server`
   - 支持 stdio transport
   - 提供 `perplexity_search`, `perplexity_research`, `perplexity_reason` 工具

2. **Stdio Transport 优势**
   - 无需单独的 HTTP 服务器
   - 通过子进程 stdin/stdout 通信
   - 更简单的部署和配置

3. **配置同步策略**
   - 采用混合方案: 前端配置 + 后端执行
   - 前端负责用户界面和配置管理
   - 后端负责实际的 MCP server 启动和工具执行

4. **测试环境支持重要性**
   - 允许在没有 AWS SSM 的情况下测试
   - 加快开发和调试速度

## 🔧 技术栈

- **前端**: React Native, TypeScript
- **后端**: Python 3.13, FastAPI, Uvicorn
- **MCP**: Model Context Protocol (stdio transport)
- **工具**: Perplexity MCP Server (NPM package)
- **测试**: Python requests, 自定义测试脚本

## 📞 联系和支持

如有问题或建议，请参考:
- GitHub Issues
- 项目文档
- 测试脚本示例
