# SwiftChat Flutter 实施计划

---
**AI_CONTEXT**:
```yaml
project: SwiftChat Flutter
purpose: 主执行计划 - 定义时间线和任务
dependencies:
  - docs/COMPONENT_CHECKLIST.md (任务清单)
  - docs/UI_REPLICATION_GUIDE.md (UI规范)
  - docs/API_INTEGRATION_GUIDE.md (API集成)
source_reference: react-native/src/
last_updated: 2025-12-13
```
---

## 🤖 AI交接指南

### 如果你是新接手的AI助手，请先执行:
```
1. 阅读本文档了解整体计划
2. 打开 docs/COMPONENT_CHECKLIST.md 查看当前进度
3. 找到最后一个勾选 [x] 的任务
4. 开始执行下一个未勾选 [ ] 的任务
5. 如需UI细节，参考 docs/UI_REPLICATION_GUIDE.md
6. 如需API对接，参考 docs/API_INTEGRATION_GUIDE.md
```

### 标准交接提示词
```
我需要你继续开发SwiftChat Flutter项目。

项目路径: /Users/dpliu/swift-chat/
当前进度: [从 docs/COMPONENT_CHECKLIST.md 查看]

请告诉我:
1. 当前完成到哪个阶段
2. 下一个任务是什么
3. 需要创建哪些文件
```

---

## 🔄 实施计划调整 (2025-12-14)

### 决策：提前进行后端集成

**当前进度**: Week 2 Day 3-4 完成

**调整原因**:
1. UI 框架已完整（聊天界面 + 设置界面 + 导航）
2. 配置系统已就绪（SharedPreferences 保存/加载）
3. MVP 原则 - 应先打通核心功能链路
4. 真实验证 - 基于真实 API 响应优化 UI
5. 避免返工 - 文件上传等功能应基于真实需求实现

**新的执行顺序**:
```
✅ Week 1: 核心交互链路 (已完成)
✅ Week 2 Day 1-4: 消息气泡 + 设置界面 (已完成)
→ Week 3: 后端集成 (提前执行) ⭐ 当前阶段
  ├─ Day 1-2: 文本聊天 API
  ├─ Day 3: 错误处理和优化
  └─ Day 4-5: 数据持久化
→ Week 2 Day 5-7: 剩余 UI 功能 (基于真实场景)
  ├─ Day 5: 文件上传
  └─ Day 6-7: UI 打磨
```

**预期收益**:
- 立即可用 - App 从演示变成真正的工具
- 真实反馈 - 发现并解决实际问题
- 避免返工 - UI 功能基于真实 API 开发
- 提升效率 - 后续功能基于真实需求实现

---

## 项目概述

**目标**: 使用Flutter复刻SwiftChat React Native版本的UI，并集成现有后端API

**策略**: MVP快速验证 → 尽早集成 → 边用边优化

**总时长**: 11-13周

---

## 时间线总览

```
Week 1-2  ████████░░░░░░░░░░░░░░░░  MVP骨架 (可演示)
Week 3    ░░░░░░░░████░░░░░░░░░░░░  后端集成 (可使用)
Week 4-12 ░░░░░░░░░░░░████████████  渐进式完善 (持续优化)
```

---

## 阶段 0: MVP骨架 (Week 1-2)

### 目标
构建最小可用UI，能看、能点、能跑通基本流程

### Week 1: 核心交互链路

#### Day 1-2: 项目基础
**任务**:
- [ ] 执行 `flutter create --platforms=android,ios,macos,windows,web flutter_app`
- [ ] 配置 pubspec.yaml 依赖
- [ ] 创建项目目录结构
- [ ] 提取颜色系统 (参考: docs/UI_REPLICATION_GUIDE.md § 颜色系统)
- [ ] 提取字体系统 (参考: docs/UI_REPLICATION_GUIDE.md § 字体系统)

**输出文件**:
```
lib/
├── theme/
│   ├── swift_chat_colors.dart
│   └── swift_chat_text_styles.dart
└── main.dart
```

**验收**: 
- ✅ 项目能运行
- ✅ 浅色/深色主题切换正常

---

#### Day 3-4: 聊天界面基础
**任务**:
- [ ] 创建消息数据模型 (简化版)
- [ ] 实现消息列表 (ListView.builder)
- [ ] 实现基础输入框
- [ ] 实现发送按钮
- [ ] 使用Mock数据测试

**输出文件**:
```
lib/
├── models/
│   └── message.dart
├── screens/
│   └── chat_screen.dart
├── widgets/
│   ├── message_bubble.dart (简化版)
│   └── input_toolbar.dart (简化版)
└── services/
    └── mock_api_service.dart
```

**参考**: docs/UI_REPLICATION_GUIDE.md § 消息气泡 (只实现基础样式)

