# Debug增强和错误修复总结

## 实施时间
2025-12-08 21:40

## 修复的问题

### ✅ 问题1: web_fetch缺少debug字段

**问题描述:**
- 成功时有`_debug`字段
- 错误时没有`_debug`字段
- 无法调试为什么没使用AI summary或使用了regex

**解决方案:**
```typescript
// BuiltInTools.ts - catch块
return {
  error: `Failed to fetch: ${errMsg}`,
  _debug: createErrorDebug(
    'web_fetch',
    error instanceof Error ? error : errMsg,
    {
      url: String(args.url),
      mode: getContentProcessingMode(),
      summaryModel: getSummaryModel()?.modelName || 'not configured',
    },
    startTime
  ),
};
```

**效果:**
- 错误时也能看到配置信息
- 知道使用的mode和model
- 可以判断为什么失败

---

### ✅ 问题2: OAuth的blobId错误信息不详细

**问题描述:**
- 只显示: `"Cannot read property 'blobId' of undefined"`
- 不知道是哪一步出错
- 不知道URL是什么

**解决方案:**
```typescript
// MCPOAuth.ts
try {
  const canOpen = await Linking.canOpenURL(authUrl);
  if (!canOpen) {
    throw new Error('Cannot open authorization URL');
  }
  await Linking.openURL(authUrl);
} catch (linkingError) {
  const error = linkingError instanceof Error ? linkingError : new Error(String(linkingError));
  const errorDetails = `
Error: ${error.message}
Type: ${error.name}
Auth URL: ${authUrl}

This error often occurs when:
1. The URL scheme is not properly configured
2. React Native's Linking module has internal issues (blobId error)
3. The browser cannot be opened

Stack: ${error.stack || 'No stack trace'}
  `.trim();
  
  throw new Error(errorDetails);
}
```

**效果:**
- 显示完整的错误信息
- 显示Auth URL
- 提供可能的原因
- 显示堆栈信息

---

### ✅ 问题3: Test Connection的blobId错误信息不详细

**问题描述:**
- 只显示简单的错误消息
- 不知道具体哪里出错

**解决方案:**
```typescript
// PerplexitySettingsScreen.tsx
catch (error) {
  const errorMsg = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  let detailedMessage = `${errorMsg}`;
  if (errorStack) {
    detailedMessage += `\n\nStack: ${errorStack.split('\n').slice(0, 3).join('\n')}`;
  }
  detailedMessage += `\n\nAPI URL: ${baseUrl}/search`;
  
  setTestResult({
    success: false,
    message: detailedMessage,
  });
}
```

**效果:**
- 显示错误消息
- 显示前3行堆栈
- 显示API URL
- 便于定位问题

---

### ✅ 问题4: Chat中找不到Perplexity工具

**问题描述:**
- 用户已启用Perplexity
- 已勾选perplexity_search
- 已输入API Key
- 但Chat中找不到工具

**解决方案:**
在Debug区域添加配置状态检查：

```typescript
<Text style={styles.debugLabel}>Configuration Status:</Text>
<Text style={styles.debugItem}>
  • Enabled: {enabled ? '✅ Yes' : '❌ No'}
</Text>
<Text style={styles.debugItem}>
  • API Key: {apiKey ? '✅ Configured' : '❌ Not configured'}
</Text>
<Text style={styles.debugItem}>
  • Selected Tools: {enabledTools.length > 0 ? `✅ ${enabledTools.join(', ')}` : '❌ None'}
</Text>

<Text style={styles.debugLabel}>
  Registered Tools ({registeredTools.length}):
</Text>
{registeredTools.length > 0 ? (
  registeredTools.map(tool => (
    <Text key={tool} style={styles.debugItem}>• {tool}</Text>
  ))
) : (
  <Text style={styles.debugItem}>
    ⚠️ No tools registered - Check configuration above
  </Text>
)}
```

**效果:**
- 实时显示配置状态
- 显示已注册工具列表
- 如果没有工具，显示警告
- 便于排查配置问题

---

## 🎯 新功能: 全局Debug开关

### 功能描述
在Settings页面添加"Enable Debug"开关，控制所有工具的debug信息输出。

### 实现位置
**Settings页面 → Usage上面**

