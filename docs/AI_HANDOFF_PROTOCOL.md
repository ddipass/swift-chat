# AI 交接协议

## 文档目的

本文档定义了如何在任何阶段将SwiftChat Flutter项目交接给另一个AI助手。

---

## 交接场景

### 场景1: 项目启动交接
**触发条件**: 新AI助手接手项目，从零开始

**交接提示词**:
```
我需要你帮我开发SwiftChat的Flutter版本。

项目背景:
- 已有React Native版本，源码在 react-native/ 目录
- 已有完整后端API
- 目标: 使用Flutter复刻UI并集成后端

请执行以下步骤:
1. 阅读 FLUTTER_IMPLEMENTATION_PLAN.md 了解整体计划
2. 阅读 docs/COMPONENT_CHECKLIST.md 了解当前进度
3. 告诉我当前应该做什么任务
```

---

### 场景2: 开发中交接
**触发条件**: 项目进行到某个阶段，需要切换AI助手

**交接提示词**:
```
我需要你继续开发SwiftChat Flutter项目。

当前状态:
- 项目位置: /Users/xxx/swift-chat/
- 当前阶段: [从 COMPONENT_CHECKLIST.md 中查看最后一个勾选的任务]
- 已完成: [列出已勾选的任务]
- 待完成: [列出未勾选的任务]

请执行以下步骤:
1. 检查 docs/COMPONENT_CHECKLIST.md 确认当前进度
2. 阅读下一个任务的要求
3. 如果需要UI细节，参考 docs/UI_REPLICATION_GUIDE.md
4. 开始执行下一个任务
```

---

### 场景3: 调试/优化交接
**触发条件**: 遇到问题需要另一个AI助手帮助

**交接提示词**:
```
SwiftChat Flutter项目遇到问题，需要你帮助解决。

项目背景:
- 项目位置: /Users/xxx/swift-chat/
- 当前阶段: [Week X Day Y]
- 问题描述: [具体问题]
- 相关文件: [列出相关文件路径]

请执行以下步骤:
1. 阅读相关文件了解上下文
2. 如果是UI问题，参考 react-native/src/ 中的源实现
3. 如果是API问题，参考 docs/API_INTEGRATION_GUIDE.md
4. 提供解决方案
```

---

### 场景4: 代码审查交接
**触发条件**: 需要另一个AI审查代码质量

**交接提示词**:
```
请审查SwiftChat Flutter项目的代码质量。

审查范围:
- 文件: [列出需要审查的文件]
- 对照标准: docs/UI_REPLICATION_GUIDE.md 中的规范
- 源码参考: react-native/src/ 中的对应文件

请检查:
1. UI是否与React Native版本一致
2. 代码是否符合Flutter最佳实践
3. 是否有性能问题
4. 是否有安全问题

输出格式:
- ✅ 通过项
- ⚠️ 警告项
- ❌ 必须修复项
```

---

## 文档结构要求

### 每个文档必须包含的AI元数据

```markdown
---
AI_CONTEXT:
  project: SwiftChat Flutter
  purpose: [文档用途]
  dependencies: [依赖的其他文档]
  source_reference: [React Native源码路径]
  last_updated: [日期]
---
```

---

## 任务描述规范

### ❌ 错误示例 (AI无法执行)
```
- [ ] 实现消息气泡
```

### ✅ 正确示例 (AI可执行)
```
- [ ] 实现消息气泡
  **输入**: 
  - 源文件: react-native/src/chat/component/CustomMessageComponent.tsx
  - 数据模型: lib/models/message.dart
  
  **输出**: 
  - 文件: lib/widgets/message_bubble.dart
  - 包含: MessageBubble Widget类
  
  **要求**:
  1. 用户消息: 右对齐，背景色 colors.messageBackground，圆角22
  2. AI消息: 左对齐，显示头像和用户名
  3. 支持长按复制
  
  **验证**:
  - [ ] 运行 flutter run，能看到消息气泡
  - [ ] 样式与 react-native/src/chat/component/CustomMessageComponent.tsx 一致
  - [ ] 长按能复制文本
  
  **参考**: docs/UI_REPLICATION_GUIDE.md § 消息气泡
```

---

## 状态追踪规范

### 进度文件格式

```markdown
## 当前状态
- **阶段**: Week 2 Day 3
- **任务**: 设置界面核心
- **进度**: 60% (3/5 子任务完成)
- **阻塞**: 无
- **下一步**: 实现模型选择下拉框

## 已完成任务
- [x] Week 1 Day 1-2: 项目基础
  - 完成时间: 2025-12-14
  - 提交: commit abc123
  - 验证: ✅ 通过
  
- [x] Week 1 Day 3-4: 聊天界面基础
  - 完成时间: 2025-12-16
  - 提交: commit def456
  - 验证: ✅ 通过

## 待完成任务
- [ ] Week 2 Day 3-4: 设置界面核心
  - 预计完成: 2025-12-18
  - 依赖: 无
  - 风险: 低
```

---

## AI提示词模板

