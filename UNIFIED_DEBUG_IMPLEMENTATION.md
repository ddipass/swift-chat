# 统一Debug功能实现总结

## 实现时间
2025-12-08 16:47

## 目标

为所有工具（web_fetch、Perplexity、MCP）添加统一的debug信息，让用户和AI能够：
1. 看到工具执行的详细信息
2. 了解失败原因
3. 获得调试建议

---

## 实现内容

### 1. 创建统一Debug工具 ✅

**文件：** `src/mcp/ToolDebugUtils.ts`

```typescript
export interface ToolDebugInfo {
  tool: string;              // 工具名称
  timestamp: string;         // ISO时间戳
  duration_ms?: number;      // 执行时长（毫秒）
  success: boolean;          // 是否成功
  details: Record<string, unknown>;  // 工具特定信息
  error?: {                  // 错误信息（如果有）
    message: string;
    code?: string;
    stack?: string;
  };
}

// 创建成功的debug信息
export function createSuccessDebug(
  toolName: string,
  details: Record<string, unknown>,
  startTime?: number
): ToolDebugInfo

// 创建失败的debug信息
export function createErrorDebug(
  toolName: string,
  error: Error | string,
  details: Record<string, unknown>,
  startTime?: number
): ToolDebugInfo
```

---

### 2. web_fetch工具 ✅

**修改：** `src/mcp/BuiltInTools.ts`

**返回格式：**
```json
{
  "content": "...",
  "type": "text",
  "url": "https://...",
  "truncated": true,
  "originalLength": 11474,
  "processedBy": "regex",
  "processingInfo": { ... },
  "_debug": {
    "tool": "web_fetch",
    "timestamp": "2025-12-08T16:47:00.000Z",
    "duration_ms": 1234,
    "success": true,
    "details": {
      "url": "https://...",
      "mode": "ai_summary",
      "summaryModel": "Claude Sonnet 4.5",
      "processedBy": "regex",
      "fallbackReason": "AI returned empty summary",
      "htmlLength": 11474,
      "truncated": true
    }
  }
}
```

**关键信息：**
- `mode`: 配置的模式（ai_summary/regex）
- `processedBy`: 实际使用的模式
- `fallbackReason`: 如果降级，显示原因
- `duration_ms`: 执行时长

---

### 3. Perplexity 4个工具 ✅

**修改：** `src/mcp/PerplexityTools.ts`

#### perplexity_search
```json
{
  "results": [...],
  "formatted": "...",
  "_debug": {
    "tool": "perplexity_search",
    "timestamp": "2025-12-08T16:47:00.000Z",
    "duration_ms": 5234,
    "success": true,
    "details": {
      "query": "AWS Project Rainier",
      "resultCount": 10,
      "timeout": 30000
    }
  }
}
```

#### perplexity_ask
```json
{
  "answer": "...",
  "_debug": {
    "tool": "perplexity_ask",
    "duration_ms": 10123,
    "success": true,
    "details": {
      "query": "...",
      "model": "sonar-pro",
      "timeout": 60000
    }
  }
}
```

#### perplexity_research
```json
{
  "report": "...",
  "_debug": {
    "tool": "perplexity_research",
    "duration_ms": 198456,
    "success": true,
    "details": {
      "query": "...",
      "model": "sonar-deep-research",
      "timeout": 300000
    }
  }
}
```

#### perplexity_reason
```json
{
  "reasoning": "...",
  "_debug": {
    "tool": "perplexity_reason",
    "duration_ms": 32145,
    "success": true,
    "details": {
      "query": "...",
      "model": "sonar-reasoning-pro",
      "timeout": 90000
    }
  }
}
```

---

### 4. 错误情况示例

**API Key未配置：**
```json
{
  "error": "Perplexity API key not configured",
  "_debug": {
    "tool": "perplexity_search",
    "timestamp": "2025-12-08T16:47:00.000Z",
    "duration_ms": 2,
    "success": false,
    "details": {
      "query": "test query"
    },
    "error": {
      "message": "API key not configured",
      "code": "Error"
    }
  }
}
```

**超时错误：**
```json
{
  "error": "Search failed: Timeout after 30s",
  "_debug": {
    "tool": "perplexity_search",
    "timestamp": "2025-12-08T16:47:00.000Z",
    "duration_ms": 30001,
    "success": false,
    "details": {
      "query": "test query",
      "timeout": 30000
    },
    "error": {
      "message": "Timeout after 30s",
      "code": "AbortError",
      "stack": "..."
    }
  }
}
```

---

## 使用场景

### 场景1：AI Summary降级

**用户：** 帮我fetch这个网页

**工具返回：**
```json
{
  "content": "...",
  "processedBy": "regex",
  "_debug": {
    "mode": "ai_summary",
    "summaryModel": "Claude Sonnet 4.5",
    "processedBy": "regex",
    "fallbackReason": "AI returned empty summary",
    "duration_ms": 15234
  }
}
```

