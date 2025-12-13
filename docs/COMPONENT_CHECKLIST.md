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
- [x] UI精确复刻
  - [x] 消息气泡 borderRadius: 22
  - [x] AI头像: bedrock.png (22x22)
  - [x] 用户消息: 右对齐，无头像
  - [x] AI消息: 头像+名字，纯文本内容
  - [x] 布局: marginLeft 12, marked_box marginLeft 28
  - [x] 标题: "Chat", fontSize 17, fontWeight 600

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
- [x] 抽屉导航
  - [x] Drawer组件
  - [x] 抽屉宽度计算 (434px断点)
  - [x] 开关动画
- [x] 历史记录列表 (简化版)
  - [x] Mock数据显示
  - [x] 日期分组 (Today, Yesterday)
  - [x] 点击跳转
  - [x] 长按删除
  - [x] 选中状态高亮
- [x] 设置页面框架
  - [x] 空白页面
  - [x] 标题栏
  - [x] 返回按钮 (使用 context.go)
- [x] 路由配置
  - [x] go_router配置
  - [x] 路由参数传递 (sessionId, tapIndex, mode)
  - [x] ShellRoute + MainLayout
  - [x] 响应式布局 (移动端 Drawer, 桌面端 Row)
- [x] 图片资源
  - [x] image.png, image_dark.png
  - [x] settings.png, settings_dark.png
  - [x] pubspec.yaml 注册 (目录方式)
  - [x] 代码中正确使用 (不加 assets/ 前缀)

**输出文件**:
```
✓ lib/navigation/app_router.dart
✓ lib/screens/settings_screen.dart (完整)
✓ lib/widgets/app_drawer.dart (完整)
✓ lib/models/chat_history.dart
✓ assets/image.png, image_dark.png
✓ assets/settings.png, settings_dark.png
✓ docs/FLUTTER_DEBUG_LESSONS.md (重要经验)
```

**重要修复**:
- ✅ 修复图片路径问题 (Image.asset 自动添加 assets/ 前缀)
- ✅ 修复 Settings 返回按钮 (使用 context.go 而非 Navigator.pop)
- ✅ 实现完整的历史记录列表 (带分组和交互)
- ✅ 实现响应式布局 (桌面永久抽屉，移动滑动抽屉)

---

### Day 7: 自测和调整
- [x] 修复UI问题
- [x] 调整间距
- [x] API适配层接口定义
  - [x] ApiService抽象类
  - [x] sendMessage接口
  - [x] generateImage接口
  - [x] getModels接口
  - [x] getTokenUsage接口
  - [x] 支持类定义 (ImageGenerationProgress, ModelInfo, TokenUsage)

**输出文件**:
```
✓ lib/services/api_service.dart
```

**Week 1 完成标准**:
- [x] 所有 Day 1-7 任务完成
- [x] 项目能运行
- [x] 浅色/深色主题切换正常
- [x] 消息发送和显示正常
- [x] 导航和路由正常
- [x] 图片资源正确加载
- [x] Git提交: `git commit -m "feat: complete Week 1 - MVP skeleton"`

**当前状态**: ✅ Week 1 完成！准备进入 Week 2

---

## Week 2: 关键功能补充

### Day 1-2: 消息气泡样式 + Markdown + 交互功能 ✅ 已完成 (2025-12-14)
- [x] 用户消息气泡
  - [x] 背景色 (colors.messageBackground)
  - [x] 圆角 (borderRadius: 22)
  - [x] 内边距 (horizontal: 16, vertical: 10)
  - [x] 右对齐 (Align + maxWidth 75%)
- [x] AI消息气泡
  - [x] 头像 (bedrock.png, 22x22, borderRadius: 11)
  - [x] 用户名 ("AI Assistant", fontSize: 16, fontWeight: 500)
  - [x] 左对齐 (marginLeft: 28)
- [x] 完整Markdown渲染
  - [x] 段落 (fontSize: 16, height: 1.625, fontWeight: 300)
  - [x] 标题 (h1-h6, 深色模式适配)
  - [x] 粗体、斜体、列表 (深色模式适配)
  - [x] 代码块 (codeBackground, borderRadius: 8)
  - [x] 代码高亮 (flutter_highlight, monokai/github theme)
  - [x] 表格渲染 (TableBorder, tableCellsPadding)
  - [x] **LaTeX 公式** (flutter_markdown_latex)
    - [x] 行内公式 `$...$`
    - [x] 块级公式 `$$...$$`
    - [x] 与其他 Markdown 元素混合显示
    - [x] 深色模式适配
