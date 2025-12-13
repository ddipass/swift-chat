# MCP Frontend Testing Checklist

## 测试环境
- 平台：iOS / Android / macOS
- 后端：App Runner 或本地服务器

## 测试步骤

### 1. 基础导航测试 ✓

**步骤：**
1. 打开 App
2. 打开侧边栏
3. 点击 "MCP Servers"

**预期结果：**
- 进入 MCP Servers 页面
- 显示 "+ Add MCP Server" 按钮
- 如果没有服务器，显示 "No MCP servers configured"

---

### 2. 预设选择测试 ✓

**步骤：**
1. 点击 "+ Add MCP Server"
2. 查看预设列表

**预期结果：**
- 显示所有预设（AWS Labs Core, Filesystem, Brave Search 等）
- 每个预设显示图标、名称、描述
- 最后一个是 "⚙️ Custom Configuration"

---

### 3. AWS Labs Core MCP 配置测试 ✓

**步骤：**
1. 选择 "☁️ AWS Labs Core" 预设
2. 进入配置页面

**预期结果：**
- 显示图标 ☁️
- 显示名称 "AWS Labs Core"
- 显示描述
- 显示提示：💡 First run may take 30-60s to download packages

**基础配置：**
- Server Name: AWS Labs Core MCP
- Command: uvx
- Arguments: awslabs.core-mcp-server@latest

**环境变量：**
- 显示 "🔐 Environment Variables"
- 已有变量：FASTMCP_LOG_LEVEL = ERROR
- 可以点击 [+ Add] 添加新变量

**高级设置（折叠）：**
- 点击 "⚙️ Advanced Settings" 展开
- 显示所有配置项：
  - ⏱️ Timeout Settings
    - Initialization Timeout: 60
    - Tool Execution Timeout: 30
  - 🔄 Auto Restart
    - Enable auto restart: ☑
    - Max Restarts: 3
    - Restart Delay: 5
  - 📁 Working Directory: (空)
  - 📝 Logging
    - Log Level: ERROR (Recommended)
    - Enable debug mode: ☐

---

### 4. 环境变量编辑测试 ✓

**步骤：**
1. 在配置页面点击 [+ Add]
2. 输入变量名：TEST_VAR
3. 点击 Add
4. 在新变量中输入值：test_value
5. 点击变量右侧的 × 删除

**预期结果：**
- 成功添加变量
- 变量显示在列表中
- 可以编辑值
- 可以删除（非必需变量）
- 必需变量（如 BRAVE_API_KEY）不能删除

---

### 5. 高级配置修改测试 ✓

**步骤：**
1. 展开 Advanced Settings
2. 修改 Initialization Timeout 为 90
3. 关闭 Auto Restart
4. 修改 Log Level 为 DEBUG
5. 开启 Enable debug mode

**预期结果：**
- 所有修改都生效
- 关闭 Auto Restart 后，Max Restarts 和 Restart Delay 隐藏
- 每个字段都有提示文本

---

### 6. 保存并添加服务器测试 ✓

**步骤：**
1. 配置完成后点击右上角 ✓
2. 等待服务器启动（可能需要 30-60 秒）

**预期结果：**
- 返回 MCP Servers 列表
- 显示新添加的服务器
- 状态显示 "active"（绿色）
- 显示 Tools: 1

---

### 7. Brave Search 配置测试（需要 API Key）✓

**步骤：**
1. 选择 "🔍 Brave Search" 预设
2. 查看环境变量部分

**预期结果：**
- BRAVE_API_KEY 标记为 *required
- 显示提示：💡 Get your API key from https://brave.com/search/api/
- 不能删除 BRAVE_API_KEY
- 输入框自动隐藏（因为包含 KEY）

---

### 8. Filesystem 配置测试 ✓

**步骤：**
1. 选择 "📁 Filesystem" 预设
2. 修改 Arguments 中的 /tmp 为 /Users/xxx/Documents
3. 在 Working Directory 填写 /Users/xxx/Documents

**预期结果：**
- Arguments 可以编辑
- Working Directory 可以填写
- 提示：Leave empty to use default. Required for filesystem-based tools.

---

### 9. 查看服务器工具测试 ✓

**步骤：**
1. 在服务器列表中点击 "View Tools"

**预期结果：**
- 显示工具列表弹窗
- AWS Labs Core: prompt_understanding
- Filesystem: read_file, write_file, list_directory 等

---

### 10. 删除服务器测试 ✓

**步骤：**
1. 点击服务器的 "Delete" 按钮
2. 确认删除

**预期结果：**
- 显示确认对话框
- 确认后服务器从列表中移除

---