**验收**:
- ✅ 能显示消息列表
- ✅ 能输入文本
- ✅ 点击发送后消息出现在列表中

---

#### Day 5-6: 导航结构
**任务**:
- [ ] 实现抽屉导航 (Drawer)
- [ ] 实现历史记录列表 (简化版，平铺显示)
- [ ] 实现设置页面框架 (空白页面，只有标题)
- [ ] 实现页面路由

**输出文件**:
```
lib/
├── navigation/
│   └── app_router.dart
├── screens/
│   ├── settings_screen.dart (框架)
│   └── history_screen.dart (简化版)
└── widgets/
    └── app_drawer.dart
```

**参考**: 
- docs/UI_REPLICATION_GUIDE.md § 抽屉导航 (简化版，不做日期分组)
- 抽屉宽度计算: `minWidth > 434 ? 300 : minWidth * 0.83`

**验收**:
- ✅ 抽屉能打开/关闭
- ✅ 能看到历史记录列表
- ✅ 点击历史记录能跳转到聊天页面

---

#### Day 7: 自测和调整
**任务**:
- [ ] 修复明显的UI问题
- [ ] 调整间距和对齐
- [ ] 准备API适配层接口定义

**输出文件**:
```
lib/services/
├── api_service.dart (抽象接口)
└── mock_api_service.dart (实现类)
```

---

### Week 2: 关键功能补充

#### Day 1-2: 消息气泡样式
**任务**:
- [ ] 完善用户消息气泡样式
- [ ] 完善AI消息气泡样式
- [ ] 实现基础Markdown渲染 (段落、代码块)
- [ ] 添加消息头像和用户名

**参考**: docs/UI_REPLICATION_GUIDE.md § 消息气泡 (完整样式)

**验收**:
- ✅ 消息气泡样式与React Native一致
- ✅ 代码块能正确显示
- ✅ 用户消息和AI消息样式有区分

---

#### Day 3-4: 设置界面核心
**任务**:
- [ ] 实现Bedrock配置表单
- [ ] 实现模型选择下拉框
- [ ] 实现配置保存/加载 (SharedPreferences)
- [ ] 实现表单验证

**输出文件**:
```
lib/
├── screens/
│   └── settings_screen.dart (完整实现)
└── widgets/
    ├── custom_text_field.dart
    └── custom_dropdown.dart
```

**参考**: docs/UI_REPLICATION_GUIDE.md § 设置界面

**验收**:
- ✅ 能输入API URL和API Key
- ✅ 能选择模型
- ✅ 配置能保存和加载

---

#### Day 5: 文件上传基础
**任务**:
- [ ] 实现图片选择器 (file_picker)
- [ ] 实现图片预览
- [ ] 实现文件列表显示

**输出文件**:
```
lib/widgets/
├── file_picker_button.dart
└── file_preview.dart
```

**参考**: docs/UI_REPLICATION_GUIDE.md § 文件处理

**验收**:
- ✅ 能选择图片
- ✅ 图片能预览
- ✅ 能删除已选图片

---

#### Day 6-7: 打磨和准备集成
**任务**:
- [ ] 修复所有明显bug
- [ ] 调整UI细节
- [ ] 准备API集成代码框架
- [ ] 编写集成测试清单

**输出文件**:
```
lib/services/
└── bedrock_api_service.dart (空实现，Week 3填充)
```

**Milestone 1 验收**:
- ✅ 能发送文本消息 (Mock数据)
- ✅ 能显示历史记录
- ✅ 能切换模型
- ✅ 能上传图片
- ✅ UI基本像样，没有明显bug

---

## 阶段 1: 后端集成 (Week 3)

### 目标
替换Mock服务，打通真实API，实现完整功能链路

### Day 1-2: 文本聊天API对接
**任务**:
- [ ] 实现 BedrockApiService.sendMessage()
- [ ] 处理SSE流式响应
- [ ] 实现错误处理和超时
- [ ] 显示Token使用量

**参考**: docs/API_INTEGRATION_GUIDE.md § 文本聊天API

**验收**:
- ✅ 能发送真实消息到后端
- ✅ 流式响应能逐字显示
- ✅ Token统计正确显示

---

### Day 3: 图片生成API对接
**任务**:
- [ ] 实现 BedrockApiService.generateImage()
- [ ] 实现进度条显示
- [ ] 实现图片保存到本地

**验收**:
- ✅ 能生成图片
- ✅ 进度条正常显示
- ✅ 图片能保存

---

### Day 4: 数据持久化
**任务**:
- [ ] 实现历史记录保存 (SQLite/Hive)
- [ ] 实现消息加载
- [ ] 实现会话管理

**验收**:
- ✅ 历史记录能保存
- ✅ 重启应用后数据还在
- ✅ 能切换不同会话

