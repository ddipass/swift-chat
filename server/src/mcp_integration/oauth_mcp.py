"""
MCP OAuth 2.0 客户端（动态注册 + PKCE）

功能：实现 MCP 规范的 OAuth 2.0 认证流程
特点：
  - 动态客户端注册 (RFC 7591)
  - PKCE 授权码流程 (RFC 7636)
  - 无需预先注册应用
用途：连接支持 MCP OAuth 的远程服务器
示例：Notion MCP (https://mcp.notion.com)
流程：元数据发现 → 动态注册 → 生成 PKCE → 用户授权 → Token 交换
"""
import secrets
import hashlib
import base64
import httpx
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)


class MCPOAuthClient:
    """MCP OAuth 客户端 - 支持动态客户端注册和 PKCE"""
    
    def __init__(self, auth_metadata: Dict, callback_url: str):
        self.auth_metadata = auth_metadata
        self.callback_url = callback_url
        self.client_id = None
        self.client_secret = None
        self.code_verifier = None
        self.code_challenge = None
    
    def generate_pkce(self):
        """生成 PKCE code verifier 和 challenge"""
        # 生成 code_verifier (43-128 字符)
        self.code_verifier = base64.urlsafe_b64encode(
            secrets.token_bytes(32)
        ).decode('utf-8').rstrip('=')
        
        # 生成 code_challenge (SHA256)
        challenge_bytes = hashlib.sha256(self.code_verifier.encode('utf-8')).digest()
        self.code_challenge = base64.urlsafe_b64encode(challenge_bytes).decode('utf-8').rstrip('=')
        
        logger.info(f"Generated PKCE: verifier={self.code_verifier[:10]}..., challenge={self.code_challenge[:10]}...")
    
    async def register_client(self) -> Dict:
        """动态客户端注册"""
        registration_endpoint = self.auth_metadata.get("registration_endpoint")
        if not registration_endpoint:
            raise Exception("No registration_endpoint in auth metadata")
        
        logger.info(f"Registering client at: {registration_endpoint}")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                registration_endpoint,
                json={
                    "client_name": "SwiftChat MCP Client",
                    "redirect_uris": [self.callback_url],
                    "grant_types": ["authorization_code", "refresh_token"],
                    "response_types": ["code"],
                    "token_endpoint_auth_method": "none"  # Public client
                },
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 201:
                raise Exception(f"Client registration failed: {response.status_code} {response.text}")
            
            result = response.json()
            self.client_id = result.get("client_id")
            self.client_secret = result.get("client_secret")  # May be None for public clients
            
            logger.info(f"Client registered: client_id={self.client_id}")
            return result
    
    def get_authorization_url(self, state: str) -> str:
        """生成授权 URL"""
        if not self.client_id:
            raise Exception("Client not registered")
        
        if not self.code_challenge:
            self.generate_pkce()
        
        auth_endpoint = self.auth_metadata.get("authorization_endpoint")
        
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.callback_url,
            "response_type": "code",
            "state": state,
            "code_challenge": self.code_challenge,
            "code_challenge_method": "S256"
        }
        
        # 构建 URL
        param_str = "&".join([f"{k}={v}" for k, v in params.items()])
        auth_url = f"{auth_endpoint}?{param_str}"
        
        logger.info(f"Authorization URL: {auth_url}")
        return auth_url
    
    async def exchange_code(self, code: str) -> Dict:
        """用授权码换取 access token"""
        token_endpoint = self.auth_metadata.get("token_endpoint")
        
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": self.callback_url,
            "client_id": self.client_id,
            "code_verifier": self.code_verifier
        }
        
        # 如果有 client_secret，添加它
        if self.client_secret:
            data["client_secret"] = self.client_secret
        
        logger.info(f"Exchanging code at: {token_endpoint}")
        logger.info(f"Data: grant_type={data['grant_type']}, client_id={self.client_id}")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                token_endpoint,
                data=data,
                headers={
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "application/json"
                }
            )
            
            logger.info(f"Token exchange response status: {response.status_code}")
            logger.info(f"Token exchange response headers: {dict(response.headers)}")
            logger.info(f"Token exchange response text: {response.text[:500]}")
            
            if response.status_code != 200:
                raise Exception(f"Token exchange failed: {response.status_code} {response.text}")
            
            # 检查响应是否为空
            if not response.text:
                raise Exception("Token exchange returned empty response")
            
            try:
                result = response.json()
            except Exception as e:
                raise Exception(f"Failed to parse token response as JSON: {e}. Response: {response.text[:200]}")
            
            logger.info(f"Token obtained: {list(result.keys())}")
            return result
