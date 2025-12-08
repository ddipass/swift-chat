# _debug字段完整指南

## 概述

`_debug`字段是所有工具返回的统一调试信息，帮助诊断问题。

**前提条件:** 必须在Settings中开启"Enable Debug"开关

---

## 通用结构

所有工具的`_debug`字段都遵循相同结构：

```typescript
{
  _debug: {
    tool: string,           // 工具名称
    timestamp: string,      // ISO时间戳
    duration_ms: number,    // 执行耗时（毫秒）
    success: boolean,       // 是否成功
    details: {              // 工具特定的详细信息
      // ... 各工具不同
    },
    error?: {               // 仅失败时存在
      message: string,      // 错误消息
      code: string,         // 错误类型
      stack: string         // 堆栈信息
    }
  }
}
```

---

## 1. web_fetch 的 _debug

### 成功时 (success: true)

```json
{
  "_debug": {
    "tool": "web_fetch",
    "timestamp": "2025-12-08T13:45:23.456Z",
    "duration_ms": 2345,
    "success": true,
    "details": {
      "url": "https://example.com",
      "mode": "ai_summary",              // 或 "regex"
      "summaryModel": "Claude 3.5 Sonnet", // 或 "not configured"
      "processedBy": "ai_summary",       // 实际使用的处理方式
      "fallbackReason": "none",          // 或具体原因
      "htmlLength": 15234,               // HTML长度
      "truncated": false                 // 是否截断
    }
  }
}
```

### 失败时 (success: false)

```json
{
  "_debug": {
    "tool": "web_fetch",
    "timestamp": "2025-12-08T13:45:23.456Z",
    "duration_ms": 1234,
    "success": false,
    "details": {
      "url": "https://example.com",
      "mode": "ai_summary",
      "summaryModel": "not configured"
    },
    "error": {
      "message": "Failed to fetch: Network request failed",
      "code": "TypeError",
      "stack": "TypeError: Network request failed\n  at fetch..."
    }
  }
}
```

### 🔍 如何判断问题

#### 问题1: 为什么用了regex而不是AI summary？

**查看字段:**
- `mode`: 配置的模式
- `processedBy`: 实际使用的处理方式
- `fallbackReason`: 降级原因

**示例:**
```json
{
  "mode": "ai_summary",
  "processedBy": "regex",
  "fallbackReason": "summary model not configured"
}
```
**结论:** AI summary模型未配置，自动降级到regex

#### 问题2: 为什么AI summary失败？

**查看字段:**
- `summaryModel`: 是否为"not configured"
- `error.message`: 具体错误信息
- `fallbackReason`: 降级原因

**可能原因:**
- `summaryModel: "not configured"` → 未配置模型
- `fallbackReason: "model API error"` → 模型API调用失败
- `fallbackReason: "timeout"` → 超时

#### 问题3: 内容被截断了吗？

**查看字段:**
- `truncated`: true/false
- `htmlLength`: 原始HTML长度

**示例:**
```json
{
  "htmlLength": 150000,
  "truncated": true
}
```
**结论:** HTML超过最大长度限制，被截断

#### 问题4: 请求为什么慢？

**查看字段:**
- `duration_ms`: 执行耗时

**示例:**
```json
{
  "duration_ms": 15000
}
```
**结论:** 耗时15秒，可能是网络慢或网页大

---

## 2. perplexity_search 的 _debug

### 成功时

```json
{
  "_debug": {
    "tool": "perplexity_search",
    "timestamp": "2025-12-08T13:45:23.456Z",
    "duration_ms": 5234,
    "success": true,
    "details": {
      "query": "AI developments 2024",
      "resultCount": 10,
      "apiUrl": "https://api.perplexity.ai/search",
      "timeout": 30000
    }
  }
}
```

### 失败时

