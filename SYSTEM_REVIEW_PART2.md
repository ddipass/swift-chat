# SwiftChat 系统架构 Review - Part 2

## 5. Debug 信息流转

### 5.1 完整链路

```
前端: Settings → Enable Debug
    ↓
存储: storage.set(debugEnabledKey, true)
    ↓
ChatScreen: const debugEnabled = getDebugEnabled()
    ↓
executeToolCall(toolName, args, debugEnabled)
    ↓
callMCPTool(name, args, debug)
    ↓
executeBuiltInTool(name, args, debug)
    ↓
BackendToolsClient.executeTool(name, args, debug)
    ↓
HTTP: POST /api/tool/exec { name, arguments, debug: true }
    ↓
后端: tool_manager.execute_tool(name, args, debug)
    ↓
┌──────────────────┬──────────────────┐
│  MCP Manager     │  Built-in Tools  │
│  execute_tool()  │  web_fetch()     │
└──────────────────┴──────────────────┘
    ↓                      ↓
添加 _debug 信息      添加 _debug 信息
    ↓                      ↓
返回 { result, _debug }
    ↓
main.py: 添加执行时间等信息
    ↓
返回: { success, result, _debug }
    ↓
前端: console.log('[Tool Debug]', _debug)
```

### 5.2 代码实现

#### 前端

**ChatScreen.tsx**
```typescript
const debugEnabled = getDebugEnabled();
const toolResult = await executeToolCall(
  toolCall.toolName,
  toolCall.toolArgs,
  debugEnabled  // 传递 debug 参数
);
```

**BackendToolsClient.ts**
```typescript
async executeTool(name: string, args: Record<string, unknown>, debug: boolean = false) {
  const response = await fetch(`${this.apiUrl}/api/tool/exec`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      arguments: args,
      debug  // 发送到后端
    })
  });
  
  const data = await response.json();
  
  // 打印 debug 信息
  if (debug && data._debug) {
    console.log('[Tool Debug]', JSON.stringify(data._debug, null, 2));
  }
  
  return data.result;
}
```

#### 后端

**main.py**
```python
@app.post("/api/tool/exec")
async def execute_tool(request: ToolExecuteRequest, ...):
    try:
        start_time = time.time()
        result = await tool_manager.execute_tool(
            request.name, 
            request.arguments, 
            request.debug  # 传递 debug
        )
        execution_time = time.time() - start_time
        
        response = {"success": True, "result": result}
        
        # 添加 debug 信息
        if request.debug:
            response["_debug"] = {
                "tool_name": request.name,
                "arguments": request.arguments,
                "execution_time": f"{execution_time:.3f}s",
                "timestamp": time.time()
            }
            
            # 合并工具返回的 debug 信息
            if isinstance(result, dict) and "_debug" in result:
                response["_debug"].update(result["_debug"])
        
        return response
    except Exception as e:
        error_response = {"success": False, "error": str(e)}
        if request.debug:
            error_response["_debug"] = {
                "traceback": traceback.format_exc()
            }
        return error_response
```

**builtin_tools.py**
```python
async def web_fetch(self, arguments: Dict, debug: bool = False):
    debug_info = {
        "url": url,
        "mode": mode,
        "steps": []
    }
    
    # 每个步骤都记录
    debug_info["steps"].append("Fetching URL...")
    # ... 下载 ...
    debug_info["steps"].append(f"Downloaded {len(html)} bytes")
    
    # ... 处理 ...
    
    if mode == "ai_summary":
        debug_info["steps"].append("Calling Bedrock for AI summary...")
        # ... AI 调用 ...
        debug_info["ai_model"] = "claude-3-haiku"
        debug_info["input_tokens"] = result['usage']['input_tokens']
        debug_info["output_tokens"] = result['usage']['output_tokens']
    
    result = {"url": url, "text": text, "mode": mode}
    
    if debug:
        result["_debug"] = debug_info
    
    return result
```

