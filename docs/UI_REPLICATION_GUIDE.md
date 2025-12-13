# SwiftChat Flutter UI 1:1 复刻计划

## 项目概述

本项目的核心目标是对 SwiftChat React Native 版本进行纯前端 UI 的 1:1 复刻，使用 Flutter 框架重新实现所有用户界面组件和交互体验。

### 重要说明

**此复刻工作仅专注于前端 UI 层面**，不涉及任何后端 API 集成、数据处理逻辑或业务功能实现。所有的 AI 模型调用、消息处理、文件上传等后端功能都将通过 Mock 数据或占位符实现，确保 UI 组件能够正常展示和交互。

完成此 UI 复刻后，其他开发者可以基于这套完整的 Flutter UI 框架，独立集成真实的后端服务、API 调用和业务逻辑，实现完整的应用功能。

### 技术规格

- **源项目**: SwiftChat React Native 版本
- **目标框架**: Flutter 3.24+
- **复刻范围**: 100% UI 界面和交互体验
- **平台支持**: Android, iOS, Windows, macOS, Web
- **复刻原则**: 像素级精确，交互行为一致
- **预计工期**: 14-15 周

---

## 文件分类说明

### 自动生成文件 (无需手动编写)

执行 `flutter create --platforms=android,ios,macos,windows,web flutter_app` 后自动创建：

```
flutter_app/
├── android/          # Android 构建配置
├── ios/              # iOS 构建配置
├── macos/            # macOS 构建配置
├── windows/          # Windows 构建配置
├── web/              # Web 构建配置
├── pubspec.lock      # 依赖锁定文件
└── .gitignore        # Git 忽略文件
```

### 需要配置的文件 (一次性修改)

```
flutter_app/
├── pubspec.yaml              # 依赖配置文件
└── analysis_options.yaml     # 代码分析配置 (可选)
```

### 需要手动开发的文件 (核心工作)

```
flutter_app/lib/              # 所有 UI 源代码
├── main.dart                 # 应用入口
├── app.dart                  # 应用根组件
├── theme/                    # 主题系统
├── models/                   # 数据模型
├── screens/                  # 页面组件
├── widgets/                  # UI 组件
├── services/                 # 服务类 (Mock 实现)
└── utils/                    # 工具类
```

---

## 开发实施计划

### 阶段 0：项目初始化 (1 天)

#### 任务 0.1：创建 Flutter 项目

**操作步骤**:
```bash
cd swift-chat/
flutter create --platforms=android,ios,macos,windows,web flutter_app
cd flutter_app/
```

**验证标准**:
- [ ] `flutter doctor` 显示所有平台配置正常
- [ ] `flutter run -d chrome` 能启动默认 Demo 应用
- [ ] 项目结构完整，所有平台目录已生成

#### 任务 0.2：配置项目依赖

**需要修改的文件**: `flutter_app/pubspec.yaml`

**具体工作**: 
1. 打开 `pubspec.yaml` 文件
2. 在 `dependencies` 部分添加所需的 Flutter 包
3. 执行 `flutter pub get` 安装依赖
4. 验证所有依赖包版本兼容

**必需依赖包**:
- provider (状态管理)
- go_router (路由导航)
- flutter_markdown (Markdown 渲染)
- flutter_highlight (代码高亮)
- flutter_math_fork (数学公式)
- webview_flutter (图表渲染)
- file_picker, image_picker (文件选择)
- shared_preferences (本地存储)
- http, dio (网络请求)
- uuid (ID 生成)
- video_player (视频播放)

**验证标准**:
- [ ] `flutter pub get` 执行成功，无依赖冲突
- [ ] 项目能正常编译运行
- [ ] 所有依赖包版本兼容

#### 任务 0.3：准备 Mock 数据

**输出文件**: `flutter_app/lib/mock/mock_data.dart`

**具体工作**:
1. 创建示例对话数据 (至少 10 条消息，包含文本、图片、代码块)
2. 创建模型列表数据 (参考 `react-native/src/storage/Constants.ts` 中的模型定义)
3. 创建系统提示词示例数据 (参考内置的 6 个提示词)
4. 创建配置选项数据 (Region 列表、模型参数等)

**验证标准**:
- [ ] Mock 数据结构与 React Native 版本一致
- [ ] 数据足够丰富，能覆盖所有 UI 场景
- [ ] 包含浅色/深色主题的测试数据

