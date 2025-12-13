# MCP 界面风格统一改造计划

## 📊 当前状态分析

### Settings 界面风格特征：
1. **简洁的列表项** - 使用 `itemContainer` 样式
   - `flexDirection: 'row'`
   - `justifyContent: 'space-between'`
   - `marginVertical: 10`
   - 无边框、无背景色、无阴影

2. **统一的文字样式**
   - 标题: `fontSize: 16, fontWeight: '500'`
   - 副文本: `fontSize: 14, fontWeight: '400', color: textSecondary`

3. **箭头导航**
   - 右侧显示箭头图标
   - 点击整个列表项进入详情

4. **统一间距**
   - `padding: 20` (容器)
   - `marginVertical: 10` (列表项)
   - `marginBottom: 12` (标签)

### MCP 界面当前问题：
1. ❌ 使用卡片样式 (有背景色、边框)
2. ❌ 有多个按钮 (View Tools, Delete)
3. ❌ 状态显示过于复杂
4. ❌ OAuth 提示框样式不统一
5. ❌ 预设列表也使用卡片样式

## 🎯 改造目标

让 MCP 界面完全匹配 Settings 风格：
- 简洁的列表项布局
- 统一的文字和间距
- 箭头导航交互
- 最小化视觉元素

## 📝 详细改造方案

### 1. 服务器列表项改造

**当前结构：**
```
┌─────────────────────────────────────┐ (卡片)
│ Notion MCP  [Remote]  [Pending Auth]│
│ 0 tools available                   │
│ ⚠️ OAuth 提示框                     │
│ [View Tools]  [Delete]              │
└─────────────────────────────────────┘
```

**改为 Settings 风格：**
```
Notion MCP  [Remote]                    →
0 tools • Pending Auth
─────────────────────────────────────────
```

**实现：**
- 移除卡片背景和边框
- 使用 `itemContainer` 样式
- 左侧：服务器名 + 类型标签 + 状态信息
- 右侧：箭头图标
- 点击整行进入工具列表
- 长按显示删除选项

### 2. 状态显示简化

**当前：** 独立的状态标签 `[⏳ Pending Auth]`

**改为：** 融入副文本
- `0 tools • Active` (绿色点)
- `0 tools • Pending Auth` (橙色点)
- `0 tools • Connecting` (灰色点 + 加载动画)

### 3. OAuth 提示改造

**当前：** 黄色提示框 + Check Status 按钮

**改为：** 
- 在状态文本中显示 "Pending Auth"
- 点击列表项自动检查状态
- 如需授权，自动打开浏览器

### 4. 预设列表改造

**当前：** 卡片样式

**改为：** Settings 风格列表项
```
📝 Notion                               →
Access your Notion workspace (Remote)

🔧 AWS Labs Core                        →
AWS service integration tools (Local)
```

### 5. 删除功能改造

**当前：** Delete 按钮

**改为：** 
- 长按列表项显示 Alert
- 或者在工具详情页面添加删除按钮

## 🎨 样式调整清单

### 需要移除的样式：
- ❌ `serverCard` (卡片)
- ❌ `buttonRow` (按钮行)
- ❌ `button` (按钮)
- ❌ `deleteButton` (删除按钮)
- ❌ `authPrompt` (OAuth 提示框)
- ❌ `presetCard` (预设卡片)

### 需要添加的样式：
- ✅ `serverItemContainer` (匹配 Settings itemContainer)
- ✅ `serverLeftContent` (左侧内容)
- ✅ `serverRightContent` (右侧箭头)
- ✅ `statusDot` (状态点)
- ✅ `statusRow` (状态行)

### 需要保留的样式：
- ✅ `serverName` (调整为 label 样式)
- ✅ `serverInfo` (调整为 text 样式)
- ✅ `typeBadge` (保留但调整大小)
- ✅ `separator` (分隔线)

## 🔧 代码改造步骤

