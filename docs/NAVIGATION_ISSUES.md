# 导航结构对比分析 - React Native vs Flutter

## 🔴 严重问题清单

### 1. 导航架构完全不同

**React Native 原版**:
```
NavigationContainer
└── Stack Navigator (AppNavigator)
    ├── Drawer Navigator (DrawerNavigator)
    │   ├── Bedrock (ChatScreen)
    │   └── Settings (SettingsScreen)
    ├── TokenUsage
    ├── Prompt
    ├── ToolsSettings
    ├── MCPServers
    ├── MCPServerConfig
    └── MCPServerTools
```

**Flutter 当前版本**:
```
MaterialApp
└── HomeScreen
    ├── AppDrawer (永久显示)
    └── ChatScreen
```

**问题**: 
- ❌ 缺少路由导航系统
- ❌ 缺少 Stack 导航
- ❌ 所有页面都硬编码在一个屏幕上
- ❌ 无法导航到其他页面

---

### 2. 抽屉行为完全错误

**React Native 原版**:
- macOS: `drawerType: 'permanent'` (永久显示，不可关闭)
- 移动端: `drawerType: 'slide'` (滑动抽屉，可关闭)
- 动态切换: 点击历史记录时切换为 permanent

**Flutter 当前版本**:
- 所有平台都是永久显示
- 没有滑动抽屉模式
- 没有动态切换逻辑

**问题**:
- ❌ 移动端应该是滑动抽屉，不是永久显示
- ❌ 缺少平台判断逻辑
- ❌ 缺少抽屉状态管理

---

### 3. 抽屉内容严重缺失

**React Native 原版抽屉内容**:
```
ListHeaderComponent:
  - Chat 按钮 (带 bedrock 图标)
  - Image 按钮 (带 image 图标)

FlatList (历史记录):
  - 按日期分组 (Today, Yesterday, Last 7 Days, etc.)
  - 每个会话显示标题
  - 长按删除功能
  - 选中状态高亮

ListFooterComponent:
  - Settings 按钮
  - Tools 按钮
  - MCP Servers 按钮
```

**Flutter 当前版本**:
```
Column:
  - Chat 按钮
  - Image 按钮
  - Expanded(ListView()) ← 空的！
  - Settings 按钮
  - Tools 按钮
  - MCP Servers 按钮
```

**问题**:
- ❌ 历史记录列表完全是空的
- ❌ 没有日期分组
- ❌ 没有会话标题显示
- ❌ 没有长按删除
- ❌ 没有选中状态

---

### 4. 图标使用错误

**React Native 原版**:
- Chat: `bedrock.png` / `bedrock_dark.png` (24x24)
- Image: `image.png` / `image_dark.png` (24x24)
- Settings: `settings.png` / `settings_dark.png` (24x24)
- Tools: `settings.png` / `settings_dark.png` (24x24)
- MCP: `settings.png` / `settings_dark.png` (24x24)

**Flutter 当前版本**:
- Chat: ✅ 使用了 bedrock.png
- Image: ❌ 使用了 Icons.image (Material 图标)
- Settings: ❌ 使用了 Icons.settings
- Tools: ❌ 使用了 Icons.build
- MCP: ❌ 使用了 Icons.dns

**问题**:
- ❌ 除了 Chat，其他都用错了图标
- ❌ 应该使用 PNG 图片，不是 Material Icons

---

### 5. 样式细节不匹配

**React Native 原版样式**:
```dart
settingsTouch: {
  flexDirection: 'row',
  justifyContent: 'flex-start',
  alignItems: 'center',
  marginVertical: 12,
  paddingHorizontal: 18,
}

settingsText: {
  fontSize: 16,
  marginHorizontal: 8,
  fontWeight: '500',
  color: colors.text,
}

settingsLeftImg: {
  width: 24,
  height: 24,
  borderRadius: 12,
}
```

**Flutter 当前版本**:
```dart
Container(
  padding: EdgeInsets.symmetric(horizontal: 18, vertical: 12),
  child: Row(
    children: [
      icon,
      SizedBox(width: 8),
      Text(...)
    ],
  ),
)
```

