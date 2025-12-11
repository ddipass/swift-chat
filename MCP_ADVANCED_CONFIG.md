# MCP Advanced Configuration Guide

## 新增功能

### 用户可配置参数

#### 1. ⏱️ Timeout Settings（超时设置）

**Initialization Timeout（初始化超时）**
- 默认值：60 秒
- 范围：30-120 秒
- 说明：等待 MCP 服务器启动的时间。首次运行可能需要下载包（30-60秒）
- 提示：如果服务器启动失败，尝试增加此值

**Tool Execution Timeout（工具执行超时）**
- 默认值：30 秒
- 范围：10-120 秒
- 说明：单个工具调用的最大时间
- 提示：对于慢速操作（如大文件处理），增加此值

#### 2. 🔄 Auto Restart（自动重启）

**Enable Auto Restart（启用自动重启）**
- 默认值：开启
- 说明：服务器崩溃时自动重启
- 提示：建议保持开启以提高可靠性

**Max Restarts（最大重启次数）**
- 默认值：3 次
- 范围：1-10 次
- 说明：达到此次数后停止重启
- 提示：防止无限重启循环

**Restart Delay（重启延迟）**
- 默认值：5 秒
- 范围：1-30 秒
- 说明：重启前等待时间
- 提示：给服务器清理资源的时间

#### 3. 📁 Working Directory（工作目录）

**Working Directory**
- 默认值：空（使用系统默认）
- 说明：MCP 服务器的工作目录
- 示例：
  - Filesystem: `/tmp` 或 `/Users/xxx/Documents`
  - SQLite: 数据库文件所在目录
- 提示：留空使用默认值，文件系统工具必须指定

#### 4. 🔐 Environment Variables（环境变量）

**动态环境变量编辑器**
- 支持添加/删除/编辑环境变量
- 自动识别敏感字段（KEY, TOKEN, SECRET）并隐藏输入
- 必需变量标记为 *required，不可删除
- 常见环境变量：
  - `BRAVE_API_KEY` - Brave Search API 密钥
  - `GITHUB_PERSONAL_ACCESS_TOKEN` - GitHub 访问令牌
  - `SLACK_BOT_TOKEN` - Slack 机器人令牌
  - `POSTGRES_CONNECTION_STRING` - PostgreSQL 连接字符串
  - `FASTMCP_LOG_LEVEL` - 日志级别（ERROR/INFO/DEBUG）

#### 5. 📝 Logging（日志）

**Log Level（日志级别）**
- ERROR（推荐）：仅显示错误
- INFO：一般信息
- DEBUG（详细）：调试信息，输出详细
- 提示：生产环境使用 ERROR，调试时使用 DEBUG

**Enable Debug Mode（启用调试模式）**
- 默认值：关闭
- 说明：显示详细日志用于故障排查
- 提示：可能影响性能，仅在需要时开启

## 预设配置

### AWS Labs Core MCP
```
Icon: ☁️
Command: uvx awslabs.core-mcp-server@latest
Timeout: 60s (首次下载需要时间)
Tool Timeout: 30s
Auto Restart: 开启
Tips: 首次运行可能需要 30-60 秒下载包
```

### Filesystem
```
Icon: 📁
Command: npx -y @modelcontextprotocol/server-filesystem /tmp
Timeout: 30s
Working Directory: /tmp
Tips: 修改 /tmp 为你想要的目录路径
```

### Brave Search
```
Icon: 🔍
Command: npx -y @modelcontextprotocol/server-brave-search
Required Env: BRAVE_API_KEY
Timeout: 30s
Tool Timeout: 15s
Tips: 从 https://brave.com/search/api/ 获取 API 密钥
```

### GitHub
```
Icon: 🐙
Command: npx -y @modelcontextprotocol/server-github
Required Env: GITHUB_PERSONAL_ACCESS_TOKEN
Timeout: 30s
Tool Timeout: 20s
Tips: 在 https://github.com/settings/tokens 创建令牌
```

### Puppeteer
```
Icon: 🎭
Command: npx -y @modelcontextprotocol/server-puppeteer
Timeout: 45s (首次下载 Chromium)
Tool Timeout: 60s
Tips: 首次运行下载 Chromium (~170MB)
```

