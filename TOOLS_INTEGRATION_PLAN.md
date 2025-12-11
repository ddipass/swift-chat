# Tools Integration Plan

## 当前状态

✅ **已完成：**
- 后端 web_fetch 工具实现（regex + AI summary）
- 前端配置 UI
- API 端点（/api/tool/exec）
- 统计功能

⏳ **待完成：**
- 将工具集成到 AI 对话流程

## 🎯 集成方案

### 方案 A：System Prompt 方式（推荐，简单）

**原理：**
在 system prompt 中告诉 AI 有哪些工具可用，AI 在回复中使用特定格式请求工具调用。

**优点：**
- ✅ 不需要修改 Bedrock API 调用
- ✅ 不需要扩展消息格式
- ✅ 实现简单，易于调试
- ✅ 适用于所有模型

**实现步骤：**

1. **在后端添加工具列表 API**
```python
# server/src/main.py
@app.get("/api/tools/list")
async def list_tools(credentials: ...):
    return {
        "tools": [
            {
                "name": "web_fetch",
                "description": "Fetch and extract content from a web URL",
                "parameters": {
                    "url": "string (required) - The URL to fetch"
                }
            }
        ]
    }
```

2. **前端在发送消息前添加工具信息到 system prompt**
```typescript
// react-native/src/api/bedrock-api.ts

async function getToolsSystemPrompt(): Promise<string> {
  const toolsApiUrl = getToolsApiUrl();
  const toolsApiKey = getToolsApiKey();
  
  if (!toolsApiUrl || !toolsApiKey) {
    return '';
  }
  
  try {
    const client = new ToolsClient(toolsApiUrl, toolsApiKey);
    const response = await fetch(`${toolsApiUrl}/api/tools/list`, {
      headers: { 'Authorization': `Bearer ${toolsApiKey}` }
    });
    const data = await response.json();
    
    return `

Available Tools:
You have access to the following tools. To use a tool, respond with:
TOOL_CALL: tool_name
PARAMETERS: {"param1": "value1"}

Available tools:
${data.tools.map(t => `- ${t.name}: ${t.description}\n  Parameters: ${JSON.stringify(t.parameters)}`).join('\n')}

After I execute the tool, I will provide the result, and you should continue the conversation based on that result.
`;
  } catch (e) {
    return '';
  }
}

// 在 invokeBedrockWithCallBack 中使用
const toolsPrompt = await getToolsSystemPrompt();
const finalSystemPrompt = prompt?.prompt + toolsPrompt;
```

3. **前端检测 AI 响应中的工具调用请求**
```typescript
// 在 callback 中检测
function detectToolCall(text: string): {toolName: string, params: any} | null {
  const match = text.match(/TOOL_CALL:\s*(\w+)\s*PARAMETERS:\s*({.*})/s);
  if (match) {
    return {
      toolName: match[1],
      params: JSON.parse(match[2])
    };
  }
  return null;
}

// 在流式响应完成后
if (done) {
  const toolCall = detectToolCall(completeMessage);
  if (toolCall) {
    // 执行工具
    const result = await executeToolAndContinue(toolCall, messages);
    // 继续对话...
  } else {
    callback(completeMessage, true, false);
  }
}
```

---

### 方案 B：Bedrock Native Tool Use（复杂，但标准）

**原理：**
使用 Bedrock 原生的 tool use 功能，需要在请求中定义工具，Bedrock 会返回 toolUse 块。

**优点：**
- ✅ 标准的 Bedrock 功能
- ✅ AI 更准确地知道何时使用工具
- ✅ 结构化的工具调用

**缺点：**
- ❌ 需要修改后端 API（添加 tools 参数）
- ❌ 需要扩展前端消息格式
- ❌ 需要处理 toolUse/toolResult 消息类型
- ❌ 实现复杂

**实现步骤：**

1. **修改后端 API 支持 tools 参数**
```python
# server/src/main.py
class ConverseRequest(BaseModel):
    messages: List[dict] = []
    modelId: str
    region: str
    system: List[dict] | None = None
    tools: List[dict] | None = None  # 新增

@app.post("/api/converse/v3")
async def converse_v3(request: ConverseRequest, ...):
    # 调用 Bedrock 时传递 tools
    response = bedrock.converse_stream(
        modelId=request.modelId,
        messages=request.messages,
        system=request.system,
        toolConfig={
            "tools": request.tools
        } if request.tools else None
    )
```

