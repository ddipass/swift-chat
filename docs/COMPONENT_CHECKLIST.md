# SwiftChat Flutter 组件开发清单

---
**AI_CONTEXT**:
```yaml
project: SwiftChat Flutter
purpose: 任务清单 - 追踪开发进度
dependencies:
  - FLUTTER_IMPLEMENTATION_PLAN.md (主计划)
  - docs/UI_REPLICATION_GUIDE.md (UI规范)
source_reference: react-native/src/
last_updated: 2025-12-13
```
---

## 🤖 AI使用说明

### 查看当前进度
```
搜索最后一个 [x] 标记，下一个 [ ] 就是待完成任务
```

### 开始新任务
```
1. 找到下一个 [ ] 任务
2. 阅读任务的 "输入"、"输出"、"要求"
3. 如需UI细节，查看 "参考" 指向的文档
4. 完成后将 [ ] 改为 [x]
5. 提交Git: git commit -m "feat: [任务名称]"
```

### 标准提示词
```
请执行 docs/COMPONENT_CHECKLIST.md 中的下一个任务。

当前进度: [最后完成的任务]
下一个任务: [待完成的任务]

请:
1. 读取输入文件
2. 创建输出文件
3. 验证是否符合要求
4. 更新清单勾选 [x]
```

---

## 使用说明
- 完成一个任务后，将 `[ ]` 改为 `[x]`
- 每完成一个组件，提交一次Git
- 遇到问题记录在对应组件下方

---

## Week 1: 核心交互链路

### Day 1-2: 项目基础

#### 任务 1.1: 创建Flutter项目
- [x] 创建Flutter项目

**AI执行指令**:
```bash
cd /Users/dpliu/swift-chat/
flutter create --platforms=android,ios,macos,windows,web flutter_app
cd flutter_app/
flutter doctor
```

**验证**:
- [x] 执行 `flutter doctor` 无错误
- [x] 执行 `flutter run -d chrome` 能看到默认Demo

---

#### 任务 1.2: 配置依赖
- [x] 配置pubspec.yaml依赖

**输入**: 无

**输出**: `flutter_app/pubspec.yaml`

**要求**:
在 `dependencies` 部分添加:
```yaml
dependencies:
  flutter:
    sdk: flutter
  provider: ^6.1.1
  go_router: ^13.0.0
  flutter_markdown: ^0.6.18
  flutter_highlight: ^0.7.0
  webview_flutter: ^4.4.2
  file_picker: ^6.1.1
  image_picker: ^1.0.5
  shared_preferences: ^2.2.2
  http: ^1.1.2
  uuid: ^4.2.2
```

**验证**:
- [ ] 执行 `flutter pub get` 成功
- [ ] 无依赖冲突

---

#### 任务 1.3: 创建目录结构
- [x] 创建项目目录结构

**AI执行指令**:
```bash
cd flutter_app/lib/
mkdir -p theme models screens widgets services utils navigation mock
```

**验证**:
- [ ] 目录结构存在

---

#### 任务 1.4: 提取颜色系统
- [x] 提取颜色系统 (52个颜色属性)

**输入**: 
- 源文件: `react-native/src/theme/colors.ts`

**输出**: 
- 文件: `flutter_app/lib/theme/swift_chat_colors.dart`

**要求**:
1. 打开 `react-native/src/theme/colors.ts`
2. 统计 ColorScheme 接口的属性数量 (应该是52个)
3. 提取 lightColors 和 darkColors 的所有颜色值
4. 转换格式: `#ffffff` → `Color(0xFFFFFFFF)`
5. 创建 Flutter 类:
```dart
class SwiftChatColors {
  final Color background;
  final Color surface;
  // ... 其他50个属性
  
  const SwiftChatColors({
    required this.background,
    required this.surface,
    // ...
  });
  
  static const light = SwiftChatColors(
    background: Color(0xFFFFFFFF),
    surface: Color(0xFFF5F5F5),
    // ...
  );
  
  static const dark = SwiftChatColors(
    background: Color(0xFF000000),
    surface: Color(0xFF1A1A1A),
    // ...
  );
}
```

**验证**:
- [x] 颜色数量与源文件一致 (52个)
- [x] 使用 ColorZilla 验证颜色值正确
- [x] 文件能编译通过

**参考**: `docs/UI_REPLICATION_GUIDE.md § 颜色系统`

---

#### 任务 1.5: 提取字体系统
- [ ] 提取字体系统

**输入**:
- 搜索 `react-native/src/` 下所有 `fontSize`、`fontWeight`、`lineHeight`

**输出**:
- 文件: `flutter_app/lib/theme/swift_chat_text_styles.dart`

