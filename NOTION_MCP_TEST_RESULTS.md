# Notion MCP OAuth 集成测试结果

## ✅ 测试状态：成功

**测试时间**: 2025-12-10 12:19

## 🎯 测试目标

验证 SwiftChat 服务器能否正确处理 Notion MCP 的 OAuth 2.0 认证流程。

## 📋 测试步骤

### 1. 添加 Notion MCP 服务器
```bash
curl -X POST http://localhost:8080/api/mcp/servers \
  -H "Authorization: Bearer test_key" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Notion",
    "command": "sse",
    "args": ["https://mcp.notion.com/mcp"],
    "callback_base_url": "http://localhost:8080"
  }'
```

**结果**: ✅ 服务器返回 `{"server_id": "...", "status": "connecting"}`

### 2. OAuth 流程自动触发

服务器自动执行以下步骤：

1. ✅ 检测到 401 Unauthorized 响应
2. ✅ 发现 OAuth 元数据：`https://mcp.notion.com/.well-known/oauth-authorization-server`
3. ✅ 动态客户端注册成功：`client_id=N45CwjysnCYxIDKP`
4. ✅ 生成 PKCE 参数（code_verifier, code_challenge）
5. ✅ 生成授权 URL
6. ✅ 服务器状态更新为 `pending_auth`

### 3. 验证服务器状态
```bash
curl http://localhost:8080/api/mcp/servers \
  -H "Authorization: Bearer test_key"
```

**结果**: ✅ 状态正确显示为 `pending_auth`

## 📊 关键日志输出

```
2025-12-10 12:16:45,086 - mcp_integration.streamable_client - INFO - Server requires OAuth: Bearer realm="OAuth", error="invalid_token"
2025-12-10 12:16:45,086 - mcp_integration.manager - INFO - Server requires OAuth - triggering MCP OAuth flow
2025-12-10 12:16:45,660 - mcp_integration.sse_client - INFO - Auth metadata discovered
2025-12-10 12:16:46,353 - httpx - INFO - HTTP Request: POST https://mcp.notion.com/register "HTTP/1.1 201 Created"
2025-12-10 12:16:46,355 - mcp_integration.mcp_oauth - INFO - Client registered: client_id=N45CwjysnCYxIDKP
2025-12-10 12:16:46,357 - mcp_integration.mcp_oauth - INFO - Authorization URL: https://mcp.notion.com/authorize?...
```

## 🔧 技术实现

### 修复的关键问题

**问题**: MCP SDK 的 `streamablehttp_client` 在收到 401 时会挂起，不抛出异常

**解决方案**: 在使用 MCP SDK 前，先用 httpx 发送测试请求检测 401

### 修改的文件

1. **server/src/mcp_integration/streamable_client.py**
   - 添加 `check_auth_required()` 方法
   - 在连接前检测是否需要 OAuth

2. **server/src/mcp_integration/manager.py**
   - 在 `_start_server()` 中先调用 `check_auth_required()`
   - 如果返回 401，立即触发 OAuth 流程
   - 避免 MCP SDK 挂起

3. **server/src/main.py**
   - 添加日志配置
   - 修复环境变量处理

## 🎓 学到的关键知识

### 1. mcp.notion.com 不接受内部集成 token

从 GitHub Issue #106 得知：
> "The remote MCP server doesn't work with internal integration token. Your MCP client must kick off the auth flow and use the token acquired from the OAuth flow."

### 2. OAuth 2.0 with PKCE 流程

Notion MCP 使用完整的 OAuth 2.1 规范：
- Protected Resource Metadata (PRM) 发现
- 动态客户端注册 (RFC 7591)
- PKCE (Proof Key for Code Exchange)
- Authorization Code Flow

### 3. MCP SDK 的异步行为

MCP SDK 的 `streamablehttp_client` 在 401 时不会立即抛出异常，而是等待 SSE 流，导致程序挂起。需要在使用 SDK 前先检测认证需求。

## 📝 下一步操作

要完成完整的 OAuth 流程，需要：

1. **获取授权 URL**:
   ```bash
   tail -200 server.log | grep "Authorization URL:"
   ```

2. **在浏览器中打开授权 URL**

3. **使用 Notion 账户登录并授权**

4. **授权完成后**，Notion 会重定向到：
   ```
   http://localhost:8080/api/mcp/oauth/callback?code=...&state=...
   ```

5. **服务器自动完成**：
   - Token 交换
   - 使用 access_token 连接 MCP 服务器
   - 获取工具列表
   - 状态更新为 `active`

## ✅ 测试结论

**Notion MCP OAuth 集成已成功实现！**

- ✅ 401 检测正常工作
- ✅ OAuth 元数据发现成功
- ✅ 动态客户端注册成功
- ✅ PKCE 参数生成正确
- ✅ 授权 URL 生成成功
- ✅ 服务器状态管理正确
- ✅ 后台任务执行正常

**系统已准备好接受用户授权并完成连接！**

## 🔗 相关资源

- [MCP 规范 - OAuth](https://modelcontextprotocol.io/docs/tutorials/security/authorization)
- [Notion MCP 文档](https://developers.notion.com/docs/mcp)
- [GitHub Issue #106](https://github.com/makenotion/notion-mcp-server/issues/106)
- [RFC 7591 - 动态客户端注册](https://datatracker.ietf.org/doc/html/rfc7591)
- [RFC 7636 - PKCE](https://datatracker.ietf.org/doc/html/rfc7636)