#### 任务 0.4：配置 Git 工作流程

**具体工作**:
1. 创建 `.gitignore` 文件 (如果 flutter create 未生成)
2. 配置提交规范：使用 Conventional Commits 格式
   - `feat:` 新功能
   - `fix:` 修复
   - `style:` 样式调整
   - `refactor:` 重构
   - `docs:` 文档
3. 每完成一个任务提交一次代码

**验证标准**:
- [ ] Git 提交信息规范
- [ ] 每个任务有对应的 commit
- [ ] 不提交自动生成的文件

---

### 阶段 1：设计系统提取 (4-5 天)

#### 任务 1.1：颜色系统复刻

**输入文件**: `react-native/src/theme/colors.ts`  
**输出文件**: `flutter_app/lib/theme/swift_chat_colors.dart`

**具体工作**:
1. 打开并完整阅读 `react-native/src/theme/colors.ts` 文件
2. 识别 `ColorScheme` 接口中的所有属性
3. 统计颜色属性总数并记录
4. 提取 `lightColors` 和 `darkColors` 的所有颜色值
5. 将十六进制颜色值 (如 `#ffffff`) 转换为 Flutter Color 格式 (如 `Color(0xFFFFFFFF)`)
6. 特别注意平台特定的颜色 (如 `selectedBackgroundMac`)
7. 创建 Flutter 颜色类，保持与源文件相同的属性命名

**验证标准**:
- [ ] 使用浏览器取色器工具验证颜色值完全一致
- [ ] Web 端能正确显示浅色/深色主题
- [ ] 颜色命名与 React Native 版本一致
- [ ] 平台特定颜色已标注说明

**验证工具**: ColorZilla (Chrome 插件) 或 Digital Color Meter (macOS)

#### 任务 1.2：尺寸规范复刻

**输入文件**: `react-native/src/` 下所有 `.tsx` 文件中的 StyleSheet  
**输出文件**: `flutter_app/lib/theme/swift_chat_dimensions.dart`

**具体工作**:
1. 搜索并打开以下关键文件：
   - `chat/component/CustomMessageComponent.tsx` (消息气泡尺寸)
   - `chat/component/CustomChatFooter.tsx` (输入框尺寸)
   - `App.tsx` (抽屉宽度计算逻辑)
2. 提取所有 `StyleSheet.create()` 中的尺寸值
3. 记录 padding、margin、borderRadius、width、height 等
4. 特别注意抽屉宽度的计算公式：
   ```typescript
   const minWidth = screenWidth > screenHeight ? screenHeight : screenWidth;
   const width = minWidth > 434 ? 300 : minWidth * 0.83;
   ```
5. 将 React Native 的尺寸单位 (pt) 转换为 Flutter 的逻辑像素 (dp)

**验证标准**:
- [ ] 所有尺寸与 React Native 版本误差 < 1px
- [ ] 响应式计算逻辑正确 (断点 434px)
- [ ] 抽屉宽度在不同屏幕尺寸下表现一致

#### 任务 1.3：字体系统复刻

**输入文件**: `react-native/src/` 下所有文本样式定义  
**输出文件**: `flutter_app/lib/theme/swift_chat_text_styles.dart`

**具体工作**:
1. 搜索所有包含 `fontSize`、`fontWeight`、`lineHeight` 的代码
2. 识别等宽字体使用场景 (搜索 `fontFamily: 'monospace'`)
3. 提取标题、正文、辅助文本等层级的样式定义
4. 创建对应的 Flutter TextStyle 类
5. 注意 React Native 的 `lineHeight` 是绝对值，Flutter 的 `height` 是相对值 (lineHeight / fontSize)

**验证标准**:
- [ ] 字体大小、行高、字重与 React Native 完全一致
- [ ] 等宽字体 (代码块) 显示正确
- [ ] 中英文混排显示正常

---
### 阶段 2：基础组件开发 (4-5 天)

#### 任务 2.1：主题系统实现

**输入文件**: `react-native/src/theme/ThemeContext.tsx`  
**输出文件**: `flutter_app/lib/theme/swift_chat_theme.dart`

**具体工作**:
1. 阅读 `ThemeContext.tsx` 了解主题切换逻辑
2. 使用 Provider 模式实现主题管理
3. 实现主题切换动画 (观察 React Native 版本的动画时长)
4. 使用 SharedPreferences 实现主题状态持久化
5. 支持系统主题跟随

