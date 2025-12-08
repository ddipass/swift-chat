# macOS 窗口拖动限制说明

## 问题描述

在 macOS 上使用 SwiftChat 时：
- ✅ **ChatScreen**: 可以通过顶部任何位置拖动窗口
- ⚠️ **SettingsScreen/MCPSettingsScreen/WebFetchSettingsScreen**: 只能通过左侧 Drawer 上方的区域拖动

## 根本原因

SwiftChat 使用 **Mac Catalyst** 技术（iOS 应用运行在 macOS 上），在 Mac Catalyst 中，**ScrollView 组件会捕获所有鼠标事件**，阻止窗口拖动。这是 Mac Catalyst 的已知限制。

### 技术背景

| 特性 | SwiftChat (Mac Catalyst) | React Native macOS |
|------|-------------------------|-------------------|
| 基础 | iOS 应用 + Mac Catalyst | 原生 macOS 应用 |
| React Native | 标准 RN 0.74.1 | microsoft/react-native-macos |
| ScrollView 拖动 | ❌ 不支持 | ✅ 支持 |

## 为什么 ChatScreen 可以拖动？

ChatScreen 使用 `GiftedChat` 组件（内部使用 `FlatList`），事件处理方式不同，不会完全阻止窗口拖动。

## 解决方案评估

### ✅ 方案 1: 接受限制（当前方案）
- 保持滚动功能
- 左侧区域仍可拖动
- 无需修改代码

### ❌ 方案 2: 禁用滚动
- 失去滚动功能
- 内容无法完整查看

### ⚠️ 方案 3: 迁移到 React Native macOS
- 需要大量重构
- 维护成本高

## 结论

这是 Mac Catalyst 的技术限制，不是代码缺陷。当前实现是合理的折衷方案。

## 用户建议

- 通过左侧 Drawer 上方区域拖动窗口
- 使用 macOS 窗口管理快捷键
- 通过标题栏空白区域拖动
