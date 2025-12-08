# MCP 工具调用测试指南

## 🎉 实现完成

完整的 MCP 工具调用流程已实现：

1. ✅ **toolConfig 传递** - AI 知道有哪些工具
2. ✅ **toolUse 检测** - 检测 AI 的工具使用请求
3. ✅ **工具执行** - 调用 callMCPTool 执行工具
4. ✅ **结果返回** - 构造 toolResult 消息
5. ✅ **继续对话** - AI 基于工具结果生成最终响应

## 测试步骤

### 准备工作

1. **启动后端服务器**
   ```bash
   cd server
   source venv/bin/activate
   python src/main.py
   ```

2. **启动前端应用**
   ```bash
   cd react-native
   npm start
   # 在另一个终端
   npm run ios  # 或 npm run android
   ```

3. **配置 SwiftChat Server**
   - 打开 Settings
   - 配置 API URL: `http://localhost:8080`
   - 配置 API Key: `test-key`

### 测试用例

#### 测试 1: web_fetch 工具

**输入：**
```
请帮我获取 https://example.com 的内容
```

**预期流程：**
1. AI 识别需要使用 web_fetch 工具
2. 控制台输出：`[Bedrock] Tool use requested: {name: 'web_fetch', ...}`
3. 控制台输出：`[Bedrock] Executing tool: web_fetch`
4. 工具执行并返回网页内容
5. 控制台输出：`[Bedrock] Tool result: {...}`
6. AI 基于工具结果生成最终响应

**预期响应：**
```
我已经获取了 example.com 的内容。这是一个示例域名网站...
[显示网页内容摘要]
```

#### 测试 2: 不需要工具

**输入：**
```
什么是机器学习？
```

**预期流程：**
1. AI 直接回答，不调用工具
2. 控制台无 toolUse 相关日志

**预期响应：**
```
机器学习是人工智能的一个分支...
[正常的AI回答]
```

#### 测试 3: Perplexity 工具（如果配置了）

**前提：** 在 MCP Settings 中添加 Perplexity MCP server

**输入：**
```
2024年最新的AI新闻是什么？
```

**预期流程：**
1. AI 识别需要搜索最新信息
2. 调用 perplexity_search 工具
3. 返回最新新闻
4. AI 总结并呈现

## 调试技巧

### 1. 查看控制台日志

在 React Native 应用中打开调试控制台：
- iOS: Cmd+D → Debug
- Android: Cmd+M → Debug

关键日志：
```
[Bedrock] Tool use requested: {...}
[Bedrock] Executing tool: web_fetch
[Bedrock] Tool result: {...}
```

### 2. 检查网络请求

使用 React Native Debugger 或 Chrome DevTools 查看：
- POST `/api/converse/v3` 请求
- 请求体中是否包含 toolConfig
- 响应中是否有 toolUse

### 3. 后端日志

查看后端服务器输出：
```bash
tail -f /tmp/server.log
```

应该看到：
- toolConfig 生成
- 工具列表
- 工具执行请求

### 4. 常见问题

**问题：AI 不调用工具**
- 检查：toolConfig 是否传递？
- 解决：运行 `server/test_toolconfig.py` 验证

**问题：工具执行失败**
- 检查：callMCPTool 是否正确导入？
- 检查：工具是否在 BuiltInTools 中注册？
- 解决：查看控制台错误日志

**问题：无限循环**
- 原因：工具结果格式不正确
- 解决：检查 toolResult 消息格式

## 性能优化

### 1. 工具执行超时

当前默认 60 秒，可以调整：
```typescript
const timeoutId = setTimeout(() => controller.abort(), 120000); // 2分钟
```

### 2. 工具结果大小

如果工具返回大量数据，考虑截断：
```typescript
const toolResultText = JSON.stringify(toolResult);
const truncated = toolResultText.length > 5000 
  ? toolResultText.substring(0, 5000) + '...[truncated]'
  : toolResultText;
```

### 3. 用户反馈

添加"正在使用工具..."提示：
```typescript
if (bedrockChunk.stopReason === 'tool_use') {
  callback(
    completeMessage + '\n\n🔧 正在使用工具...',
    false,
    false
  );
  // 执行工具...
}
```

## 扩展功能

### 1. 多轮工具调用

当前实现支持单次工具调用。如需多轮：
- AI 可能连续请求多个工具
- 每次都会递归调用 invokeBedrockWithCallBack
- 直到 stopReason 不是 tool_use

### 2. 并行工具调用

Bedrock 支持在一次响应中调用多个工具：
```typescript
// 收集所有 toolUse
const toolUses = [];
if (bedrockChunk.toolUse) {
  toolUses.push(bedrockChunk.toolUse);
}

// 并行执行
const results = await Promise.all(
  toolUses.map(tu => callMCPTool(tu.name, tu.input))
);
```

### 3. 工具选择控制

强制 AI 使用特定工具：
```typescript
toolConfig: {
  tools: [...],
  toolChoice: {
    tool: { name: 'web_fetch' }
  }
}
```

## 成功标准

✅ **基础功能**
- AI 能看到工具列表
- AI 能决定何时使用工具
- 工具能正确执行
- AI 能基于工具结果回答

✅ **用户体验**
- 响应流畅，无明显延迟
- 工具执行有反馈
- 错误处理友好

✅ **稳定性**
- 工具执行失败不会崩溃
- 超时处理正确
- 无内存泄漏

## 下一步

1. **测试验证** - 运行上述测试用例
2. **用户反馈** - 添加工具执行状态提示
3. **错误处理** - 完善各种边界情况
4. **性能优化** - 减少工具调用延迟
5. **文档更新** - 更新 README 说明 MCP 功能

## 庆祝 🎉

这是一个重大里程碑！从零到完整的 MCP 工具集成：
- 后端工具管理 ✓
- 前后端配置同步 ✓
- AI 工具感知 ✓
- 完整的工具调用循环 ✓

SwiftChat 现在是一个真正的 **AI Agent**，能够主动使用工具来完成任务！
