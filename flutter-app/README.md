# SwiftChat Flutter

SwiftChat的Flutter重构版本，提供更简单的跨平台开发体验。

## 为什么迁移到Flutter？

1. **更简单的跨平台支持** - 一套代码支持Android、iOS、macOS、Windows、Linux和Web
2. **更好的Windows支持** - 避免React Native Windows的复杂构建问题
3. **更快的开发速度** - Hot reload和丰富的UI组件库
4. **更小的包体积** - 编译后的应用体积更小
5. **更好的性能** - 原生编译，性能接近原生应用

## 项目结构

```
flutter-app/
├── lib/
│   ├── main.dart              # 应用入口
│   ├── models/                # 数据模型
│   │   ├── message.dart
│   │   └── conversation.dart
│   ├── providers/             # 状态管理
│   │   ├── chat_provider.dart
│   │   └── settings_provider.dart
│   ├── screens/               # 页面
│   │   ├── chat_screen.dart
│   │   └── settings_screen.dart
│   ├── services/              # API服务
│   ├── widgets/               # 可复用组件
│   └── utils/                 # 工具函数
├── assets/                    # 资源文件
├── pubspec.yaml              # 依赖配置
└── README.md
```

## React Native vs Flutter 功能对照

| React Native | Flutter | 说明 |
|-------------|---------|------|
| AsyncStorage | shared_preferences | 本地存储 |
| react-native-mmkv | flutter_secure_storage | 加密存储 |
| axios/fetch | dio/http | 网络请求 |
| react-native-markdown-display | flutter_markdown | Markdown渲染 |
| react-native-image-picker | image_picker | 图片选择 |
| react-native-document-picker | file_picker | 文件选择 |
| react-native-video | video_player | 视频播放 |
| Context API | Provider | 状态管理 |

## 开发环境设置

### 1. 安装Flutter

```bash
# macOS
brew install flutter

# 或从官网下载
# https://flutter.dev/docs/get-started/install
```

### 2. 验证环境

```bash
flutter doctor
```

### 3. 安装依赖

```bash
cd flutter-app
flutter pub get
```

### 4. 运行应用

```bash
# Android
flutter run -d android

# iOS
flutter run -d ios

# macOS
flutter run -d macos

# Windows
flutter run -d windows
```

## 构建发布版本

### Android APK
```bash
flutter build apk --release
```

### iOS IPA
```bash
flutter build ios --release
```

### macOS DMG
```bash
flutter build macos --release
```

### Windows
```bash
flutter build windows --release
```

## CI/CD

GitHub Actions workflows已配置：
- `.github/workflows/flutter-android.yml` - Android构建
- `.github/workflows/flutter-ios.yml` - iOS构建
- `.github/workflows/flutter-macos.yml` - macOS构建
- `.github/workflows/flutter-windows.yml` - Windows构建

## 迁移进度

- [x] 项目初始化
- [x] 基础UI框架
- [x] 状态管理设置
- [x] Chat页面基础
- [x] Settings页面基础
- [x] CI/CD配置
- [ ] API服务集成
- [ ] Markdown渲染
- [ ] 图片/视频/文档支持
- [ ] MCP集成
- [ ] Tools集成
- [ ] 完整功能测试

## 后续任务

1. **API服务层** - 实现与SwiftChat Server的通信
2. **Markdown渲染** - 支持代码高亮、表格、LaTeX等
3. **多媒体支持** - 图片、视频、文档的上传和预览
4. **会话管理** - 会话列表、搜索、删除等
5. **MCP集成** - MCP服务器管理
6. **Tools集成** - 工具调用支持
7. **主题定制** - 完整的明暗主题支持
8. **国际化** - 多语言支持

## 注意事项

- React Native代码已备份到 `react-native/` 目录
- 旧的CI/CD workflows已移动到 `.github/workflows-bak/`
- 可以同时维护两个版本，逐步迁移功能