**mcp_manager.py**
```python
async def execute_tool(self, tool_name: str, arguments: Dict, debug: bool = False):
    for server_name, server in self.servers.items():
        for tool in server.tools:
            if tool.name == tool_name:
                result = await server.execute(tool_name, arguments)
                
                # 添加 MCP debug 信息
                if debug:
                    if isinstance(result, dict):
                        if "_debug" not in result:
                            result["_debug"] = {}
                        result["_debug"]["mcp_server"] = server_name
                        result["_debug"]["transport"] = server.transport_type.value
                    else:
                        result = {
                            "content": result,
                            "_debug": {
                                "mcp_server": server_name,
                                "transport": server.transport_type.value
                            }
                        }
                
                return result
```

### 5.3 Debug 信息示例

#### web_fetch (regex 模式)
```json
{
  "success": true,
  "result": {
    "url": "https://example.com",
    "text": "...",
    "mode": "regex",
    "_debug": {
      "url": "https://example.com",
      "mode": "regex",
      "steps": [
        "Fetching URL...",
        "Downloaded 45678 bytes",
        "Cleaning HTML with regex...",
        "Extracted 12345 characters"
      ],
      "status_code": 200,
      "content_type": "text/html"
    }
  },
  "_debug": {
    "tool_name": "web_fetch",
    "arguments": {"url": "https://example.com", "mode": "regex"},
    "execution_time": "1.234s",
    "timestamp": 1733728800.123
  }
}
```

#### web_fetch (AI summary 模式)
```json
{
  "success": true,
  "result": {
    "url": "https://example.com",
    "text": "Summary...",
    "mode": "ai_summary",
    "_debug": {
      "steps": [
        "Fetching URL...",
        "Downloaded 45678 bytes",
        "Using AI summary mode...",
        "Cleaned HTML: 12345 chars",
        "Calling Bedrock for AI summary...",
        "AI summary generated: 567 chars"
      ],
      "ai_model": "claude-3-haiku",
      "input_tokens": 3456,
      "output_tokens": 234
    }
  },
  "_debug": {
    "tool_name": "web_fetch",
    "execution_time": "3.456s"
  }
}
```

#### perplexity_search
```json
{
  "success": true,
  "result": {
    "results": [...],
    "_debug": {
      "mcp_server": "perplexity",
      "transport": "stdio"
    }
  },
  "_debug": {
    "tool_name": "perplexity_search",
    "arguments": {"query": "latest AI news"},
    "execution_time": "2.345s"
  }
}
```

#### 错误情况
```json
{
  "success": false,
  "error": "Tool execution failed: Connection timeout",
  "_debug": {
    "tool_name": "web_fetch",
    "arguments": {"url": "https://slow-site.com"},
    "traceback": "Traceback (most recent call last):\n  File ...\n  httpx.TimeoutException: ..."
  }
}
```

### 5.4 设计评估

#### ✅ 优点
1. **完整的链路** - 从前端到后端全程追踪
2. **分层信息** - 工具层 + 管理层 + API 层
3. **详细的步骤** - 每个操作都有记录
4. **性能统计** - 执行时间、token 使用量
5. **错误追踪** - 包含完整的 traceback

#### ⚠️ 问题
1. **只在控制台输出** - UI 中看不到
2. **信息可能过多** - 大量 debug 信息影响性能
3. **没有日志级别** - 无法控制详细程度
4. **没有持久化** - 刷新后丢失

#### 💡 改进建议
1. 在 UI 中显示工具调用步骤（可折叠）
2. 添加 debug 级别（简单/详细/完整）
3. 支持导出 debug 日志
4. 添加性能分析（每个步骤的耗时）
5. 持久化到文件（可选）

---

## 6. 问题和改进建议

### 6.1 架构层面

#### 🔴 严重问题

1. **工具调用检测不可靠**
   - 当前：使用正则匹配 `<tool_use>` 标签
   - 问题：AI 可能返回不同格式
   - 建议：使用 Bedrock 原生的 `stopReason: "tool_use"` 和 `toolUse` 对象

2. **没有并发控制**
   - 当前：多个工具调用串行执行
   - 问题：效率低下
   - 建议：支持并发执行独立的工具调用

3. **MCP 进程管理不完善**
   - 当前：启动后不管理
   - 问题：进程可能崩溃、僵尸进程
   - 建议：添加健康检查、自动重启、优雅关闭

4. **配置不持久化**
   - 当前：存储在内存中
   - 问题：重启后丢失
   - 建议：持久化到文件或数据库

#### 🟡 中等问题

