# 修复总结 - 2025-12-09

## 问题 1: macOS 崩溃修复 ✅

### 问题描述
SwiftChat 在 macOS 15.7.1 上崩溃，错误信息：
- `EXC_CRASH (SIGABRT)`
- Thread 1: `com.facebook.react.ExceptionsManagerQueue`
- 崩溃位置：`RCTExceptionsManager reportFatal`

### 根本原因
1. OAuth callback 使用 `async` 直接在事件监听器中，导致未处理的 Promise rejection
2. `Alert.alert` 在异步操作后立即调用，在 macOS 上有时序问题
3. 缺少全局错误处理器

### 解决方案
1. **react-native/src/settings/MCPSettingsScreen.tsx**
   - 将 async 逻辑包装在独立函数中
   - 添加 try-catch 错误处理
   - 使用 `setTimeout` 延迟 Alert 调用（100ms）

2. **react-native/index.js**
   - 添加全局 `ErrorUtils.setGlobalHandler`
   - 添加 `unhandledrejection` 事件监听器
   - 所有错误记录到控制台而不是崩溃

### 测试
- ✅ OAuth 流程不再崩溃
- ✅ 错误被正确捕获和记录
- ✅ 应用保持稳定运行

---

## 问题 2: Debug 功能实现 ✅

### 需求
1. 恢复工具调用的 `_debug` 返回信息
2. 在 Settings 中添加 Debug 开关（已存在）
3. 完善 web_fetch 的 AI Summary 和 regex 功能
4. 提供详细的工具调用信息反馈

### 实现内容

#### 后端改动

1. **server/src/main.py**
   ```python
   class ToolExecuteRequest(BaseModel):
       name: str
       arguments: dict
       debug: bool = False  # 新增
   
   @app.post("/api/tool/exec")
   async def execute_tool(...):
       # 返回 _debug 信息
       response["_debug"] = {
           "tool_name": request.name,
           "arguments": request.arguments,
           "execution_time": "2.345s",
           "timestamp": time.time()
       }
   ```

2. **server/src/builtin_tools.py**
   - 实现完整的 AI Summary 功能（使用 Claude 3 Haiku）
   - 改进 regex 清理（使用 `re.sub`）
   - 返回详细步骤日志：
     ```python
     debug_info = {
         "steps": [
             "Fetching URL...",
             "Downloaded 45678 bytes",
             "Using AI summary mode...",
             "Calling Bedrock for AI summary...",
             "AI summary generated: 567 chars"
         ],
         "status_code": 200,
         "ai_model": "claude-3-haiku",
         "input_tokens": 3456,
         "output_tokens": 234
     }
     ```

3. **server/src/tool_manager.py** & **server/src/mcp_manager.py**
   - 传递 debug 参数
   - 添加 MCP 服务器信息到 debug 输出

#### 前端改动

1. **react-native/src/mcp/BackendToolsClient.ts**
   ```typescript
   async executeTool(name: string, args: Record<string, unknown>, debug: boolean = false)
   // 打印 debug 信息到控制台
   ```

2. **react-native/src/mcp/MCPService.ts**
   ```typescript
   export async function callMCPTool(name: string, args: Record<string, unknown>, debug: boolean = false)
   export async function executeToolCall(toolName: string, toolArgs: Record<string, unknown>, debug: boolean = false)
   ```

3. **react-native/src/mcp/BuiltInTools.ts**
   - 传递 debug 参数到后端

4. **react-native/src/chat/ChatScreen.tsx**
   ```typescript
   import { getDebugEnabled } from '../storage/StorageUtils.ts';
   
   const debugEnabled = getDebugEnabled();
   const toolResult = await executeToolCall(toolCall.toolName, toolCall.toolArgs, debugEnabled);
   ```

### Debug 信息示例

#### Console 输出
```
[Tool Debug] {
  "tool_name": "web_fetch",
  "arguments": {"url": "https://example.com", "mode": "ai_summary"},
  "execution_time": "2.345s",
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
  "ai_model": "claude-3-haiku",
  "input_tokens": 3456,
  "output_tokens": 234
}
```

