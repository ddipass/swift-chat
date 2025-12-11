"""
传统 OAuth 2.0 客户端（预注册）

功能：实现标准 OAuth 2.0 授权码流程
特点：
  - 需要预先在服务提供商注册应用
  - 使用固定的 client_id 和 client_secret
  - 支持 state 参数防止 CSRF
用途：连接需要预注册的 OAuth 服务
示例：GitHub、Google 等传统 OAuth 提供商
流程：用户授权 → 回调接收 code → Token 交换 → Token 存储
"""
import secrets
import time
import httpx
import logging
from typing import Optional, Dict

logger = logging.getLogger(__name__)


class MCPOAuthHandler:
    def __init__(self, storage):
        self.storage = storage
        self.pending_auth: Dict[str, dict] = {}
        self.token_cache: Dict[str, dict] = {}
        
        # OAuth Provider 配置（需要配置实际的 client credentials）
        self.providers = {
            "google": {
                "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
                "token_url": "https://oauth2.googleapis.com/token",
                "client_id": os.environ.get("GOOGLE_CLIENT_ID", ""),
                "client_secret": os.environ.get("GOOGLE_CLIENT_SECRET", "")
            },
            "github": {
                "auth_url": "https://github.com/login/oauth/authorize",
                "token_url": "https://github.com/login/oauth/access_token",
                "client_id": os.environ.get("GITHUB_CLIENT_ID", ""),
                "client_secret": os.environ.get("GITHUB_CLIENT_SECRET", "")
            },
            "notion": {
                "auth_url": "https://api.notion.com/v1/oauth/authorize",
                "token_url": "https://api.notion.com/v1/oauth/token",
                "client_id": os.environ.get("NOTION_CLIENT_ID", ""),
                "client_secret": os.environ.get("NOTION_CLIENT_SECRET", "")
            }
        }
    
    def get_auth_url(self, server_id: str, config: dict, callback_base_url: str) -> str:
        """生成 OAuth 授权 URL"""
        provider_name = config["oauth"]["provider"]
        
        if provider_name not in self.providers:
            raise ValueError(f"Unknown OAuth provider: {provider_name}")
        
        provider = self.providers[provider_name]
        scopes = config["oauth"]["scopes"]
        
        # 生成 state（防 CSRF）
        state = secrets.token_urlsafe(32)
        self.pending_auth[state] = {
            "server_id": server_id,
            "config": config
        }
        
        # 构造授权 URL
        callback_url = f"{callback_base_url}/api/mcp/oauth/callback"
        
        params = {
            "client_id": provider["client_id"],
            "redirect_uri": callback_url,
            "scope": " ".join(scopes),
            "state": state,
            "response_type": "code",
            "access_type": "offline",  # Google: 获取 refresh_token
            "prompt": "consent"  # Google: 强制显示授权页面
        }
        
        query = "&".join(f"{k}={v}" for k, v in params.items())
        auth_url = f"{provider['auth_url']}?{query}"
        
        logger.info(f"Generated auth URL for {provider_name}")
        return auth_url
    
    async def handle_callback(self, code: str, state: str) -> str:
        """处理 OAuth 回调"""
        if state not in self.pending_auth:
            raise ValueError("Invalid state parameter")
        
        auth_info = self.pending_auth.pop(state)
        server_id = auth_info["server_id"]
        config = auth_info["config"]
        
        provider_name = config["oauth"]["provider"]
        provider = self.providers[provider_name]
        
        # 换取 access token
        logger.info(f"Exchanging code for token: {provider_name}")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                provider["token_url"],
                data={
                    "code": code,
                    "client_id": provider["client_id"],
                    "client_secret": provider["client_secret"],
                    "redirect_uri": f"{config.get('callback_base_url', '')}/api/mcp/oauth/callback",
                    "grant_type": "authorization_code"
                },
                headers={"Accept": "application/json"}
            )
            
            if response.status_code != 200:
                raise Exception(f"Token exchange failed: {response.text}")
            
            tokens = response.json()
        
        # 计算过期时间
        if "expires_in" in tokens:
            tokens["expires_at"] = int(time.time()) + tokens["expires_in"]
        
        # 持久化 token
        self.storage.save_tokens(server_id, tokens)
        
        logger.info(f"OAuth completed for server {server_id}")
        return server_id
    
    async def get_token(self, server_id: str) -> str:
        """获取有效的 access token（自动刷新）"""
        # 检查内存缓存
        if server_id in self.token_cache:
            cached = self.token_cache[server_id]
            if cached.get("expires_at", 0) > time.time() + 300:  # 提前 5 分钟
                return cached["access_token"]
        
        # 从存储加载
        tokens = self.storage.load_tokens(server_id)
        if not tokens:
            raise ValueError(f"No tokens found for server {server_id}")
        
        # 检查是否需要刷新
        if tokens.get("expires_at", 0) < time.time() + 300:
            logger.info(f"Token expiring soon, refreshing for {server_id}")
            tokens = await self._refresh_token(server_id, tokens)
        
        # 更新缓存
        self.token_cache[server_id] = tokens
        
        return tokens["access_token"]
    
    async def _refresh_token(self, server_id: str, old_tokens: dict) -> dict:
        """刷新 token"""
        config = self.storage.load_config(server_id)
        provider_name = config["oauth"]["provider"]
        provider = self.providers[provider_name]
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                provider["token_url"],
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": old_tokens["refresh_token"],
                    "client_id": provider["client_id"],
                    "client_secret": provider["client_secret"]
                },
                headers={"Accept": "application/json"}
            )
            
            if response.status_code != 200:
                raise Exception(f"Token refresh failed: {response.text}")
            
            new_tokens = response.json()
        
        # 计算新的过期时间
        if "expires_in" in new_tokens:
            new_tokens["expires_at"] = int(time.time()) + new_tokens["expires_in"]
        
        # 保留 refresh_token（某些 provider 不返回新的）
        if "refresh_token" not in new_tokens:
            new_tokens["refresh_token"] = old_tokens["refresh_token"]
        
        # 更新存储
        self.storage.save_tokens(server_id, new_tokens)
        
        logger.info(f"Token refreshed for {server_id}")
        return new_tokens


import os