2. **前端定义工具并发送**
```typescript
const tools = [{
  "toolSpec": {
    "name": "web_fetch",
    "description": "Fetch content from a web URL",
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
}];

const bodyObject = {
  messages: messages,
  modelId: getTextModel().modelId,
  region: getRegion(),
  system: prompt ? [{ text: prompt?.prompt }] : undefined,
  tools: tools  // 添加工具定义
};
```

3. **扩展 BedrockChunk 类型**
```typescript
// react-native/src/types/Chat.ts
export interface BedrockChunk {
  contentBlockDelta: {
    delta: Delta;
  };
  contentBlockStart: {
    start: {
      toolUse: {
        toolUseId: string;
        name: string;
      }
    }
  };
  metadata: {
    usage: Usage;
  };
  detail: string;
  stopReason: string;
}
```

4. **处理 toolUse 响应**
```typescript
// 在 parseChunk 中检测 toolUse
if (bedrockChunk.contentBlockStart?.start?.toolUse) {
  return {
    ...content,
    toolUse: bedrockChunk.contentBlockStart.start.toolUse
  };
}

if (bedrockChunk.stopReason === 'tool_use') {
  return {
    ...content,
    stopReason: 'tool_use'
  };
}
```

5. **执行工具并继续对话**
```typescript
// 当检测到 tool_use 时
if (bedrockChunk.stopReason === 'tool_use' && collectedToolUse) {
  // 执行工具
  const toolResult = await executeToolCall(collectedToolUse);
  
  // 添加 assistant 消息（包含 toolUse）
  messages.push({
    role: 'assistant',
    content: [{ toolUse: collectedToolUse }]
  });
  
  // 添加 user 消息（包含 toolResult）
  messages.push({
    role: 'user',
    content: [{
      toolResult: {
        toolUseId: collectedToolUse.toolUseId,
        content: [{ text: JSON.stringify(toolResult) }]
      }
    }]
  });
  
  // 继续对话
  await invokeBedrockWithCallBack(messages, ...);
}
```

---

## 📊 方案对比

| 指标 | 方案 A (System Prompt) | 方案 B (Native Tool Use) |
|------|----------------------|-------------------------|
| 实现难度 | ⭐ 简单 | ⭐⭐⭐⭐ 复杂 |
| 代码修改量 | 小（~100行） | 大（~500行） |
| 准确性 | 中等（依赖 AI 理解） | 高（结构化） |
| 调试难度 | 简单 | 复杂 |
| 适用模型 | 所有模型 | 仅 Bedrock Claude |
| 实施时间 | 30分钟 | 2-3小时 |

---

## 🎯 推荐方案

**建议先实现方案 A（System Prompt）**

理由：
1. 快速验证工具功能是否正常
2. 用户可以立即使用
3. 代码简单，易于维护
4. 后续可以升级到方案 B

**实施步骤：**
1. 添加 `/api/tools/list` 端点（5分钟）
2. 实现 `getToolsSystemPrompt()` 函数（10分钟）
3. 实现 `detectToolCall()` 和工具执行逻辑（15分钟）
4. 测试（10分钟）

总计：约 40 分钟

---

## 🧪 测试计划

### 测试用例 1：简单网页抓取
```
用户: "帮我总结 https://example.com 的内容"
AI: "TOOL_CALL: web_fetch
PARAMETERS: {"url": "https://example.com"}"
系统: [执行工具，返回结果]
AI: "根据抓取的内容，这个网页主要讲述了..."
```

### 测试用例 2：多步骤
```
用户: "比较 https://site1.com 和 https://site2.com"
AI: "TOOL_CALL: web_fetch
PARAMETERS: {"url": "https://site1.com"}"
系统: [执行工具]
AI: "TOOL_CALL: web_fetch
PARAMETERS: {"url": "https://site2.com"}"
系统: [执行工具]
AI: "比较结果：..."
```

---

## 下一步

需要我实现方案 A 吗？还是你想直接实现方案 B？