- [x] **代码块复制按钮**
  - [x] 位置：代码块右上角
  - [x] 图标：copy.png / copy_grey.png
  - [x] 反馈：done.png / done_dark.png (2秒)
  - [x] 语言标签：与复制按钮同行
- [x] **点击AI标题复制**
  - [x] 点击"AI Assistant"复制文本
  - [x] 显示完成图标2秒
- [x] **长按消息复制全文**
  - [x] GestureDetector.onLongPress
  - [x] 显示"Copied"提示2秒
  - [x] 位置跟随消息对齐（用户右侧，AI左侧）
- [x] **重新生成按钮**
  - [x] 仅最后一条AI消息显示
  - [x] 刷新图标 + "Regenerate"文字
  - [x] 删除最后AI回复，重新发送用户消息
- [x] **AppBar优化**
  - [x] 高度：44px (toolbarHeight)
  - [x] 左侧：汉堡菜单图标 (Icons.menu)
  - [x] 右侧1：新建对话按钮 (Icons.edit_outlined)
  - [x] 右侧2：主题切换按钮 (Icons.light_mode/dark_mode)
  - [x] 标题居中："Chat"
- [x] **Drawer切换**
  - [x] DrawerStateProvider状态管理
  - [x] 移动端：切换overlay drawer
  - [x] 桌面端：切换permanent drawer显示/隐藏
- [x] **Reasoning折叠展开**
  - [x] 箭头旋转动画 (0.5 to 0.75 turns)
  - [x] 复制按钮
  - [x] 折叠/展开状态

**输出文件**:
```
✓ lib/widgets/message_bubble.dart (完整实现 + LaTeX 支持)
✓ lib/screens/chat_screen.dart (AppBar + 重新生成)
✓ lib/navigation/app_router.dart (DrawerStateProvider)
✓ lib/services/mock_api_service.dart (LaTeX + 混合格式测试数据)
✓ pubspec.yaml (flutter_markdown_latex + markdown 依赖)
✓ assets/copy.png, copy_grey.png, done.png, done_dark.png
```

**Git提交**:
```
8214129 - feat: add code block copy button and improve styling
866c01a - feat: add message interaction features  
9d3ac0b - feat: improve AppBar and drawer interaction
0af0e40 - feat: add Reasoning collapse/expand
62dfdc4 - feat: add table rendering support
[本次] - feat: add LaTeX formula support with complete markdown styling
```

**LaTeX 实现方案**:
- ✅ 使用 `flutter_markdown_latex` 包 (避免无限循环问题)
- ✅ 支持行内公式 `$...$` 和块级公式 `$$...$$`
- ✅ 与 GitHub Flavored Markdown 完美兼容
- ✅ 深色模式下所有 Markdown 元素正确显示
- ✅ 混合格式测试通过（标题+代码+公式+表格+列表）

**关键技术点**:
```dart
// 保留 GitHub Flavored Markdown + 添加 LaTeX
extensionSet: md.ExtensionSet(
  md.ExtensionSet.gitHubFlavored.blockSyntaxes + [LatexBlockSyntax()],
  md.ExtensionSet.gitHubFlavored.inlineSyntaxes + [LatexInlineSyntax()],
),

// 完整的样式定义（包括深色模式）
styleSheet: MarkdownStyleSheet(
  h1-h6: TextStyle(color: colors.text),
  listBullet: TextStyle(color: colors.text),
  strong/em: TextStyle(color: colors.text),
  // ... 所有元素都适配主题色
)
```

**参考**: `react-native/src/chat/component/markdown/CustomMarkdownRenderer.tsx`

---

### Day 3-4: 设置界面核心 ✅ 已完成 (2025-12-14)
- [x] Bedrock配置表单
  - [x] API URL输入框
  - [x] API Key输入框（密码隐藏）
  - [x] Region选择器（5个区域）
  - [x] Text Model选择器（4个模型）
- [x] 配置保存/加载
  - [x] SharedPreferences集成
  - [x] 自动加载已保存配置
  - [x] 保存按钮（AppBar右侧✓）
  - [x] 保存成功提示
- [x] 表单验证
  - [x] 检查必填字段
  - [x] 错误提示显示
- [x] 自定义组件
  - [x] CustomTextField（标签、占位符、密码隐藏、主题适配）
  - [x] CustomDropdown（标签、选项列表、主题适配）

**输出文件**:
```
✓ lib/screens/settings_screen.dart (完整实现)
✓ lib/widgets/custom_text_field.dart
✓ lib/widgets/custom_dropdown.dart
```