```json
{
  "_debug": {
    "tool": "perplexity_search",
    "timestamp": "2025-12-08T13:45:23.456Z",
    "duration_ms": 5100,
    "success": false,
    "details": {
      "query": "AI developments 2024",
      "timeout": 30000
    },
    "error": {
      "message": "Search failed: API key invalid",
      "code": "Error",
      "stack": "Error: API key invalid\n  at PerplexitySearchClient..."
    }
  }
}
```

### 🔍 如何判断问题

#### 问题1: API调用失败

**查看字段:**
- `error.message`: 错误消息
- `apiUrl`: 使用的API端点

**常见错误:**
- `"API key invalid"` → API Key错误
- `"API key not configured"` → 未配置API Key
- `"timeout"` → 超时（超过30秒）
- `"Network request failed"` → 网络问题

#### 问题2: 返回结果少

**查看字段:**
- `resultCount`: 实际返回数量

**示例:**
```json
{
  "resultCount": 2
}
```
**结论:** 只返回2个结果，可能是查询太具体或Perplexity找到的结果少

#### 问题3: 请求慢

**查看字段:**
- `duration_ms`: 执行耗时
- `timeout`: 超时设置

**示例:**
```json
{
  "duration_ms": 28000,
  "timeout": 30000
}
```
**结论:** 接近超时，网络可能较慢

---

## 3. perplexity_ask 的 _debug

### 成功时

```json
{
  "_debug": {
    "tool": "perplexity_ask",
    "timestamp": "2025-12-08T13:45:23.456Z",
    "duration_ms": 8234,
    "success": true,
    "details": {
      "query": "What is AI?",
      "apiUrl": "https://api.perplexity.ai/chat/completions",
      "model": "sonar-pro",
      "timeout": 60000
    }
  }
}
```

### 失败时

```json
{
  "_debug": {
    "tool": "perplexity_ask",
    "timestamp": "2025-12-08T13:45:23.456Z",
    "duration_ms": 60100,
    "success": false,
    "details": {
      "query": "What is AI?",
      "apiUrl": "https://api.perplexity.ai/chat/completions",
      "model": "sonar-pro",
      "timeout": 60000
    },
    "error": {
      "message": "Ask failed: Request timeout",
      "code": "Error",
      "stack": "..."
    }
  }
}
```

### 🔍 如何判断问题

#### 问题1: 超时

**查看字段:**
- `duration_ms` vs `timeout`

**示例:**
```json
{
  "duration_ms": 60100,
  "timeout": 60000
}
```
**结论:** 超过60秒超时限制

#### 问题2: API错误

**查看字段:**
- `error.message`
- `model`: 使用的模型

**常见错误:**
- `"API key invalid"` → API Key问题
- `"Rate limit exceeded"` → 超过速率限制
- `"Model not available"` → 模型不可用

---

## 4. perplexity_research 的 _debug

### 成功时

```json
{
  "_debug": {
    "tool": "perplexity_research",
    "timestamp": "2025-12-08T13:45:23.456Z",
    "duration_ms": 180234,
    "success": true,
    "details": {
      "query": "AI research 2024",
      "apiUrl": "https://api.perplexity.ai/chat/completions",
      "model": "sonar-deep-research",
      "timeout": 300000
    }
  }
}
```

### 🔍 如何判断问题

#### 问题1: 耗时太长

**查看字段:**
- `duration_ms`

**示例:**
```json
{
  "duration_ms": 280000
}
```
**结论:** 耗时280秒（4分40秒），接近5分钟上限，这是正常的

#### 问题2: 超时

**查看字段:**
- `duration_ms` vs `timeout`

**示例:**
```json
{
  "duration_ms": 300100,
  "timeout": 300000
}
```
**结论:** 超过5分钟限制，研究太复杂

---

## 5. perplexity_reason 的 _debug

### 成功时

```json
{
  "_debug": {
    "tool": "perplexity_reason",
    "timestamp": "2025-12-08T13:45:23.456Z",
    "duration_ms": 25234,
    "success": true,
    "details": {
      "query": "Solve this problem...",
      "apiUrl": "https://api.perplexity.ai/chat/completions",
      "model": "sonar-reasoning-pro",
      "timeout": 90000
    }
  }
}
```

