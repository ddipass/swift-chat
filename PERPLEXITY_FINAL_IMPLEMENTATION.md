# Perplexity Search 最终实现总结

## 实现时间
2025-12-08 16:10 - 16:30

## 核心功能

### 1. 4个Perplexity工具 ✅
- `perplexity_search` - 网页搜索 (30s)
- `perplexity_ask` - 对话式AI (60s)
- `perplexity_research` - 深度研究 (300s)
- `perplexity_reason` - 高级推理 (90s)

### 2. 用户可选工具 ✅
- 每个工具独立的enable/disable开关
- 默认只启用search工具
- 动态工具注册

### 3. **新增：自定义工具描述** 🆕
- 用户可编辑每个工具的描述
- 引导AI选择正确的工具
- 支持Reset恢复默认

## 架构设计

### 工具工厂模式

```typescript
// 默认描述
const DEFAULT_DESCRIPTIONS = {
  search: '...',
  ask: '...',
  research: '...',
  reason: '...',
};

// 工具工厂函数
function createSearchTool(customDescription?: string): BuiltInTool {
  return {
    name: 'perplexity_search',
    description: customDescription || DEFAULT_DESCRIPTIONS.search,
    inputSchema: { /* ... */ },
    execute: async (args) => { /* ... */ },
  };
}

// 动态创建工具
export function getPerplexityTools(): BuiltInTool[] {
  const customDescriptions = getPerplexityToolDescriptions();
  
  return enabledToolIds.map(id => {
    const factory = toolFactories[id];
    return factory(customDescriptions[id]);
  });
}
```

### 存储层

```typescript
// 新增接口
export interface PerplexityToolDescription {
  search?: string;
  ask?: string;
  research?: string;
  reason?: string;
}

// 新增函数
export function getPerplexityToolDescriptions(): PerplexityToolDescription
export function savePerplexityToolDescriptions(descriptions: PerplexityToolDescription)
```

### UI层

```typescript
// 状态管理
const [toolDescriptions, setToolDescriptions] = useState(...)
const [editingTool, setEditingTool] = useState<string | null>(null)

// 编辑功能
const handleDescriptionChange = (toolId, value) => {
  const newDescriptions = { ...toolDescriptions, [toolId]: value };
  savePerplexityToolDescriptions(newDescriptions);
}

const handleResetDescription = (toolId) => {
  delete newDescriptions[toolId];
  savePerplexityToolDescriptions(newDescriptions);
}
```

## UI设计

### 工具卡片（默认状态）

```
┌─────────────────────────────────┐
│ Search                [✎]  [⚪] │
│ Search the web using...         │
│ Timeout: 30s                    │
└─────────────────────────────────┘
```

### 工具卡片（编辑状态）

```
┌─────────────────────────────────┐
│ Search                [✓]  [⚪] │
│ ┌─────────────────────────────┐ │
│ │ [多行文本输入框]            │ │
│ │ 用户可以自定义描述...       │ │
│ └─────────────────────────────┘ │
│ Reset to default                │
└─────────────────────────────────┘
```

### 新增信息卡片

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

## 使用场景

### 场景1：强制AI使用search获取链接

**自定义search描述：**
```
Use this tool when user asks for web links, URLs, or search results. 
Returns a list of ranked web pages. DO NOT use for answering questions.
```

**自定义ask描述：**
```
Use this tool for ALL questions. Returns direct answers with citations.
This is the DEFAULT tool for questions.
```

**效果：**
- 用户问"最新新闻" → AI使用ask返回答案
- 用户问"给我一些链接" → AI使用search返回链接列表

### 场景2：限制research使用

**自定义research描述：**
```
Use ONLY when user explicitly says "deep research" or "comprehensive analysis".
Takes 5 minutes. For normal questions, use 'ask' instead.
```

**效果：**
- 用户问"研究量子计算" → AI使用ask（快速）
- 用户问"深度研究量子计算" → AI使用research（5分钟）

### 场景3：中文描述