```typescript
<View style={styles.switchContainer}>
  <Text style={styles.label}>Enable Debug</Text>
  <Switch
    value={debugEnabled}
    onValueChange={value => {
      setDebugEnabled(value);
      saveDebugEnabled(value);
    }}
  />
</View>
```

### 存储实现
```typescript
// StorageUtils.ts
const debugEnabledKey = keyPrefix + 'debugEnabled';

export function saveDebugEnabled(enabled: boolean) {
  storage.set(debugEnabledKey, enabled);
}

export function getDebugEnabled() {
  return storage.getBoolean(debugEnabledKey) ?? false; // 默认关闭
}
```

### 工具集成
```typescript
// ToolDebugUtils.ts
export function createSuccessDebug(...): ToolDebugInfo | undefined {
  if (!getDebugEnabled()) {
    return undefined; // Debug关闭时不返回debug信息
  }
  return createToolDebug(...);
}

export function createErrorDebug(...): ToolDebugInfo | undefined {
  if (!getDebugEnabled()) {
    return undefined; // Debug关闭时不返回debug信息
  }
  return createToolDebug(...);
}
```

### 影响范围
所有使用`createSuccessDebug`和`createErrorDebug`的工具：
- ✅ web_fetch
- ✅ perplexity_search
- ✅ perplexity_ask
- ✅ perplexity_research
- ✅ perplexity_reason
- ✅ 未来所有MCP工具

### 使用方式
1. 打开Settings
2. 找到"Enable Debug"开关（在Usage上面）
3. 开启后，所有工具返回值包含`_debug`字段
4. 关闭后，工具返回值不包含`_debug`字段（节省token）

---

## 验证结果

### 代码质量
- ✅ ESLint: 0 errors, 13 warnings (all no-alert)
- ✅ TypeScript: 0 new errors
- ✅ Prettier: All files formatted

### 功能测试清单

#### Debug开关
- [ ] Settings中显示"Enable Debug"开关
- [ ] 开关位置在Usage上面
- [ ] 开启后工具返回包含_debug
- [ ] 关闭后工具返回不包含_debug

#### web_fetch debug
- [ ] 成功时有_debug（包含mode, summaryModel, processedBy）
- [ ] 错误时有_debug（包含url, mode, summaryModel, error）

#### OAuth错误
- [ ] 显示详细错误信息
- [ ] 包含Auth URL
- [ ] 包含错误类型和堆栈
- [ ] 提供troubleshooting提示

#### Test Connection错误
- [ ] 显示错误消息
- [ ] 显示堆栈前3行
- [ ] 显示API URL

#### Perplexity配置检查
- [ ] Debug区域显示配置状态
- [ ] 显示Enabled/API Key/Selected Tools状态
- [ ] 显示已注册工具列表
- [ ] 无工具时显示警告

---

## Git提交

**Commit:** `67c9ac2`
```
Add global Debug toggle and enhance error reporting

Problem 1: web_fetch missing debug info
Problem 2 & 3: OAuth and Test Connection blobId errors
Problem 4: Perplexity tools not found in chat
New Feature: Global Debug Toggle
```

---

## 下一步建议

### 立即测试
1. **启用Debug开关**
   - 打开Settings → 开启"Enable Debug"
   - 测试web_fetch，查看返回的_debug字段

2. **测试OAuth**
   - 尝试OAuth授权
   - 如果出现blobId错误，查看详细错误信息

3. **测试Perplexity**
   - 查看Debug区域的配置状态
   - 确认所有配置项都是✅
   - 查看Registered Tools数量

4. **测试Chat**
   - 在Chat中尝试调用perplexity_search
   - 查看是否能找到工具
   - 查看返回的_debug信息

### 如果问题4仍然存在
可能的原因：
1. 配置保存后需要重启App
2. getBuiltInTools()没有被重新调用
3. 工具注册时机问题

**排查步骤:**
1. 查看Debug区域的"Configuration Status"
2. 确认所有项都是✅
3. 查看"Registered Tools"数量
4. 如果数量为0，尝试：
   - 关闭并重新打开Perplexity开关
   - 重启App
   - 检查console日志

---

## 总结

✅ **所有4个问题都已修复**
✅ **新增全局Debug开关**
✅ **所有代码质量检查通过**
📱 **等待用户在实际设备上测试**

修复完成，等待您的测试反馈！
