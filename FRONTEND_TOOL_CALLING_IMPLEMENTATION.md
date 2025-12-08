# 前端工具调用实现方案

## 当前状态
- ✅ 后端已添加 toolConfig 到 Bedrock API
- ✅ AI 现在知道有哪些工具可用
- ❌ 前端还没有处理 toolUse 响应

## 实现方案

### 方案 A: 在流式响应中检测 toolUse（推荐）

#### 1. 修改 parseChunk 函数
在 `bedrock-api.ts` 中添加 toolUse 检测：

```typescript
function parseChunk(event: string) {
  const bedrockChunk = JSON.parse(event);
  
  // 检测 toolUse
  if (bedrockChunk.contentBlockStart?.start?.toolUse) {
    return {
      toolUse: bedrockChunk.contentBlockStart.start.toolUse,
      type: 'toolUseStart'
    };
  }
  
  // 检测 stopReason
  if (bedrockChunk.messageStop?.stopReason === 'tool_use') {
    return {
      type: 'toolUseStop',
      stopReason: 'tool_use'
    };
  }
  
  // 原有逻辑...
}
```

#### 2. 在流式处理中处理 toolUse

```typescript
while (true) {
  const { done, value } = await reader.read();
  const chunk = decoder.decode(value);
  
  for (const event of chunk.split('\n\n')) {
    const parsed = parseChunk(event);
    
    if (parsed?.type === 'toolUseStart') {
      // 收集 toolUse 信息
      currentToolUse = parsed.toolUse;
    }
    
    if (parsed?.type === 'toolUseStop') {
      // 执行工具
      const result = await callMCPTool(
        currentToolUse.name,
        currentToolUse.input
      );
      
      // 构造 toolResult 消息
      messages.push({
        role: 'user',
        content: [{
          toolResult: {
            toolUseId: currentToolUse.toolUseId,
            content: [{ text: JSON.stringify(result) }]
          }
        }]
      });
      
      // 重新调用 API 继续对话
      await invokeBedrockWithCallBack(
        messages,
        chatMode,
        prompt,
        shouldStop,
        controller,
        callback
      );
      return;
    }
    
    // 原有文本处理...
  }
}
```

### 方案 B: 简化实现 - 在消息完成后检查

#### 优点
- 实现简单
- 不需要修改流式处理逻辑
- 更容易调试

#### 缺点
- 需要等待完整响应
- 用户体验稍差（看到完整消息后才执行工具）

#### 实现步骤

1. **在 callback 的 complete=true 时检查**

```typescript
callback(completeMessage, true, false, usage, reasoning);

// 检查是否有 toolUse
if (hasToolUse(completeMessage)) {
  const toolUse = extractToolUse(completeMessage);
  
  // 执行工具
  const result = await callMCPTool(toolUse.name, toolUse.input);
  
  // 添加 toolResult 到消息
  messages.push({
    role: 'assistant',
    content: [{ toolUse: toolUse }]
  });
  messages.push({
    role: 'user',
    content: [{
      toolResult: {
        toolUseId: toolUse.toolUseId,
        content: [{ text: JSON.stringify(result) }]
      }
    }]
  });
  
  // 继续对话
  await invokeBedrockWithCallBack(...);
}
```

### 方案 C: 最简单 - 让用户手动触发（临时方案）

#### 实现
1. AI 提示用户需要使用工具
2. 显示"执行工具"按钮
3. 用户点击后执行工具
4. 显示结果

#### 优点
- 最简单
- 用户可控
- 快速验证功能

#### 缺点
- 用户体验差
- 不是真正的自动化

## 推荐实施顺序

### 第一阶段：验证 toolConfig 是否生效
1. 发送请求："请帮我获取 https://example.com 的内容"
2. 查看 AI 响应是否提到 web_fetch 工具
3. 如果提到，说明 toolConfig 生效 ✅

### 第二阶段：实现方案 B（简化版）
1. 在响应完成后检查 stopReason
2. 如果是 tool_use，执行工具
3. 发送 toolResult
4. 显示最终结果

### 第三阶段：优化为方案 A（完整版）
1. 在流式响应中实时检测 toolUse
2. 立即执行工具
3. 无缝继续对话

## 关键代码位置

- **流式处理**: `react-native/src/api/bedrock-api.ts` (line 150-250)
- **MCP 工具调用**: `react-native/src/mcp/MCPService.ts` - `callMCPTool()`
- **消息构造**: `react-native/src/chat/util/BedrockMessageConvertor.ts`

## 测试用例

### 测试 1: web_fetch
```
用户: "请帮我获取 https://example.com 的内容"
预期: AI 调用 web_fetch，返回网页内容
```

### 测试 2: Perplexity search (如果配置了)
```
用户: "2024年最新的AI新闻是什么？"
预期: AI 调用 perplexity_search，返回最新信息
```

### 测试 3: 不需要工具
```
用户: "什么是机器学习？"
预期: AI 直接回答，不调用工具
```

## 下一步行动

1. **立即**: 测试 toolConfig 是否生效
2. **今天**: 实现方案 B 的基础版本
3. **本周**: 完善错误处理和用户体验
4. **下周**: 优化为方案 A 的流式版本