**验证标准**:
- [ ] 主题切换动画流畅
- [ ] 刷新页面后主题状态保持
- [ ] 所有组件颜色随主题正确变化

#### 任务 2.2：基础输入组件

**输入文件**: `react-native/src/settings/CustomTextInput.tsx`  
**输出文件**: `flutter_app/lib/widgets/common/swift_chat_text_field.dart`

**具体工作**:
1. 打开 `CustomTextInput.tsx` 查看完整实现
2. 提取输入框的所有样式属性
3. 复刻焦点状态变化效果
4. 实现密码显示/隐藏切换 (如果有)
5. 支持多行文本输入

**验证标准**:
- [ ] 输入框样式与 React Native 像素级一致
- [ ] 焦点状态变化动画正确
- [ ] 键盘交互行为一致

#### 任务 2.3：下拉选择组件

**输入文件**: `react-native/src/settings/DropdownComponent.tsx`  
**输出文件**: `flutter_app/lib/widgets/common/swift_chat_dropdown.dart`

**具体工作**:
1. 打开 `DropdownComponent.tsx` 查看完整实现
2. 复刻下拉框展开动画
3. 复刻选项列表样式
4. 复刻选中状态指示器

**验证标准**:
- [ ] 下拉框展开/收起动画流畅
- [ ] 选项列表样式与 React Native 一致
- [ ] 选中状态视觉反馈正确

#### 任务 2.4：标签页按钮组件

**输入文件**: `react-native/src/settings/TabButton.tsx`  
**输出文件**: `flutter_app/lib/widgets/common/swift_chat_tab_button.dart`

**具体工作**:
1. 打开 `TabButton.tsx` 查看完整实现
2. 复刻标签页按钮样式
3. 实现选中/未选中状态切换

**验证标准**:
- [ ] 标签页按钮样式与 React Native 一致
- [ ] 状态切换动画流畅

---

### 阶段 3：聊天界面核心 (6-7 天)

#### 任务 3.1：消息数据模型

**输入文件**: `react-native/src/types/Chat.ts`  
**输出文件**: `flutter_app/lib/models/swift_chat_message.dart`

**具体工作**:
1. 打开并完整阅读 `Chat.ts` 文件
2. 识别所有接口和枚举定义
3. 复刻 SwiftChatMessage、ChatStatus、FileInfo、ChatMode 等
4. 实现 JSON 序列化/反序列化方法
5. 确保所有字段类型与 TypeScript 定义一致

**验证标准**:
- [ ] 数据模型与 React Native 完全一致
- [ ] JSON 序列化/反序列化正常
- [ ] 支持所有消息类型

#### 任务 3.2：消息气泡组件

**输入文件**: `react-native/src/chat/component/CustomMessageComponent.tsx`  
**输出文件**: `flutter_app/lib/widgets/chat/message_bubble.dart`

**具体工作**:
1. 打开 `CustomMessageComponent.tsx` 查看完整实现
2. 提取用户消息和 AI 消息的样式差异
3. 复刻消息时间戳显示逻辑
4. 实现长按复制功能
5. 支持消息选择模式

**验证标准**:
- [ ] 消息气泡布局与 React Native 完全一致
- [ ] 长消息自动换行正确
- [ ] 消息复制功能正常

#### 任务 3.3：聊天标题组件

**输入文件**: `react-native/src/chat/component/HeaderTitle.tsx`  
**输出文件**: `flutter_app/lib/widgets/chat/header_title.dart`

**具体工作**:
1. 打开 `HeaderTitle.tsx` 查看完整实现
2. 复刻双击滚动到顶部功能
3. 复刻单击显示 token 使用量功能
4. 复刻标题文本样式

**验证标准**:
- [ ] 双击滚动功能正常
- [ ] Token 使用量显示正确
- [ ] 标题样式一致

#### 任务 3.4：聊天列表组件

**输入文件**: `react-native/src/chat/ChatScreen.tsx` (GiftedChat 相关代码)  
**输出文件**: `flutter_app/lib/widgets/chat/swift_chat_list.dart`

**具体工作**:
1. 打开 `ChatScreen.tsx` 查看消息列表实现
2. 复刻消息列表滚动逻辑 (倒序显示)
3. 实现滚动到底部功能
4. 优化大量消息的渲染性能 (使用 ListView.builder)

