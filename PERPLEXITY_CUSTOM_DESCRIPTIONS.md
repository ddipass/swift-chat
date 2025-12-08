# Perplexity工具自定义描述功能

## 问题分析

用户提出了一个非常重要的问题：

> "如果你是AI，你如何自动判断应该使用哪个search工具？是不是在search的配置界面，需要每个工具给一个简单的说明，这个说明允许客户修订，以引导AI来选择使用正确的工具？"

### 当前问题

1. **工具描述硬编码**
   - 所有工具的`description`字段都硬编码在代码中
   - 用户无法根据自己的使用场景调整描述
   - AI只能根据固定的描述来选择工具

2. **AI选择困难**
   - `perplexity_search` - "Returns ranked search results" → AI可能认为只返回链接列表
   - `perplexity_ask` - "Returns a conversational answer" → AI可能认为这个更适合回答问题
   - 用户无法引导AI根据自己的需求选择合适的工具

## 解决方案

### 1. 架构改进

**之前：**
```typescript
const perplexitySearchTool: BuiltInTool = {
  name: 'perplexity_search',
  description: '硬编码的描述...',  // 无法修改
  // ...
};
```

**之后：**
```typescript
function createSearchTool(customDescription?: string): BuiltInTool {
  return {
    name: 'perplexity_search',
    description: customDescription || DEFAULT_DESCRIPTIONS.search,  // 支持自定义
    // ...
  };
}
```

### 2. 存储层支持

**新增存储函数：**
```typescript
export interface PerplexityToolDescription {
  search?: string;
  ask?: string;
  research?: string;
  reason?: string;
}

export function getPerplexityToolDescriptions(): PerplexityToolDescription
export function savePerplexityToolDescriptions(descriptions: PerplexityToolDescription)
```

### 3. UI功能

**新增编辑功能：**
- ✎ 按钮：点击进入编辑模式
- ✓ 按钮：保存并退出编辑
- 多行文本输入：支持长描述
- Reset按钮：恢复默认描述

**UI布局：**
```
┌─────────────────────────────────┐
│ Search                [✎]  [⚪] │
│ Search the web using...         │
│ Timeout: 30s                    │
└─────────────────────────────────┘

点击✎后：
┌─────────────────────────────────┐
│ Search                [✓]  [⚪] │
│ ┌─────────────────────────────┐ │
│ │ [可编辑的多行文本框]        │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│ Reset to default                │
└─────────────────────────────────┘
```

### 4. 使用场景示例

**场景1：用户希望AI优先使用search获取原始链接**
```
自定义描述：
"Use this tool when user explicitly asks for web links, URLs, or wants to see 
multiple search results. Returns a list of ranked web pages with titles, URLs, 
and snippets. DO NOT use this for answering questions directly."
```

**场景2：用户希望AI优先使用ask获取答案**
```
自定义描述：
"Use this tool for ALL questions that need current information from the web. 
Returns a direct conversational answer with citations. This is the DEFAULT 
tool for web-based questions. Fast response (~10s)."
```

**场景3：用户希望research只用于特定关键词**
```
自定义描述：
"Use ONLY when user explicitly says 'deep research', 'comprehensive analysis', 
or 'detailed investigation'. Takes 5 minutes. For normal questions, use 'ask' 
tool instead."
```

## 实现细节

### 1. 工具工厂模式

```typescript
const toolFactories: Record<string, (desc?: string) => BuiltInTool> = {
  search: createSearchTool,
  ask: createAskTool,
  research: createResearchTool,
  reason: createReasonTool,
};

export function getPerplexityTools(): BuiltInTool[] {
  const customDescriptions = getPerplexityToolDescriptions();
  
  return enabledToolIds
    .map(id => {
      const factory = toolFactories[id];
      return factory(customDescriptions[id]);  // 传入自定义描述
    })
    .filter((tool): tool is BuiltInTool => tool !== undefined);
}
```

### 2. 默认描述导出

```typescript
export function getDefaultToolDescriptions() {
  return DEFAULT_DESCRIPTIONS;
}
```

UI可以使用这个函数来：
- 显示默认描述
- 实现Reset功能
- 对比用户是否修改过

### 3. 状态管理

```typescript
const [toolDescriptions, setToolDescriptions] = 
  useState<PerplexityToolDescription>(getPerplexityToolDescriptions());
const [editingTool, setEditingTool] = useState<string | null>(null);

const defaultDescriptions = getDefaultToolDescriptions();
```

## 用户体验改进

### 1. 新增信息卡片

```
┌─────────────────────────────────┐
│ ✎ Customize Tool Descriptions   │
│ • Click ✎ to edit how AI        │
│   understands each tool          │
│ • Customize descriptions to      │
│   guide AI selection             │
│ • Reset to default anytime       │
└─────────────────────────────────┘
```

### 2. 编辑体验

- 点击✎进入编辑模式
- 文本框自动聚焦
- 支持多行输入
- 实时保存（onChangeText）
- 点击✓或其他工具的✎退出编辑

### 3. Reset功能

- 只在有自定义描述时显示
- 点击后立即恢复默认
- 自动退出编辑模式

## 代码变更统计

| 文件 | 变更 | 说明 |
|------|------|------|
| PerplexityTools.ts | +40行 | 工具工厂函数 + 默认描述导出 |
| StorageUtils.ts | +25行 | 自定义描述存储 |
| PerplexitySettingsScreen.tsx | +60行 | 编辑UI + 状态管理 |
| **总计** | **+125行** | |

## 测试场景

### 1. 默认行为
- 未自定义时，使用DEFAULT_DESCRIPTIONS
- AI根据默认描述选择工具

### 2. 自定义后
- 用户修改search描述强调"返回链接"
- AI在需要链接时优先选择search

### 3. Reset功能
- 点击Reset恢复默认
- 自定义描述被删除
- AI恢复使用默认描述

### 4. 多工具自定义
- 可以同时自定义多个工具
- 每个工具独立保存
- 互不影响

## 优势

1. **灵活性** ✅
   - 用户可以根据自己的使用习惯调整
   - 支持不同语言的描述
   - 支持特定领域的术语

2. **可控性** ✅
   - 用户完全控制AI如何理解工具
   - 可以强制AI使用或避免某个工具
   - 可以添加使用条件和限制

3. **可维护性** ✅
   - 默认描述仍然保留
   - Reset功能随时恢复
   - 不影响代码升级

4. **用户体验** ✅
   - 直观的编辑界面
   - 实时保存
   - 清晰的视觉反馈

## 最终效果

用户现在可以：
1. 点击✎编辑任何工具的描述
2. 用自己的语言描述工具用途
3. 引导AI根据自己的需求选择工具
4. 随时Reset恢复默认

这个功能让SwiftChat的Perplexity集成更加智能和个性化！🎉
