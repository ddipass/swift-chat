# 后台部署检查清单

## 📝 本次更新内容

### 新增文件
- `builtin_tools.py` - 内置工具（web_fetch）
- `tool_manager.py` - 工具管理器
- `tool_stats.py` - 工具统计
- `mcp_integration/` - MCP 集成模块
  - `__init__.py`
  - `manager.py` - MCP 管理器
  - `stdio_client.py` - stdio 传输
  - `http_client.py` - HTTP 传输
  - `oauth_mcp.py` - MCP OAuth
  - `oauth_traditional.py` - 传统 OAuth
  - `metadata.py` - OAuth 元数据发现
  - `storage.py` - 配置存储

### 修改文件
- `main.py` - 添加 MCP API 端点
- `requirements.txt` - 添加依赖
- `Dockerfile` - 添加 Node.js 和新文件

## 🔧 依赖变更

### requirements.txt
```diff
+ beautifulsoup4~=4.12.3  # web_fetch HTML 解析
+ mcp~=1.3.2              # MCP Python SDK
```

### Dockerfile
```diff
+ # Install Node.js for MCP servers (npx/uvx)
+ RUN apt-get update && apt-get install -y \
+     nodejs \
+     npm \
+     && rm -rf /var/lib/apt/lists/*

+ COPY tool_manager.py .
+ COPY builtin_tools.py .
+ COPY tool_stats.py .
+ COPY mcp_integration/ ./mcp_integration/
```

## ✅ 部署前检查

### 1. 文件完整性
```bash
cd server/src
ls -la builtin_tools.py tool_manager.py tool_stats.py
ls -la mcp_integration/
```

### 2. 依赖安装测试
```bash
pip install -r requirements.txt
python -c "import mcp; import bs4; print('Dependencies OK')"
```

### 3. 导入测试
```bash
python -c "from mcp_integration.manager import MCPManager; print('Imports OK')"
```

### 4. 语法检查
```bash
python -m py_compile main.py
python -m py_compile builtin_tools.py
python -m py_compile tool_manager.py
python -m py_compile mcp_integration/*.py
```

## 🚀 部署步骤

### 方式 1: 使用现有脚本

```bash
cd server/scripts
bash ./push-to-ecr.sh
```

按提示选择：
- ECR repository: `swift-chat-api` (或你的名称)
- Image tag: `latest`
- Region: 你的部署区域
- Deployment type: AppRunner 或 Lambda

### 方式 2: 手动部署

#### Step 1: 构建镜像
```bash
cd server/src
docker build -t swift-chat-api:latest .
```

#### Step 2: 推送到 ECR
```bash
# 登录 ECR
aws ecr get-login-password --region us-west-2 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-west-2.amazonaws.com

# 标记镜像
docker tag swift-chat-api:latest \
  <account-id>.dkr.ecr.us-west-2.amazonaws.com/swift-chat-api:latest

# 推送
docker push <account-id>.dkr.ecr.us-west-2.amazonaws.com/swift-chat-api:latest
```

#### Step 3: 更新服务

**App Runner:**
```bash
# 在 App Runner 控制台点击 "Deploy"
# 或使用 CLI
aws apprunner start-deployment --service-arn <service-arn>
```

**Lambda:**
```bash
# 在 Lambda 控制台点击 "Deploy new image"
# 或使用 CLI
aws lambda update-function-code \
  --function-name <function-name> \
  --image-uri <account-id>.dkr.ecr.us-west-2.amazonaws.com/swift-chat-api:latest
```

## 🧪 部署后验证

### 1. 健康检查
```bash
curl https://your-api-url.com/
# 应返回: {"status":"ok","service":"SwiftChat API"}
```

### 2. MCP API 测试
```bash
# 列出 MCP 服务器
curl https://your-api-url.com/api/mcp/servers \
  -H "Authorization: Bearer YOUR_API_KEY"

# 应返回: {"servers":[]}
```

### 3. 工具 API 测试
```bash
# 获取工具列表
curl https://your-api-url.com/api/tools/list \
  -H "Authorization: Bearer YOUR_API_KEY"

# 应返回包含 web_fetch 的工具列表
```

### 4. Web Fetch 测试
```bash
# 测试 web_fetch 工具
curl -X POST https://your-api-url.com/api/tool/exec \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "web_fetch",
    "arguments": {"url": "https://example.com"},
    "config": {"mode": "regex"}
  }'

# 应返回提取的网页内容
```

## ⚠️ 注意事项

### 1. Node.js 依赖
- Dockerfile 中添加了 Node.js 和 npm
- 用于运行 MCP stdio 服务器（如 `uvx awslabs.core-mcp-server@latest`）
- 镜像大小会增加约 50-100MB

### 2. 环境变量
确保以下环境变量已配置：
- `API_KEY_NAME` - SSM Parameter Store 中的 API Key 名称
- `PORT` - 服务端口（默认 8080）

### 3. IAM 权限
确保服务角色有以下权限：
- `ssm:GetParameter` - 读取 API Key
- `bedrock:InvokeModel` - AI Summary 功能
- `bedrock-runtime:InvokeModel` - 聊天功能

### 4. 存储
MCP 配置存储在 `/tmp/mcp_storage.json`
- Lambda: 每次冷启动会丢失
- App Runner: 重启会丢失
- 建议：未来可以迁移到 S3 或 DynamoDB

## 🐛 常见问题

### 问题 1: 导入错误
```
ModuleNotFoundError: No module named 'mcp'
```
**解决：** 确保 `mcp~=1.3.2` 在 requirements.txt 中

### 问题 2: MCP 目录未找到
```
FileNotFoundError: mcp_integration
```
**解决：** 检查 Dockerfile 中 `COPY mcp_integration/ ./mcp_integration/`

### 问题 3: Node.js 未安装
```
FileNotFoundError: [Errno 2] No such file or directory: 'uvx'
```
**解决：** 确保 Dockerfile 中安装了 Node.js

## 📊 回滚计划

如果部署后出现问题：

### App Runner
```bash
# 回滚到上一个版本
aws apprunner start-deployment \
  --service-arn <service-arn> \
  --source-configuration ImageRepository={ImageIdentifier=<previous-image>}
```

### Lambda
```bash
# 回滚到上一个版本
aws lambda update-function-code \
  --function-name <function-name> \
  --image-uri <previous-image-uri>
```

## ✅ 部署完成确认

- [ ] 镜像构建成功
- [ ] 镜像推送到 ECR
- [ ] 服务更新完成
- [ ] 健康检查通过
- [ ] MCP API 可访问
- [ ] 工具 API 可访问
- [ ] Web Fetch 测试通过
- [ ] 前端可以连接

## 📝 版本信息

- **更新日期**: 2025-12-11
- **主要功能**: MCP 集成 + 内置工具
- **依赖变更**: +2 (beautifulsoup4, mcp)
- **新增文件**: 11 个
- **修改文件**: 3 个