**问题**:
- ❌ marginVertical: 12 没有实现 (应该是外边距，不是内边距)
- ❌ 图标的 borderRadius: 12 没有应用到所有图标
- ✅ padding 和 fontSize 是正确的

---

### 6. 历史记录项样式缺失

**React Native 原版**:
```dart
touch: {
  paddingHorizontal: 8,
  paddingVertical: 12,
  marginHorizontal: 12,
  marginVertical: 2,
  borderRadius: 8,
}

touchSelected: {
  backgroundColor: colors.selectedBackground,
}

macTouchSelected: {
  backgroundColor: colors.selectedBackgroundMac,
}

title: {
  fontSize: 16,
  color: colors.text,
}
```

**Flutter 当前版本**:
- ❌ 完全没有实现

---

### 7. 日期分组样式缺失

**React Native 原版**:
```dart
sectionContainer: {
  paddingHorizontal: 8,
  marginHorizontal: 12,
  marginVertical: 12,
}

sectionDivider: {
  height: 1,
  backgroundColor: colors.border,
}

sectionText: {
  marginTop: 17,
  fontSize: 14,
  color: colors.textSecondary,
}
```

**Flutter 当前版本**:
- ❌ 完全没有实现

---

### 8. 路由参数传递缺失

**React Native 原版**:
```typescript
navigation.navigate('Bedrock', {
  sessionId: item.id,
  tapIndex: tapIndexRef.current,
  mode: item.mode,
});
```

**Flutter 当前版本**:
- ❌ 没有路由参数
- ❌ 没有 sessionId 传递
- ❌ 没有 tapIndex 传递
- ❌ 没有 mode 传递

---

## 📋 需要修复的文件清单

### 1. 创建路由系统
- [ ] `lib/navigation/app_router.dart` - 使用 go_router
- [ ] 定义所有路由路径
- [ ] 配置路由参数

### 2. 重写 AppDrawer
- [ ] `lib/widgets/app_drawer.dart`
- [ ] 添加历史记录 FlatList
- [ ] 实现日期分组
- [ ] 实现选中状态
- [ ] 实现长按删除
- [ ] 修复所有图标

### 3. 创建历史记录数据模型
- [ ] `lib/models/chat_history.dart`
- [ ] Chat 类
- [ ] ChatMode 枚举

### 4. 创建历史记录工具类
- [ ] `lib/utils/history_group_util.dart`
- [ ] groupMessagesByDate() 函数

### 5. 重写 HomeScreen
- [ ] `lib/screens/home_screen.dart`
- [ ] 添加平台判断
- [ ] 实现响应式布局
- [ ] 移动端使用 Drawer
- [ ] 桌面端使用 Row

### 6. 添加缺失的图片资源
- [ ] `assets/image.png`
- [ ] `assets/image_dark.png`
- [ ] `assets/settings.png`
- [ ] `assets/settings_dark.png`

---

## 🎯 修复优先级

### P0 (立即修复)
1. 创建路由系统 (go_router)
2. 重写 AppDrawer 的基础结构
3. 添加历史记录列表 (先用 Mock 数据)

### P1 (本周完成)
4. 实现日期分组
5. 实现选中状态
6. 修复所有图标

### P2 (下周完成)
7. 实现长按删除
8. 实现平台判断
9. 实现响应式布局

---

## 📝 正确的实现步骤

### Step 1: 安装 go_router (已完成)
```yaml
dependencies:
  go_router: ^13.0.0
```

### Step 2: 创建路由配置
```dart
// lib/navigation/app_router.dart
final router = GoRouter(
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const HomeScreen(),
    ),
    GoRoute(
      path: '/chat/:sessionId',
      builder: (context, state) {
        final sessionId = int.parse(state.pathParameters['sessionId']!);
        return ChatScreen(sessionId: sessionId);
      },
    ),
    GoRoute(
      path: '/settings',
      builder: (context, state) => const SettingsScreen(),
    ),
    // ... 其他路由
  ],
);
```

### Step 3: 修改 main.dart
```dart
MaterialApp.router(
  routerConfig: router,
  // ...
)
```

### Step 4: 重写 AppDrawer
参考 `CustomDrawerContent.tsx` 的完整实现

---

**创建时间**: 2025-12-14  
**状态**: 待修复
