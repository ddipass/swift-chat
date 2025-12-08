# Backend Tools 使用指南

## 概述

SwiftChat现在支持在后端运行工具，包括：
- **MCP Tools** (stdio和OAuth两种方式)
- **web_fetch** (网页抓取)

## 架构

```
App → Backend API → Tool Manager
                        ├─ MCP Manager (stdio/OAuth)
                        └─ Built-in Tools (web_fetch)
```

---

## 后端配置

### 1. 环境变量配置

**MCP_SERVERS** - 配置MCP服务器（分号分隔）

格式：`name:transport:command:args`

**示例：**

```bash
# Notion MCP (stdio)
export MCP_SERVERS="notion:stdio:npx:-y:@modelcontextprotocol/server-notion"

# 多个服务器
export MCP_SERVERS="notion:stdio:npx:-y:@modelcontextprotocol/server-notion;filesystem:stdio:npx:-y:@modelcontextprotocol/server-filesystem:/allowed/path"
```

**Notion API Key:**
```bash
export NOTION_API_KEY="your-notion-api-key"
```

### 2. 启动后端

```bash
cd server/src
pip install -r requirements.txt
python main.py
```

后端会自动：
1. 启动配置的MCP服务器（stdio进程）
2. 初始化web_fetch工具
3. 暴露 `/api/tools` 和 `/api/tool/exec` 端点

---

## 客户端配置

### 自动检测

客户端会自动检测是否使用后端工具：

- ✅ **有配置 API URL + API Key** → 使用后端工具
- ❌ **没有配置** → 使用客户端工具（兼容模式）

### 配置步骤

1. 打开 SwiftChat App
2. 进入 Settings → Amazon Bedrock → SwiftChat Server
3. 配置：
   - API URL: `https://your-backend-url.com`
   - API Key: `your-api-key`

配置后，所有工具调用会自动路由到后端。

---

## 支持的工具

### 1. web_fetch

**描述:** 获取网页内容并清理HTML

**参数:**
- `url` (string, required): 要抓取的URL
- `mode` (string, optional): 处理模式
  - `regex`: 使用正则清理（快速）
  - `ai_summary`: AI总结（详细）

**示例:**
```json
{
  "name": "web_fetch",
  "arguments": {
    "url": "https://example.com",
    "mode": "regex"
  }
}
```

**返回:**
```json
{
  "url": "https://example.com",
  "text": "清理后的文本内容...",
  "truncated": false,
  "length": 12345,
  "mode": "regex"
}
```

### 2. MCP Tools (stdio)

**支持的MCP服务器:**
- `@modelcontextprotocol/server-notion` - Notion集成
- `@modelcontextprotocol/server-filesystem` - 文件系统访问
- `@modelcontextprotocol/server-github` - GitHub集成
- 其他支持stdio的MCP服务器

**配置示例:**
```bash
# Notion
export MCP_SERVERS="notion:stdio:npx:-y:@modelcontextprotocol/server-notion"
export NOTION_API_KEY="secret_xxx"

# Filesystem
export MCP_SERVERS="fs:stdio:npx:-y:@modelcontextprotocol/server-filesystem:/home/user/documents"

# GitHub
export MCP_SERVERS="github:stdio:npx:-y:@modelcontextprotocol/server-github"
export GITHUB_TOKEN="ghp_xxx"
```

### 3. MCP Tools (OAuth)

**配置示例:**
```bash
# 暂不支持通过环境变量配置OAuth
# 需要在代码中手动添加
```

---

## API参考

### POST /api/tools

获取所有可用工具

**请求:**
```json
{
  "Authorization": "Bearer your-api-key"
}
```

**响应:**
```json
{
  "tools": [
    {
      "name": "web_fetch",
      "description": "Fetch and extract content from a web page",
      "inputSchema": {...},
      "source": "builtin"
    },
    {
      "name": "notion_search",
      "description": "Search Notion pages",
      "inputSchema": {...},
      "source": "mcp",
      "server": "notion"
    }
  ]
}
```

