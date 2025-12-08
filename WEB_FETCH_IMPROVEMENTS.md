# Web Fetch 改进说明

## 🎯 改进内容

### 1. 增强 web_fetch 返回信息

#### 之前
```json
{
  "content": "...",
  "processedBy": "regex"
}
```

#### 现在
```json
{
  "content": "...",
  "processedBy": "regex",
  "processingInfo": {
    "attemptedMode": "ai_summary",
    "summaryModel": "Claude 3.5 Sonnet",
    "fallbackReason": "AI returned empty summary",
    "htmlLength": 11474
  }
}
```

**新增字段说明**：
- `processingInfo.attemptedMode`: 尝试使用的模式（ai_summary 或 regex）
- `processingInfo.summaryModel`: 使用的 AI 模型名称
- `processingInfo.fallbackReason`: 如果降级到 regex，说明原因
- `processingInfo.htmlLength`: 原始 HTML 长度

### 2. 改进 WebFetch Settings 信息卡

#### 之前
```
Current Mode: AI Summary
Intelligent content extraction using AI. 
Uses tokens but provides better results.
```

#### 现在
```
Current Configuration
• Mode: AI Summary
• Summary Model: Claude 3.5 Sonnet
• AI will extract and summarize content. 
  Falls back to Regex if AI fails.
```

**改进点**：
- 显示完整配置信息
- 显示当前选择的 Summary Model
- 如果未选择模型，显示警告
- 说明降级机制

## 📊 降级原因说明

### 可能的 fallbackReason 值：

1. **"Summary model not configured"**
   - 原因：未选择 Summary Model
   - 解决：在 WebFetch Settings 中选择一个模型

2. **"AI returned empty summary"**
   - 原因：AI 处理后返回空内容
   - 可能：模型不支持、内容太复杂、API 限制
   - 解决：尝试更换模型或简化内容

3. **"AI summarization timeout after 90 seconds"**
   - 原因：AI 处理超时
   - 可能：网络问题、内容太大、模型响应慢
   - 解决：检查网络、减少内容长度

4. **其他错误信息**
   - 会显示具体的错误原因
   - 如 "Please configure your Bedrock API Key"

## 🔍 如何使用新信息诊断问题

### 场景 1: 配置正确，AI 工作正常
```json
{
  "processedBy": "ai_summary",
  "processingInfo": {
    "attemptedMode": "ai_summary",
    "summaryModel": "Claude 3.5 Sonnet",
    "htmlLength": 11474
  }
}
```
✅ 一切正常

### 场景 2: 未选择 Summary Model
```json
{
  "processedBy": "regex",
  "processingInfo": {
    "attemptedMode": "ai_summary",
    "fallbackReason": "Summary model not configured",
    "htmlLength": 11474
  }
}
```
❌ 需要在 WebFetch Settings 中选择 Summary Model

### 场景 3: AI 处理失败
```json
{
  "processedBy": "regex",
  "processingInfo": {
    "attemptedMode": "ai_summary",
    "summaryModel": "Amazon Nova Lite",
    "fallbackReason": "AI returned empty summary",
    "htmlLength": 11474
  }
}
```
⚠️ 模型可能不适合，尝试更换为 Claude 3.5 Sonnet

### 场景 4: 直接使用 Regex 模式
```json
{
  "processedBy": "regex",
  "processingInfo": {
    "attemptedMode": "regex",
    "htmlLength": 11474
  }
}
```
ℹ️ 用户选择了 Regex 模式，没有尝试 AI

## 💡 用户体验改进

1. **透明度**：用户现在能看到为什么使用了 regex 而不是 AI
2. **可调试性**：开发者能快速定位问题
3. **配置反馈**：界面上清楚显示当前配置状态
4. **降级说明**：用户知道 AI 失败时会自动降级，不会完全失败

## 🚀 下一步

用户现在可以：
1. 查看 `processingInfo` 了解处理详情
2. 根据 `fallbackReason` 调整配置
3. 在界面上看到完整的配置信息
4. 理解为什么某些情况下会使用 regex
