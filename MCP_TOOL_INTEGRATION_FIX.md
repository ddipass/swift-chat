# MCP 工具集成关键修复

## 🚨 发现的关键问题

**AI 根本不知道系统中有哪些工具可用！**

### 问题根源

在 `server/src/main.py` 的 `create_bedrock_command()` 函数中，**没有将工具列表传递给 Bedrock API**。

```python
# 之前的代码 - 缺少 toolConfig
command = {
    "inferenceConfig": {"maxTokens": max_tokens},
    "messages": request.messages,
    "modelId": model_id
}
```

这意味着：
- ✅ 后端正确加载了 MCP 工具
- ✅ 工具可以通过 `/api/tools` 查询
- ❌ **但 AI 完全不知道这些工具的存在**
- ❌ AI 无法调用任何工具

## ✅ 修复方案

### 1. 添加 toolConfig 到 Bedrock API 调用

```python
# 修复后的代码
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

### 2. toolConfig 格式说明

Bedrock Converse API 需要的工具格式：

```json
{
  "toolConfig": {
    "tools": [
      {
        "toolSpec": {
          "name": "web_fetch",
          "description": "Fetch and extract content from a web page",
          "inputSchema": {
            "json": {
              "type": "object",
              "properties": {
                "url": {
                  "type": "string",
                  "description": "The URL to fetch"
                }
              },
              "required": ["url"]
            }
          }
        }
      }
    ]
  }
}
```

## 🔄 工具调用流程

### Bedrock 工具调用是多轮对话

```
用户请求
    ↓
AI 收到 toolConfig (知道有哪些工具)
    ↓
AI 决定是否需要使用工具
    ↓
如果需要: AI 返回 toolUse (stopReason: "tool_use")
    ↓
客户端检测到 toolUse
    ↓
客户端执行工具
    ↓
客户端将 toolResult 发送回 AI
    ↓
AI 继续生成最终响应
```

### 示例：AI 请求使用工具

```json
{
  "stopReason": "tool_use",
  "output": {
    "message": {
      "role": "assistant",
      "content": [
        {
          "toolUse": {
            "toolUseId": "tooluse_abc123",
            "name": "web_fetch",
            "input": {
              "url": "https://example.com"
            }
          }
        }
      ]
    }
  }
}
```

### 示例：客户端返回工具结果

```json
{
  "role": "user",
  "content": [
    {
      "toolResult": {
        "toolUseId": "tooluse_abc123",
        "content": [
          {
            "text": "Fetched content: Example Domain..."
          }
        ],
        "status": "success"
      }
    }
  ]
}
```

## 📋 待实现：客户端工具调用处理

### 需要在前端实现

1. **检测 toolUse 响应**
   ```typescript
   if (response.stopReason === 'tool_use') {
     const toolUse = response.output.message.content.find(c => c.toolUse);
     // 执行工具
   }
   ```

2. **执行工具**
   ```typescript
   const result = await callMCPTool(toolUse.name, toolUse.input);
   ```

3. **构造 toolResult 消息**
   ```typescript
   const toolResultMessage = {
     role: 'user',
     content: [{
       toolResult: {
         toolUseId: toolUse.toolUseId,
         content: [{ text: JSON.stringify(result) }],
         status: 'success'
       }
     }]
   };
   ```

4. **继续对话**
   ```typescript
   // 将 toolResult 添加到消息历史
   messages.push(toolResultMessage);
   // 再次调用 API
   const finalResponse = await converseAPI(messages);
   ```

## 🎯 当前状态

### ✅ 已完成
- [x] 后端加载 MCP 工具
- [x] 后端提供 `/api/tools` 端点
- [x] **后端将 toolConfig 传递给 Bedrock API** ⭐ 关键修复
- [x] AI 现在知道有哪些工具可用

### 📋 待实现
- [ ] 前端检测 toolUse 响应
- [ ] 前端执行工具
- [ ] 前端发送 toolResult
- [ ] 前端处理多轮工具调用

## 🔍 验证方法

### 1. 检查 toolConfig 是否传递

在后端日志中添加：
```python
if tool_config:
    print(f"Sending {len(tools)} tools to AI:")
    for tool in tools:
        print(f"  - {tool['name']}: {tool['description']}")
```

### 2. 测试 AI 是否知道工具

发送请求：
```
"请帮我获取 https://example.com 的内容"
```

如果 AI 回复类似：
- "我可以使用 web_fetch 工具..." ✅ 成功
- "我无法访问网页..." ❌ 失败

## 📚 参考资料

- [AWS Bedrock Converse API - Tool Use](https://docs.aws.amazon.com/bedrock/latest/userguide/tool-use-examples.html)
- [Function Calling with Converse](https://aws-samples.github.io/amazon-bedrock-samples/agents-and-function-calling/function-calling/function_calling_with_converse/function_calling_with_converse/)
- [Model Context Protocol](https://modelcontextprotocol.io/docs/concepts/tools)

## 🎉 影响

这个修复是 **MCP 工具集成的关键**：

- **之前**: AI 完全不知道有工具，无法使用任何 MCP 功能
- **现在**: AI 知道所有可用工具，可以决定何时使用
- **下一步**: 实现客户端工具调用处理，完成完整的工具调用循环

这是从 "工具存在但无法使用" 到 "AI 可以主动使用工具" 的关键一步！