**验证标准**:
- [ ] 消息列表滚动保持 60fps
- [ ] 新消息自动滚动到底部
- [ ] 1000+ 消息滚动性能正常

#### 任务 3.5：滚动到底部按钮

**输入文件**: `react-native/src/chat/component/CustomScrollToBottomComponent.tsx`  
**输出文件**: `flutter_app/lib/widgets/chat/scroll_to_bottom_button.dart`

**具体工作**:
1. 打开 `CustomScrollToBottomComponent.tsx` 查看实现
2. 复刻按钮样式和位置
3. 实现显示/隐藏逻辑 (滚动距离底部超过一定值时显示)

**验证标准**:
- [ ] 按钮样式与 React Native 一致
- [ ] 显示/隐藏逻辑正确
- [ ] 点击后平滑滚动到底部

#### 任务 3.6：输入工具栏

**输入文件**: `react-native/src/chat/component/CustomChatFooter.tsx`  
**输出文件**: `flutter_app/lib/widgets/chat/input_toolbar.dart`

**具体工作**:
1. 打开 `CustomChatFooter.tsx` 查看完整实现
2. 复刻输入框自适应高度逻辑
3. 复刻发送按钮状态管理
4. 复刻键盘交互行为
5. 添加附件按钮和菜单

**验证标准**:
- [ ] 输入框高度自适应正确
- [ ] Enter 键发送，Shift+Enter 换行
- [ ] 发送按钮状态切换正确

#### 任务 3.7：空状态组件

**输入文件**: `react-native/src/chat/component/EmptyChatComponent.tsx`  
**输出文件**: `flutter_app/lib/widgets/chat/empty_chat.dart`

**具体工作**:
1. 打开 `EmptyChatComponent.tsx` 查看实现
2. 复刻空状态图标和文本
3. 复刻布局和间距

**验证标准**:
- [ ] 空状态显示与 React Native 一致
- [ ] 图标和文本居中对齐

---

### 阶段 4：多模态功能 (5-6 天)

#### 任务 4.1：文件处理组件

**输入文件**: `react-native/src/chat/component/CustomFileListComponent.tsx`  
**输出文件**: `flutter_app/lib/widgets/file/swift_chat_file_list.dart`

**具体工作**:
1. 打开 `CustomFileListComponent.tsx` 查看完整实现
2. 复刻文件预览缩略图
3. 复刻文件类型图标
4. 复刻文件大小和状态显示
5. 实现文件删除功能

**验证标准**:
- [ ] 文件缩略图显示正确
- [ ] 文件类型图标与 React Native 一致
- [ ] 文件大小格式化正确

#### 任务 4.2：文件上传组件

**输入文件**: `react-native/src/chat/component/CustomAddFileComponent.tsx`  
**输出文件**: `flutter_app/lib/widgets/file/file_picker.dart`

**具体工作**:
1. 打开 `CustomAddFileComponent.tsx` 查看实现
2. 实现文件选择功能 (使用 file_picker)
3. 支持多文件选择
4. 实现文件类型限制

**验证标准**:
- [ ] 文件选择器弹出正常
- [ ] 多文件选择功能正常
- [ ] 文件类型过滤正确

#### 任务 4.3：图片预览组件

**输入文件**: `react-native/src/chat/component/ImageProgressBar.tsx`  
**输出文件**: `flutter_app/lib/widgets/file/image_preview.dart`

**具体工作**:
1. 打开 `ImageProgressBar.tsx` 查看进度条实现
2. 实现图片预览和缩放
3. 实现图片保存功能
4. 复刻图片生成进度条

**验证标准**:
- [ ] 图片缩放流畅
- [ ] 保存功能正常
- [ ] 进度条样式与 React Native 一致

#### 任务 4.4：视频播放组件

**输出文件**: `flutter_app/lib/widgets/file/video_player_widget.dart`

**具体工作**:
1. 参考 React Native 中视频消息的显示方式
2. 使用 video_player 实现视频播放
3. 复刻播放控制条样式
4. 实现播放/暂停/进度控制

**验证标准**:
- [ ] 视频播放流畅
- [ ] 控制条样式与 React Native 一致
- [ ] 进度拖动正常

#### 任务 4.5：语音波形组件

**输入文件**: `react-native/src/chat/component/AudioWaveformComponent.tsx`  
**输出文件**: `flutter_app/lib/widgets/audio/audio_waveform.dart`

