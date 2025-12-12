# SwiftChat Flutter - 快速开始指南

## 🚀 5分钟快速启动

### 1. 安装Flutter (如果还没有)

```bash
# macOS
brew install flutter

# 验证安装
flutter doctor
```

### 2. 获取依赖

```bash
cd flutter-app
flutter pub get
```

### 3. 运行应用

```bash
# Android
flutter run -d android

# iOS (需要macOS)
flutter run -d ios

# macOS
flutter run -d macos

# Windows
flutter run -d windows
```

### 4. 配置API

在应用中进入 **Settings** 页面，配置以下信息：

- **API URL**: `https://iqsgefrhcz.us-west-2.awsapprunner.com`
- **API Key**: `20250111`
- **Region**: `us-west-2`

### 5. 开始聊天！

返回 **Chat** 页面，开始与AI对话。

## 📱 功能演示

### 基础对话
1. 在输入框输入消息
2. 点击发送按钮
3. 实时查看AI流式响应

### 多媒体支持
1. 点击附件按钮 📎
2. 选择图片/文档/视频
3. 添加文字说明（可选）
4. 发送消息

### 会话管理
1. 点击 **History** 标签
2. 查看所有历史会话
3. 点击会话继续对话
4. 左滑删除会话

### 模型切换
1. 在Chat页面点击模型图标
2. 选择不同的AI模型
3. 继续对话

## 🎨 主题切换

在 **Settings** 页面开启 **Dark Mode** 切换明暗主题。

## 🔧 开发调试

### 热重载
修改代码后按 `r` 进行热重载，按 `R` 进行热重启。

### 查看日志
```bash
flutter logs
```

### 构建发布版本

```bash
# Android APK
flutter build apk --release

# iOS IPA
flutter build ios --release

# macOS DMG
flutter build macos --release

# Windows
flutter build windows --release
```

## 📦 已实现功能

✅ 实时流式对话  
✅ Markdown渲染  
✅ 图片上传和预览  
✅ 文档上传  
✅ 视频上传  
✅ 会话历史管理  
✅ 本地数据持久化  
✅ 多模型支持  
✅ 明暗主题  
✅ 错误处理  

## 🚧 开发中功能

⏳ 代码语法高亮  
⏳ LaTeX公式渲染  
⏳ System Prompt管理  
⏳ MCP服务器集成  
⏳ Tools集成  

## 💡 提示

- 图片会自动压缩以提高上传速度
- 所有会话自动保存到本地数据库
- 支持多张图片同时上传
- 长按消息可以复制内容（即将支持）

## 🐛 遇到问题？

1. 确保Flutter版本 >= 3.0.0
2. 运行 `flutter doctor` 检查环境
3. 清理缓存: `flutter clean && flutter pub get`
4. 查看 [MIGRATION_STATUS.md](MIGRATION_STATUS.md) 了解已知问题

## 📚 更多资源

- [Flutter文档](https://flutter.dev/docs)
- [SwiftChat README](../README.md)
- [API文档](../server/README.md)
- [迁移状态](MIGRATION_STATUS.md)

## 🎯 下一步

查看 [MIGRATION_STATUS.md](MIGRATION_STATUS.md) 了解开发路线图和待实现功能。

---

**享受使用SwiftChat Flutter！** 🎉
