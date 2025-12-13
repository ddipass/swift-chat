# MCP Deployment Guide

## ✅ 部署准备检查

### 后端修改
- [x] `Dockerfile` - 添加 Node.js 支持和 mcp/ 目录
- [x] `tool_manager.py` - 集成 MCP 工具路由
- [x] `main.py` - 添加 MCP API 端点
- [x] `mcp/` 模块 - 完整实现

### 前端修改
- [x] `MCPClient.ts` - API 客户端
- [x] `MCPServersScreen.tsx` - 管理界面
- [x] `MCPPresets.ts` - 预设配置
- [x] 路由和导航集成

## 部署方法

### 方法 1: 使用现有部署脚本

现有的部署脚本**完全兼容** MCP 功能，只需要：

```bash
cd server/scripts

# 构建并推送到 ECR
./push-to-ecr.sh

# 部署到 App Runner
./deploy-apprunner.sh
# 或
./deploy-apprunner-no-docker.sh
```

### 方法 2: 手动部署

#### 1. 构建 Docker 镜像

```bash
cd server/src
docker build -t swift-chat-api:latest .
```

#### 2. 推送到 ECR

```bash
# 登录 ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# 标记镜像
docker tag swift-chat-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/swift-chat-api:latest

# 推送
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/swift-chat-api:latest
```

#### 3. 更新 App Runner

在 App Runner 控制台点击 "Deploy" 按钮，或使用 CLI：

```bash
aws apprunner start-deployment \
  --service-arn <service-arn> \
  --region us-east-1
```

## Dockerfile 变更说明

### 新增内容

```dockerfile
# Install Node.js for MCP servers (npx)
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Copy MCP module
COPY mcp/ ./mcp/
```

### 为什么需要 Node.js？

MCP 服务器大多是 npm 包，通过 `npx` 运行。例如：
- `npx @modelcontextprotocol/server-filesystem`
- `npx @modelcontextprotocol/server-brave-search`

## 环境变量配置

### 必需的环境变量

- `API_KEY_NAME` - SSM Parameter Store 中的 API Key 名称
- `PORT` - 服务器端口（默认 8080）

### OAuth 可选环境变量

如果要使用 OAuth MCP 服务器（如 Google Drive），需要配置：

```bash
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
```

可以在 App Runner 服务配置中添加这些环境变量。

## 测试部署

### 1. 本地测试

```bash
cd server/scripts
./test-mcp-simple.sh
```

### 2. 远程测试

```bash
export API_URL=https://your-apprunner-url.awsapprunner.com
export API_KEY=your_api_key
./test-mcp-simple.sh
```

### 3. 添加 MCP 服务器

```bash
curl -X POST ${API_URL}/api/mcp/servers \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Filesystem",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"]
  }'
```

## 常见问题

### 1. Docker 镜像构建失败

**问题**: Node.js 安装失败

**解决**: 确保使用 Debian/Ubuntu 基础镜像，当前使用 `python:3.12.0-slim-bullseye`

### 2. MCP 服务器启动超时

**问题**: `npx` 首次下载包需要时间

**解决**: 
- 增加超时时间（已设置为 30 秒）
- 或在 Dockerfile 中预安装常用 MCP 包

### 3. OAuth 回调失败

**问题**: callback_base_url 不正确

**解决**: 
- 确保 `callback_base_url` 设置为 App Runner URL
- 在 OAuth provider 中配置正确的重定向 URI

## 镜像大小优化（可选）

当前 Dockerfile 会增加约 200MB（Node.js + npm）。如果需要优化：

### 方案 1: 使用 Node.js Alpine

```dockerfile
FROM node:18-alpine as node
FROM python:3.12.0-slim-bullseye
COPY --from=node /usr/local/bin/node /usr/local/bin/
COPY --from=node /usr/local/bin/npm /usr/local/bin/
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
```

### 方案 2: 预安装常用 MCP 包

```dockerfile
RUN npm install -g \
    @modelcontextprotocol/server-filesystem \
    @modelcontextprotocol/server-brave-search
```

## 回滚方案

如果部署后出现问题，可以快速回滚：

```bash
# 方法 1: App Runner 控制台
# 在 "Deployments" 标签中选择之前的版本，点击 "Rollback"

# 方法 2: 使用之前的镜像标签
aws apprunner update-service \
  --service-arn <service-arn> \
  --source-configuration ImageRepository={ImageIdentifier=<old-image-uri>}
```

## 监控和日志

### CloudWatch Logs

App Runner 自动将日志发送到 CloudWatch Logs：

```bash
aws logs tail /aws/apprunner/swiftchat-api --follow
```

### 关键指标

- MCP 服务器启动时间
- 工具调用成功率（`/api/tools/stats`）
- OAuth token 刷新频率

## 下一步

- [ ] 配置 CloudWatch Alarms
- [ ] 设置自动扩展策略
- [ ] 添加 MCP 服务器健康检查
- [ ] 实现 MCP 服务器自动重启
- [ ] 优化镜像大小
