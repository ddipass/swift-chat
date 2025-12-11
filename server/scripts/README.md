# SwiftChat 部署脚本

## 🚀 快速部署

### 一键部署（推荐）

```bash
cd server/scripts
bash ./deploy.sh
```

脚本会自动：
- 检测 Docker 是否可用
- 有 Docker：本地构建（更快）
- 无 Docker：使用 CodeBuild 云端构建
- 自动创建/更新 ECR、S3、CloudFormation
- 生成或使用现有 API Key

### 部署模式

**模式 1: 本地 Docker 构建**
- 需要：Docker Desktop 运行中
- 优点：构建快（1-2 分钟）
- 适合：开发环境、快速迭代

**模式 2: 云端 CodeBuild**
- 需要：仅需 AWS CLI
- 优点：无需本地 Docker
- 适合：生产环境、CI/CD

## 📋 其他脚本

### 测试脚本
- `test-api.sh` - 测试已部署的 API
- `test-local.sh` - 本地测试
- `test-mcp.sh` - MCP 功能测试
- `test-mcp-simple.sh` - 简单 MCP 测试
- `test-mcp-e2e.sh` - 端到端 MCP 测试

### 清理脚本
- `cleanup-deployment.sh` - 清理所有 AWS 资源

## 🔧 部署后

部署完成后会显示：
```
API URL: https://xxx.us-west-2.awsapprunner.com
API Key: xxxxxxxxxx
```

在 SwiftChat 应用中配置：
1. 打开 Settings → Tools Settings
2. 输入 Backend URL 和 API Key
3. 保存并开始使用

## ✨ 已部署功能

- ✅ MCP (Model Context Protocol) 集成
- ✅ 内置 web_fetch 工具
- ✅ 支持 stdio 和 OAuth MCP 服务器
- ✅ Node.js 运行时（用于 MCP stdio 服务器）

## 📝 依赖

- AWS CLI (已配置)
- Docker (可选，用于本地构建)
- jq (可选，用于测试脚本)