### Step 1: 修改服务器列表项结构
```tsx
<TouchableOpacity 
  style={styles.itemContainer}
  onPress={() => viewTools(server.server_id, server.name)}
  onLongPress={() => confirmDelete(server.server_id, server.name)}>
  
  <View style={styles.serverLeftContent}>
    <View style={styles.serverTitleRow}>
      <Text style={styles.label}>{server.name}</Text>
      <View style={[styles.typeBadge, {backgroundColor: isRemote ? '#4A90E2' : '#7B68EE'}]}>
        <Text style={styles.typeBadgeText}>{isRemote ? 'Remote' : 'Local'}</Text>
      </View>
    </View>
    <View style={styles.statusRow}>
      <View style={[styles.statusDot, {backgroundColor: getStatusColor(server.status)}]} />
      <Text style={styles.text}>
        {server.tool_count} {server.tool_count === 1 ? 'tool' : 'tools'} • {getStatusText(server.status)}
      </Text>
    </View>
  </View>
  
  <Image style={styles.arrowImage} source={...} />
</TouchableOpacity>
```

### Step 2: 修改预设列表项结构
```tsx
<TouchableOpacity 
  style={styles.itemContainer}
  onPress={() => selectPreset(preset)}>
  
  <View style={styles.presetLeftContent}>
    <Text style={styles.presetIcon}>{preset.icon}</Text>
    <View>
      <Text style={styles.label}>{preset.name}</Text>
      <Text style={styles.text}>{preset.description}</Text>
    </View>
  </View>
  
  <Image style={styles.arrowImage} source={...} />
</TouchableOpacity>
```

### Step 3: 简化状态处理
- 移除独立的状态标签
- 移除 OAuth 提示框
- 状态融入副文本显示

### Step 4: 调整样式定义
- 使用 Settings 的 `itemContainer`
- 使用 Settings 的 `label` 和 `text`
- 使用 Settings 的 `arrowImage`
- 添加 `statusDot` 和 `statusRow`

## ✅ 预期效果

### 改造前：
- 视觉复杂，卡片样式突出
- 多个按钮，操作分散
- OAuth 提示框占用空间

### 改造后：
- 简洁清爽，与 Settings 一致
- 单一交互，点击进入详情
- 状态信息紧凑显示
- 整体风格统一专业

## 📋 验证清单

改造完成后需要验证：
- [ ] 列表项样式与 Settings 完全一致
- [ ] 间距、字体、颜色统一
- [ ] 交互方式一致（点击进入，长按删除）
- [ ] 状态显示清晰简洁
- [ ] 预设列表风格统一
- [ ] 无多余视觉元素
- [ ] 整体专业统一

## 🔌 后台 API 设计分析

### 后台支持的操作：
1. **POST /api/mcp/servers** - 添加服务器
   - 返回: `{server_id, status, auth_url?}`
   - status 可能是: `connecting` 或 `pending_auth`

2. **GET /api/mcp/servers** - 列出所有服务器
   - 返回: `{servers: [{server_id, name, status, tool_count}]}`

3. **DELETE /api/mcp/servers/{id}** - 删除服务器

4. **GET /api/mcp/servers/{id}/tools** - 获取工具列表

5. **GET /api/mcp/servers/{id}/status** - 获取服务器状态
   - 返回: `{server_id, name, status}`

6. **GET /api/mcp/oauth/callback** - OAuth 回调
   - 支持传统 OAuth 和 MCP OAuth

### 服务器状态流转：
```
connecting → active (成功)
connecting → pending_auth (需要 OAuth)
connecting → error (失败)

pending_auth → active (授权完成)
pending_auth → error (授权失败)
```

### 后台异步连接机制：
- 添加服务器后，后台创建异步任务连接
- 前端需要轮询或主动检查状态
- OAuth 流程：
  1. 后台检测需要 OAuth → 返回 `pending_auth` + `auth_url`
  2. 前端打开浏览器授权
  3. 用户授权后，后台收到回调
  4. 后台自动完成连接，状态变为 `active`
  5. 前端需要刷新状态查看结果

## 🎯 前端需要支持的功能

### 1. 状态轮询/刷新
**问题：** 后台异步连接，前端不知道何时完成

**方案：**
- 添加服务器后，如果状态是 `connecting`，启动轮询
- 每 2-3 秒调用 `getServerStatus()` 检查状态
- 状态变为 `active` 或 `error` 后停止轮询
- 显示加载动画提示用户

### 2. OAuth 授权流程
**问题：** `pending_auth` 状态需要用户操作

**方案：**
- 检测到 `pending_auth` 状态，显示提示
- 提供"授权"按钮，打开 `auth_url`
- 提供"检查状态"按钮，手动刷新状态
- 授权完成后，后台自动连接，前端刷新看到 `active`