### 模板1: 开始新任务

```
我需要你执行以下任务:

**任务**: [从 COMPONENT_CHECKLIST.md 复制任务描述]

**上下文**:
- 项目路径: /Users/xxx/swift-chat/
- 当前阶段: Week X Day Y
- 已完成: [列出相关的已完成任务]

**输入文件**:
- [列出需要读取的文件]

**输出文件**:
- [列出需要创建的文件]

**参考文档**:
- UI规范: docs/UI_REPLICATION_GUIDE.md § [相关章节]
- 源码: react-native/src/[相关文件]

请执行以下步骤:
1. 读取输入文件了解上下文
2. 阅读参考文档了解要求
3. 创建输出文件
4. 验证是否符合要求
5. 更新 COMPONENT_CHECKLIST.md 勾选任务
```

---

### 模板2: 继续未完成任务

```
我需要你继续之前未完成的任务。

**任务**: [任务名称]

**当前状态**:
- 已完成: [列出已完成的部分]
- 未完成: [列出未完成的部分]
- 问题: [如果有问题，描述问题]

**相关文件**:
- [列出已创建的文件]

请执行以下步骤:
1. 读取相关文件了解当前进度
2. 继续完成未完成的部分
3. 验证是否符合要求
4. 更新 COMPONENT_CHECKLIST.md
```

---

### 模板3: 调试问题

```
项目遇到问题，需要你帮助调试。

**问题描述**: [详细描述问题]

**复现步骤**:
1. [步骤1]
2. [步骤2]
3. [观察到的错误]

**预期行为**: [应该是什么样的]

**相关文件**:
- [列出可能相关的文件]

**参考**:
- React Native实现: react-native/src/[相关文件]
- UI规范: docs/UI_REPLICATION_GUIDE.md § [相关章节]

请执行以下步骤:
1. 读取相关文件了解上下文
2. 对比React Native实现找出差异
3. 提供修复方案
4. 验证修复是否有效
```

---

### 模板4: 代码审查

```
请审查以下代码是否符合规范。

**审查文件**: [文件路径]

**审查标准**:
- UI一致性: 对比 react-native/src/[对应文件]
- 代码质量: Flutter最佳实践
- 性能: 是否有性能问题
- 安全: 是否有安全隐患

**参考文档**:
- docs/UI_REPLICATION_GUIDE.md § [相关章节]

请输出:
1. ✅ 通过项: [列出符合要求的部分]
2. ⚠️ 警告项: [列出可以改进的部分]
3. ❌ 必须修复项: [列出必须修改的部分]
4. 修改建议: [具体的修改方案]
```

---

## 关键信息清单

### AI需要知道的项目信息

```yaml
project:
  name: SwiftChat Flutter
  type: UI Replication + Backend Integration
  
source:
  framework: React Native
  location: react-native/src/
  
target:
  framework: Flutter
  location: flutter_app/
  
backend:
  status: Already Implemented
  api_docs: docs/API_INTEGRATION_GUIDE.md
  
timeline:
  total: 11-13 weeks
  phase1: Week 1-2 (MVP)
  phase2: Week 3 (Integration)
  phase3: Week 4-12 (Optimization)
  
current_progress:
  check: docs/COMPONENT_CHECKLIST.md
  
references:
  ui_guide: docs/UI_REPLICATION_GUIDE.md
  api_guide: docs/API_INTEGRATION_GUIDE.md
  main_plan: FLUTTER_IMPLEMENTATION_PLAN.md
```

---

## 交接检查清单

### 交接前 (交出方)
- [ ] 更新 COMPONENT_CHECKLIST.md 勾选所有已完成任务
- [ ] 提交所有代码到Git
- [ ] 记录当前遇到的问题 (如果有)
- [ ] 记录下一步计划

### 交接时 (双方)
- [ ] 确认当前进度
- [ ] 确认待完成任务
- [ ] 确认已知问题
- [ ] 确认参考文档路径

### 交接后 (接收方)
- [ ] 阅读 FLUTTER_IMPLEMENTATION_PLAN.md
- [ ] 检查 COMPONENT_CHECKLIST.md 当前进度
- [ ] 运行项目验证环境
- [ ] 开始下一个任务

---

## 最佳实践

### 1. 始终从检查清单开始
```
第一句话应该是: "请打开 docs/COMPONENT_CHECKLIST.md 告诉我当前进度"
```

### 2. 明确任务边界
```
不要说: "实现聊天功能"
应该说: "实现 Week 1 Day 3-4 的聊天界面基础，包括消息列表、输入框、发送按钮"
```

### 3. 提供完整上下文
```
不要说: "这个组件有问题"
应该说: "lib/widgets/message_bubble.dart 的消息气泡组件，与 react-native/src/chat/component/CustomMessageComponent.tsx 对比，圆角不一致"
```

### 4. 验证可执行
```
不要说: "看起来不错"
应该说: "运行 flutter run，打开聊天页面，发送消息，消息气泡样式与React Native版本一致"
```

---

**最后更新**: 2025-12-13
