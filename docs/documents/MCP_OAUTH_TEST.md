# MCP OAuth 完整测试流程

## 测试步骤

### 1. 启动服务器

```bash
cd server && source venv/bin/activate && cd src
export LOCAL_API_KEY=20250112Research
python3 main.py
```

### 2. 添加 Notion MCP

```bash
curl -X POST http://localhost:8080/api/mcp/servers \
  -H "Authorization: Bearer 20250112Research" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Notion",
    "command": "sse",
    "args": ["https://mcp.notion.com/mcp"]
  }'
```

**响应示例：**
```json
{
  "server_id": "5dddc41f",
  "status": "pending_auth",
  "auth_url": "https://mcp.notion.com/authorize?client_id=qKjBq1APgfL2DHSw&redirect_uri=/api/mcp/oauth/callback&response_type=code&state=oyH8qZgFaWBpgWVQ0DtSKaVbe2nRFbnEz6PZCqcDF2c&code_challenge=is11uZK5TXeWXI0_opBb1A7fgyYq95gYPDagNq6_YyY&code_challenge_method=S256"
}
```

### 3. 在浏览器中授权

1. 复制 `auth_url`
2. 在浏览器中打开
3. 登录 Notion（如果还没登录）
4. 选择要授权的工作区
5. 点击 "Allow access"

### 4. 自动回调处理

授权后，Notion 会重定向到：
```
http://localhost:8080/api/mcp/oauth/callback?code=xxx&state=yyy
```

后端自动：
1. 验证 state
2. 用 code + code_verifier 交换 access_token
3. 保存 token
4. 启动 MCP 客户端
5. 显示成功页面

### 5. 检查服务器状态

```bash
curl -s http://localhost:8080/api/mcp/servers \
  -H "Authorization: Bearer 20250112Research" | jq .
```

**应该返回：**
```json
{
  "servers": [
    {
      "id": "5dddc41f",
      "name": "Notion",
      "status": "active",
      "tools": [...]
    }
  ]
}
```

### 6. 查看可用工具

```bash
curl -s http://localhost:8080/api/mcp/servers/5dddc41f/tools \
  -H "Authorization: Bearer 20250112Research" | jq .
```

## 完整流程图

```
1. 用户添加 Notion MCP
   ↓
2. 后端尝试连接 (401)
   ↓
3. 发现授权元数据
   GET /.well-known/oauth-authorization-server
   ↓
4. 动态注册客户端
   POST /register
   返回: client_id
   ↓
5. 生成 PKCE
   code_verifier → SHA256 → code_challenge
   ↓
6. 返回授权 URL
   status: pending_auth
   auth_url: https://mcp.notion.com/authorize?...
   ↓
7. 用户在浏览器授权
   选择工作区 → Allow access
   ↓
8. Notion 重定向到 callback
   /api/mcp/oauth/callback?code=xxx&state=yyy
   ↓
9. 后端处理回调
   - 验证 state
   - 查找 pending_auth 服务器
   - 重建 MCP OAuth 客户端
   ↓
10. 交换 token
    POST /token
    {
      grant_type: authorization_code,
      code: xxx,
      code_verifier: yyy,
      client_id: zzz
    }
    返回: access_token, refresh_token
    ↓
11. 保存 token
    storage.save_token(server_id, tokens)
    ↓
12. 启动 MCP 客户端
    - 创建 SSE 客户端
    - 添加 Authorization: Bearer <token>
    - 初始化连接
    - 获取工具列表
    ↓
13. 更新状态
    status: active
    tools: [...]
    ↓
14. 显示成功页面
    ✓ Authorization Successful!
    (自动关闭)
```

## 关键代码

### 1. 动态客户端注册

```python
# mcp/mcp_oauth.py
async def register_client(self) -> Dict:
    response = await client.post(
        registration_endpoint,
        json={
            "client_name": "SwiftChat MCP Client",
            "redirect_uris": [callback_url],
            "grant_types": ["authorization_code", "refresh_token"],
            "token_endpoint_auth_method": "none"  # Public client
        }
    )
    self.client_id = response.json()["client_id"]
```

### 2. PKCE 生成

```python
# 生成 code_verifier
self.code_verifier = base64.urlsafe_b64encode(
    secrets.token_bytes(32)
).decode('utf-8').rstrip('=')

# 生成 code_challenge
challenge_bytes = hashlib.sha256(
    self.code_verifier.encode('utf-8')
).digest()
self.code_challenge = base64.urlsafe_b64encode(
    challenge_bytes
).decode('utf-8').rstrip('=')
```

### 3. Token 交换

```python
async def exchange_code(self, code: str) -> Dict:
    response = await client.post(
        token_endpoint,
        data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": callback_url,
            "client_id": self.client_id,
            "code_verifier": self.code_verifier
        }
    )
    return response.json()
```

### 4. 回调处理

```python
# main.py
@app.get("/api/mcp/oauth/callback")
async def mcp_oauth_callback(code: str, state: str):
    # 完成 MCP OAuth
    server_id = await mcp_manager.complete_mcp_oauth(code, state)
    
    # 显示成功页面
    return HTMLResponse("✓ Authorization Successful!")
```

## 测试结果

### 成功标志

1. ✅ 返回 `pending_auth` 和 `auth_url`
2. ✅ 浏览器打开授权页面
3. ✅ 授权后自动回调
4. ✅ Token 交换成功
5. ✅ MCP 客户端启动
6. ✅ 状态变为 `active`
7. ✅ 工具列表可用

### 常见问题

**1. redirect_uri 不匹配**
```
Error: redirect_uri_mismatch
```
**解决：** 确保 callback_base_url 正确

**2. state 不匹配**
```
Error: No pending auth server found
```
**解决：** 检查 state 是否正确保存

**3. code_verifier 错误**
```
Error: invalid_grant
```
**解决：** 确保 code_verifier 正确保存和传递

## 安全考虑

1. ✅ **PKCE** - 防止授权码拦截
2. ✅ **State** - 防止 CSRF 攻击
3. ✅ **HTTPS** - 所有端点使用 HTTPS
4. ✅ **Token 存储** - 安全存储在 SSM
5. ✅ **Public Client** - 无 client_secret

## 总结

MCP OAuth 实现完成：
- ✅ 元数据发现
- ✅ 动态客户端注册
- ✅ PKCE 支持
- ✅ 授权 URL 生成
- ✅ 回调处理
- ✅ Token 交换
- ✅ Token 存储
- ✅ MCP 客户端启动

用户体验：
1. 点击添加 Notion
2. 浏览器自动打开
3. 授权
4. 完成！

从 10+ 步骤简化到 3 步！🎉