**Git提交**:
```
[本次] - feat: implement settings screen with Bedrock configuration
```

**参考**: `react-native/src/settings/SettingsScreen.tsx`

---

### Day 5: 文件上传基础
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
---

## 📋 开发日志

### 2025-12-14 (Week 2 Day 3-4) ✅ 完成

#### 已完成任务
- [x] 设置界面核心功能
- [x] CustomTextField 和 CustomDropdown 组件
- [x] Bedrock 配置表单（API URL、API Key、Region、Model）
- [x] SharedPreferences 配置保存/加载
- [x] 表单验证

#### Git提交
```
0c1d334 - feat: implement settings screen with Bedrock configuration
```

---

### 🔄 开发计划调整 (2025-12-14)

**决策**: 提前进行后端集成（从 Week 3 提前到现在）

**原因**:
1. ✅ UI 框架已完整（聊天界面 + 设置界面）
2. ✅ 配置系统已就绪（可保存 API 配置）
3. ✅ MVP 原则 - 应先打通核心链路
4. ✅ 真实验证 - 基于真实 API 响应优化 UI
5. ✅ 用户价值 - 集成后立即可用

**调整后的顺序**:
```
当前 → Week 3: 后端集成 (提前执行)
  Day 1-2: 文本聊天 API 集成 ⭐
  Day 3: 错误处理和优化
  Day 4-5: 数据持久化

之后 → Week 2 剩余功能 (基于真实场景)
  Day 5: 文件上传基础
  Day 6-7: UI 打磨
```

**预期收益**:
- 🎯 立即可用 - App 从"演示"变成"工具"
- 🎯 避免返工 - 基于真实 API 开发 UI
- 🎯 真实反馈 - 发现并解决实际问题
- 🎯 开发效率 - 文件上传等功能基于真实需求实现

---

## Week 3: 后端集成 (2025-12-14)

### Day 1-2: 文本聊天 API 集成 ⏳ 进行中

#### 已完成
- [x] BedrockApiService 实现
  - [x] SSE 流式响应处理
  - [x] 消息格式转换
  - [x] 错误处理
- [x] ChatScreen 集成
  - [x] 从 SharedPreferences 读取配置
  - [x] 流式文本显示
  - [x] 加载状态指示器
  - [x] Mock API fallback
- [x] 后端 CORS 支持
  - [x] 添加 CORSMiddleware
  - [x] 重新构建镜像
  - [x] 触发 AppRunner 部署

#### 待完成
- [ ] 等待 AppRunner 部署完成（3-5分钟）
- [ ] 测试真实 API 调用
- [ ] Token 统计显示
- [ ] 错误处理优化

**当前状态**: 
- ✅ 代码已完成
- ✅ 后端已部署
- ⏳ AppRunner 正在更新（Operation ID: 5a1cdff0da9d4eda8ae264c88db0a573）
- ⏳ 等待 CORS 生效

**Git提交**:
```
ade5f5a - feat: add backend API integration and CORS support
```

---

### 下一步：Week 3 Day 3-4 数据持久化

#### 已完成任务
- [x] 消息气泡样式完善（用户/AI）
- [x] 基础Markdown渲染（段落、粗体、斜体、列表）
- [x] 代码块语法高亮（flutter_highlight）
- [x] **代码块复制按钮**（右上角，点击显示完成图标2秒）
- [x] **点击AI标题复制**（显示完成图标2秒）
- [x] **长按消息复制全文**（显示Copied提示，跟随消息位置）
- [x] **重新生成按钮**（最后一条AI消息下方）
- [x] **AppBar优化**（44px高度，汉堡菜单，新建对话，主题切换）
- [x] **Drawer切换**（桌面端和移动端都支持显示/隐藏）

#### Git提交
```
8214129 - feat: add code block copy button and improve styling
866c01a - feat: add message interaction features  
9d3ac0b - feat: improve AppBar and drawer interaction
```

#### 修复的问题
1. 资源加载404 → flutter clean + 删除缓存
2. 消息引用错误 → 修正为widget.message
3. Copied提示位置 → 根据isUser动态对齐
4. Drawer切换失败 → 添加DrawerStateProvider

#### 新增资源
- copy.png, copy_grey.png, done.png, done_dark.png

---

### 下一步：Week 2 Day 3-4 设置界面核心
- [ ] 实现Bedrock配置表单
- [ ] 实现模型选择下拉框
- [ ] 实现配置保存/加载
- [ ] 实现表单验证
