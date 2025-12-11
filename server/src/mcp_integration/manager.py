"""
MCP 服务器管理器

功能：统一管理多个 MCP 服务器的生命周期
职责：
  - 添加/删除 MCP 服务器
  - 管理服务器连接（stdio 和 HTTP）
  - 协调 OAuth 认证流程
  - 维护服务器状态（connecting/pending_auth/active/error）
  - 后台异步连接管理
支持的传输：stdio（本地）、Streamable HTTP（远程）
支持的认证：无认证、传统 OAuth、MCP OAuth
"""
import uuid
import logging
import os
import asyncio
from typing import Dict, Any, Optional
from .stdio_client import MCPClient
from .http_client import MCPStreamableClient
from .oauth_traditional import MCPOAuthHandler
from .oauth_mcp import MCPOAuthClient
from .storage import MCPStorage

logger = logging.getLogger(__name__)


class MCPManager:
    def __init__(self):
        self.storage = MCPStorage()
        self.oauth = MCPOAuthHandler(self.storage)
        self.servers: Dict[str, dict] = {}
        self.connection_tasks: Dict[str, asyncio.Task] = {}
    
    async def add_server(self, config: dict) -> dict:
        """添加 MCP 服务器"""
        server_id = self._generate_id()
        logger.info(f"Adding MCP server '{config['name']}' (id: {server_id})")
        
        # 保存配置
        self.storage.save_config(server_id, config)
        
        # 初始化服务器状态
        self.servers[server_id] = {
            "id": server_id,
            "config": config,
            "client": None,
            "status": "connecting",
            "tools": []
        }
        
        # 检查是否需要传统 OAuth
        if config.get("oauth"):
            callback_base_url = config.get("callback_base_url", "")
            auth_url = self.oauth.get_auth_url(server_id, config, callback_base_url)
            
            self.servers[server_id]["status"] = "pending_auth"
            
            return {
                "server_id": server_id,
                "status": "pending_auth",
                "auth_url": auth_url
            }
        
        # 创建后台任务连接
        task = asyncio.create_task(self._connect_in_background(server_id, config))
        self.connection_tasks[server_id] = task
        logger.info(f"Background connection started for {server_id}")
        
        return {
            "server_id": server_id,
            "status": "connecting"
        }
    
    async def _connect_in_background(self, server_id: str, config: dict):
        """后台连接服务器"""
        try:
            logger.info(f"Background connecting server {server_id}")
            result = await self._start_server(server_id, config)
            
            if result and result.get("status") == "pending_auth":
                # 需要 OAuth
                self.servers[server_id].update(result)
            else:
                self.servers[server_id]["status"] = "active"
                logger.info(f"Server {server_id} connected successfully")
                
        except Exception as e:
            logger.error(f"Background connection failed for {server_id}: {e}")
            self.servers[server_id]["status"] = "error"
            self.servers[server_id]["error"] = str(e)
        finally:
            if server_id in self.connection_tasks:
                del self.connection_tasks[server_id]
    
    async def complete_mcp_oauth(self, code: str, state: str) -> str:
        """完成 MCP OAuth 流程"""
        logger.info(f"Completing MCP OAuth (state: {state[:16]}...)")
        
        # 查找匹配的 server
        server_id = None
        for sid, server in self.servers.items():
            if server.get("status") == "pending_auth":
                config = server.get("config", {})
                mcp_oauth_data = config.get("_mcp_oauth", {})
                if mcp_oauth_data.get("state") == state:
                    server_id = sid
                    logger.info(f"Found matching server: {server_id}")
                    break
        
        if not server_id:
            raise ValueError(f"No pending auth server found for state: {state}")
        
        server = self.servers[server_id]
        config = server["config"]
        mcp_oauth_data = config["_mcp_oauth"]
        
        # 重建 MCP OAuth 客户端
        from mcp_integration.oauth_mcp import MCPOAuthClient
        auth_metadata = mcp_oauth_data["auth_metadata"]
        callback_url = f"{config.get('callback_base_url', 'http://localhost:8080')}/api/mcp/oauth/callback"
        mcp_oauth = MCPOAuthClient(auth_metadata, callback_url)
        mcp_oauth.client_id = mcp_oauth_data["client_id"]
        mcp_oauth.client_secret = mcp_oauth_data.get("client_secret")
        mcp_oauth.code_verifier = mcp_oauth_data["code_verifier"]
        
        # 交换 token
        tokens = await mcp_oauth.exchange_code(code)
        logger.info(f"MCP OAuth tokens obtained: {list(tokens.keys())}")
        
        # 保存 token
        access_token = tokens.get("access_token")
        refresh_token = tokens.get("refresh_token")
        
        # 保存到 storage
        self.storage.save_token(server_id, {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": tokens.get("token_type", "Bearer"),
            "expires_in": tokens.get("expires_in"),
        })
        
        # 启动 MCP 客户端
        await self._start_server_with_token(server_id, config, access_token)
        
        return server_id
    
    async def _start_server_with_token(self, server_id: str, config: dict, access_token: str):
        """使用 token 启动 MCP 服务器"""
        logger.info(f"Starting server {server_id} with OAuth token")
        
        is_sse = (
            config.get("command") == "sse" or 
            len(config.get("args", [])) > 0 and 
            config["args"][0].startswith("http")
        )
        
        if is_sse:
            client = MCPStreamableClient()
            url = config["args"][0] if config.get("args") else config.get("url")
            
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json, text/event-stream",
                "MCP-Protocol-Version": "2024-11-05"
            }
            
            # 直接连接，不再检查 auth
            await client.connect(url, headers)
            
            # 获取工具列表
            tools_response = await client.list_tools()
            logger.info(f"Server {server_id} connected with {len(tools_response.get('tools', []))} tools")
            
            # 更新服务器状态
            self.servers[server_id] = {
                "id": server_id,
                "config": config,
                "client": client,
                "status": "active",
                "tools": tools_response.get("tools", [])
            }
        else:
            raise ValueError("Only SSE/Streamable HTTP transport supported for MCP OAuth")
    
    async def complete_oauth(self, server_id: str):
        """OAuth 完成后启动服务器"""
        config = self.storage.load_config(server_id)
        if not config:
            raise ValueError(f"Config not found for server {server_id}")
        
        await self._start_server(server_id, config)
    
    async def _start_server(self, server_id: str, config: dict):
        """启动 MCP 服务器"""
        logger.info(f"Starting MCP server {server_id}: {config['name']}")
        
        # 判断传输类型
        command = config.get("command", "")
        is_sse = command == "sse" or (
            len(config.get("args", [])) > 0 and 
            config["args"][0].startswith("http")
        )
        
        if is_sse:
            # SSE/Streamable HTTP 传输
            url = config["args"][0] if config.get("args") else config.get("url")
            
            # 准备请求头
            headers = {}
            
            if config.get("oauth"):
                # 传统 OAuth 流程
                try:
                    token = await self.oauth.get_token(server_id)
                    headers["Authorization"] = f"Bearer {token}"
                except Exception as e:
                    logger.info(f"No existing OAuth token: {e}")
            
            # 尝试连接（可能需要 OAuth）
            try:
                client = MCPStreamableClient()
                
                # 先检查是否需要 OAuth
                auth_check = await client.check_auth_required(url)
                
                if auth_check and auth_check.get("status") == 401:
                    logger.info("Server requires OAuth - triggering MCP OAuth flow")
                    
                    # 发现 OAuth 元数据
                    from .metadata import discover_oauth_metadata
                    auth_metadata = await discover_oauth_metadata(url)
                    
                    # 创建 MCP OAuth 客户端
                    callback_url = f"{config.get('callback_base_url', 'http://localhost:8080')}/api/mcp/oauth/callback"
                    mcp_oauth = MCPOAuthClient(auth_metadata, callback_url)
                    
                    # 动态注册客户端
                    await mcp_oauth.register_client()
                    
                    # 生成授权 URL
                    import secrets
                    state = secrets.token_urlsafe(32)
                    auth_url = mcp_oauth.get_authorization_url(state)
                    
                    # 保存配置
                    config["_mcp_oauth"] = {
                        "client_id": mcp_oauth.client_id,
                        "client_secret": mcp_oauth.client_secret,
                        "code_verifier": mcp_oauth.code_verifier,
                        "state": state,
                        "auth_metadata": auth_metadata
                    }
                    self.storage.save_config(server_id, config)
                    
                    # 返回需要授权
                    self.servers[server_id] = {
                        "id": server_id,
                        "config": config,
                        "client": None,
                        "status": "pending_auth",
                        "mcp_oauth": mcp_oauth
                    }
                    return {
                        "server_id": server_id,
                        "status": "pending_auth",
                        "auth_url": auth_url
                    }
                
                # 不需要 OAuth 或已有 token，直接连接
                await client.connect(url, headers)
                
                # 获取工具列表
                tools_response = await client.list_tools()
                logger.info(f"MCP server connected: {len(tools_response.get('tools', []))} tools")
                
                # 保存客户端
                self.servers[server_id]["client"] = client
                self.servers[server_id]["tools"] = tools_response.get("tools", [])
                
            except Exception as e:
                error_msg = str(e)
                logger.error(f"Connection failed: {error_msg}")
                raise
        else:
            # stdio 传输
            client = MCPClient()
            
            # 准备环境变量
            env = os.environ.copy()
            env.update(config.get("env", {}))
            
            # 如果是 OAuth，注入 token
            if config.get("oauth"):
                try:
                    token = await self.oauth.get_token(server_id)
                    env["OAUTH_TOKEN"] = token
                except Exception as e:
                    logger.error(f"Failed to get OAuth token: {e}")
                    raise
            
            # 启动进程
            await client.connect(
                command=config["command"],
                args=config.get("args", []),
                env=env
            )
        
        # 初始化
        await client.initialize()
        
        # 获取工具列表
        tools = await client.list_tools()
        
        # 保存
        self.servers[server_id] = {
            "config": config,
            "status": "active",
            "client": client,
            "tools": tools
        }
        
        logger.info(f"Server {server_id} started with {len(tools)} tools")
    
    async def remove_server(self, server_id: str):
        """删除服务器"""
        if server_id in self.servers:
            server = self.servers[server_id]
            
            # 断开连接
            if server["client"]:
                await server["client"].disconnect()
            
            # 删除
            del self.servers[server_id]
        
        # 删除存储
        self.storage.delete_config(server_id)
        self.storage.delete_tokens(server_id)
        
        logger.info(f"Server {server_id} removed")
    
    async def execute_tool(
        self,
        server_id: str,
        tool_name: str,
        arguments: dict
    ) -> Any:
        """执行工具（带自动重试）"""
        if server_id not in self.servers:
            raise ValueError(f"Server {server_id} not found")
        
        server = self.servers[server_id]
        
        if server["status"] != "active":
            raise ValueError(f"Server {server_id} is not active")
        
        client = server["client"]
        
        try:
            # 尝试执行
            result = await client.call_tool(tool_name, arguments)
            return result
            
        except Exception as e:
            error_msg = str(e).lower()
            
            # 检查是否是认证错误
            if any(x in error_msg for x in ["401", "unauthorized", "expired"]):
                
                # 只对 OAuth 服务器刷新
                if server["config"].get("oauth"):
                    logger.warning(f"Auth error for {server_id}, refreshing token...")
                    
                    try:
                        # 刷新 token
                        await self.oauth.get_token(server_id)
                        
                        # 重启服务器
                        await client.disconnect()
                        await self._start_server(server_id, server["config"])
                        
                        # 重试
                        return await self.servers[server_id]["client"].call_tool(
                            tool_name, arguments
                        )
                    except Exception as retry_error:
                        logger.error(f"Retry failed: {retry_error}")
                        raise
            
            # 其他错误直接抛出
            raise
    
    def list_servers(self) -> list:
        """列出所有服务器"""
        return [
            {
                "server_id": sid,
                "name": s["config"]["name"],
                "status": s["status"],
                "tool_count": len(s.get("tools", []))
            }
            for sid, s in self.servers.items()
        ]
    
    def get_server_tools(self, server_id: str) -> list:
        """获取服务器的工具列表"""
        if server_id not in self.servers:
            raise ValueError(f"Server {server_id} not found")
        
        return self.servers[server_id].get("tools", [])
    
    def get_server_status(self, server_id: str) -> dict:
        """获取服务器状态"""
        if server_id not in self.servers:
            raise ValueError(f"Server {server_id} not found")
        
        server = self.servers[server_id]
        return {
            "server_id": server_id,
            "name": server["config"]["name"],
            "status": server["status"]
        }
    
    def _generate_id(self) -> str:
        """生成服务器 ID"""
        return str(uuid.uuid4())[:8]