**具体工作**:
1. 打开 `AudioWaveformComponent.tsx` 查看完整实现
2. 复刻波形动画效果
3. 实现录音按钮和状态
4. 添加音量指示器

**验证标准**:
- [ ] 波形动画流畅
- [ ] 录音按钮样式正确
- [ ] 音量指示器实时更新

---
### 阶段 5：Markdown 渲染系统 (10-12 天)

#### 任务 5.1：基础 Markdown 组件

**输入文件**: `react-native/src/chat/component/markdown/CustomMarkdownRenderer.tsx`  
**输出文件**: `flutter_app/lib/widgets/markdown/swift_chat_markdown.dart`

**具体工作**:
1. 打开 `CustomMarkdownRenderer.tsx` 查看完整实现
2. 识别支持的 Markdown 语法元素
3. 复刻标题样式 (H1-H6)
4. 复刻段落间距
5. 复刻链接颜色和下划线
6. 复刻列表样式 (有序/无序)
7. 复刻引用块样式

**验证标准**:
- [ ] 标题字体大小与 React Native 一致
- [ ] 段落间距正确
- [ ] 链接样式和点击行为正确

#### 任务 5.2：代码块组件

**输入文件**: `react-native/src/chat/component/markdown/CustomCodeHighlighter.tsx`  
**输出文件**: `flutter_app/lib/widgets/markdown/code_block.dart`

**具体工作**:
1. 打开 `CustomCodeHighlighter.tsx` 查看高亮实现
2. 识别支持的编程语言列表
3. 复刻代码块背景色和边框
4. 复刻语法高亮配色方案
5. 实现代码复制功能
6. 添加语言标签显示

**验证标准**:
- [ ] 代码块背景色与 React Native 一致
- [ ] JavaScript/Python/Java 等语言高亮正确
- [ ] 复制功能正常工作

#### 任务 5.3：流式文本动画

**输出文件**: `flutter_app/lib/widgets/markdown/streaming_text.dart`

**具体工作**:
1. 观察 React Native 版本的流式文本显示效果
2. 实现打字机效果 (逐字符显示)
3. 优化流式更新性能
4. 处理动画中断和恢复
5. 支持 Markdown 实时解析

**验证标准**:
- [ ] 打字机动画速度与 React Native 一致
- [ ] 流式更新不影响页面滚动
- [ ] 长文本流式渲染性能正常

#### 任务 5.4：Mermaid 图表组件

**输入文件**: `react-native/src/chat/component/markdown/MermaidRenderer.tsx`  
**输出文件**: `flutter_app/lib/widgets/markdown/mermaid_chart.dart`

**具体工作**:
1. 打开 `MermaidRenderer.tsx` 查看实现
2. 使用 WebView 渲染 Mermaid 图表
3. 复刻图表容器样式
4. 实现图表缩放和保存功能

**验证标准**:
- [ ] Mermaid 图表渲染正确
- [ ] 图表样式与 React Native 一致
- [ ] 缩放和保存功能正常

#### 任务 5.5：LaTeX 公式渲染

**输出文件**: `flutter_app/lib/widgets/markdown/latex_formula.dart`

**具体工作**:
1. 观察 React Native 版本的 LaTeX 公式显示
2. 使用 flutter_math_fork 渲染 LaTeX 公式
3. 支持行内公式和块级公式
4. 复刻公式样式和间距

**验证标准**:
- [ ] LaTeX 公式渲染正确
- [ ] 行内公式和块级公式样式一致
- [ ] 公式大小和间距正确

---

### 阶段 6：导航结构 (4-5 天)

#### 任务 6.1：应用导航结构

**输入文件**: `react-native/src/App.tsx`  
**输出文件**: `flutter_app/lib/navigation/app_router.dart`

**具体工作**:
1. 打开 `App.tsx` 查看完整的导航结构
2. 识别 Drawer + Stack 导航组合
3. 提取路由参数定义 (sessionId, tapIndex, mode)
4. 实现路由参数传递
5. 配置页面转场动画

**验证标准**:
- [ ] 导航结构与 React Native 一致
- [ ] 路由参数传递正确
- [ ] 页面转场动画流畅

#### 任务 6.2：抽屉导航

**输入文件**: `react-native/src/history/CustomDrawerContent.tsx`  
**输出文件**: `flutter_app/lib/widgets/navigation/swift_chat_drawer.dart`

