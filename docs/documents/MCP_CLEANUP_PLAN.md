# MCP 实现清理和优化计划

## 📊 当前状态

### ✅ 已验证工作的功能

1. **stdio 传输** - AWS Labs Core MCP 服务器 ✅
2. **Streamable HTTP 传输** - Notion MCP 服务器 ✅
3. **MCP OAuth 2.0** - 动态客户端注册 + PKCE ✅
4. **传统 OAuth** - 预注册客户端 ✅
5. **后台任务管理** - 异步连接 ✅
6. **状态跟踪** - connecting/pending_auth/active/error ✅

### 📁 当前文件结构

```
mcp_integration/
├── __init__.py
├── client.py           # stdio 客户端 (4.6K)
├── manager.py          # 核心管理器 (16K)
├── mcp_oauth.py        # MCP OAuth 2.0 (5.3K)
├── oauth.py            # 传统 OAuth (6.6K)
├── sse_client.py       # 自定义 SSE 客户端 (5.3K)
├── storage.py          # 配置和 token 存储 (3.0K)
└── streamable_client.py # MCP SDK 客户端 (4.2K)
```

## 🎯 清理目标

### 1. 代码重复问题

**问题**:
- `sse_client.py` 和 `streamable_client.py` 功能重叠
- `oauth.py` 和 `mcp_oauth.py` 都处理 OAuth，但方式不同
- `manager.py` 中有重复的连接逻辑

**建议**:
- ✅ **保留 `streamable_client.py`** (使用官方 MCP SDK)
- ⚠️ **评估 `sse_client.py`** - 仅用于 OAuth 元数据发现，可以简化
- ✅ **保留两个 OAuth 实现** - 用途不同

### 2. 代码组织

**当前问题**:
- `manager.py` 太大 (16K)，包含太多逻辑
- 连接逻辑分散在多个方法中

**建议重构**:
```
mcp_integration/
├── __init__.py
├── manager.py          # 核心管理器 (简化)
├── transports/         # 传输层
│   ├── stdio.py       # stdio 传输
│   └── http.py        # HTTP/SSE 传输
├── auth/              # 认证层
│   ├── mcp_oauth.py   # MCP OAuth 2.0
│   └── oauth.py       # 传统 OAuth
└── storage.py         # 存储层
```

### 3. 错误处理

**当前问题**:
- 某些错误被静默捕获
- 日志级别不一致

**改进**:
- 统一错误处理模式
- 添加更详细的错误信息
- 改进日志结构

## 📋 清理任务清单

### 阶段 1: 评估和测试 (当前)

- [x] 验证 stdio 传输工作
- [x] 验证 Streamable HTTP 传输工作
- [x] 验证 MCP OAuth 流程
- [x] 验证传统 OAuth 流程
- [ ] 测试错误场景
- [ ] 测试 token 刷新

### 阶段 2: 简化 SSE 客户端

**选项 A: 完全移除 `sse_client.py`**
- 使用 httpx 直接发现 OAuth 元数据
- 优点: 减少代码，减少依赖
- 缺点: 失去 SSE 连接能力（但我们已经用 MCP SDK）

**选项 B: 简化为元数据发现工具**
```python
# sse_client.py -> metadata_discovery.py
async def discover_oauth_metadata(url: str) -> dict:
    """发现 OAuth 元数据"""
    # 简化的实现，只做元数据发现
```

**推荐**: 选项 B - 保留但简化

### 阶段 3: 重构 manager.py

**拆分职责**:
1. **ServerManager** - 服务器生命周期管理
2. **ConnectionManager** - 连接建立和维护
3. **AuthManager** - 认证流程协调

**示例结构**:
```python
class MCPManager:
    def __init__(self):
        self.storage = MCPStorage()
        self.auth_manager = AuthManager(self.storage)
        self.connection_manager = ConnectionManager()
        self.servers = {}
    
    async def add_server(self, config):
        # 简化的添加逻辑
        pass
```

### 阶段 4: 改进错误处理

**统一错误类型**:
```python
class MCPError(Exception):
    """基础 MCP 错误"""
    pass

class MCPConnectionError(MCPError):
    """连接错误"""
    pass

class MCPAuthError(MCPError):
    """认证错误"""
    pass
```

### 阶段 5: 添加测试

**单元测试**:
- OAuth 流程测试
- 连接管理测试
- 错误处理测试

**集成测试**:
- stdio 服务器连接
- HTTP 服务器连接
- OAuth 完整流程

## 🚀 优化建议

### 性能优化

1. **连接池** - 复用 HTTP 连接
2. **Token 缓存** - 避免重复刷新
3. **并发控制** - 限制同时连接数

### 安全优化

1. **Token 加密存储** - 使用 cryptography
2. **PKCE 验证** - 确保 code_verifier 安全
3. **超时控制** - 防止挂起

### 可维护性

1. **类型注解** - 添加完整的类型提示
2. **文档字符串** - 改进 docstring
3. **配置验证** - 使用 Pydantic 模型

## 📝 推荐的清理顺序

### 立即执行 (高优先级)

1. ✅ **验证所有功能** - 确保没有回归
2. **简化 sse_client.py** - 只保留元数据发现
3. **清理 manager.py** - 移除重复代码
4. **统一日志格式** - 使用一致的日志级别

### 短期 (1-2 天)

5. **重构 manager.py** - 拆分为多个类
6. **改进错误处理** - 添加自定义异常
7. **添加类型注解** - 提高代码质量
8. **更新文档** - 反映新的结构

### 中期 (1 周)

9. **添加单元测试** - 覆盖核心功能
10. **性能优化** - 连接池和缓存
11. **安全加固** - Token 加密
12. **集成测试** - 端到端测试

## 🎯 最终目标

### 代码质量指标

- **代码行数**: 减少 30%
- **重复代码**: < 5%
- **测试覆盖率**: > 80%
- **类型注解**: 100%

### 功能目标

- ✅ stdio 传输稳定
- ✅ HTTP 传输稳定
- ✅ OAuth 流程完整
- ✅ 错误处理健壮
- ⬜ Token 自动刷新
- ⬜ 连接重试机制
- ⬜ 性能监控

## 💡 建议

### 现在应该做什么？

**选项 1: 立即清理** (推荐)
- 简化 `sse_client.py`
- 清理 `manager.py` 重复代码
- 统一日志和错误处理
- 时间: 2-3 小时

**选项 2: 保持现状，添加功能**
- 实现 token 自动刷新
- 添加连接重试
- 改进前端 UI
- 时间: 4-6 小时

**选项 3: 大重构**
- 完全重组代码结构
- 添加完整测试套件
- 性能和安全优化
- 时间: 1-2 天

### 我的推荐

**先做选项 1 (立即清理)**，原因：
1. 代码已经工作，不要破坏
2. 清理会让后续开发更容易
3. 减少技术债务
4. 为添加新功能打好基础

然后再考虑选项 2 (添加功能)。

## 🤔 你的选择？

请告诉我你想：
1. **立即清理代码** - 简化和优化现有实现
2. **添加新功能** - token 刷新、重试等
3. **大重构** - 完全重组代码结构
4. **保持现状** - 代码已经工作，专注其他部分

我会根据你的选择提供具体的实施步骤！