**自定义描述（中文）：**
```
search: 当用户明确要求"搜索"、"查找链接"时使用。返回网页列表。
ask: 当用户提问时使用。返回带引用的答案。这是默认工具。
research: 仅当用户说"深度研究"、"详细分析"时使用。需要5分钟。
reason: 当用户需要逻辑推理、决策分析时使用。
```

## 代码变更

### 1. PerplexityTools.ts (+40行)

**变更：**
- 将4个工具常量改为工厂函数
- 添加DEFAULT_DESCRIPTIONS常量
- 导出getDefaultToolDescriptions()
- 更新getPerplexityTools()使用工厂模式

**关键代码：**
```typescript
function createSearchTool(customDescription?: string): BuiltInTool {
  return {
    name: 'perplexity_search',
    description: customDescription || DEFAULT_DESCRIPTIONS.search,
    // ...
  };
}
```

### 2. StorageUtils.ts (+25行)

**新增：**
- PerplexityToolDescription接口
- getPerplexityToolDescriptions()
- savePerplexityToolDescriptions()

### 3. PerplexitySettingsScreen.tsx (+60行)

**新增：**
- toolDescriptions状态
- editingTool状态
- handleDescriptionChange()
- handleResetDescription()
- 编辑UI（TextInput + Reset按钮）
- 自定义描述信息卡片

**UI改进：**
- 工具名称旁边添加✎/✓按钮
- 点击✎进入编辑模式
- 多行文本输入框
- Reset按钮（仅在有自定义时显示）

## 代码质量

### ESLint ✅
```
✖ 15 problems (0 errors, 15 warnings)
```
- 0个错误
- 15个no-alert警告（预期的）
- 新增1个warning（PerplexitySettingsScreen的alert）

### TypeScript ✅
- Perplexity相关代码：0个类型错误
- 所有类型定义完整
- 接口定义清晰

### Prettier ✅
- 所有文件格式正确
- 代码风格一致

## 测试清单

### 功能测试
- [ ] 点击✎进入编辑模式
- [ ] 修改描述后自动保存
- [ ] 点击✓退出编辑模式
- [ ] Reset按钮恢复默认
- [ ] 自定义描述影响AI选择
- [ ] 多个工具可同时自定义

### 边界测试
- [ ] 空描述处理
- [ ] 超长描述处理
- [ ] 特殊字符处理
- [ ] 多行文本显示

### 集成测试
- [ ] 与其他工具（web_fetch）并发
- [ ] 工具启用/禁用正确
- [ ] 存储持久化正确

## 优势总结

### 1. 灵活性 🎯
- 用户完全控制AI如何理解工具
- 支持任何语言的描述
- 支持特定领域术语

### 2. 智能性 🧠
- 引导AI选择正确工具
- 减少AI选择错误
- 提高响应准确性

### 3. 可维护性 🔧
- 默认描述保留
- Reset功能随时恢复
- 不影响代码升级

### 4. 用户体验 ✨
- 直观的编辑界面
- 实时保存
- 清晰的视觉反馈

## Commit Message

```
feat: Add customizable tool descriptions for Perplexity Search

- Implement tool factory pattern for dynamic description injection
- Add storage functions for custom tool descriptions
- Add edit UI with ✎/✓ buttons and multiline TextInput
- Add Reset functionality to restore default descriptions
- Allow users to guide AI tool selection through custom descriptions
- Support any language for tool descriptions

This enables users to customize how AI understands each Perplexity tool,
improving tool selection accuracy and user control.
```

## 下一步

### 可选增强
1. **描述模板** - 提供常用描述模板供用户选择
2. **描述验证** - 检查描述长度和格式
3. **描述预览** - 显示AI如何理解描述
4. **导入/导出** - 分享自定义描述配置

### 文档更新
- [ ] 更新README.md
- [ ] 添加用户指南
- [ ] 添加最佳实践示例

## 总结

这次实现不仅完成了Perplexity Search的基础集成，还通过**自定义工具描述**功能，让用户可以：

1. ✅ 引导AI选择正确的工具
2. ✅ 根据使用场景调整工具行为
3. ✅ 使用任何语言描述工具
4. ✅ 完全控制AI的工具理解

这是一个**用户驱动的AI工具选择系统**，大大提高了SwiftChat的灵活性和智能性！🎉