**具体工作**:
1. 打开 `CustomDrawerContent.tsx` 查看完整实现
2. 复刻会话历史列表
3. 提取抽屉宽度计算逻辑：
   ```typescript
   const minWidth = screenWidth > screenHeight ? screenHeight : screenWidth;
   const width = minWidth > 434 ? 300 : minWidth * 0.83;
   ```
4. 复刻抽屉开关动画
5. 实现历史记录按日期分组

**验证标准**:
- [ ] 抽屉宽度在不同屏幕尺寸下正确
- [ ] 开关动画流畅
- [ ] 历史记录分组逻辑正确

#### 任务 6.3：历史记录分组

**输入文件**: `react-native/src/history/HistoryGroupUtil.ts`  
**输出文件**: `flutter_app/lib/utils/history_group_util.dart`

**具体工作**:
1. 打开 `HistoryGroupUtil.ts` 查看分组逻辑
2. 复刻 `groupMessagesByDate` 函数
3. 实现分组标题样式和分隔线
4. 支持 Today, Yesterday, Last 7 Days, Last 30 Days, Older 分组

**验证标准**:
- [ ] 分组逻辑与 React Native 完全一致
- [ ] 分组标题样式正确
- [ ] 分隔线显示正确

#### 任务 6.4：响应式布局

**输入文件**: `react-native/src/App.tsx` (抽屉宽度计算部分)  
**输出文件**: `flutter_app/lib/utils/responsive_layout.dart`

**具体工作**:
1. 提取响应式布局的断点规则 (434px)
2. 实现手机端全屏聊天模式 (宽度 < 434px)
3. 实现平板端侧边栏 + 聊天区域 (宽度 ≥ 434px)
4. 实现桌面端永久抽屉 + 聊天区域 (macOS)
5. 处理横屏/竖屏切换

**验证标准**:
- [ ] 手机端抽屉宽度 = 屏幕宽度 * 0.83
- [ ] 平板/桌面抽屉宽度 = 300px
- [ ] macOS 永久抽屉模式正常

---
### 阶段 7：设置界面 (7-9 天)

#### 任务 7.1：主设置页面

**输入文件**: `react-native/src/settings/SettingsScreen.tsx`  
**输出文件**: `flutter_app/lib/screens/settings/settings_screen.dart`

**具体工作**:
1. 打开 `SettingsScreen.tsx` 查看完整实现
2. 识别所有标签页 (Bedrock, OpenAI, Ollama, DeepSeek)
3. 复刻标签页切换动画
4. 复刻设置项分组和布局
5. 实现保存和重置功能

**验证标准**:
- [ ] 标签页切换动画流畅
- [ ] 设置项布局与 React Native 一致
- [ ] 保存功能正常

#### 任务 7.2：Bedrock 配置界面

**输入文件**: `react-native/src/settings/SettingsScreen.tsx` (Bedrock 标签页部分)  
**输出文件**: `flutter_app/lib/screens/settings/bedrock_settings.dart`

**具体工作**:
1. 定位到 Bedrock 标签页的代码
2. 复刻配置模式切换 (Bedrock API Key / SwiftChat Server)
3. 复刻 API URL、API Key、Region 输入框
4. 实现模型列表加载和选择

**验证标准**:
- [ ] 配置模式切换正常
- [ ] 输入框样式与 React Native 一致
- [ ] 模型列表加载正常

#### 任务 7.3：其他 AI 提供商配置

**输入文件**: `react-native/src/settings/SettingsScreen.tsx` (各标签页)  
**输出文件**: 
- `flutter_app/lib/screens/settings/openai_settings.dart`
- `flutter_app/lib/screens/settings/ollama_settings.dart`
- `flutter_app/lib/screens/settings/deepseek_settings.dart`

**具体工作**:
1. 定位到各个标签页的代码
2. 复刻 OpenAI 配置 (API Key, Use Proxy)
3. 复刻 Ollama 配置 (Server URL, API Key)
4. 复刻 DeepSeek 配置 (API Key)

**验证标准**:
- [ ] 所有配置项样式一致
- [ ] 配置验证逻辑正确

#### 任务 7.4：OpenAI Compatible 多配置管理

**输入文件**: 
- `react-native/src/settings/OpenAICompatConfigsSection.tsx`
- `react-native/src/settings/OpenAICompatConfigComponent.tsx`