## UI 流程

### 添加服务器流程

1. **选择预设**
   ```
   MCP Servers → + Add MCP Server
   → 选择预设（如 AWS Labs Core）
   ```

2. **基础配置**
   ```
   📋 Basic Configuration
   - Server Name: [AWS Labs Core MCP]
   - Command: [uvx]
   - Arguments: [awslabs.core-mcp-server@latest]
   ```

3. **环境变量**（如需要）
   ```
   🔐 Environment Variables
   [+ Add] 按钮添加变量
   
   FASTMCP_LOG_LEVEL = ERROR [×]
   ```

4. **高级设置**（可选，折叠）
   ```
   ⚙️ Advanced Settings [▶]
   
   展开后显示：
   - ⏱️ Timeout Settings
   - 🔄 Auto Restart
   - 📁 Working Directory
   - 📝 Logging
   ```

5. **保存**
   ```
   点击右上角 ✓ 保存
   → 服务器开始启动
   → 状态显示 "active"
   ```

## 常见配置场景

### 场景 1: 快速测试（使用默认值）
```
1. 选择预设
2. 填写必需的环境变量（如有）
3. 直接保存
```

### 场景 2: 生产环境（优化配置）
```
1. 选择预设
2. 填写环境变量
3. 展开高级设置：
   - Log Level: ERROR
   - Enable Debug: 关闭
   - Auto Restart: 开启
   - Max Restarts: 5
4. 保存
```

### 场景 3: 调试问题（详细日志）
```
1. 选择预设
2. 展开高级设置：
   - Log Level: DEBUG
   - Enable Debug: 开启
   - Initialization Timeout: 120s
3. 保存并查看日志
```

### 场景 4: 文件系统工具
```
1. 选择 Filesystem 预设
2. 修改 Arguments: 
   从 /tmp 改为 /Users/xxx/Documents
3. 设置 Working Directory: /Users/xxx/Documents
4. 保存
```

## 故障排查

### 问题 1: 服务器启动超时
**症状**: 状态一直显示 "pending"
**解决**:
1. 增加 Initialization Timeout 到 90-120 秒
2. 检查网络连接（首次需要下载包）
3. 启用 Debug Mode 查看详细日志

### 问题 2: 工具调用失败
**症状**: 工具执行返回错误
**解决**:
1. 检查环境变量是否正确填写
2. 增加 Tool Execution Timeout
3. 查看 Working Directory 是否正确

### 问题 3: 服务器频繁重启
**症状**: 状态在 active 和 error 之间切换
**解决**:
1. 启用 Debug Mode 查看错误原因
2. 检查环境变量和权限
3. 减少 Max Restarts 避免资源浪费

### 问题 4: 环境变量不生效
**症状**: 工具提示缺少 API Key
**解决**:
1. 确认变量名称正确（区分大小写）
2. 确认变量值已填写且无空格
3. 删除服务器重新添加

## 最佳实践

### 1. 命名规范
- 使用描述性名称：`AWS Labs Core MCP` 而不是 `Server 1`
- 包含用途：`GitHub - Personal Repos`

### 2. 环境变量管理
- 使用环境变量而不是硬编码
- 定期轮换 API Keys
- 不要在截图中暴露敏感信息

### 3. 超时设置
- 首次运行：60-120 秒
- 稳定运行：30-60 秒
- 快速工具：10-20 秒
- 慢速工具：60-120 秒

### 4. 日志管理
- 开发/测试：DEBUG
- 生产环境：ERROR
- 故障排查：临时开启 DEBUG

### 5. 自动重启
- 始终开启 Auto Restart
- Max Restarts: 3-5 次
- Restart Delay: 5-10 秒

## 后端支持

后端已支持所有高级配置参数：

```python
# mcp/manager.py
config = {
    "name": "...",
    "command": "...",
    "args": [...],
    "env": {...},
    "timeout": 60,
    "toolTimeout": 30,
    "autoRestart": True,
    "maxRestarts": 3,
    "restartDelay": 5,
    "workingDirectory": "/tmp",
    "logLevel": "ERROR",
    "enableDebug": False
}
```

这些参数会传递给 MCP 客户端并在服务器启动和工具执行时使用。