### 3. 错误处理
**问题：** 连接可能失败

**方案：**
- `error` 状态显示错误信息
- 提供"重试"功能（删除后重新添加）
- 显示错误原因（如果后台提供）

### 4. 工具列表查看
**问题：** 需要查看服务器提供的工具

**方案：**
- 点击服务器进入工具详情页
- 显示工具名称、描述、参数
- 只有 `active` 状态才能查看工具

### 5. 服务器删除
**问题：** 需要删除不需要的服务器

**方案：**
- 长按列表项显示删除确认
- 或在工具详情页添加删除按钮
- 删除后刷新列表

## 📝 完善后的改造方案

### 1. 服务器列表项改造

**Settings 风格布局：**
```tsx
<TouchableOpacity 
  style={styles.itemContainer}
  onPress={() => handleServerPress(server)}
  onLongPress={() => confirmDelete(server)}>
  
  <View style={styles.leftContent}>
    {/* 第一行：名称 + 类型标签 */}
    <View style={styles.titleRow}>
      <Text style={styles.label}>{server.name}</Text>
      <View style={[styles.typeBadge, {backgroundColor: badgeColor}]}>
        <Text style={styles.typeBadgeText}>{transportType}</Text>
      </View>
    </View>
    
    {/* 第二行：工具数 + 状态 */}
    <View style={styles.statusRow}>
      <View style={[styles.statusDot, {backgroundColor: statusColor}]} />
      <Text style={styles.text}>
        {server.tool_count} {server.tool_count === 1 ? 'tool' : 'tools'} • {statusText}
      </Text>
      {isConnecting && <ActivityIndicator size="small" />}
    </View>
  </View>
  
  <Image style={styles.arrowImage} source={arrowIcon} />
</TouchableOpacity>
```

**视觉效果：**
```
Notion MCP  [Remote]                    →
0 tools • Pending Auth  ⟳
─────────────────────────────────────────
AWS Labs Core  [Local]                  →
1 tool • Active
```

### 2. 状态处理逻辑

**connecting 状态：**
- 显示加载动画
- 自动轮询状态（每 3 秒）
- 状态文本: "Connecting..."

**pending_auth 状态：**
- 显示橙色状态点
- 状态文本: "Pending Auth"
- 点击列表项 → 显示授权对话框
  - "Open Browser to Authorize" 按钮
  - "Check Status" 按钮
  - "Cancel" 按钮

**active 状态：**
- 显示绿色状态点
- 状态文本: "Active"
- 点击列表项 → 进入工具列表页

**error 状态：**
- 显示红色状态点
- 状态文本: "Error"
- 点击列表项 → 显示错误详情
  - 错误信息
  - "Retry" 按钮（删除后重新添加）
  - "Delete" 按钮

### 3. 交互流程

**添加服务器流程：**
```
1. 点击 "Add MCP Server"
2. 选择预设或自定义
3. 配置参数
4. 保存
5. 后台开始连接（状态: connecting）
6. 前端显示加载动画，开始轮询
7a. 连接成功 → 状态变为 active
7b. 需要 OAuth → 状态变为 pending_auth，显示授权提示
7c. 连接失败 → 状态变为 error，显示错误
```

**OAuth 授权流程：**
```
1. 服务器状态为 pending_auth
2. 点击服务器 → 显示授权对话框
3. 点击 "Open Browser" → 打开 auth_url
4. 用户在浏览器中授权
5. 后台收到回调，自动完成连接
6. 前端点击 "Check Status" 或自动轮询
7. 状态变为 active，显示工具数量
```

**查看工具流程：**
```
1. 点击 active 状态的服务器
2. 进入工具详情页
3. 显示工具列表（名称、描述）
4. 底部显示 "Delete Server" 按钮
```

### 4. 新增组件需求

