# SwiftChat 系统架构全面 Review

## 目录
1. [整体架构](#整体架构)
2. [Fetch 工具设计](#fetch-工具设计)
3. [MCP 工具设计](#mcp-工具设计)
4. [AI 问答逻辑](#ai-问答逻辑)
5. [Debug 信息流转](#debug-信息流转)
6. [问题和改进建议](#问题和改进建议)

---

## 1. 整体架构

### 架构图
```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (React Native)                    │
├─────────────────────────────────────────────────────────────┤
│  ChatScreen.tsx                                              │
│    ↓                                                         │
│  MCPService.ts → callMCPTool() → executeBuiltInTool()       │
│                                                              │
│  BuiltInTools.ts                                             │
│    ↓                                                         │
│  BackendToolsClient.ts → executeTool(name, args, debug)     │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP
┌─────────────────────────────────────────────────────────────┐
│                      后端 (FastAPI)                          │
├─────────────────────────────────────────────────────────────┤
│  main.py                                                     │
│    ↓                                                         │
│  POST /api/tool/exec                                         │
│    ↓                                                         │
│  tool_manager.execute_tool(name, args, debug)               │
│    ↓                                                         │
│  ┌──────────────────┬──────────────────┐                   │
│  │  MCP Manager     │  Built-in Tools  │                   │
│  │  (Perplexity等)  │  (web_fetch)     │                   │
│  └──────────────────┴──────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    外部服务                                   │
├─────────────────────────────────────────────────────────────┤
│  • MCP Servers (stdio/OAuth)                                │
│  • Bedrock API (AI Summary)                                 │
│  • Web (HTTP fetch)                                         │
└─────────────────────────────────────────────────────────────┘
```

### 设计原则
✅ **后端统一管理** - 所有工具由后端管理，前端只负责调用
✅ **安全性** - API Key 存储在后端，不暴露给前端
✅ **可扩展** - 易于添加新的 MCP servers 和工具
✅ **Debug 友好** - 完整的 debug 信息链路

---

## 2. Fetch 工具设计

### 2.1 架构流程

```
用户请求 "抓取网页"
    ↓
AI 决定调用 web_fetch
    ↓
前端: executeToolCall("web_fetch", {url, mode}, debug)
    ↓
后端: POST /api/tool/exec
    ↓
builtin_tools.web_fetch(url, mode, debug)
    ↓
┌─────────────┬──────────────┐
│ mode=regex  │ mode=ai_summary │
└─────────────┴──────────────┘
      ↓              ↓
  _clean_html()  _ai_summary()
      ↓              ↓
  返回文本      调用 Bedrock
                     ↓
                 返回总结
```

### 2.2 代码实现

**后端：** `server/src/builtin_tools.py`

```python
async def web_fetch(self, arguments: Dict[str, Any], debug: bool = False):
    url = arguments.get("url")
    mode = arguments.get("mode", "regex")
    
    debug_info = {
        "url": url,
        "mode": mode,
        "steps": []
    }
    
    # 1. 下载内容
    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=30.0)
        html = response.text
        debug_info["steps"].append(f"Downloaded {len(html)} bytes")
    
    # 2. 处理内容
    if mode == "regex":
        text = self._clean_html(html)
    elif mode == "ai_summary":
        text = await self._ai_summary(html, url, debug_info)
    
    # 3. 返回结果
    result = {
        "url": url,
        "text": text,
        "mode": mode
    }
    
    if debug:
        result["_debug"] = debug_info
    
    return result
```

### 2.3 Regex 清理逻辑

```python
def _clean_html(self, html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    
    # 移除无用标签
    for tag in soup(["script", "style", "nav", "footer", "header", 
                     "aside", "iframe", "noscript"]):
        tag.decompose()
    
    # 提取文本
    text = soup.get_text(separator=" ", strip=True)
    
    # 清理空白 - 使用 regex
    text = re.sub(r'\s+', ' ', text)  # 多个空白 → 单个空格
    text = re.sub(r'\n\s*\n', '\n\n', text)  # 多个换行 → 双换行
    
    return text
```

### 2.4 AI Summary 逻辑

```python
async def _ai_summary(self, html: str, url: str, debug_info: Dict) -> str:
    # 1. 先用 regex 清理
    cleaned_text = self._clean_html(html)
    
    # 2. 截断过长内容
    if len(cleaned_text) > 100000:
        cleaned_text = cleaned_text[:100000]
    
    # 3. 调用 Bedrock
    bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
    
    response = bedrock.invoke_model(
        modelId='anthropic.claude-3-haiku-20240307-v1:0',
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4096,
            "messages": [{
                "role": "user",
                "content": f"Summarize: {cleaned_text}"
            }]
        })
    )
    
    result = json.loads(response['body'].read())
    summary = result['content'][0]['text']
    
    # 4. 记录 debug 信息
    debug_info["ai_model"] = "claude-3-haiku"
    debug_info["input_tokens"] = result['usage']['input_tokens']
    debug_info["output_tokens"] = result['usage']['output_tokens']
    
    return summary
```

### 2.5 工具定义

```python
{
    "name": "web_fetch",
    "description": "Fetch and extract content from a web page. Supports regex and AI summary modes.",
    "inputSchema": {
        "type": "object",
        "properties": {
            "url": {"type": "string"},
            "mode": {
                "type": "string",
                "enum": ["regex", "ai_summary"]
            }
        },
        "required": ["url"]
    }
}
```

### 2.6 设计评估

#### ✅ 优点
1. **双模式支持** - regex 快速，AI summary 智能
2. **自动降级** - AI 失败时回退到 regex
3. **完整的 debug 信息** - 每个步骤都有记录
4. **性能优化** - 截断过长内容，避免超时

#### ⚠️ 问题
1. **AI Summary 需要 AWS credentials** - 后端必须配置
2. **费用问题** - 每次 AI summary 都会产生费用
3. **超时风险** - 大网页可能超过 30 秒
4. **没有缓存** - 相同 URL 重复抓取

#### 💡 改进建议
1. 添加 URL 缓存（Redis/内存）
2. 增加超时配置
3. 支持更多清理选项（用户自定义）
4. AI Summary 使用更便宜的模型

---

## 3. MCP 工具设计

### 3.1 架构流程

```
启动时:
  ↓
tool_manager.initialize(config)
  ↓
mcp_manager.initialize_from_config(servers)
  ↓
for each server:
  ↓
  MCPServer.start()
    ↓
  ┌─────────────┬──────────────┐
  │ stdio       │ oauth        │
  └─────────────┴──────────────┘
        ↓              ↓
  启动子进程    HTTP 连接
        ↓              ↓
  调用 tools/list
        ↓
  存储工具列表到 server.tools

运行时:
  ↓
用户请求 "搜索最新 AI 新闻"
  ↓
AI 决定调用 perplexity_search
  ↓
tool_manager.execute_tool("perplexity_search", {query}, debug)
  ↓
mcp_manager.execute_tool()
  ↓
找到对应的 MCPServer
  ↓
server.execute(tool_name, args)
  ↓
┌─────────────┬──────────────┐
│ stdio       │ oauth        │
└─────────────┴──────────────┘
      ↓              ↓
  发送 JSON-RPC  发送 HTTP POST
      ↓              ↓
  返回结果
```

### 3.2 代码实现

**MCP Server 启动：** `server/src/mcp_manager.py`

```python
async def _start_stdio(self):
    # 1. 启动子进程
    self.process = await asyncio.create_subprocess_exec(
        self.command,
        *self.args,
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        env=env
    )
    
    # 2. 获取工具列表
    response = await self._send_stdio_request({
        "method": "tools/list",
        "params": {}
    })
    
    # 3. 存储工具
    for tool_data in response["result"]["tools"]:
        tool = MCPTool(
            name=tool_data["name"],
            description=tool_data["description"],
            input_schema=tool_data["inputSchema"]
        )
        self.tools.append(tool)
```

**工具执行：**

```python
async def execute_tool(self, tool_name: str, arguments: Dict, debug: bool):
    for server_name, server in self.servers.items():
        for tool in server.tools:
            if tool.name == tool_name:
                result = await server.execute(tool_name, arguments)
                
                if debug:
                    result["_debug"] = {
                        "mcp_server": server_name,
                        "transport": server.transport_type.value
                    }
                
                return result
```

### 3.3 Perplexity 集成

**配置：** MCP Settings

```json
{
  "name": "perplexity",
  "url": "stdio://npx/-y/@perplexity-ai/mcp-server",
  "transport": "stdio",
  "env": {
    "PERPLEXITY_API_KEY": "pplx-xxx"
  }
}
```

**自动提供的工具：**
- `perplexity_search` - 网页搜索
- `perplexity_ask` - 快速问答
- `perplexity_research` - 深度研究
- `perplexity_reason` - 推理分析

**工具信息传递：**
```python
# main.py - 每次 API 请求都发送
tool_config = {
    "tools": [
        {
            "toolSpec": {
                "name": "perplexity_search",
                "description": "Search the web...",
                "inputSchema": {"json": {...}}
            }
        }
    ]
}
command["toolConfig"] = tool_config
```

### 3.4 设计评估

#### ✅ 优点
1. **完全自动化** - 工具列表自动获取
2. **支持两种 transport** - stdio 和 OAuth
3. **动态更新** - MCP Server 更新时自动反映
4. **统一管理** - 所有 MCP servers 在一个地方
5. **OAuth 自动刷新** - Token 过期自动刷新

#### ⚠️ 问题
1. **stdio 进程管理** - 子进程可能崩溃
2. **没有重试机制** - 调用失败直接报错
3. **没有超时控制** - 可能无限等待
4. **内存配置** - 重启后配置丢失

#### 💡 改进建议
1. 添加进程健康检查和自动重启
2. 实现重试机制（3次）
3. 添加超时配置（可配置）
4. 持久化配置到文件/数据库
5. 添加工具调用统计

---

## 4. AI 问答逻辑

### 4.1 完整流程

```
用户输入消息
    ↓
ChatScreen.tsx
    ↓
invokeBedrockWithCallBack()
    ↓
POST /api/converse/v3
    ↓
main.py: prepare_bedrock_command()
    ↓
添加 toolConfig (所有可用工具)
    ↓
bedrock_runtime.converse_stream()
    ↓
┌──────────────────────────────────┐
│  AI 返回 (Streaming)              │
├──────────────────────────────────┤
│  1. contentBlockStart            │
│  2. contentBlockDelta (文本)      │
│  3. toolUse (工具调用)            │
│  4. messageStop                  │
└──────────────────────────────────┘
    ↓
检测到 toolUse?
    ↓ Yes
执行工具
    ↓
将结果添加到 messages
    ↓
再次调用 Bedrock (继续对话)
    ↓
返回最终答案
```

### 4.2 代码实现

**前端：** `react-native/src/chat/ChatScreen.tsx`

```typescript
// 检测工具调用
const { detectToolCall, executeToolCall } = await import(
  '../mcp/MCPService'
);

const toolCall = detectToolCall(msg);

if (toolCall) {
  // 执行工具
  const debugEnabled = getDebugEnabled();
  const toolResult = await executeToolCall(
    toolCall.toolName,
    toolCall.toolArgs,
    debugEnabled
  );
  
  // 继续对话
  // ...
}
```

**后端：** `server/src/main.py`

```python
@app.post("/api/converse/v3")
async def converse_stream_v3(...):
    # 1. 准备命令
    client, command = await prepare_bedrock_command(request)
    
    # 2. 添加工具配置
    if tool_manager:
        tools = tool_manager.list_tools()
        tool_config = {
            "tools": [
                {
                    "toolSpec": {
                        "name": tool["name"],
                        "description": tool["description"],
                        "inputSchema": {"json": tool["inputSchema"]}
                    }
                }
                for tool in tools
            ]
        }
        command["toolConfig"] = tool_config
    
    # 3. 调用 Bedrock
    response = client.converse_stream(**command)
    
    # 4. 流式返回
    for event in response["stream"]:
        yield f"data: {json.dumps(event)}\n\n"
```

### 4.3 工具调用检测

**前端：** `react-native/src/mcp/MCPService.ts`

```typescript
export function detectToolCall(message: string): ToolCall | null {
  // 检测 <tool_use> 标签
  const match = message.match(
    /<tool_use[^>]*name="([^"]+)"[^>]*>(.*?)<\/tool_use>/s
  );
  
  if (match) {
    const toolName = match[1];
    const argsJson = match[2].trim();
    const toolArgs = JSON.parse(argsJson);
    
    return { toolName, toolArgs };
  }
  
  return null;
}
```

### 4.4 设计评估

#### ✅ 优点
1. **流式响应** - 实时显示 AI 回复
2. **自动工具调用** - AI 自主决定是否使用工具
3. **多轮对话** - 支持工具调用后继续对话
4. **完整的上下文** - 保留所有历史消息

#### ⚠️ 问题
1. **工具调用检测不可靠** - 依赖正则匹配
2. **没有并发控制** - 多个工具调用串行执行
3. **错误处理不完善** - 工具失败后可能卡住
4. **没有工具调用限制** - 可能无限循环

#### 💡 改进建议
1. 使用 Bedrock 原生的 toolUse 格式（不用正则）
2. 支持并发工具调用
3. 添加工具调用次数限制（最多 5 次）
4. 改进错误处理和重试逻辑
5. 添加工具调用超时

---

(续下一部分...)