### 🔍 如何判断问题

类似perplexity_ask，但超时时间为90秒。

---

## 6. MCP工具的 _debug

**注意:** MCP工具目前还没有实现_debug字段

**计划实现:**
```json
{
  "_debug": {
    "tool": "mcp_tool_name",
    "timestamp": "2025-12-08T13:45:23.456Z",
    "duration_ms": 1234,
    "success": true,
    "details": {
      "server": "notion",
      "method": "search_pages",
      "params": {...}
    }
  }
}
```

---

## 常见问题诊断流程

### 问题: web_fetch没有使用AI summary

**步骤:**
1. 查看`_debug.details.mode` → 配置的模式
2. 查看`_debug.details.processedBy` → 实际使用的方式
3. 查看`_debug.details.fallbackReason` → 降级原因
4. 查看`_debug.details.summaryModel` → 模型配置

**可能结果:**
- `summaryModel: "not configured"` → 去Settings配置Summary Model
- `fallbackReason: "model API error"` → 检查模型API是否正常
- `processedBy: "regex"` + `fallbackReason: "none"` → 配置的mode就是regex

---

### 问题: Perplexity工具调用失败

**步骤:**
1. 查看`_debug.success` → 是否成功
2. 查看`_debug.error.message` → 错误消息
3. 查看`_debug.details.apiUrl` → API端点
4. 查看`_debug.duration_ms` vs `timeout` → 是否超时

**可能结果:**
- `error.message: "API key not configured"` → 去Perplexity Settings配置API Key
- `error.message: "API key invalid"` → API Key错误
- `duration_ms > timeout` → 超时，网络慢或查询复杂
- `error.message: "Network request failed"` → 网络问题

---

### 问题: 工具执行很慢

**步骤:**
1. 查看`_debug.duration_ms` → 实际耗时
2. 对比各工具的正常耗时：
   - web_fetch: 1-5秒
   - perplexity_search: 3-10秒
   - perplexity_ask: 5-20秒
   - perplexity_research: 60-300秒
   - perplexity_reason: 10-60秒

**可能原因:**
- 网络慢
- 网页/查询复杂
- API服务器响应慢

---

## 如何查看_debug字段

### 在Chat中
当工具返回结果时，如果开启了Debug，会在返回值中包含`_debug`字段。

**AI会自动读取并可以解释给你:**
```
用户: 为什么没有使用AI summary？
AI: 根据_debug信息，processedBy是regex，fallbackReason是"summary model not configured"，
    说明您还没有配置Summary Model。请到Settings → Web Fetch → Summary Model中配置。
```

### 在代码中
```typescript
const result = await executeTool('web_fetch', { url: 'https://example.com' });
console.log(result._debug);
```

---

## 总结

### _debug字段的价值

1. **快速定位问题**
   - 看`success`知道成败
   - 看`error.message`知道错误原因
   - 看`duration_ms`知道性能

2. **理解工具行为**
   - web_fetch: 知道用了AI还是regex，为什么
   - Perplexity: 知道调用了哪个API，用了什么模型

3. **优化配置**
   - 发现未配置的选项
   - 发现性能瓶颈
   - 发现超时问题

4. **辅助AI诊断**
   - AI可以读取_debug信息
   - AI可以根据_debug给出建议
   - 用户不需要理解技术细节

### 最佳实践

1. **调试时开启Debug**
   - Settings → Enable Debug → ON

2. **遇到问题时查看_debug**
   - 先看`success`
   - 再看`error.message`
   - 最后看`details`

3. **问AI**
   - "为什么这个工具失败了？"
   - "为什么用了regex而不是AI summary？"
   - AI会自动读取_debug并解释

4. **生产环境关闭Debug**
   - 节省token
   - 减少返回数据量