5. **没有缓存机制**
   - web_fetch 相同 URL 重复抓取
   - 建议：添加 Redis/内存缓存（TTL 1小时）

6. **没有重试机制**
   - 工具调用失败直接报错
   - 建议：自动重试 3 次（指数退避）

7. **没有超时控制**
   - 可能无限等待
   - 建议：添加可配置的超时（默认 30s）

8. **没有工具调用限制**
   - 可能无限循环调用
   - 建议：限制单次对话最多 5 次工具调用

#### 🟢 优化建议

9. **Debug 信息只在控制台**
   - 建议：在 UI 中显示工具调用步骤

10. **AI Summary 费用高**
    - 建议：使用更便宜的模型或本地模型

11. **没有工具调用统计**
    - 建议：记录调用次数、成功率、平均耗时

12. **OAuth token 刷新逻辑复杂**
    - 建议：简化为统一的 token 管理器

### 6.2 代码层面

#### 代码质量问题

1. **错误处理不一致**
   ```python
   # 有的地方
   try:
       result = await execute()
   except Exception as e:
       return {"error": str(e)}
   
   # 有的地方
   try:
       result = await execute()
   except:
       pass  # 静默失败
   ```
   建议：统一错误处理策略

2. **类型注解不完整**
   ```python
   async def execute_tool(self, tool_name, arguments, debug=False):  # 缺少类型
   ```
   建议：添加完整的类型注解

3. **Magic Numbers**
   ```python
   if len(text) > 100000:  # Magic number
       text = text[:100000]
   ```
   建议：定义常量

4. **重复代码**
   - 多处 debug 信息构造逻辑相似
   - 建议：提取为公共函数

### 6.3 性能问题

1. **每次请求都获取工具列表**
   ```python
   tools = tool_manager.list_tools()  # 每次都调用
   ```
   建议：缓存工具列表，只在配置变更时刷新

2. **大文件处理**
   - 100KB+ 的网页可能导致内存问题
   - 建议：流式处理或分块处理

3. **AI Summary 输入过长**
   - 100K 字符可能超过模型限制
   - 建议：智能截取（保留开头和结尾）

### 6.4 安全问题

1. **SSRF 风险**
   - web_fetch 可以访问内网地址
   - 建议：添加 URL 白名单/黑名单

2. **命令注入风险**
   - stdio MCP server 执行外部命令
   - 建议：严格验证命令和参数

3. **资源耗尽**
   - 没有并发限制
   - 建议：添加速率限制

---

## 7. 优先级改进计划

### P0 (立即修复)
1. ✅ 修复工具调用检测（使用 Bedrock 原生格式）
2. ✅ 添加工具调用次数限制
3. ✅ 添加超时控制
4. ✅ 完善错误处理

### P1 (本周完成)
5. ✅ 添加 MCP 进程健康检查
6. ✅ 实现配置持久化
7. ✅ 添加重试机制
8. ✅ 添加 URL 缓存

### P2 (下周完成)
9. ✅ 在 UI 显示工具调用步骤
10. ✅ 添加工具调用统计
11. ✅ 优化 AI Summary 成本
12. ✅ 支持并发工具调用

### P3 (未来优化)
13. 添加更多 debug 级别
14. 实现工具调用缓存
15. 添加性能监控
16. 优化大文件处理

---

## 8. 总结

### 当前架构优点
✅ **清晰的分层** - 前端/后端/工具层职责明确
✅ **统一管理** - 所有工具由后端统一管理
✅ **安全性好** - API Key 不暴露给前端
✅ **可扩展** - 易于添加新工具和 MCP servers
✅ **Debug 友好** - 完整的 debug 信息链路

### 主要问题
🔴 **工具调用检测不可靠** - 依赖正则匹配
🔴 **进程管理不完善** - MCP 进程可能崩溃
🔴 **配置不持久化** - 重启后丢失
🟡 **没有缓存和重试** - 效率和可靠性问题
🟡 **没有并发控制** - 性能问题

### 整体评分
- **架构设计**: 8/10
- **代码质量**: 7/10
- **性能**: 6/10
- **可靠性**: 6/10
- **可维护性**: 7/10

**总分**: 6.8/10

### 建议
优先修复 P0 和 P1 的问题，可以将系统提升到 8/10 的水平。
