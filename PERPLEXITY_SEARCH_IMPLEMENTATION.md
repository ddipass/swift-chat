# Perplexity Search Implementation

## 概述

实现Perplexity Search API集成，提供实时网页搜索功能。

## 已完成

### 1. Perplexity Search Client (`PerplexitySearch.ts`)

**功能：**
- ✅ HTTP API调用（使用API Key认证）
- ✅ 搜索参数配置（max_results, country, recency_filter）
- ✅ 结果格式化为Markdown

**API端点：**
```
POST https://api.perplexity.ai/search
Authorization: Bearer {API_KEY}
```

**使用示例：**
```typescript
const client = new PerplexitySearchClient(apiKey);
const results = await client.search({
  query: 'latest AI developments',
  maxResults: 10,
  recencyFilter: 'week',
});
const markdown = client.formatResults(results);
```

### 2. Storage配置 (`StorageUtils.ts`)

**新增函数：**
- `getPerplexityEnabled()` - 获取启用状态
- `setPerplexityEnabled()` - 设置启用状态
- `getPerplexityApiKey()` - 获取API Key
- `savePerplexityApiKey()` - 保存API Key

### 3. Settings UI (`PerplexitySettingsScreen.tsx`)

**界面元素：**
- ✅ Enable/Disable开关
- ✅ API Key输入框（加密显示）
- ✅ 使用说明卡片
- ✅ 功能特性说明

**UI风格：**
- 与MCP Settings保持一致
- 使用统一的padding/margin
- 使用CustomTextInput组件
- 响应主题颜色

## 待完成

### 1. 路由配置

**需要修改的文件：**
- `src/types/RouteTypes.ts` - 添加PerplexitySettings路由
- `src/navigation/` - 添加到导航栈

**示例：**
```typescript
// RouteTypes.ts
export type RouteParamList = {
  // ... existing routes
  PerplexitySettings: undefined;
};

// Navigation
<Stack.Screen
  name="PerplexitySettings"
  component={PerplexitySettingsScreen}
  options={{ title: 'Perplexity Search' }}
/>
```

### 2. Settings入口

**在SettingsScreen.tsx中添加：**
```typescript
<TouchableOpacity
  style={styles.itemContainer}
  onPress={() => navigation.navigate('PerplexitySettings', {})}>
  <Text style={styles.label}>Perplexity Search</Text>
  <View style={styles.arrowContainer}>
    <Image source={backIcon} style={styles.arrowImage} />
  </View>
</TouchableOpacity>
```

### 3. 集成到聊天功能

**方案A：作为工具使用**
```typescript
// 在BuiltInTools.ts中添加
{
  name: 'perplexity_search',
  description: 'Search the web using Perplexity AI',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string' },
      maxResults: { type: 'number' },
    },
    required: ['query'],
  },
}
```

**方案B：作为独立功能**
- 在聊天界面添加搜索按钮
- 点击后弹出搜索对话框
- 搜索结果插入到聊天中

### 4. 错误处理

**需要处理的情况：**
- API Key未配置
- API Key无效
- 网络错误
- 速率限制
- 搜索结果为空

## 使用流程

### 用户配置流程

```
1. 打开Settings
   ↓
2. 点击"Perplexity Search"
   ↓
3. 开启Enable开关
   ↓
4. 访问 https://www.perplexity.ai/account/api/group
   ↓
5. 生成API Key
   ↓
6. 复制并粘贴到SwiftChat
   ↓
7. 保存
   ↓
8. 完成！
```

### 使用流程

**方案A（工具方式）：**
```
用户: "搜索最新的AI新闻"
  ↓
AI识别需要搜索
  ↓
调用perplexity_search工具
  ↓
返回搜索结果
  ↓
AI基于结果回答
```

**方案B（独立功能）：**
```
用户点击搜索按钮
  ↓
输入搜索关键词
  ↓
显示搜索结果
  ↓
点击结果查看详情
```

## API特性

### 搜索参数

| 参数 | 类型 | 说明 |
|------|------|------|
| query | string | 搜索查询 |
| max_results | number | 最大结果数（1-20） |
| country | string | 国家代码（US, GB等） |
| search_recency_filter | enum | 时间过滤（day/week/month/year） |
| search_domain_filter | string[] | 域名过滤（最多20个） |

### 搜索结果

```typescript
{
  title: string;        // 标题
  url: string;          // URL
  snippet: string;      // 摘要
  date: string;         // 索引日期
  last_updated: string; // 最后更新日期
}
```

## 优势

### vs MCP
- ✅ **简单**：只需API Key，无需OAuth
- ✅ **稳定**：HTTP API，不依赖stdio
- ✅ **跨平台**：Android/iOS/macOS都支持
- ✅ **快速**：直接API调用，无需中间层

### vs 内置web_fetch
- ✅ **智能**：AI驱动的搜索排序
- ✅ **全面**：搜索数百亿网页
- ✅ **实时**：持续更新的索引
- ✅ **结构化**：返回格式化的结果

## 成本

**Perplexity API定价：**
- $5 per 1000 requests
- 平均响应时间：<500ms
- 速率限制：1000 requests/minute (Pro tier)

## 安全考虑

1. **API Key存储**
   - 使用react-native-mmkv加密存储
   - 不在日志中显示
   - 不提交到Git

2. **输入验证**
   - 验证query长度
   - 验证max_results范围
   - 防止注入攻击

3. **错误处理**
   - 不暴露API Key在错误信息中
   - 友好的用户提示
   - 详细的开发者日志

## 下一步

1. **完成路由配置** - 添加到导航栈
2. **添加Settings入口** - 在主Settings页面
3. **集成到聊天** - 选择工具方式或独立功能
4. **测试** - 各平台测试
5. **文档** - 用户使用指南

## 文件清单

- ✅ `PerplexitySearch.ts` - API客户端
- ✅ `PerplexitySettingsScreen.tsx` - 设置界面
- ✅ `StorageUtils.ts` - 配置存储
- ⏳ `RouteTypes.ts` - 路由定义（待添加）
- ⏳ `BuiltInTools.ts` - 工具集成（待添加）

## 总结

✅ **核心功能已实现**
- Perplexity Search API客户端
- 配置存储
- Settings UI

⏳ **待集成**
- 路由配置
- Settings入口
- 聊天功能集成

**预计完成时间：** 30分钟
**代码量：** ~200行
