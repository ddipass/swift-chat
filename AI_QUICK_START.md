# 🤖 AI快速上手卡片

> **给AI助手**: 如果你是新接手这个项目的AI，从这里开始！

---

## 1️⃣ 项目是什么？

**SwiftChat Flutter** - 使用Flutter复刻React Native版本的AI聊天应用

- ✅ 后端API已完成
- ✅ React Native版本已完成 (参考源码)
- 🚧 Flutter版本开发中 (你要做的)

---

## 2️⃣ 我现在应该做什么？

### 第一步：检查当前进度

```
请打开文件: docs/COMPONENT_CHECKLIST.md

搜索最后一个 [x] 标记
下一个 [ ] 就是你要做的任务
```

### 第二步：执行任务

每个任务都有这些信息：
- **输入**: 需要读取哪些文件
- **输出**: 需要创建哪些文件
- **要求**: 具体要做什么
- **验证**: 如何确认完成
- **参考**: 去哪里查细节

### 第三步：完成后更新

```
1. 将任务的 [ ] 改为 [x]
2. 提交Git: git commit -m "feat: [任务名称]"
3. 继续下一个任务
```

---

## 3️⃣ 标准提示词模板

### 场景A: 我是新AI，第一次接手

```
我需要你帮我开发SwiftChat Flutter项目。

项目路径: /Users/dpliu/swift-chat/

请执行:
1. 打开 docs/COMPONENT_CHECKLIST.md
2. 告诉我当前进度 (最后完成的任务)
3. 告诉我下一个任务是什么
4. 开始执行下一个任务
```

---

### 场景B: 继续之前的任务

```
继续开发SwiftChat Flutter项目。

项目路径: /Users/dpliu/swift-chat/
当前任务: [从 COMPONENT_CHECKLIST.md 复制任务名称]

请执行这个任务的所有步骤。
```

---

### 场景C: 遇到问题需要帮助

```
SwiftChat Flutter项目遇到问题。

问题: [描述问题]
相关文件: [列出文件路径]

请参考 react-native/src/[对应文件] 的实现，帮我解决。
```

---

### 场景D: 审查代码

```
请审查SwiftChat Flutter的代码。

文件: [文件路径]
对照: react-native/src/[对应文件]

检查:
1. UI是否一致
2. 代码质量
3. 性能问题
```

---

## 4️⃣ 关键文件位置

```
swift-chat/
├── AI_QUICK_START.md                    ← 你现在看的文件
├── FLUTTER_IMPLEMENTATION_PLAN.md       ← 主计划 (时间线)
├── docs/
│   ├── COMPONENT_CHECKLIST.md           ← 任务清单 (最重要!)
│   ├── UI_REPLICATION_GUIDE.md          ← UI规范参考
│   ├── API_INTEGRATION_GUIDE.md         ← API集成指南
│   └── AI_HANDOFF_PROTOCOL.md           ← 详细交接协议
├── react-native/src/                    ← React Native源码 (参考)
└── flutter_app/                         ← Flutter项目 (你要写的)
```

---

## 5️⃣ 工作流程

```
┌─────────────────────────────────────────┐
│ 1. 打开 COMPONENT_CHECKLIST.md         │
│    找到下一个 [ ] 任务                  │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ 2. 阅读任务的输入/输出/要求             │
│    如需UI细节，查看 UI_REPLICATION_GUIDE│
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ 3. 读取输入文件 (React Native源码)     │
│    创建输出文件 (Flutter代码)           │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ 4. 验证是否符合要求                     │
│    运行 flutter run 测试                │
└─────────────────┬───────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ 5. 更新 COMPONENT_CHECKLIST.md         │
│    将 [ ] 改为 [x]                      │
│    提交Git                              │
└─────────────────┬───────────────────────┘
                  ↓
                回到步骤1
```

---

## 6️⃣ 常见问题

### Q: 我不知道UI应该长什么样？
**A**: 打开 `docs/UI_REPLICATION_GUIDE.md`，搜索对应组件名称

### Q: 我不知道颜色/尺寸是多少？
**A**: 打开 `react-native/src/theme/colors.ts` 或对应的源文件

### Q: 我不知道API怎么调用？
**A**: 打开 `docs/API_INTEGRATION_GUIDE.md`

### Q: 我不确定任务是否完成？
**A**: 看任务的 "验证" 部分，执行验证步骤

### Q: 我想知道整体进度？
**A**: 打开 `FLUTTER_IMPLEMENTATION_PLAN.md` 看时间线

---

## 7️⃣ 验证清单

### 每个任务完成后，确认:
- [ ] 输出文件已创建
- [ ] 代码能编译通过
- [ ] 运行 `flutter run` 能看到效果
- [ ] UI与React Native版本一致
- [ ] COMPONENT_CHECKLIST.md 已勾选 [x]
- [ ] Git已提交

---

## 8️⃣ 紧急情况

### 如果完全不知道从哪开始
```
请执行:
1. 阅读 FLUTTER_IMPLEMENTATION_PLAN.md 前100行
2. 打开 docs/COMPONENT_CHECKLIST.md
3. 告诉我当前应该做什么
```

### 如果遇到无法解决的问题
```
请:
1. 描述问题
2. 列出相关文件
3. 说明已尝试的解决方案
4. 请求人类开发者介入
```

---

## 9️⃣ 成功标准

### Week 1-2 (MVP)
- [ ] 能发送消息
- [ ] 能看到回复
- [ ] 能查看历史
- [ ] UI基本像样

### Week 3 (集成)
- [ ] 真实API调用成功
- [ ] 数据能保存

### Week 4+ (优化)
- [ ] 根据反馈逐步完善

---

## 🎯 现在开始！

**你的第一句话应该是**:
```
请打开 docs/COMPONENT_CHECKLIST.md，告诉我当前进度和下一个任务。
```

---

**最后更新**: 2025-12-13
