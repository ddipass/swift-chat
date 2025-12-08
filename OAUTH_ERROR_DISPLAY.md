# OAuth错误显示改进

## 问题

之前OAuth授权失败时，弹窗只显示：
```
Authorization failed: TypeError: Cannot read property 'blobId' of undefined
```

用户无法知道：
- 具体是哪一步出错
- 错误的详细信息
- 如何解决问题

---

## 解决方案

### 1. 优化错误信息格式

**文件:** `src/mcp/MCPOAuth.ts`

现在错误信息包含：
```
❌ Cannot read property 'blobId' of undefined

🔗 URL: https://api.notion.com/v1/oauth/authorize...

💡 Common causes:
• React Native Linking bug (blobId error)
• URL scheme not configured
• Browser cannot open URL

📋 Error type: TypeError
```

### 2. 增强错误弹窗

**文件:** `src/settings/MCPSettingsScreen.tsx`

弹窗改进：
- ✅ 标题改为 `❌ Authorization Failed`
- ✅ 显示完整的格式化错误信息
- ✅ 添加"Copy Error"按钮，可复制错误详情
- ✅ 添加console.error输出，便于调试

---

## 使用效果

### 之前
```
[弹窗标题] Error
[弹窗内容] Authorization failed: TypeError: Cannot read property 'blobId' of undefined
[按钮] OK
```

### 现在
```
[弹窗标题] ❌ Authorization Failed

[弹窗内容]
❌ Cannot read property 'blobId' of undefined

🔗 URL: https://api.notion.com/v1/oauth/authorize...

💡 Common causes:
• React Native Linking bug (blobId error)
• URL scheme not configured
• Browser cannot open URL

📋 Error type: TypeError

[按钮] Copy Error | OK
```

---

## blobId错误的原因

这是**React Native的已知bug**，发生在：
1. 调用`Linking.openURL()`时
2. React Native内部尝试创建Blob对象
3. Blob对象的某个属性未初始化

### 可能的解决方法

#### 方法1: 重启App
有时重启App可以解决

#### 方法2: 使用其他OAuth方式
如果持续出现，可能需要：
- 使用WebView内嵌OAuth流程
- 使用第三方OAuth库（如react-native-app-auth）

#### 方法3: 更新React Native
升级到最新版本的React Native可能修复此问题

---

## 调试信息

现在错误会同时输出到：
1. **弹窗** - 用户可见
2. **Console** - 开发者可查看
3. **剪贴板** - 点击"Copy Error"复制

### Console输出
```
[MCPSettings] OAuth error: ❌ Cannot read property 'blobId' of undefined
...
```

### 复制的内容
点击"Copy Error"后，剪贴板包含完整的错误信息，可以：
- 粘贴到GitHub Issue
- 发送给开发者
- 保存到文件

---

## Git提交

**Commit:** `867a0d9`
```
Improve OAuth error display with detailed information
```

---

## 测试

1. 尝试OAuth授权
2. 如果出现blobId错误，查看弹窗
3. 应该看到格式化的详细错误信息
4. 点击"Copy Error"可复制错误详情
5. 查看Console应该有相同的错误输出
