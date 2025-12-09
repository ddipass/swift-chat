# Perplexity 完全整合到 MCP

## 变更说明
Perplexity 现在**完全**作为 MCP Server 使用，删除了所有旧的客户端实现。

## 删除的内容

### UI 层
- ✅ `PerplexitySettingsScreen.tsx` (627 行) - 独立设置界面
- ✅ `App.tsx` - Perplexity 路由和导入
- ✅ `RouteTypes.ts` - PerplexitySettings 类型
- ✅ `CustomDrawerContent.tsx` - 侧边栏入口

### 客户端实现
- ✅ `PerplexityTools.ts` (200+ 行) - 客户端工具定义
- ✅ `PerplexitySearch.ts` (300+ 行) - 客户端 API 调用
- ✅ `StorageUtils.ts` - 所有 Perplexity 存储函数（75 行）

### 集成代码
- ✅ `BuiltInTools.ts` - 移除 Perplexity 工具集成

**总计删除：~1200 行代码**

## Perplexity 工具说明
当你添加 Perplexity MCP server 后，它会**自动提供**以下工具：
- `perplexity_search` - 网页搜索
- `perplexity_ask` - 快速问答
- `perplexity_research` - 深度研究
- `perplexity_reason` - 推理分析

**这些工具由 MCP server 自动暴露，不需要我们手动定义。**

## 使用方法
1. 打开侧边栏 → **MCP Settings**
2. 点击 **"Add Perplexity"** 按钮
3. 编辑 server，设置环境变量：
   ```json
   {
     "PERPLEXITY_API_KEY": "your-api-key"
   }
   ```
4. 启用 server
5. 完成！工具会自动可用

## 架构对比

### 旧架构（已删除）
```
前端 → PerplexityTools → PerplexitySearch → Perplexity API
      ↓
   需要在前端配置 API Key（不安全）
   需要维护客户端实现
   需要单独的设置界面
```

### 新架构（当前）
```
前端 → MCP Manager → Perplexity MCP Server → Perplexity API
                    ↓
                 后端统一管理
                 API Key 在后端
                 自动获取工具列表
```

## 优势
- 🎯 **统一管理**：所有工具在 MCP Settings 中
- 🔧 **简化配置**：只需一个地方配置
- 📦 **大幅减少代码**：删除 ~1200 行
- 🚀 **更好的架构**：后端统一处理，更安全
- ✨ **自动更新**：MCP server 更新时自动获得新功能

## 文件变更统计
```
删除文件:
- PerplexitySettingsScreen.tsx    627 行
- PerplexityTools.ts               200+ 行
- PerplexitySearch.ts              300+ 行

修改文件:
- StorageUtils.ts                  -75 行
- BuiltInTools.ts                  -10 行
- App.tsx                          -4 行
- RouteTypes.ts                    -1 行
- CustomDrawerContent.tsx          -19 行

总计: 删除 ~1200 行代码
```
