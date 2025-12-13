# MCP Testing Guide

## 快速开始

### 1. 启动后端服务器

```bash
cd server
source venv/bin/activate
cd src
export LOCAL_API_KEY=20250112Research
python3 main.py
```

### 2. 启动前端

```bash
cd react-native
npm start
npm run ios  # 或 npm run android
```

### 3. 添加 MCP 服务器

1. 打开 App
2. 侧边栏 → **MCP Servers**
3. 点击 **+ Add MCP Server**
4. 选择预设（如 Filesystem）或自定义配置
5. 等待服务器启动（状态变为 active）

## 测试场景

### Scenario 1: 使用预设添加服务器

**步骤：**
1. 点击 "+ Add MCP Server"
2. 选择 "📁 Filesystem"
3. 自动添加，状态显示 "active"
4. 点击 "View Tools" 查看可用工具

**预期结果：**
- 服务器成功添加
- 工具列表包含：read_file, write_file, list_directory 等

### Scenario 2: 在聊天中使用 MCP 工具

**前提：** 已添加 Filesystem 服务器

**步骤：**
1. 创建测试文件：`echo "Hello MCP" > /tmp/test.txt`
2. 在聊天中输入：`请读取 /tmp/test.txt 文件的内容`
3. AI 应该调用 `mcp:xxx:read_file` 工具
4. 返回文件内容

### Scenario 3: OAuth 服务器（需要配置）

**配置 Google Drive：**

1. 在 Google Cloud Console 创建 OAuth 应用
2. 设置环境变量：
   ```bash
   export GOOGLE_CLIENT_ID=your_client_id
   export GOOGLE_CLIENT_SECRET=your_client_secret
   ```
3. 重启后端服务器
4. 在 App 中选择 "📂 Google Drive" 预设
5. 浏览器打开授权页面
6. 授权后返回 App，状态变为 "active"

## API 测试

### 端到端测试

```bash
cd server/scripts
./test-mcp-e2e.sh
```

**测试内容：**
- ✅ 添加 MCP 服务器
- ✅ 列出所有工具（内置 + MCP）
- ✅ 执行 MCP 工具
- ✅ 查看统计
- ✅ 删除服务器

### 手动 API 测试

```bash
# 1. 添加服务器
curl -s http://localhost:8080/api/mcp/servers \
  -H "Authorization: Bearer 20250112Research" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Filesystem",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"]
  }' | jq .

# 2. 列出所有工具
curl -s http://localhost:8080/api/tools/list \
  -H "Authorization: Bearer 20250112Research" | jq .

# 3. 执行工具
curl -s http://localhost:8080/api/tool/exec \
  -H "Authorization: Bearer 20250112Research" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "mcp:xxx:read_file",
    "arguments": {"path": "/tmp/test.txt"},
    "config": {}
  }' | jq .
```

## 可用的预设服务器

| 预设 | 描述 | 需要配置 |
|------|------|----------|
| 📁 Filesystem | 读写本地文件 | 无 |
| 🔍 Brave Search | 网页搜索 | BRAVE_API_KEY |
| 🐙 GitHub | GitHub 仓库和 Issues | GITHUB_PERSONAL_ACCESS_TOKEN |
| 📂 Google Drive | Google Drive 文件（OAuth） | OAuth 配置 |
| 💬 Slack | Slack 消息 | SLACK_BOT_TOKEN |
| 🐘 PostgreSQL | PostgreSQL 数据库 | POSTGRES_CONNECTION_STRING |
| 🎭 Puppeteer | 浏览器自动化 | 无 |
| 💾 SQLite | SQLite 数据库 | 数据库路径 |

## 常见问题

### 1. 服务器启动失败

**检查：**
- npx 是否安装：`npx --version`
- 网络连接是否正常
- 查看后端日志

### 2. OAuth 回调失败

**检查：**
- callback_base_url 是否正确
- OAuth credentials 是否配置
- 重定向 URI 是否匹配

### 3. 工具执行失败

**检查：**
- 服务器状态是否为 "active"
- 工具参数是否正确
- 查看 `/api/tools/stats` 的错误信息

## 架构说明

### 工具命名规则

- 内置工具：`web_fetch`
- MCP 工具：`mcp:{server_id}:{tool_name}`

### 数据流

```
前端 → /api/tool/exec
     → ToolManager.execute_tool()
     → 判断工具类型
     → MCPManager.execute_tool() 或 BuiltInTools.execute()
     → 返回结果
```

### 持久化

- 服务器配置：SSM Parameter Store `/swiftchat/mcp/{server_id}/config`
- OAuth Tokens：SSM Parameter Store `/swiftchat/mcp/{server_id}/tokens`（加密）

## 下一步

- [ ] 添加更多预设服务器
- [ ] 优化 UI（图标、状态动画）
- [ ] 支持服务器编辑
- [ ] 添加工具使用统计
- [ ] 支持工具权限管理