### 11. OAuth 服务器测试（需要配置）⚠️

**步骤：**
1. 选择 "📂 Google Drive" 预设
2. 保存配置

**预期结果：**
- 状态显示 "pending_auth"（橙色）
- 浏览器自动打开 Google 授权页面
- 授权后状态变为 "active"

**注意：** 需要后端配置 OAuth credentials

---

### 12. 自定义配置测试 ✓

**步骤：**
1. 选择 "⚙️ Custom Configuration"
2. 手动输入 JSON 配置

**预期结果：**
- 显示 JSON 输入框
- 可以粘贴自定义配置
- 验证 JSON 格式

---

## 集成测试

### 13. 在聊天中使用 MCP 工具 ✓

**步骤：**
1. 添加 AWS Labs Core MCP 服务器
2. 等待状态变为 active
3. 在聊天中输入：请帮我理解如何使用 AWS
4. AI 应该调用 `mcp:xxx:prompt_understanding` 工具

**预期结果：**
- 工具被成功调用
- 返回 AWS 专家指导
- 在 /api/tools/stats 中可以看到调用记录

---

## 性能测试

### 14. 首次启动时间测试

**测试服务器：**
- AWS Labs Core (uvx): 预期 30-60 秒
- Filesystem (npx): 预期 10-20 秒
- Puppeteer (npx): 预期 40-60 秒（下载 Chromium）

**测试方法：**
1. 记录点击保存的时间
2. 记录状态变为 active 的时间
3. 计算差值

---

## 错误处理测试

### 15. 超时测试

**步骤：**
1. 设置 Initialization Timeout 为 5 秒
2. 添加 AWS Labs Core 服务器

**预期结果：**
- 启动失败
- 显示超时错误
- 建议增加超时时间

### 16. 缺少必需环境变量测试

**步骤：**
1. 选择 Brave Search
2. 不填写 BRAVE_API_KEY
3. 点击保存

**预期结果：**
- 显示错误：BRAVE_API_KEY is required
- 不允许保存

### 17. 无效命令测试

**步骤：**
1. 自定义配置
2. Command 填写 invalid_command
3. 保存

**预期结果：**
- 服务器启动失败
- 状态显示 error
- 可以查看错误信息

---

## UI/UX 测试

### 18. 深色模式测试

**步骤：**
1. 切换到深色模式
2. 浏览所有 MCP 页面

**预期结果：**
- 所有颜色正确显示
- 文本可读
- 图标清晰

### 19. 横屏模式测试（平板）

**步骤：**
1. 旋转设备到横屏
2. 浏览 MCP 配置页面

**预期结果：**
- 布局适配横屏
- 所有元素可见
- 滚动正常

### 20. 长文本测试

**步骤：**
1. 输入超长的 Server Name
2. 输入超长的 Arguments

**预期结果：**
- 文本正确换行或滚动
- 不影响布局

---

## 测试结果

| 测试项 | 状态 | 备注 |
|--------|------|------|
| 1. 基础导航 | ⬜ | |
| 2. 预设选择 | ⬜ | |
| 3. AWS Labs Core 配置 | ⬜ | |
| 4. 环境变量编辑 | ⬜ | |
| 5. 高级配置修改 | ⬜ | |
| 6. 保存并添加服务器 | ⬜ | |
| 7. Brave Search 配置 | ⬜ | |
| 8. Filesystem 配置 | ⬜ | |
| 9. 查看服务器工具 | ⬜ | |
| 10. 删除服务器 | ⬜ | |
| 11. OAuth 服务器 | ⬜ | 需要配置 |
| 12. 自定义配置 | ⬜ | |
| 13. 聊天中使用工具 | ⬜ | |
| 14. 首次启动时间 | ⬜ | |
| 15. 超时测试 | ⬜ | |
| 16. 缺少环境变量 | ⬜ | |
| 17. 无效命令 | ⬜ | |
| 18. 深色模式 | ⬜ | |
| 19. 横屏模式 | ⬜ | |
| 20. 长文本 | ⬜ | |

---

## 快速测试命令

```bash
# 启动后端
cd server && source venv/bin/activate && cd src
export LOCAL_API_KEY=20250112Research
python3 main.py

# 启动前端
cd react-native
npm start
npm run ios  # 或 npm run android
```

## 已知问题

1. ⚠️ OAuth 需要后端配置 credentials
2. ⚠️ 首次运行 uvx/npx 需要下载包，可能较慢
3. ⚠️ Working Directory 在 iOS 上可能有权限限制

## 建议改进

1. 添加服务器启动进度指示器
2. 添加工具调用历史记录
3. 添加服务器日志查看功能
4. 添加配置导入/导出功能
