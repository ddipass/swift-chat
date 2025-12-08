# AI Summary 模式修复说明

## 问题描述

用户选择 AI Summary 模式后，实际返回的仍然是 regex 模式的结果：
```json
{
  "processedBy": "regex",
  "content": "...",
  "originalLength": 11474
}
```

## 根本原因

在 `summarizeHTMLWithAI` 函数中，当 AI 总结失败时会自动降级到 regex 模式：

```typescript
catch (error) {
  console.warn('AI summarization failed:', error);
  return cleanHTMLWithRegex(html);  // 降级到 regex
}
```

但是外层代码仍然会设置 `processedBy = 'ai_summary'`，导致状态不一致。

## 修复方案

### 1. 修改返回类型

将 `summarizeHTMLWithAI` 的返回类型从 `Promise<string>` 改为 `Promise<{ content: string; processedBy: string }>`，让函数能够返回实际使用的处理模式。

### 2. 更新降级逻辑

```typescript
// 修复前
return cleanHTMLWithRegex(html);

// 修复后
return { content: cleanHTMLWithRegex(html), processedBy: 'regex' };
```

### 3. 更新调用代码

```typescript
// 修复前
cleanText = await summarizeHTMLWithAI(responseText, url);
processedBy = 'ai_summary';

// 修复后
const result = await summarizeHTMLWithAI(responseText, url);
cleanText = result.content;
processedBy = result.processedBy;  // 使用实际的处理模式
```

## UI 改进

添加了当前模式确认信息卡，让用户清楚知道当前使用的是哪种模式：

```tsx
<View style={styles.infoCard}>
  <Text style={styles.infoCardTitle}>
    Current Mode: {mode === 'regex' ? 'Regex' : 'AI Summary'}
  </Text>
  <Text style={styles.infoCardText}>
    {mode === 'regex'
      ? 'Fast HTML tag removal using regex patterns. Free and instant.'
      : 'Intelligent content extraction using AI. Uses tokens but provides better results.'}
  </Text>
</View>
```

## 效果

### 修复前
- 选择 AI Summary 模式
- AI 失败后降级到 regex
- 但返回 `processedBy: "ai_summary"` ❌
- 用户不知道实际使用的是哪种模式

### 修复后
- 选择 AI Summary 模式
- AI 失败后降级到 regex
- 正确返回 `processedBy: "regex"` ✅
- 界面显示当前模式确认信息
- 用户清楚知道实际使用的处理模式

## 测试验证

```bash
npm run test:web-fetch
```

✅ 4/4 tests passing

## 文件修改

1. **src/mcp/BuiltInTools.ts**
   - 修改 `summarizeHTMLWithAI` 返回类型
   - 更新降级逻辑返回正确的 processedBy
   - 更新调用代码使用返回的 processedBy

2. **src/settings/WebFetchSettingsScreen.tsx**
   - 添加当前模式确认信息卡
   - 添加信息卡样式
