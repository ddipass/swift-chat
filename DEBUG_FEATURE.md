# Debug 功能实现文档

## 概述
为工具调用（MCP Tools、Built-in Tools、Perplexity等）添加了完整的 Debug 信息返回功能，帮助开发者了解工具调用的详细过程。

## 功能特性

### 1. Settings 中的 Debug 开关
- 位置：Settings → Enable Debug
- 功能：全局控制是否输出详细的工具调用信息
- 默认：关闭

### 2. 后端 Debug 信息

#### API 变更
**POST /api/tool/exec**
```json
// Request
{
  "name": "web_fetch",
  "arguments": {
    "url": "https://example.com",
    "mode": "ai_summary"
  },
  "debug": true  // 新增参数
}

// Response (debug=true)
{
  "success": true,
  "result": {
    "url": "https://example.com",
    "text": "...",
    "mode": "ai_summary",
    "_debug": {
      "url": "https://example.com",
      "mode": "ai_summary",
      "steps": [
        "Fetching URL...",
        "Downloaded 45678 bytes",
        "Using AI summary mode...",
        "Cleaned HTML: 12345 chars",
        "Calling Bedrock for AI summary...",
        "AI summary generated: 567 chars"
      ],
      "status_code": 200,
      "content_type": "text/html",
      "ai_model": "claude-3-haiku",
      "input_tokens": 3456,
      "output_tokens": 234
    }
  },
  "_debug": {
    "tool_name": "web_fetch",
    "arguments": {...},
    "execution_time": "2.345s",
    "timestamp": 1733728800.123
  }
}
```

### 3. web_fetch 工具增强

#### Regex 模式改进
- 使用 `re.sub()` 清理多余空白符
- 移除更多无用标签：`iframe`, `noscript`
- 更好的文本格式化

#### AI Summary 模式实现
- 使用 Claude 3 Haiku 进行智能总结
- 自动截断过长内容（100K chars）
- 返回 token 使用统计
- 失败时自动降级到 regex 模式

#### Debug 信息包含
- URL 和处理模式
- 每个步骤的详细日志
- HTTP 状态码和 Content-Type
- AI 模型信息和 token 使用量
- 错误信息（如果有）

### 4. MCP Tools Debug 信息
- MCP 服务器名称
- Transport 类型（stdio/oauth）
- 工具调用参数和结果

### 5. 前端 Debug 输出
当 Debug 开启时，所有工具调用会在控制台输出详细信息：

```javascript
[Tool Debug] {
  "tool_name": "web_fetch",
  "arguments": {...},
  "execution_time": "2.345s",
  "timestamp": 1733728800.123,
  "url": "https://example.com",
  "mode": "ai_summary",
  "steps": [...],
  "ai_model": "claude-3-haiku",
  "input_tokens": 3456,
  "output_tokens": 234
}

[MCP Tool Debug] {
  "tool": "perplexity_search",
  "args": {...},
  "result": {...},
  "client": "MCPClient"
}
```

## 代码变更

### 后端文件
1. **server/src/main.py**
   - `ToolExecuteRequest` 添加 `debug: bool = False`
   - `execute_tool` 端点返回 `_debug` 信息
   - 包含执行时间、timestamp、traceback（错误时）

2. **server/src/tool_manager.py**
   - `execute_tool()` 添加 `debug` 参数
   - 传递给 MCP 和 Built-in tools

3. **server/src/builtin_tools.py**
   - `execute()` 和 `web_fetch()` 支持 debug
   - 实现完整的 AI Summary 功能
   - 改进 regex 清理逻辑
   - 返回详细的步骤日志

4. **server/src/mcp_manager.py**
   - `execute_tool()` 添加 debug 信息
   - 包含 MCP 服务器名称和 transport 类型

### 前端文件
1. **react-native/src/mcp/BackendToolsClient.ts**
   - `executeTool()` 添加 `debug` 参数
   - 打印 debug 信息到控制台

2. **react-native/src/mcp/MCPService.ts**
   - `callMCPTool()` 和 `executeToolCall()` 支持 debug
   - 打印 MCP 工具调用信息

3. **react-native/src/mcp/BuiltInTools.ts**
   - `executeBuiltInTool()` 和 `getBuiltInToolsAsync()` 支持 debug
   - 传递 debug 参数到后端

4. **react-native/src/chat/ChatScreen.tsx**
   - 导入 `getDebugEnabled()`
   - 调用工具时传递 debug 参数

5. **react-native/index.js**
   - 添加全局错误处理器
   - 防止未捕获的异常导致崩溃

6. **react-native/src/settings/MCPSettingsScreen.tsx**
   - 修复 OAuth callback 的异步错误处理
   - 使用 setTimeout 避免 Alert 时序问题

## 使用方法

### 开启 Debug
1. 打开 SwiftChat
2. 进入 Settings
3. 找到 "Enable Debug" 开关
4. 打开开关

### 查看 Debug 信息

#### macOS
1. 打开 Xcode
2. 运行应用
3. 查看 Console 输出

#### Android
```bash
adb logcat | grep -E "Tool Debug|MCP Tool Debug"
```

#### 后端日志
```bash
# 查看 App Runner 日志
aws logs tail /aws/apprunner/swiftchat-api --follow

# 或查看 Lambda 日志
aws logs tail /aws/lambda/SwiftChatLambda-xxx --follow
```

## 示例场景

### 场景 1：调试 web_fetch 为什么没用 AI Summary
1. 开启 Debug
2. 发送消息让 AI 抓取网页
3. 查看控制台输出：
```
[Tool Debug] {
  "steps": [
    "Fetching URL...",
    "Downloaded 45678 bytes",
    "Using AI summary mode...",
    "AI summary failed: NoCredentialsError, falling back to regex"
  ],
  "ai_error": "Unable to locate credentials"
}
```
4. 发现问题：后端没有配置 AWS credentials

### 场景 2：调试 Perplexity 工具调用
1. 开启 Debug
2. 使用 Perplexity 搜索
3. 查看输出：
```
[MCP Tool Debug] {
  "tool": "perplexity_search",
  "args": {"query": "latest AI news"},
  "result": {...},
  "client": "MCPClient",
  "_debug": {
    "mcp_server": "perplexity",
    "transport": "stdio"
  }
}
```

## 性能影响
- Debug 关闭时：无性能影响
- Debug 开启时：
  - 额外的日志输出（~100ms）
  - 控制台打印（可忽略）
  - 不影响用户体验

## 安全考虑
- Debug 信息不包含敏感数据（API Keys、Tokens）
- 仅在开发/调试时开启
- 生产环境建议关闭

## 未来改进
- [ ] 添加 Debug 信息导出功能
- [ ] 在 UI 中显示工具调用步骤
- [ ] 添加性能分析（每个步骤的耗时）
- [ ] 支持 Debug 级别（简单/详细/完整）