**要求**:
1. 搜索所有文本样式定义
2. 识别等宽字体使用场景 (搜索 `fontFamily: 'monospace'`)
3. 创建 TextStyle 类:
```dart
class SwiftChatTextStyles {
  static const h1 = TextStyle(
    fontSize: 28,
    fontWeight: FontWeight.bold,
    height: 1.2, // lineHeight / fontSize
  );
  
  static const body = TextStyle(
    fontSize: 16,
    height: 1.5,
  );
  
  static const code = TextStyle(
    fontSize: 14,
    fontFamily: 'monospace',
  );
  
  // ... 其他样式
}
```

**验证**:
- [ ] 字体大小与源文件一致
- [ ] 行高计算正确 (height = lineHeight / fontSize)
- [ ] 等宽字体标记正确

**参考**: `docs/UI_REPLICATION_GUIDE.md § 字体系统`

---

**输出文件总结**:
```
✓ flutter_app/pubspec.yaml
✓ flutter_app/lib/theme/swift_chat_colors.dart
✓ flutter_app/lib/theme/swift_chat_text_styles.dart
```

**Day 1-2 完成标准**:
- [x] 所有任务勾选 [x]
- [x] 项目能运行
- [x] 浅色/深色主题颜色正确
- [x] Git提交: `git commit -m "feat: setup project and design system"`

---

### Day 3-4: 聊天界面基础
- [x] 消息数据模型 (简化版)
  - [x] Message类
  - [x] User类 (通过isUser字段实现)
  - [x] 序列化/反序列化
- [x] 消息列表
  - [x] ListView.builder
  - [x] 倒序显示
  - [x] 基础滚动
- [x] 基础输入框
  - [x] TextField
  - [x] 多行支持
- [x] 发送按钮
  - [x] 图标
  - [x] 点击事件
- [x] Mock API服务
  - [x] sendMessage() 方法
  - [x] 模拟延迟

**输出文件**:
```
✓ lib/models/message.dart
✓ lib/screens/chat_screen.dart
✓ lib/widgets/message_bubble.dart (简化版)
✓ lib/widgets/input_toolbar.dart (简化版)
✓ lib/services/mock_api_service.dart
```

---

### Day 5-6: 导航结构
- [ ] 抽屉导航
  - [ ] Drawer组件
  - [ ] 抽屉宽度计算 (434px断点)
  - [ ] 开关动画
- [ ] 历史记录列表 (简化版)
  - [ ] 平铺列表
  - [ ] 点击跳转
- [ ] 设置页面框架
  - [ ] 空白页面
  - [ ] 标题栏
- [ ] 路由配置
  - [ ] go_router配置
  - [ ] 路由参数传递

**输出文件**:
```
✓ lib/navigation/app_router.dart
✓ lib/screens/settings_screen.dart (框架)
✓ lib/screens/history_screen.dart (简化版)
✓ lib/widgets/app_drawer.dart
```

---

### Day 7: 自测和调整
- [ ] 修复UI问题
- [ ] 调整间距
- [ ] API适配层接口定义
  - [ ] ApiService抽象类
  - [ ] sendMessage接口
  - [ ] generateImage接口
  - [ ] getModels接口

**输出文件**:
```
✓ lib/services/api_service.dart
```

---

## Week 2: 关键功能补充

### Day 1-2: 消息气泡样式
- [ ] 用户消息气泡
  - [ ] 背景色
  - [ ] 圆角
  - [ ] 内边距
  - [ ] 右对齐
- [ ] AI消息气泡
  - [ ] 头像
  - [ ] 用户名
  - [ ] 左对齐
- [ ] 基础Markdown渲染
  - [ ] 段落
  - [ ] 代码块
  - [ ] 代码高亮

**参考**: `react-native/src/chat/component/CustomMessageComponent.tsx`

---

### Day 3-4: 设置界面核心
- [ ] Bedrock配置表单
  - [ ] API URL输入框
  - [ ] API Key输入框
  - [ ] Region选择器
- [ ] 模型选择下拉框
  - [ ] 文本模型列表
  - [ ] 图片模型列表
- [ ] 配置保存/加载
  - [ ] SharedPreferences集成
  - [ ] 表单验证

**输出文件**:
```
✓ lib/widgets/custom_text_field.dart
✓ lib/widgets/custom_dropdown.dart
```

**参考**: `react-native/src/settings/SettingsScreen.tsx`

---

### Day 5: 文件上传基础
- [ ] 图片选择器
  - [ ] file_picker集成
  - [ ] 图片类型过滤
- [ ] 图片预览
  - [ ] 缩略图显示
  - [ ] 删除按钮
- [ ] 文件列表
  - [ ] 横向滚动
  - [ ] 文件信息显示

**输出文件**:
```
✓ lib/widgets/file_picker_button.dart
✓ lib/widgets/file_preview.dart
```

**参考**: `react-native/src/chat/component/CustomFileListComponent.tsx`

---

