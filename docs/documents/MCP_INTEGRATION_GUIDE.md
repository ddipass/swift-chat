# SwiftChat MCP 集成完整指南

## 目录
1. [项目概述](#项目概述)
2. [当前架构](#当前架构)
3. [已完成功能](#已完成功能)
4. [待完成任务](#待完成任务)
5. [技术细节](#技术细节)
6. [文件结构](#文件结构)
7. [测试指南](#测试指南)

---

## 项目概述

SwiftChat 是一个跨平台 AI 聊天应用，支持 Amazon Bedrock、Ollama、DeepSeek、OpenAI 等多个 AI 模型提供商。

**MCP 集成目标**：添加 Model Context Protocol (MCP) 支持，允许 AI 访问外部工具和数据源（如 Notion、GitHub、文件系统等）。

---

## 当前架构

### 整体架构

```
SwiftChat
├── react-native/          # 前端 (React Native)
│   └── src/tools/
│       ├── MCPPresets.ts  # MCP 服务器预设配置
│       └── MCP*.tsx       # MCP 相关 UI 组件
│
└── server/                # 后端 (Python FastAPI)
    └── src/
        ├── main.py        # FastAPI 主应用
        ├── tool_manager.py # 工具管理器
        └── mcp_integration/  # MCP 集成模块 (重命名自 mcp)
            ├── __init__.py
            ├── manager.py           # MCP 服务器管理器
            ├── client.py            # stdio 传输客户端
            ├── sse_client.py        # SSE 传输客户端 (自定义)
            ├── streamable_client.py # Streamable HTTP 客户端 (MCP SDK)
            ├── oauth.py             # 传统 OAuth (Google, GitHub)
            ├── mcp_oauth.py         # MCP OAuth (动态注册 + PKCE)
            └── storage.py           # 配置和 token 存储
```

### 数据流

```
用户 → React Native App
    ↓
FastAPI Server (main.py)
    ↓
ToolManager → MCPManager
    ↓
MCP Clients (stdio/SSE/Streamable HTTP)
    ↓
MCP Servers (AWS Labs Core, Notion, GitHub, etc.)
```

---

## 已完成功能

### 1. stdio 传输 (本地 MCP 服务器)
- ✅ 使用 `npx` 或 `uvx` 启动本地 MCP 服务器
- ✅ 通过 stdin/stdout 通信
- ✅ 环境变量注入
- ✅ 进程管理和清理
- ✅ 测试通过：AWS Labs Core MCP

**文件**: `mcp_integration/client.py`

### 2. SSE 传输 (自定义实现)
- ✅ HTTP POST 请求发送 JSON-RPC
- ✅ 基本的 MCP 协议支持
- ✅ 401 检测和元数据发现
- ⚠️ 问题：与 Notion MCP 不兼容

**文件**: `mcp_integration/sse_client.py`

### 3. MCP OAuth 2.1 (动态客户端注册)
- ✅ 元数据发现 (`/.well-known/oauth-authorization-server`)
- ✅ 动态客户端注册 (RFC 7591)
- ✅ PKCE 支持 (SHA256)
- ✅ 授权 URL 生成
- ✅ Token 交换
- ✅ Token 存储 (SSM Parameter Store)

**文件**: `mcp_integration/mcp_oauth.py`

### 4. 前端 UI
- ✅ 9 个预设 MCP 服务器配置
- ✅ 服务器添加/删除界面
- ✅ 高级配置（超时、重启、日志等）
- ✅ 环境变量编辑器
- ✅ OAuth 状态显示

**文件**: `react-native/src/tools/MCP*.tsx`

### 5. API 端点
- ✅ `POST /api/mcp/servers` - 添加服务器
- ✅ `GET /api/mcp/servers` - 列出服务器
- ✅ `DELETE /api/mcp/servers/{id}` - 删除服务器
- ✅ `GET /api/mcp/servers/{id}/tools` - 获取工具列表
- ✅ `GET /api/mcp/servers/{id}/status` - 获取状态
- ✅ `GET /api/mcp/oauth/callback` - OAuth 回调

**文件**: `server/src/main.py`

---

## 待完成任务

### 🔴 高优先级

#### 1. 修复 Notion MCP 集成
**问题**: MCP SDK 的 `streamablehttp_client` 在 FastAPI 请求处理中出现异步作用域错误

**错误信息**:
```
RuntimeError: Attempted to exit cancel scope in a different task than it was entered in
```

**原因**: MCP SDK 的异步上下文管理器需要在同一个任务中进入和退出，但 FastAPI 的请求处理会创建新的任务。

**解决方案**:
1. **方案 A (推荐)**: 将 MCP 客户端生命周期提升到应用级别
   - 在应用启动时创建客户端池
   - 使用后台任务管理连接
   - 请求处理只调用已连接的客户端

2. **方案 B**: 使用 FastAPI 的 BackgroundTasks
   - 在后台任务中处理连接
   - 使用轮询或 WebSocket 通知前端

3. **方案 C**: 继续使用自定义 SSE 客户端
   - 修复与 Notion MCP 的兼容性问题
   - 参考 MCP SDK 源码实现

**相关文件**:
- `mcp_integration/streamable_client.py` (新建，使用 MCP SDK)
- `mcp_integration/manager.py` (需要重构)

**参考资源**:
- [MCP SDK Python 示例](https://github.com/invariantlabs-ai/mcp-streamable-http/blob/main/python-example/client/client.py)
- [Notion MCP OAuth 示例](https://kriasoft.com/oauth-callback/examples/notion.html)

#### 2. OAuth 回调处理完善
**当前状态**: 回调端点已创建，但 token 交换后的客户端启动有问题

**需要**:
- 完善 `complete_mcp_oauth()` 方法
- 确保 token 交换成功后能正确启动客户端
- 添加错误处理和重试机制

**文件**: `mcp_integration/manager.py` (第 56-90 行)

#### 3. Token 刷新机制
**需要**:
- 检测 token 过期 (401 错误)
- 使用 refresh_token 自动刷新
- 后台定时刷新 (过期前 5 分钟)

**文件**: `mcp_integration/mcp_oauth.py` (需要添加 `refresh_token()` 方法)

### 🟡 中优先级

#### 4. 工具调用集成
**当前状态**: 工具列表可以获取，但未集成到 AI 对话流程

**需要**:
- 在 `tool_manager.py` 中注册 MCP 工具
- 将 MCP 工具转换为 Bedrock 工具格式
- 处理工具调用结果

**文件**: `server/src/tool_manager.py`

#### 5. 错误处理和日志
**需要**:
- 统一错误处理
- 详细的调试日志
- 用户友好的错误信息

#### 6. 前端状态管理
**需要**:
- OAuth 授权流程的进度显示
- 服务器状态实时更新
- 错误提示和重试按钮

### 🟢 低优先级

#### 7. 性能优化
- 客户端连接池
- 请求缓存
- 并发控制

#### 8. 测试
- 单元测试
- 集成测试
- E2E 测试

---

## 技术细节

### MCP 传输类型

#### 1. stdio (标准输入输出)
**用途**: 本地 MCP 服务器

**流程**:
```python
# 启动进程
process = subprocess.Popen(
    ["npx", "-y", "mcp-server"],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    env={"API_KEY": "xxx"}
)

# 发送 JSON-RPC
request = {"jsonrpc": "2.0", "method": "initialize", ...}
process.stdin.write(json.dumps(request) + "\n")

# 读取响应
response = process.stdout.readline()
```

**优点**: 简单、安全、无需网络
**缺点**: 只能本地使用

#### 2. SSE (Server-Sent Events)
**用途**: 远程 MCP 服务器 (旧版)

**流程**:
```python
# HTTP POST 发送请求
response = httpx.post(
    "https://mcp.example.com/mcp",
    json={"jsonrpc": "2.0", "method": "initialize", ...},
    headers={"Authorization": "Bearer token"}
)
```

**优点**: 简单的 HTTP
**缺点**: 不是标准 MCP 传输

#### 3. Streamable HTTP (推荐)
**用途**: 远程 MCP 服务器 (新版)

**流程**:
```python
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

# 创建客户端
async with streamablehttp_client(
    url="https://mcp.notion.com/mcp",
    headers={"Authorization": "Bearer token"}
) as (read, write, _):
    session = ClientSession(read, write)
    await session.initialize()
    tools = await session.list_tools()
```

**优点**: 官方标准、完整支持
**缺点**: 异步上下文管理复杂

### MCP OAuth 流程

```
1. 用户添加 Notion MCP
   ↓
2. 后端尝试连接 (无 token)
   ↓
3. 收到 401 Unauthorized
   ↓
4. 发现授权元数据
   GET /.well-known/oauth-authorization-server
   返回: {
     "authorization_endpoint": "https://mcp.notion.com/authorize",
     "token_endpoint": "https://mcp.notion.com/token",
     "registration_endpoint": "https://mcp.notion.com/register"
   }
   ↓
5. 动态注册客户端
   POST /register
   {
     "client_name": "SwiftChat MCP Client",
     "redirect_uris": ["http://localhost:8080/api/mcp/oauth/callback"],
     "grant_types": ["authorization_code", "refresh_token"],
     "token_endpoint_auth_method": "none"
   }
   返回: { "client_id": "xxx" }
   ↓
6. 生成 PKCE
   code_verifier = base64(random(32))
   code_challenge = base64(sha256(code_verifier))
   ↓
7. 生成授权 URL
   https://mcp.notion.com/authorize?
     client_id=xxx&
     redirect_uri=http://localhost:8080/api/mcp/oauth/callback&
     response_type=code&
     state=random&
     code_challenge=yyy&
     code_challenge_method=S256
   ↓
8. 返回给前端: { "status": "pending_auth", "auth_url": "..." }
   ↓
9. 用户在浏览器授权
   ↓
10. Notion 重定向到 callback?code=zzz&state=random
   ↓
11. 后端交换 token
   POST /token
   {
     "grant_type": "authorization_code",
     "code": "zzz",
     "redirect_uri": "...",
     "client_id": "xxx",
     "code_verifier": "..."
   }
   返回: {
     "access_token": "...",
     "refresh_token": "...",
     "expires_in": 3600
   }
   ↓
12. 保存 token 到 SSM
   ↓
13. 使用 token 启动 MCP 客户端
   ↓
14. 状态变为 "active"
```

### 环境变量

**开发环境**:
```bash
export LOCAL_API_KEY=your_api_key
export AWS_REGION=us-east-1
```

**生产环境** (App Runner):
- `API_KEY_PARAM`: SSM Parameter Store 参数名
- `AWS_REGION`: AWS 区域

---

## 文件结构

### 后端核心文件

```
server/src/
├── main.py (1200 行)
│   ├── FastAPI 应用初始化
│   ├── MCP API 端点 (第 530-680 行)
│   │   ├── POST /api/mcp/servers
│   │   ├── GET /api/mcp/servers
│   │   ├── DELETE /api/mcp/servers/{id}
│   │   ├── GET /api/mcp/servers/{id}/tools
│   │   ├── GET /api/mcp/servers/{id}/status
│   │   └── GET /api/mcp/oauth/callback
│   └── 聊天和工具调用端点
│
├── tool_manager.py (300 行)
│   ├── 工具注册和管理
│   ├── MCP 工具路由 (mcp:server_id:tool_name)
│   └── 工具调用执行
│
└── mcp_integration/
    ├── __init__.py
    │
    ├── manager.py (250 行) ⚠️ 需要重构
    │   ├── MCPManager 类
    │   ├── add_server() - 添加服务器
    │   ├── _start_server() - 启动服务器
    │   ├── complete_mcp_oauth() - 完成 OAuth
    │   ├── _start_server_with_token() - 用 token 启动
    │   └── execute_tool() - 执行工具
    │
    ├── client.py (200 行) ✅ 稳定
    │   ├── MCPClient 类 (stdio 传输)
    │   ├── connect() - 启动子进程
    │   ├── initialize() - MCP 握手
    │   ├── list_tools() - 获取工具
    │   └── call_tool() - 调用工具
    │
    ├── sse_client.py (150 行) ⚠️ 有问题
    │   ├── MCPSSEClient 类 (自定义 SSE)
    │   ├── connect() - HTTP 连接
    │   ├── initialize() - 401 检测
    │   ├── discover_auth_metadata() - 元数据发现
    │   └── _send_request() - HTTP POST
    │
    ├── streamable_client.py (100 行) 🆕 未完成
    │   ├── MCPStreamableClient 类 (MCP SDK)
    │   ├── connect() - 使用 streamablehttp_client
    │   ├── list_tools() - 获取工具
    │   └── close() - 清理连接
    │
    ├── oauth.py (150 行) ✅ 稳定
    │   ├── MCPOAuthHandler 类 (传统 OAuth)
    │   ├── Google/GitHub/Notion 配置
    │   ├── generate_auth_url() - 生成授权 URL
    │   ├── handle_callback() - 处理回调
    │   └── refresh_token() - 刷新 token
    │
    ├── mcp_oauth.py (130 行) ✅ 基本完成
    │   ├── MCPOAuthClient 类 (MCP OAuth)
    │   ├── generate_pkce() - 生成 PKCE
    │   ├── register_client() - 动态注册
    │   ├── get_authorization_url() - 授权 URL
    │   └── exchange_code() - Token 交换
    │
    └── storage.py (100 行) ✅ 稳定
        ├── MCPStorage 类
        ├── save_config() - 保存配置
        ├── load_config() - 加载配置
        ├── save_tokens() - 保存 token
        └── load_tokens() - 加载 token
```

### 前端核心文件

```
react-native/src/tools/
├── MCPPresets.ts (200 行) ✅ 完成
│   └── 9 个预设配置
│
├── MCPServerConfigScreen.tsx (400 行) ✅ 完成
│   ├── 服务器配置表单
│   ├── 环境变量编辑
│   └── 高级设置
│
├── MCPAdvancedConfig.tsx (150 行) ✅ 完成
│   └── 可折叠高级配置
│
├── MCPEnvEditor.tsx (200 行) ✅ 完成
│   └── 动态环境变量编辑器
│
└── MCPClient.ts (100 行) ✅ 完成
    └── API 调用封装
```

---

## 测试指南

### 1. 测试 stdio MCP (AWS Labs Core)

```bash
# 启动服务器
cd server && source venv/bin/activate && cd src
export LOCAL_API_KEY=test_key
python3 main.py

# 添加服务器
curl -X POST http://localhost:8080/api/mcp/servers \
  -H "Authorization: Bearer test_key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AWS Labs Core",
    "command": "uvx",
    "args": ["awslabs.core-mcp-server@latest"],
    "env": {"FASTMCP_LOG_LEVEL": "ERROR"},
    "timeout": 60
  }'

# 应该返回: {"server_id": "xxx", "status": "active"}

# 查看工具
curl http://localhost:8080/api/mcp/servers/xxx/tools \
  -H "Authorization: Bearer test_key"
```

### 2. 测试 Notion MCP OAuth (待修复)

```bash
# 添加服务器
curl -X POST http://localhost:8080/api/mcp/servers \
  -H "Authorization: Bearer test_key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Notion",
    "command": "sse",
    "args": ["https://mcp.notion.com/mcp"],
    "callback_base_url": "http://localhost:8080"
  }'

# 应该返回: {
#   "server_id": "xxx",
#   "status": "pending_auth",
#   "auth_url": "https://mcp.notion.com/authorize?..."
# }

# 在浏览器打开 auth_url 授权
# 授权后应该自动完成 token 交换并启动客户端
```

---

## 依赖项

### Python 后端
```
fastapi==0.115.5
uvicorn==0.38.0
httpx==0.28.1
boto3==1.35.72
pydantic==2.12.5
mcp==1.23.3  # MCP SDK
```

### React Native 前端
```
react-native==0.76.5
@react-navigation/native==^7.0.13
```

---

## 重要注意事项

### 1. 模块命名冲突
- ⚠️ 原来的 `mcp/` 模块已重命名为 `mcp_integration/`
- 原因：与 MCP SDK 的 `mcp` 包冲突
- 所有导入已更新：`from mcp.manager` → `from mcp_integration.manager`

### 2. Pydantic 版本
- 使用 Pydantic v2
- `request.dict()` → `request.model_dump()`

### 3. 异步编程
- 所有 MCP 客户端操作都是异步的
- 使用 `async/await`
- 注意异步上下文管理器的作用域

### 4. 安全性
- API Key 存储在 SSM Parameter Store (SecureString)
- OAuth token 存储在 SSM
- 环境变量中的敏感信息自动检测 (KEY/TOKEN/SECRET)

---

## 下一步行动

### 立即任务 (1-2 天)
1. 修复 Notion MCP 的异步作用域问题
2. 完成 OAuth 回调后的客户端启动
3. 测试完整的 OAuth 流程

### 短期任务 (1 周)
1. 实现 token 刷新机制
2. 集成 MCP 工具到 AI 对话
3. 添加错误处理和日志

### 长期任务 (2-4 周)
1. 性能优化和连接池
2. 完整的测试覆盖
3. 文档和示例

---

## 联系和资源

### 文档
- [MCP 官方规范](https://modelcontextprotocol.io/specification/2025-03-26)
- [MCP SDK Python](https://github.com/modelcontextprotocol/python-sdk)
- [Notion MCP 文档](https://developers.notion.com/docs/get-started-with-mcp)

### 示例代码
- [MCP Streamable HTTP 示例](https://github.com/invariantlabs-ai/mcp-streamable-http)
- [Notion OAuth 示例](https://kriasoft.com/oauth-callback/examples/notion.html)

### 相关 Issue
- MCP SDK 异步上下文问题
- Notion MCP OAuth 集成

---

## 版本历史

- **v1.0** (2025-01-09): 初始 MCP 集成，stdio 传输完成
- **v1.1** (2025-01-10): 添加 SSE 传输和 MCP OAuth
- **v1.2** (2025-01-10): 重构使用 MCP SDK (进行中)

---

**最后更新**: 2025-01-10
**维护者**: SwiftChat Team
**状态**: 🚧 开发中
