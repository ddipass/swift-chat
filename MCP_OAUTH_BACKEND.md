# MCP OAuth Backend Implementation

## 架构变更

### 之前 (有问题)
```
前端 → 使用 child_process → ❌ React Native不支持
```

### 现在 (正确)
```
前端 (配置界面)
  ↓ API调用
后端 (统一处理)
  ├── stdio MCP → 环境变量
  └── HTTP MCP → OAuth流程
```

## 实现细节

### 后端新增文件

#### `server/src/mcp_oauth.py`
- OAuth流程处理
- PKCE支持
- 动态客户端注册
- Token交换

### 后端新增API

#### 1. 启动OAuth流程
```
POST /api/mcp/oauth/start
Authorization: Bearer <token>

Request:
{
  "server_id": "server-uuid",
  "server_url": "https://mcp.example.com",
  "server_name": "Example MCP"
}

Response:
{
  "success": true,
  "auth_url": "https://mcp.example.com/authorize?..."
}
```

#### 2. OAuth回调处理
```
GET /api/mcp/oauth/callback?code=xxx&state=xxx

自动处理:
1. 验证state
2. 交换code获取token
3. 保存token到配置
4. 重定向: swiftchat://oauth/success?server_id=xxx
```

### 前端变更

#### `MCPSettingsScreen.tsx`
- 移除 `MCPOAuth.ts` 导入
- 调用后端API启动OAuth
- 处理 `swiftchat://oauth/success` 和 `swiftchat://oauth/error` 回调

## OAuth流程

```
1. 用户点击"Authorize"按钮
   ↓
2. 前端调用 POST /api/mcp/oauth/start
   ↓
3. 后端生成OAuth URL并返回
   ↓
4. 前端用 Linking.openURL() 打开浏览器
   ↓
5. 用户在浏览器中授权
   ↓
6. 浏览器重定向到 /api/mcp/oauth/callback
   ↓
7. 后端处理回调，获取token并保存
   ↓
8. 后端更新MCPManager中的token
   ↓
9. 后端重定向到 swiftchat://oauth/success
   ↓
10. 前端接收回调，调用 GET /api/mcp/server/{id} 获取更新的配置
   ↓
11. 前端保存token到本地存储
   ↓
12. 显示成功消息
```

## Token管理

### 后端
- 内存中维护 `mcp_servers_config` 字典
- OAuth callback时保存 `oauthToken`, `oauthRefreshToken`, `oauthExpiry`
- 调用 `MCPManager.update_server_token()` 更新运行中的服务器

### 前端
- OAuth成功后调用 `GET /api/mcp/server/{id}` 获取token
- 使用 `updateMCPServer()` 保存到本地存储
- 下次同步配置时会包含token

## 新增API

#### 3. 获取服务器配置
```
GET /api/mcp/server/{server_id}
Authorization: Bearer <token>

Response:
{
  "success": true,
  "server": {
    "id": "server-uuid",
    "name": "Example MCP",
    "url": "https://mcp.example.com",
    "oauthToken": "access_token_here",
    "oauthRefreshToken": "refresh_token_here",
    "oauthExpiry": 1234567890
  }
}
```

## 优势

✅ **解决编译问题**: 移除了 `child_process` 依赖  
✅ **架构统一**: 后端统一处理stdio和HTTP两种MCP  
✅ **更安全**: Token存储在后端  
✅ **更易维护**: OAuth逻辑集中在后端  
✅ **跨平台**: 前端只需要 `Linking.openURL()`  
✅ **Token持久化**: 前后端都保存token

## 完成功能

- [x] 后端OAuth流程处理
- [x] PKCE支持
- [x] 动态客户端注册
- [x] Token交换
- [x] Token保存到后端配置
- [x] Token更新到MCPManager
- [x] 前端获取更新后的配置
- [x] Token保存到前端本地存储
- [x] **Token自动刷新机制**
- [x] **Token过期检测（提前5分钟）**

## Token刷新机制

### 自动刷新触发时机
- 每次执行工具前检查所有服务器token
- Token过期前5分钟自动刷新
- 使用refresh_token获取新的access_token

### 实现细节
```python
async def refresh_token_if_needed(server_id: str):
    # 1. 检查是否有refresh_token
    # 2. 检查token是否即将过期（< 5分钟）
    # 3. 调用token_endpoint刷新
    # 4. 更新配置和MCPManager
```

### 保存的Token信息
- `oauthToken`: 访问令牌
- `oauthRefreshToken`: 刷新令牌
- `oauthExpiry`: 过期时间戳
- `tokenEndpoint`: Token端点（用于刷新）
- `clientId`: 客户端ID（用于刷新）

## TODO

- [ ] 支持预配置的client_id (不支持动态注册的服务器)