---

### Day 5: 配置持久化
**任务**:
- [ ] 实现设置项保存
- [ ] 实现主题保存
- [ ] 实现模型选择保存

**验收**:
- ✅ 设置能保存
- ✅ 重启后配置保持

---

### Day 6-7: 集成测试和修复
**任务**:
- [ ] 端到端测试所有功能
- [ ] 修复集成过程中发现的问题
- [ ] 性能测试和优化
- [ ] 发布内测版本

**Milestone 2 验收**:
- ✅ 真实API调用成功
- ✅ 流式消息正常显示
- ✅ 数据能保存和加载
- ✅ 基本功能可用，可以开始日常使用

---

## 阶段 2: 渐进式完善 (Week 4-12)

### 优先级1: 核心体验优化 (Week 4-5)

**根据实际使用反馈，优先修复影响使用的问题**

#### 必做项
- [ ] 流式文本动画优化
- [ ] 滚动性能优化 (maintainVisibleContentPosition)
- [ ] Markdown完整支持 (表格、LaTeX、Mermaid)
- [ ] 消息复制功能
- [ ] 消息编辑功能
- [ ] 重新生成功能
- [ ] Reasoning折叠展开

**参考**: docs/UI_REPLICATION_GUIDE.md § Markdown渲染系统

---

### 优先级2: 多模态完善 (Week 6-7)

#### 必做项
- [ ] 视频上传和预览
- [ ] 文档上传和显示
- [ ] 图片生成进度优化
- [ ] 文件类型图标

**参考**: docs/UI_REPLICATION_GUIDE.md § 多模态功能

---

### 优先级3: 高级功能 (Week 8-9)

#### 选做项 (根据需求决定)
- [ ] 系统提示词管理
- [ ] 提示词拖拽排序
- [ ] MCP服务器配置
- [ ] Token使用统计页面
- [ ] 工具设置页面

**参考**: docs/UI_REPLICATION_GUIDE.md § 系统提示词管理

---

### 优先级4: 细节打磨 (Week 10-12)

#### 优化项
- [ ] 动画流畅度优化
- [ ] 响应式布局完善
- [ ] 深色模式细节调整
- [ ] 手势交互优化 (双击、长按)
- [ ] 性能监控和优化
- [ ] 内存优化
- [ ] 启动速度优化

**参考**: docs/UI_REPLICATION_GUIDE.md § 交互优化

---

## 里程碑总结

### Milestone 1 (Week 2末): MVP Demo
```
✅ 能发消息、能看回复 (Mock数据)
✅ 能切换模型
✅ 能查看历史
✅ UI基本像样
→ 决策点: UI风格是否OK？继续还是调整？
```

### Milestone 2 (Week 3末): Alpha版本
```
✅ 真实API集成
✅ 数据持久化
✅ 基本功能可用
→ 决策点: 开始内部使用，收集反馈
```

### Milestone 3 (Week 7末): Beta版本
```
✅ 核心体验优化完成
✅ 多模态功能完整
✅ 主要bug修复
→ 决策点: 扩大测试范围
```

### Milestone 4 (Week 12末): 正式版本
```
✅ 所有功能完善
✅ 性能优化完成
✅ 细节打磨完成
→ 决策点: 正式发布
```

---

## 参考文档

### 开发参考
- **UI细节**: `docs/UI_REPLICATION_GUIDE.md` - 详细的1:1复刻指南
- **API对接**: `docs/API_INTEGRATION_GUIDE.md` - 后端集成手册
- **组件清单**: `docs/COMPONENT_CHECKLIST.md` - 任务进度追踪

### 源码参考
- **React Native源码**: `react-native/src/`
- **后端API**: `server/`

---

## 执行原则

### Week 1-2 (MVP阶段)
- ✅ 专注速度，不追求完美
- ✅ 硬编码OK，颜色尺寸可以先写死
- ✅ 跳过动画，先实现功能
- ✅ 简化交互，复杂手势先不做

### Week 3 (集成阶段)
- ✅ 保持UI不变，只替换数据源
- ✅ 增量测试，一个API一个API对接
- ✅ 快速修复，发现问题立即处理

### Week 4+ (优化阶段)
- ✅ 根据反馈，优先修复影响使用的问题
- ✅ 性能优先，卡顿、崩溃优先处理
- ✅ 体验其次，动画、细节慢慢打磨

---

## 风险控制

### 如果Week 2发现UI问题严重？
→ 延长MVP阶段1周，调整设计

### 如果Week 3集成遇到困难？
→ 回退到Mock，先解决UI问题

### 如果Week 4-12优化进度慢？
→ 调整优先级，砍掉非核心功能

---

**文档版本**: 1.0  
**创建日期**: 2025-12-13  
**维护者**: SwiftChat Flutter Team
