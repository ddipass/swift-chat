# Backend Tools 快速启动

## 1. 安装依赖

```bash
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r src/requirements.txt
```

## 2. 测试（可选）

```bash
python test_backend.py
```

应该看到：
```
✅ 成功!
URL: https://example.com
文本长度: 142
```

## 3. 启动服务器

### 基础启动（只有web_fetch）

```bash
cd src
python main.py
```

服务器启动在 `http://localhost:8080`

### 启动with MCP stdio（推荐）

```bash
# 示例：Notion MCP
export MCP_SERVERS="notion:stdio:npx:-y:@modelcontextprotocol/server-notion"
export NOTION_API_KEY="secret_xxx"

cd src
python main.py
```

### 启动with多个MCP服务器

```bash
export MCP_SERVERS="notion:stdio:npx:-y:@modelcontextprotocol/server-notion;fs:stdio:npx:-y:@modelcontextprotocol/server-filesystem:/path/to/dir"
export NOTION_API_KEY="secret_xxx"

cd src
python main.py
```

## 4. 测试API

### 列出工具

```bash
curl -X POST http://localhost:8080/api/tools \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 执行web_fetch

```bash
curl -X POST http://localhost:8080/api/tool/exec \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "web_fetch",
    "arguments": {
      "url": "https://example.com",
      "mode": "regex"
    }
  }'
```

## 5. 配置客户端

在SwiftChat App中：
1. Settings → Amazon Bedrock → SwiftChat Server
2. 配置：
   - API URL: `http://localhost:8080`
   - API Key: `your-api-key`
3. 保存

## 6. 使用

在Chat中直接使用：

```
用户: 帮我获取 https://example.com 的内容

AI: [自动调用 web_fetch 工具]
结果: Example Domain...
```

如果配置了Notion MCP：

```
用户: 搜索我的Notion中关于"项目"的页面

AI: [自动调用 notion_search 工具]
结果: 找到3个页面...
```

## 故障排查

### 问题1: ModuleNotFoundError

**解决:** 确保在虚拟环境中
```bash
source venv/bin/activate
pip install -r src/requirements.txt
```

### 问题2: MCP工具不显示

**检查:**
1. `MCP_SERVERS` 环境变量是否正确？
2. `npx` 命令是否可用？（需要Node.js）
3. MCP包是否存在？

**测试:**
```bash
npx -y @modelcontextprotocol/server-notion
```

### 问题3: 客户端连接失败

**检查:**
1. 服务器是否运行？
2. API URL是否正确？
3. API Key是否匹配？

## 环境变量参考

| 变量 | 说明 | 示例 |
|------|------|------|
| MCP_SERVERS | MCP服务器配置 | `name:stdio:cmd:args` |
| NOTION_API_KEY | Notion API密钥 | `secret_xxx` |
| GITHUB_TOKEN | GitHub Token | `ghp_xxx` |
| PORT | 服务器端口 | `8080` |

## MCP服务器示例

### Notion
```bash
export MCP_SERVERS="notion:stdio:npx:-y:@modelcontextprotocol/server-notion"
export NOTION_API_KEY="secret_xxx"
```

### Filesystem
```bash
export MCP_SERVERS="fs:stdio:npx:-y:@modelcontextprotocol/server-filesystem:/home/user/docs"
```

### GitHub
```bash
export MCP_SERVERS="github:stdio:npx:-y:@modelcontextprotocol/server-github"
export GITHUB_TOKEN="ghp_xxx"
```

### 多个服务器（分号分隔）
```bash
export MCP_SERVERS="notion:stdio:npx:-y:@modelcontextprotocol/server-notion;fs:stdio:npx:-y:@modelcontextprotocol/server-filesystem:/docs"
export NOTION_API_KEY="secret_xxx"
```

## 完整示例

```bash
# 1. 设置环境
cd server
python3 -m venv venv
source venv/bin/activate
pip install -r src/requirements.txt

# 2. 配置MCP
export MCP_SERVERS="notion:stdio:npx:-y:@modelcontextprotocol/server-notion"
export NOTION_API_KEY="secret_xxx"

# 3. 启动服务器
cd src
python main.py

# 4. 在另一个终端测试
curl -X POST http://localhost:8080/api/tools \
  -H "Authorization: Bearer test-key" \
  -H "Content-Type: application/json" \
  -d '{}'

# 5. 配置App并使用
```

完成！现在可以在SwiftChat中使用后端工具了。
