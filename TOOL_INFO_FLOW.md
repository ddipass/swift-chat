# 工具信息流转机制

## 完整流程

```
1. MCP Server 启动
   ↓
2. 调用 tools/list 获取工具定义
   ↓
3. 存储到 MCPServer.tools
   ↓
4. tool_manager.list_tools() 收集所有工具
   ↓
5. 转换为 Bedrock toolConfig 格式
   ↓
6. 发送给 AI 模型
   ↓
7. AI 决定调用哪个工具
   ↓
8. 后端执行工具
   ↓
9. 返回结果给 AI
```

## 详细说明

### 1. MCP Server 启动时获取工具列表

**代码位置：** `server/src/mcp_manager.py`

```python
async def _start_stdio(self):
    """启动stdio transport"""
    # 启动子进程
    self.process = await asyncio.create_subprocess_exec(...)
    
    # 初始化：获取工具列表
    response = await self._send_stdio_request({
        "method": "tools/list",  # 调用 MCP 协议的 tools/list
        "params": {}
    })
    
    # 解析工具定义
    if "result" in response and "tools" in response["result"]:
        for tool_data in response["result"]["tools"]:
            tool = MCPTool(
                name=tool_data["name"],              # 工具名称
                description=tool_data["description"], # 工具描述
                input_schema=tool_data["inputSchema"] # 参数定义
            )
            self.tools.append(tool)
```

**Perplexity MCP Server 返回的工具示例：**
```json
{
  "result": {
    "tools": [
      {
        "name": "perplexity_search",
        "description": "Search the web using Perplexity AI...",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": {"type": "string", "description": "Search query"}
          },
          "required": ["query"]
        }
      },
      {
        "name": "perplexity_ask",
        "description": "Ask Perplexity AI a question...",
        "inputSchema": {...}
      }
    ]
  }
}
```

### 2. 收集所有工具

**代码位置：** `server/src/tool_manager.py`

```python
def list_tools(self) -> List[Dict[str, Any]]:
    """获取所有工具"""
    tools = []
    
    # MCP工具（包括 Perplexity）
    tools.extend(self.mcp_manager.list_tools())
    
    # Built-in工具（web_fetch）
    tools.extend(self.builtin_tools.list_tools())
    
    return tools
```

**返回格式：**
```python
[
    {
        "name": "perplexity_search",
        "description": "Search the web...",
        "inputSchema": {...},
        "source": "mcp",
        "server": "perplexity"
    },
    {
        "name": "web_fetch",
        "description": "Fetch web content...",
        "inputSchema": {...},
        "source": "builtin"
    }
]
```

### 3. 转换为 Bedrock toolConfig 格式

**代码位置：** `server/src/main.py`

```python
# Add tool configuration if tools are available
if tool_manager:
    tools = tool_manager.list_tools()
    if tools:
        # Convert tools to Bedrock toolConfig format
        tool_config = {
            "tools": [
                {
                    "toolSpec": {
                        "name": tool["name"],
                        "description": tool["description"],
                        "inputSchema": {
                            "json": tool["inputSchema"]
                        }
                    }
                }
                for tool in tools
            ]
        }
        command["toolConfig"] = tool_config
```

**发送给 Bedrock 的格式：**
```json
{
  "modelId": "anthropic.claude-3-5-sonnet-20241022-v2:0",
  "messages": [...],
  "toolConfig": {
    "tools": [
      {
        "toolSpec": {
          "name": "perplexity_search",
          "description": "Search the web using Perplexity AI. Returns ranked search results...",
          "inputSchema": {
            "json": {
              "type": "object",
              "properties": {
                "query": {"type": "string", "description": "Search query"}
              },
              "required": ["query"]
            }
          }
        }
      },
      {
        "toolSpec": {
          "name": "web_fetch",
          "description": "Fetch and extract content from a web page...",
          "inputSchema": {...}
        }
      }
    ]
  }
}
```

### 4. AI 模型接收工具信息

Bedrock 的 Claude 模型会：
1. 读取 `toolConfig` 中的所有工具定义
2. 理解每个工具的 `name`、`description`、`inputSchema`
3. 根据用户问题决定是否需要调用工具
4. 如果需要，返回 `toolUse` 块

**AI 返回示例：**
```json
{
  "stopReason": "tool_use",
  "content": [
    {
      "text": "Let me search for that information."
    },
    {
      "toolUse": {
        "toolUseId": "xxx",
        "name": "perplexity_search",
        "input": {
          "query": "latest AI news"
        }
      }
    }
  ]
}
```

### 5. 执行工具并返回结果

后端执行工具后，将结果返回给 AI：

```json
{
  "role": "user",
  "content": [
    {
      "toolResult": {
        "toolUseId": "xxx",
        "content": [
          {
            "json": {
              "results": [...]
            }
          }
        ]
      }
    }
  ]
}
```

## 关键点

### ✅ 工具信息自动获取
- MCP Server 启动时自动调用 `tools/list`
- 不需要手动定义工具
- Perplexity MCP Server 会返回所有可用工具

### ✅ 工具信息完整传递
- `name` - 工具名称（AI 用来调用）
- `description` - 工具描述（AI 用来理解功能）
- `inputSchema` - 参数定义（AI 用来构造参数）

### ✅ 动态更新
- 每次 MCP Server 重启都会重新获取工具列表
- 如果 MCP Server 更新了工具，会自动反映

## 验证方法

### 1. 查看后端日志
```bash
# 启动时会看到
[MCP] Starting server: perplexity
[MCP] Loaded tools: perplexity_search, perplexity_ask, perplexity_research, perplexity_reason
```

### 2. 调用 /api/tools 接口
```bash
curl -X POST http://localhost:8000/api/tools \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**返回：**
```json
{
  "tools": [
    {
      "name": "perplexity_search",
      "description": "Search the web using Perplexity AI...",
      "inputSchema": {...},
      "source": "mcp",
      "server": "perplexity"
    }
  ]
}
```

### 3. 开启 Debug 模式
在 Settings 中开启 Debug，查看工具调用信息：
```
[Tool Debug] {
  "tool_name": "perplexity_search",
  "mcp_server": "perplexity",
  "transport": "stdio"
}
```

## 总结

**问题：** Perplexity 工具信息怎么传递给 AI？

**答案：**
1. Perplexity MCP Server 通过 `tools/list` 返回工具定义
2. 后端收集所有工具（MCP + Built-in）
3. 转换为 Bedrock `toolConfig` 格式
4. 随每次 API 请求发送给 AI 模型
5. AI 根据工具信息决定是否调用

**完全自动化，不需要手动维护工具定义！**