### Day 6-7: 打磨和准备集成
- [ ] Bug修复
- [ ] UI细节调整
- [ ] BedrockApiService框架
  - [ ] 空方法实现
  - [ ] 接口签名定义

**输出文件**:
```
✓ lib/services/bedrock_api_service.dart (空实现)
```

---

## Week 3: 后端集成

### Day 1-2: 文本聊天API
- [ ] 实现sendMessage()
  - [ ] HTTP请求
  - [ ] SSE流式响应处理
  - [ ] 错误处理
  - [ ] 超时处理
- [ ] Token统计
  - [ ] 解析usage字段
  - [ ] 显示在UI

**参考**: `react-native/src/api/bedrock-api.ts`

---

### Day 3: 图片生成API
- [ ] 实现generateImage()
  - [ ] HTTP请求
  - [ ] 进度回调
  - [ ] 图片下载
- [ ] 进度条显示
- [ ] 图片保存

---

### Day 4: 数据持久化
- [ ] 历史记录保存
  - [ ] SQLite/Hive选型
  - [ ] 数据库设计
  - [ ] CRUD操作
- [ ] 消息加载
- [ ] 会话管理

---

### Day 5: 配置持久化
- [ ] 设置项保存
- [ ] 主题保存
- [ ] 模型选择保存

---

### Day 6-7: 集成测试
- [ ] 端到端测试
- [ ] Bug修复
- [ ] 性能测试
- [ ] 发布内测版本

---

## Week 4-5: 核心体验优化

### 流式文本优化
- [ ] 打字机动画
- [ ] 流式更新性能优化
- [ ] 滚动位置保持 (maintainVisibleContentPosition)

### Markdown完整支持
- [ ] 表格渲染
- [ ] LaTeX公式 (flutter_math_fork)
- [ ] Mermaid图表 (WebView)
- [ ] 链接点击
- [ ] 图片显示

**参考**: `react-native/src/chat/component/markdown/`

### 消息交互
- [ ] 复制功能
  - [ ] 点击标题复制
  - [ ] 复制按钮
  - [ ] 复制反馈
- [ ] 编辑模式
  - [ ] 选择模式切换
  - [ ] 文本选择
- [ ] 重新生成
  - [ ] 按钮显示
  - [ ] 重新发送逻辑

### Reasoning折叠
- [ ] 折叠/展开动画
- [ ] 高度测量
- [ ] 滚动补偿
- [ ] 状态保存

**参考**: `CustomMessageComponent.tsx` 的 reasoning 部分

---

## Week 6-7: 多模态完善

### 视频支持
- [ ] 视频选择
- [ ] 视频预览
- [ ] 视频播放器 (video_player)
- [ ] 播放控制

### 文档支持
- [ ] 文档选择
- [ ] 文档图标
- [ ] 文档预览

### 图片优化
- [ ] 图片压缩
- [ ] 加载状态
- [ ] 错误处理

---

## Week 8-9: 高级功能

### 系统提示词管理
- [ ] 提示词列表
- [ ] 添加/编辑/删除
- [ ] 拖拽排序 (ReorderableListView)
- [ ] 内置提示词保护

**参考**: `react-native/src/prompt/PromptScreen.tsx`

### MCP配置
- [ ] MCP服务器列表
- [ ] 服务器配置
- [ ] 环境变量编辑

**参考**: `react-native/src/settings/MCPServersScreen.tsx`

### Token统计
- [ ] 使用统计页面
- [ ] 图表显示
- [ ] 重置功能

**参考**: `react-native/src/settings/TokenUsageScreen.tsx`

---

## Week 10-12: 细节打磨

### 动画优化
- [ ] 主题切换动画
- [ ] 页面转场动画
- [ ] 抽屉动画
- [ ] 按钮反馈动画

### 手势交互
- [ ] 双击标题滚动到顶
- [ ] 双击消息显示按钮
- [ ] 长按复制
- [ ] 长按删除历史

### 响应式布局
- [ ] 手机端适配
- [ ] 平板端适配
- [ ] 桌面端适配
- [ ] 横屏/竖屏切换

### 性能优化
- [ ] 启动速度优化
- [ ] 滚动性能优化
- [ ] 内存优化
- [ ] 包体积优化

---

## 测试清单

### 功能测试
- [ ] 发送文本消息
- [ ] 发送图片
- [ ] 生成图片
- [ ] 查看历史
- [ ] 切换模型
- [ ] 切换主题
- [ ] 保存配置

### 性能测试
- [ ] 启动时间 < 2秒
- [ ] 滚动帧率 60fps
- [ ] 1000+消息流畅滚动
- [ ] 内存占用 < 200MB

### 兼容性测试
- [ ] Android 测试
- [ ] iOS 测试
- [ ] macOS 测试
- [ ] Windows 测试
- [ ] Web 测试

---

**最后更新**: 2025-12-13