**AI回答：**
> 我使用了web_fetch工具获取内容。虽然你配置了AI Summary模式（使用Claude Sonnet 4.5），但工具降级使用了regex模式，原因是：AI返回了空的摘要结果。执行耗时15秒。内容如下：...

### 场景2：Perplexity超时

**用户：** 用Perplexity搜索一下

**工具返回：**
```json
{
  "error": "Search failed: Timeout after 30s",
  "_debug": {
    "tool": "perplexity_search",
    "duration_ms": 30001,
    "success": false,
    "error": {
      "message": "Timeout after 30s"
    }
  }
}
```

**AI回答：**
> Perplexity搜索失败了，原因是超时（30秒）。这可能是因为网络问题或Perplexity服务响应慢。建议：
> 1. 检查网络连接
> 2. 稍后重试
> 3. 或者使用web_fetch工具

### 场景3：API Key未配置

**用户：** 用Perplexity research深度研究

**工具返回：**
```json
{
  "error": "Perplexity API key not configured",
  "_debug": {
    "tool": "perplexity_research",
    "success": false,
    "error": {
      "message": "API key not configured"
    }
  }
}
```

**AI回答：**
> 无法使用Perplexity research工具，原因是：API key未配置。请前往Settings → Perplexity Search，输入你的API key。

---

## 代码变更统计

| 文件 | 变更 | 说明 |
|------|------|------|
| ToolDebugUtils.ts | +72行 | 新增统一debug工具 |
| BuiltInTools.ts | +15行 | web_fetch添加debug |
| PerplexityTools.ts | +120行 | 4个工具添加debug |
| **总计** | **+207行** | |

---

## 优势

### 1. 透明性 ✅
- 用户能看到工具执行的详细信息
- AI能解释为什么工具失败
- 开发者能快速定位问题

### 2. 可调试性 ✅
- 不依赖console日志
- 所有信息都在返回结果中
- 包含执行时长，方便性能分析

### 3. 一致性 ✅
- 所有工具使用相同的debug格式
- 统一的错误处理方式
- 易于扩展到新工具

### 4. 生产环境友好 ✅
- 不需要查看日志文件
- 用户可以直接看到问题
- AI可以提供针对性建议

---

## 未来扩展

### MCP工具
可以在MCPClient层添加debug包装：

```typescript
async function executeMCPTool(server, tool, args) {
  const startTime = Date.now();
  try {
    const result = await mcpClient.callTool(tool, args);
    return {
      ...result,
      _debug: createSuccessDebug('mcp_' + tool, {
        serverId: server.id,
        serverUrl: server.url,
        authType: server.authType,
      }, startTime),
    };
  } catch (error) {
    return {
      error: error.message,
      _debug: createErrorDebug('mcp_' + tool, error, {
        serverId: server.id,
      }, startTime),
    };
  }
}
```

### 新工具
所有新工具都应该使用统一的debug格式：

```typescript
import { createSuccessDebug, createErrorDebug } from './ToolDebugUtils';

const myNewTool: BuiltInTool = {
  name: 'my_new_tool',
  execute: async (args) => {
    const startTime = Date.now();
    try {
      const result = await doSomething(args);
      return {
        result,
        _debug: createSuccessDebug('my_new_tool', {
          // 工具特定信息
        }, startTime),
      };
    } catch (error) {
      return {
        error: error.message,
        _debug: createErrorDebug('my_new_tool', error, {
          // 工具特定信息
        }, startTime),
      };
    }
  },
};
```

---

## 测试建议

### 1. 正常执行
- [ ] web_fetch成功返回，包含_debug字段
- [ ] Perplexity工具成功返回，包含_debug字段
- [ ] duration_ms正确计算

### 2. 错误情况
- [ ] API key未配置，返回友好错误和debug
- [ ] 超时错误，包含超时信息
- [ ] 网络错误，包含错误详情

### 3. AI理解
- [ ] AI能读取_debug信息
- [ ] AI能解释失败原因
- [ ] AI能提供解决建议

---

## 总结

### 实现的功能
1. ✅ 创建统一的debug工具函数
2. ✅ web_fetch添加完整debug信息
3. ✅ Perplexity 4个工具添加debug信息
4. ✅ 包含执行时长、错误详情、工具特定信息

### 代码质量
- ESLint: 0错误 ✅
- TypeScript: 0错误 ✅
- Prettier: 格式正确 ✅

### 用户体验
- 透明：能看到工具执行详情 ✅
- 可调试：不依赖console日志 ✅
- 一致：所有工具统一格式 ✅

---

## 审查人员
- 实现人：Kiro AI Assistant
- 实现日期：2025-12-08
- 实现结论：✅ **完成，可以测试**