**授权对话框 (AuthDialog)：**
```tsx
<Modal visible={showAuthDialog}>
  <View style={styles.dialogContainer}>
    <Text style={styles.dialogTitle}>Authorization Required</Text>
    <Text style={styles.dialogText}>
      {serverName} requires OAuth authorization.
      Please open your browser to complete the authorization.
    </Text>
    
    <TouchableOpacity 
      style={styles.primaryButton}
      onPress={() => Linking.openURL(authUrl)}>
      <Text style={styles.primaryButtonText}>Open Browser</Text>
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={styles.secondaryButton}
      onPress={checkStatus}>
      <Text style={styles.secondaryButtonText}>Check Status</Text>
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={styles.cancelButton}
      onPress={closeDialog}>
      <Text style={styles.cancelButtonText}>Cancel</Text>
    </TouchableOpacity>
  </View>
</Modal>
```

**错误对话框 (ErrorDialog)：**
```tsx
<Modal visible={showErrorDialog}>
  <View style={styles.dialogContainer}>
    <Text style={styles.dialogTitle}>Connection Error</Text>
    <Text style={styles.dialogText}>{errorMessage}</Text>
    
    <TouchableOpacity 
      style={styles.primaryButton}
      onPress={retry}>
      <Text style={styles.primaryButtonText}>Retry</Text>
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={styles.deleteButton}
      onPress={deleteServer}>
      <Text style={styles.deleteButtonText}>Delete Server</Text>
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={styles.cancelButton}
      onPress={closeDialog}>
      <Text style={styles.cancelButtonText}>Cancel</Text>
    </TouchableOpacity>
  </View>
</Modal>
```

### 5. 状态管理

**需要添加的 state：**
```tsx
const [pollingServers, setPollingServers] = useState<Set<string>>(new Set());
const [authDialogServer, setAuthDialogServer] = useState<MCPServer | null>(null);
const [errorDialogServer, setErrorDialogServer] = useState<{server: MCPServer, error: string} | null>(null);
```

**轮询逻辑：**
```tsx
useEffect(() => {
  const interval = setInterval(async () => {
    for (const serverId of pollingServers) {
      const status = await mcpClient.getServerStatus(serverId);
      if (status.status !== 'connecting') {
        // 停止轮询
        setPollingServers(prev => {
          const next = new Set(prev);
          next.delete(serverId);
          return next;
        });
        // 刷新列表
        await loadServers();
      }
    }
  }, 3000);
  
  return () => clearInterval(interval);
}, [pollingServers]);
```

## 🎨 样式调整清单（更新）

### 需要移除的样式：
- ❌ `serverCard` (卡片)
- ❌ `buttonRow` (按钮行)
- ❌ `button` (通用按钮 - 保留用于对话框)
- ❌ `deleteButton` (删除按钮 - 保留用于对话框)
- ❌ `authPrompt` (OAuth 提示框 - 改为对话框)
- ❌ `presetCard` (预设卡片)

### 需要添加的样式：
- ✅ `itemContainer` (Settings 风格列表项)
- ✅ `leftContent` (左侧内容容器)
- ✅ `titleRow` (标题行)
- ✅ `statusRow` (状态行)
- ✅ `statusDot` (状态点 - 6x6 圆点)
- ✅ `dialogContainer` (对话框容器)
- ✅ `dialogTitle` (对话框标题)
- ✅ `dialogText` (对话框文本)
- ✅ `primaryButton` (主按钮)
- ✅ `secondaryButton` (次按钮)
- ✅ `cancelButton` (取消按钮)

### 需要保留并调整的样式：
- ✅ `label` (使用 Settings 的 label)
- ✅ `text` (使用 Settings 的 text)
- ✅ `typeBadge` (保留但调整大小)
- ✅ `separator` (分隔线)
- ✅ `arrowImage` (使用 Settings 的箭头)

## 🚀 执行确认

**请确认以上完善后的方案是否符合您的要求？**

主要改动：
1. ✅ 移除卡片样式，改为 Settings 风格列表项
2. ✅ 移除内联按钮，改为点击整行交互
3. ✅ 简化状态显示，融入副文本（带状态点）
4. ✅ 添加状态轮询机制（connecting 状态）
5. ✅ 添加授权对话框（pending_auth 状态）
6. ✅ 添加错误对话框（error 状态）
7. ✅ 统一预设列表风格
8. ✅ 完全匹配 Settings 界面风格
9. ✅ 支持后台异步连接流程
10. ✅ 完整的 OAuth 授权流程

**新增功能：**
- 自动轮询 connecting 状态
- OAuth 授权对话框
- 错误处理对话框
- 长按删除服务器
- 点击查看工具详情

确认后我将开始执行改造。
