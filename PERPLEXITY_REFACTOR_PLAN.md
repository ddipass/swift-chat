# Perplexity功能重构计划

## 实施时间
2025-12-08 18:30

## 问题清单

1. ❌ Search工具未注册到Chat
2. ❌ Settings位置错误（应该在左侧菜单）
3. ❌ 没有连接测试功能
4. ❌ API Base URL未显示/不可配置
5. ❌ Debug信息在console而不是返回结果
6. ❌ 配置界面缺少Debug信息显示

## 修复步骤

### Phase 1: 基础功能修复 (30分钟)

#### 1.1 移除console.log ✅
**文件：**
- `src/mcp/PerplexityTools.ts` - 移除getPerplexityTools中的console.log
- `src/mcp/BuiltInTools.ts` - 移除getBuiltInTools中的console.log

**验证：**
```bash
grep -r "console.log.*Perplexity\|console.log.*BuiltIn" src/mcp/
# 应该没有输出
```

#### 1.2 添加Base URL支持 ✅
**文件：** `src/storage/StorageUtils.ts`
```typescript
const perplexityBaseUrlKey = keyPrefix + 'perplexityBaseUrl';

export function getPerplexityBaseUrl(): string {
  return storage.getString(perplexityBaseUrlKey) || 'https://api.perplexity.ai';
}

export function savePerplexityBaseUrl(url: string) {
  storage.set(perplexityBaseUrlKey, url);
}
```

#### 1.3 更新PerplexitySearchClient ✅
**文件：** `src/search/PerplexitySearch.ts`
```typescript
constructor(apiKey: string, baseUrl = 'https://api.perplexity.ai') {
  this.apiKey = apiKey;
  this.baseUrl = baseUrl;
}
```

#### 1.4 更新所有工具使用baseUrl ✅
**文件：** `src/mcp/PerplexityTools.ts`

每个工具的execute函数：
```typescript
const apiKey = getPerplexityApiKey();
const baseUrl = getPerplexityBaseUrl();
const client = new PerplexitySearchClient(apiKey, baseUrl);

// 在_debug中添加
details: {
  apiUrl: `${baseUrl}/search`,
  model: 'sonar-pro',
  ...
}
```

### Phase 2: UI重构 (60分钟)

#### 2.1 移动到左侧菜单
**文件：** `src/history/CustomDrawerContent.tsx`

添加Perplexity菜单项（在Settings之后）：
```typescript
<TouchableOpacity
  onPress={() => navigation.navigate('PerplexitySettings', {})}>
  <View style={styles.menuItem}>
    <Text style={styles.menuText}>🔍 Perplexity</Text>
  </View>
</TouchableOpacity>
```

**文件：** `src/settings/SettingsScreen.tsx`

移除Perplexity入口（删除navigate到PerplexitySettings的代码）

#### 2.2 完善配置界面
**文件：** `src/settings/PerplexitySettingsScreen.tsx`

新增状态：
```typescript
const [baseUrl, setBaseUrl] = useState(getPerplexityBaseUrl());
const [testing, setTesting] = useState(false);
const [testResult, setTestResult] = useState<{
  success: boolean;
  message: string;
  duration?: number;
} | null>(null);
const [registeredTools, setRegisteredTools] = useState<string[]>([]);
```

新增UI组件：
1. Base URL输入框
2. Test Connection按钮
3. 连接状态显示
4. Debug信息区域

#### 2.3 添加测试连接功能
```typescript
const testConnection = async () => {
  setTesting(true);
  const startTime = Date.now();
  
  try {
    const client = new PerplexitySearchClient(apiKey, baseUrl);
    await client.search({ query: 'test' }, 5000);
    
    setTestResult({
      success: true,
      message: 'Connected successfully',
      duration: Date.now() - startTime,
    });
  } catch (error) {
    setTestResult({
      success: false,
      message: error.message,
    });
  } finally {
    setTesting(false);
  }
};
```

#### 2.4 添加Debug信息显示
```typescript
useEffect(() => {
  // 获取已注册工具
  const tools = getBuiltInTools().map(t => t.name);
  setRegisteredTools(tools);
}, [enabled]);

// UI显示
<View style={styles.debugSection}>
  <Text style={styles.debugTitle}>Debug Information</Text>
  
  <Text style={styles.debugLabel}>Registered Tools ({registeredTools.length}):</Text>
  {registeredTools.map(tool => (
    <Text key={tool} style={styles.debugItem}>• {tool}</Text>
  ))}
  
  {testResult && (
    <>
      <Text style={styles.debugLabel}>Connection Test:</Text>
      <Text style={testResult.success ? styles.debugSuccess : styles.debugError}>
        {testResult.success ? '✅' : '❌'} {testResult.message}
        {testResult.duration && ` (${testResult.duration}ms)`}
      </Text>
    </>
  )}
</View>
```

### Phase 3: 测试与验证 (30分钟)

#### 3.1 代码质量检查
```bash
cd react-native

# ESLint
npm run lint
# 期望: 0 errors

# TypeScript
npx tsc --noEmit | grep -E "(Perplexity|BuiltIn)" | grep -v "test.ts"
# 期望: 0 errors

# Prettier
npx prettier --check "src/**/*.{ts,tsx}"
# 期望: All files pass
```

#### 3.2 功能测试
- [ ] Perplexity出现在左侧菜单
- [ ] 点击进入配置界面
- [ ] 显示Base URL输入框
- [ ] Test Connection按钮工作
- [ ] Debug区域显示工具列表
- [ ] 保存配置后工具可用

#### 3.3 工具调用测试
在Chat中测试：
```
用户: 搜索2024年AI发展
```

检查返回的`_debug`字段：
```json
{
  "_debug": {
    "tool": "perplexity_search",
    "duration_ms": 5234,
    "success": true,
    "details": {
      "query": "2024年AI发展",
      "resultCount": 10,
      "apiUrl": "https://api.perplexity.ai/search",
      "model": "sonar-pro"
    }
  }
}
```

## 文件修改清单

| 文件 | 修改类型 | 说明 |
|------|---------|------|
| StorageUtils.ts | 新增 | Base URL存储函数 |
| PerplexitySearch.ts | 修改 | 支持自定义baseUrl |
| PerplexityTools.ts | 修改 | 移除console.log，使用baseUrl，增强debug |
| BuiltInTools.ts | 修改 | 移除console.log |
| PerplexitySettingsScreen.tsx | 重构 | 添加Base URL、Test、Debug区域 |
| CustomDrawerContent.tsx | 新增 | Perplexity菜单项 |
| SettingsScreen.tsx | 删除 | 移除Perplexity入口 |

## 预估工作量

- Phase 1: 30分钟
- Phase 2: 60分钟
- Phase 3: 30分钟
- **总计: 2小时**

## 风险评估

### 低风险
- 移除console.log
- 添加Base URL存储
- 更新PerplexitySearchClient

### 中风险
- UI重构（可能影响现有布局）
- 移动菜单位置（需要测试导航）

### 高风险
- 无

## 回滚计划

如果出现问题：
```bash
git reset --hard HEAD~1
```

所有修改都在一个commit中，可以快速回滚。

## 下一步

由于修改较多，建议：
1. 先完成Phase 1（基础功能）
2. 测试并commit
3. 再完成Phase 2（UI重构）
4. 最后完成Phase 3（测试）

每个Phase独立commit，便于问题定位和回滚。

---

**准备好开始Phase 1了吗？**