**输出文件**: `flutter_app/lib/screens/settings/openai_compat_settings.dart`

**具体工作**:
1. 打开两个文件查看完整实现
2. 实现多配置添加/删除功能 (最多 10 个)
3. 复刻配置卡片样式
4. 实现配置展开/折叠动画

**验证标准**:
- [ ] 最多支持 10 个配置
- [ ] 添加/删除动画流畅
- [ ] 配置卡片样式正确

#### 任务 7.5：MCP 设置界面

**输入文件**: 
- `react-native/src/settings/MCPServersScreen.tsx`
- `react-native/src/settings/MCPServerConfigScreen.tsx`
- `react-native/src/settings/MCPAdvancedConfig.tsx`
- `react-native/src/settings/MCPEnvEditor.tsx`

**输出文件**: 
- `flutter_app/lib/screens/settings/mcp_servers_screen.dart`
- `flutter_app/lib/screens/settings/mcp_server_config_screen.dart`
- `flutter_app/lib/widgets/settings/mcp_env_editor.dart`

**具体工作**:
1. 打开所有相关文件查看实现
2. 复刻 MCP 服务器列表界面
3. 实现服务器添加/编辑/删除功能
4. 复刻环境变量编辑器 (键值对)
5. 实现 OAuth 配置界面

**验证标准**:
- [ ] 服务器列表样式正确
- [ ] 环境变量编辑器功能完整
- [ ] OAuth 配置界面正确

#### 任务 7.6：Tools 设置界面

**输入文件**: `react-native/src/settings/ToolsSettingsScreen.tsx`  
**输出文件**: `flutter_app/lib/screens/settings/tools_settings_screen.dart`

**具体工作**:
1. 打开 `ToolsSettingsScreen.tsx` 查看实现
2. 复刻工具列表界面
3. 实现工具启用/禁用开关

**验证标准**:
- [ ] 工具列表样式正确
- [ ] 开关状态切换正常

#### 任务 7.7：Token Usage 统计界面

**输入文件**: `react-native/src/settings/TokenUsageScreen.tsx`  
**输出文件**: `flutter_app/lib/screens/settings/token_usage_screen.dart`

**具体工作**:
1. 打开 `TokenUsageScreen.tsx` 查看实现
2. 复刻使用统计卡片
3. 添加重置统计功能

**验证标准**:
- [ ] 统计卡片样式正确
- [ ] 数据显示准确

---

### 阶段 8：系统提示词管理 (3-4 天)

#### 任务 8.1：提示词列表界面

**输入文件**: `react-native/src/prompt/PromptScreen.tsx`  
**输出文件**: `flutter_app/lib/screens/prompt/prompt_management_screen.dart`

**具体工作**:
1. 打开 `PromptScreen.tsx` 查看完整实现
2. 复刻提示词卡片设计
3. 实现添加/编辑/删除功能
4. 实现拖拽排序功能 (使用 ReorderableListView)
5. 区分内置提示词和自定义提示词

**验证标准**:
- [ ] 提示词卡片样式与 React Native 一致
- [ ] 添加/编辑/删除功能正常
- [ ] 拖拽排序流畅
- [ ] 内置提示词不可删除

#### 任务 8.2：提示词编辑器

**输出文件**: `flutter_app/lib/widgets/prompt/prompt_editor.dart`

**具体工作**:
1. 参考 React Native 版本的编辑界面
2. 实现多行文本编辑
3. 添加字符计数显示
4. 实现保存和取消操作

**验证标准**:
- [ ] 多行文本编辑正常
- [ ] 字符计数实时更新
- [ ] 保存/取消功能正常

#### 任务 8.3：提示词选择组件

**输入文件**: `react-native/src/chat/component/PromptListComponent.tsx`  
**输出文件**: `flutter_app/lib/widgets/prompt/prompt_selector.dart`

**具体工作**:
1. 打开 `PromptListComponent.tsx` 查看实现
2. 复刻提示词选择弹窗
3. 实现提示词搜索功能

**验证标准**:
- [ ] 弹窗样式与 React Native 一致
- [ ] 搜索功能正常

#### 任务 8.4：模型选择弹窗

**输入文件**: `react-native/src/chat/component/ModelSelectionModal.tsx`  
**输出文件**: `flutter_app/lib/widgets/chat/model_selection_modal.dart`