### POST /api/tool/exec

执行工具

**请求:**
```json
{
  "name": "web_fetch",
  "arguments": {
    "url": "https://example.com",
    "mode": "regex"
  }
}
```

**响应:**
```json
{
  "success": true,
  "result": {
    "url": "https://example.com",
    "text": "...",
    "truncated": false
  }
}
```

**错误响应:**
```json
{
  "success": false,
  "error": "Tool not found"
}
```

---

## 部署

### Docker部署

**Dockerfile:**
```dockerfile
FROM python:3.11-slim

# 安装Node.js (for npx)
RUN apt-get update && apt-get install -y nodejs npm

WORKDIR /app
COPY server/src/requirements.txt .
RUN pip install -r requirements.txt

COPY server/src/ .

# 环境变量
ENV MCP_SERVERS="notion:stdio:npx:-y:@modelcontextprotocol/server-notion"
ENV NOTION_API_KEY=""
ENV PORT=8080

CMD ["python", "main.py"]
```

**构建和运行:**
```bash
docker build -t swiftchat-backend .
docker run -p 8080:8080 \
  -e NOTION_API_KEY="secret_xxx" \
  swiftchat-backend
```

### AWS App Runner部署

1. 推送Docker镜像到ECR
2. 在App Runner中配置环境变量：
   - `MCP_SERVERS`
   - `NOTION_API_KEY`
   - 其他MCP服务器需要的环境变量

---

## 故障排查

### 工具列表为空

**检查:**
1. 后端是否正常启动？
2. 环境变量是否正确配置？
3. MCP服务器是否成功启动？

**查看日志:**
```bash
# 后端日志会显示MCP服务器启动信息
python main.py
```

### 工具执行失败

**检查:**
1. 工具参数是否正确？
2. MCP服务器是否有权限？
3. API Key是否有效？

**调试:**
```bash
# 直接测试API
curl -X POST http://localhost:8080/api/tools \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### stdio MCP服务器无法启动

**常见原因:**
1. `npx` 命令不可用 → 安装Node.js
2. MCP包不存在 → 检查包名
3. 环境变量缺失 → 检查NOTION_API_KEY等

---

## 优势

### vs 客户端工具

| 特性 | 后端工具 | 客户端工具 |
|------|---------|-----------|
| MCP stdio | ✅ 支持 | ❌ 不支持 |
| 性能 | ✅ 更好 | ⚠️ 一般 |
| 隔离性 | ✅ 进程隔离 | ❌ 同进程 |
| 部署 | ⚠️ 需要后端 | ✅ 无需后端 |
| 隐私 | ⚠️ 经过后端 | ✅ 本地处理 |

### 推荐使用场景

**使用后端工具：**
- ✅ 需要MCP stdio支持
- ✅ 需要统一管理工具
- ✅ 有后端部署能力

**使用客户端工具：**
- ✅ 注重隐私
- ✅ 无后端部署
- ✅ 简单场景

---

## 示例

### 完整示例：Notion搜索

**1. 配置后端:**
```bash
export MCP_SERVERS="notion:stdio:npx:-y:@modelcontextprotocol/server-notion"
export NOTION_API_KEY="secret_xxx"
python main.py
```

**2. 配置客户端:**
- API URL: `http://localhost:8080`
- API Key: `your-api-key`

**3. 在Chat中使用:**
```
用户: 搜索我的Notion中关于"项目计划"的页面

AI: 让我搜索一下...
[调用 notion_search 工具]

结果: 找到3个相关页面...
```

工具会自动通过后端执行，使用stdio与Notion MCP服务器通信。

---

## 下一步

- [ ] 添加更多MCP服务器支持
- [ ] 支持OAuth MCP配置
- [ ] 添加工具执行监控
- [ ] 添加工具缓存机制
