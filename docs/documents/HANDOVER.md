# SwiftChat MCP 集成 - 快速交接文档

## 🎯 当前状态

### ✅ 已完成
- stdio MCP 服务器支持 (AWS Labs Core 测试通过)
- MCP OAuth 2.1 动态客户端注册 + PKCE
- 前端 UI 和 9 个预设配置
- API 端点完整实现

### 🚧 进行中
- Notion MCP 集成 (使用 MCP SDK)

### ❌ 阻塞问题
**MCP SDK 异步作用域错误**:
```
RuntimeError: Attempted to exit cancel scope in a different task than it was entered in
```

## 🔥 紧急任务

### 修复 Notion MCP (最高优先级)

**问题**: MCP SDK 的 `streamablehttp_client` 在 FastAPI 请求中无法正常工作

**位置**: `server/src/mcp_integration/manager.py` 第 74-120 行

**解决方案选项**:

#### 方案 A: 应用级客户端池 (推荐)
```python
# 在 main.py 启动时
@app.on_event("startup")
async def startup():
    app.state.mcp_clients = {}

# 在 manager.py 中
async def _start_server(self, server_id, config):
    # 创建后台任务
    task = asyncio.create_task(self._connect_client(server_id, config))
    # 保存任务引用
    self.tasks[server_id] = task
```

#### 方案 B: 使用 BackgroundTasks
```python
from fastapi import BackgroundTasks

@app.post("/api/mcp/servers")
async def add_mcp_server(request: MCPServerRequest, background_tasks: BackgroundTasks):
    server_id = generate_id()
    background_tasks.add_task(mcp_manager.connect_server, server_id, config)
    return {"server_id": server_id, "status": "connecting"}
```

#### 方案 C: 修复自定义 SSE 客户端
参考 MCP SDK 源码，修复 `mcp_integration/sse_client.py` 的兼容性问题

**参考代码**:
- [MCP SDK Python 客户端](https://github.com/invariantlabs-ai/mcp-streamable-http/blob/main/python-example/client/client.py)
- [MCP SDK 源码](https://github.com/modelcontextprotocol/python-sdk/blob/main/src/mcp/client/streamable_http.py)

## 📁 关键文件

### 需要修改
1. `server/src/mcp_integration/manager.py` - 重构异步流程
2. `server/src/mcp_integration/streamable_client.py` - 修复 MCP SDK 集成
3. `server/src/main.py` - 可能需要添加应用级状态管理

### 已完成 (稳定)
- `server/src/mcp_integration/client.py` - stdio 客户端 ✅
- `server/src/mcp_integration/mcp_oauth.py` - MCP OAuth ✅
- `server/src/mcp_integration/storage.py` - 存储 ✅
- `react-native/src/tools/MCP*.tsx` - 前端 UI ✅

## 🧪 测试命令

### 启动服务器
```bash
cd server && source venv/bin/activate && cd src
export LOCAL_API_KEY=test_key
python3 main.py
```

### 测试 stdio (工作正常)
```bash
curl -X POST http://localhost:8080/api/mcp/servers \
  -H "Authorization: Bearer test_key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "AWS Labs Core",
    "command": "uvx",
    "args": ["awslabs.core-mcp-server@latest"],
    "timeout": 60
  }'
```

### 测试 Notion (需要修复)
```bash
curl -X POST http://localhost:8080/api/mcp/servers \
  -H "Authorization: Bearer test_key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Notion",
    "command": "sse",
    "args": ["https://mcp.notion.com/mcp"],
    "callback_base_url": "http://localhost:8080"
  }'
```

## 📚 重要文档

1. **完整指南**: `MCP_INTEGRATION_GUIDE.md` - 详细架构和技术细节
2. **OAuth 文档**: `MCP_OAUTH_COMPLETE.md` - OAuth 实现说明
3. **测试文档**: `MCP_OAUTH_TEST.md` - 测试流程

## 🔧 环境设置

### Python 依赖
```bash
pip install mcp==1.23.3  # MCP SDK (已安装)
```

### 重要变更
- ⚠️ 模块重命名: `mcp/` → `mcp_integration/` (避免与 MCP SDK 冲突)
- ⚠️ 所有导入已更新

## 💡 快速提示

### 调试 MCP SDK
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### 查看 MCP SDK 源码
```bash
cd server/venv/lib/python3.13/site-packages/mcp/client/
cat streamable_http.py
```

### 测试异步上下文
```python
# 正确的用法
async def test():
    async with streamablehttp_client(url, headers) as (r, w, _):
        session = ClientSession(r, w)
        async with session:
            await session.initialize()
            # 所有操作必须在这个上下文中
```

## 🎓 学习资源

- [MCP 规范](https://modelcontextprotocol.io/specification/2025-03-26)
- [FastAPI 后台任务](https://fastapi.tiangolo.com/tutorial/background-tasks/)
- [Python asyncio](https://docs.python.org/3/library/asyncio.html)

## 📞 下一步

1. 阅读 `MCP_INTEGRATION_GUIDE.md` 了解完整架构
2. 选择一个解决方案 (推荐方案 A)
3. 修改 `manager.py` 实现新的异步流程
4. 测试 Notion MCP OAuth 完整流程
5. 实现 token 刷新机制

---

**祝好运！** 🚀

如有问题，参考完整文档或查看 GitHub Issues。