**具体工作**:
1. 打开 `ModelSelectionModal.tsx` 查看实现
2. 复刻模型选择弹窗样式
3. 实现模型列表显示和选择

**验证标准**:
- [ ] 弹窗样式与 React Native 一致
- [ ] 模型选择功能正常

---

## 测试验证标准

### Web 端测试 (每个阶段必须通过)

1. **视觉验证**
   - 使用 Chrome DevTools 的 Pixel Perfect 插件对比截图
   - 使用 ColorZilla 取色器验证颜色值
   - 使用 Ruler 工具测量尺寸
   - 检查浅色/深色主题切换

2. **交互验证**
   - 点击、输入、滚动等交互行为正确
   - 使用 Chrome DevTools Performance 面板监控动画帧率
   - 键盘快捷键功能正常

3. **性能验证**
   - 使用 Chrome DevTools Lighthouse 测试页面加载时间
   - 使用 Performance Monitor 监控 FPS (目标 60fps)
   - 使用 Memory Profiler 检查内存占用
   - 使用 CPU Profiler 检查 CPU 占用

4. **兼容性验证**
   - Chrome 最新版显示正常
   - Safari 最新版显示正常
   - Firefox 最新版显示正常
   - Edge 最新版显示正常

### 桌面端测试 (完成 Web 测试后)

1. **macOS 测试**
   - 窗口行为符合 macOS 规范
   - 键盘快捷键 (⌘+N, ⌘+V 等) 正常
   - 永久抽屉模式正常

2. **Windows 测试**
   - 窗口管理正常
   - 系统主题跟随正确
   - 高 DPI 支持 (125%, 150%, 200%)

### 移动端测试 (最后进行)

1. **Android 测试**
   - 触摸交互流畅
   - 后退按钮行为正确
   - 权限请求正常

2. **iOS 测试**
   - Safe Area 处理正确
   - iOS 设计规范遵循
   - 手势交互正常

---

## 工作交接标准

### 每个任务完成后提交

1. **源代码文件**
   - 按照指定路径创建
   - 代码规范符合 Flutter 标准
   - 注释清晰，易于理解

2. **Git 提交**
   - 使用 Conventional Commits 格式
   - 提交信息清晰描述改动
   - 每个任务一个 commit

3. **测试截图**
   - Web 端功能正常的截图
   - 标注关键测试点
   - 包含浅色/深色主题对比

4. **测试清单**
   - 勾选完成的测试项目
   - 记录测试环境信息

### 阶段完成后提交

1. **功能演示视频**
   - 录制 Web 端完整功能演示 (2-3 分钟)
   - 展示关键交互和动画

2. **性能测试报告**
   - 动画流畅度测试数据
   - 响应时间测试数据
   - 内存和 CPU 占用数据

---

## 里程碑和交付物

### 里程碑 1 (第 2 周末)
- [ ] 设计系统完成
- [ ] 基础组件库可用
- [ ] 主题切换功能正常

### 里程碑 2 (第 4 周末)  
- [ ] 聊天界面基本功能完成
- [ ] 消息发送和显示正常
- [ ] 输入工具栏功能完整

### 里程碑 3 (第 8 周末)
- [ ] 多模态功能可用
- [ ] Markdown 渲染完整
- [ ] 流式文本动画正常

### 里程碑 4 (第 10 周末)
- [ ] 导航结构完成
- [ ] 响应式布局适配
- [ ] 所有页面可正常访问

### 里程碑 5 (第 14-15 周末)
- [ ] 设置界面完成
- [ ] 提示词管理可用
- [ ] 整体功能测试通过
- [ ] 所有平台构建成功

---

## 后续集成指南

完成此 UI 复刻后，其他开发者可以按以下方式继续工作：

### API 集成
1. 替换 `mock_api_service.dart` 为真实 API 服务
2. 实现 ChatService、SettingsService 等业务逻辑类
3. 集成真实的消息流处理和状态管理

### 数据持久化
1. 扩展 StorageService 实现真实的数据存储
2. 集成数据库 (SQLite/Hive) 进行消息历史管理
3. 实现用户配置的持久化存储

### 平台特性
1. 集成平台特定的文件系统访问
2. 实现真实的分享和剪贴板功能
3. 添加推送通知和后台处理

---

**文档版本**: 2.0  
**最后更新**: 2025-12-13  
**维护者**: SwiftChat Flutter Team