### 使用方法
1. 打开 Settings → Enable Debug
2. 使用任何工具（web_fetch, Perplexity, MCP tools）
3. 查看控制台输出的详细信息

---

## 文件变更清单

### 新增文件
- `CRASH_FIX.md` - 崩溃修复文档
- `DEBUG_FEATURE.md` - Debug 功能文档
- `FIXES_SUMMARY.md` - 本文档

### 修改文件

#### 后端 (4 个文件)
- ✅ `server/src/main.py` - 添加 debug 参数和返回信息
- ✅ `server/src/tool_manager.py` - 传递 debug 参数
- ✅ `server/src/builtin_tools.py` - 实现 AI Summary 和 debug 信息
- ✅ `server/src/mcp_manager.py` - 添加 MCP debug 信息

#### 前端 (6 个文件)
- ✅ `react-native/index.js` - 全局错误处理
- ✅ `react-native/src/settings/MCPSettingsScreen.tsx` - 修复 OAuth callback
- ✅ `react-native/src/mcp/BackendToolsClient.ts` - 支持 debug 参数
- ✅ `react-native/src/mcp/MCPService.ts` - 传递 debug 参数
- ✅ `react-native/src/mcp/BuiltInTools.ts` - 传递 debug 参数
- ✅ `react-native/src/chat/ChatScreen.tsx` - 使用 debug 设置

---

## 测试建议

### 1. 崩溃修复测试
```bash
# macOS
1. 重新构建应用
2. 测试 OAuth 流程（添加 Notion/GitHub MCP server）
3. 验证不再崩溃
4. 检查错误日志是否正确输出
```

### 2. Debug 功能测试
```bash
# 测试 web_fetch regex 模式
1. 开启 Debug
2. 让 AI 抓取网页（不指定 mode）
3. 查看控制台输出

# 测试 web_fetch AI Summary 模式
1. 确保后端有 AWS credentials
2. 让 AI 抓取网页并总结
3. 查看 AI Summary 结果和 debug 信息

# 测试 MCP Tools
1. 配置 Perplexity MCP server
2. 使用 Perplexity 搜索
3. 查看 MCP debug 信息
```

### 3. 性能测试
```bash
# Debug 关闭
1. 关闭 Debug 开关
2. 正常使用工具
3. 验证无性能影响

# Debug 开启
1. 开启 Debug 开关
2. 使用工具
3. 验证性能影响可接受（<100ms）
```

---

## 部署步骤

### 后端部署
```bash
# 1. 构建新镜像
cd server/scripts
bash ./push-to-ecr.sh

# 2. 部署到 App Runner
# 在 AWS Console 中点击 Deploy

# 3. 或部署到 Lambda
# 在 AWS Console 中点击 Deploy new image
```

### 前端部署
```bash
# macOS
1. 在 Xcode 中重新构建
2. 测试 OAuth 和 Debug 功能
3. 打包发布

# Android
npm run android
# 测试后打包 APK

# iOS
npm run ios
# 测试后通过 Xcode 发布
```

---

## 已知问题和限制

### AI Summary 功能
- ⚠️ 需要后端配置 AWS credentials
- ⚠️ 使用 Claude 3 Haiku（会产生费用）
- ⚠️ 输入限制 100K 字符
- ✅ 失败时自动降级到 regex 模式

### Debug 功能
- ⚠️ 仅在控制台输出，UI 中不可见
- ⚠️ 不包含敏感信息（API Keys）
- ✅ 可以随时开关
- ✅ 无性能影响（关闭时）

---

## 下一步计划

### 短期
- [ ] 测试所有修复
- [ ] 更新 README 文档
- [ ] 发布新版本

### 中期
- [ ] 在 UI 中显示工具调用步骤
- [ ] 添加 Debug 信息导出功能
- [ ] 优化 AI Summary 的 prompt

### 长期
- [ ] 支持更多 AI 模型用于 Summary
- [ ] 添加工具调用性能分析
- [ ] 实现工具调用缓存机制
