"""
MCP Streamable HTTP 传输客户端

功能：通过 HTTP/SSE 与远程 MCP 服务器通信（使用官方 MCP SDK）
用途：连接远程托管的 MCP 服务器
示例：Notion MCP (https://mcp.notion.com/mcp)
传输：HTTP POST 发送请求，SSE 接收响应
认证：支持 Bearer Token (OAuth 2.0)
SDK：使用官方 Python MCP SDK 的 streamablehttp_client
"""
import logging
import httpx
from typing import Optional, Dict, Any
from contextlib import AsyncExitStack
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

logger = logging.getLogger(__name__)


class MCPStreamableClient:
    """MCP Client using official SDK for Streamable HTTP transport"""
    
    def __init__(self):
        self.session: Optional[ClientSession] = None
        self.exit_stack = AsyncExitStack()
        self._streams_context = None
        self._session_context = None
    
    async def check_auth_required(self, url: str) -> Optional[Dict[str, Any]]:
        """
        Check if server requires OAuth by sending a test request.
        
        Returns:
            Dict with auth metadata if OAuth required, None otherwise
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    url,
                    json={"jsonrpc": "2.0", "method": "initialize", "params": {}, "id": 1},
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 401:
                    www_auth = response.headers.get("WWW-Authenticate", "")
                    logger.info(f"Server requires OAuth: {www_auth}")
                    return {"www_authenticate": www_auth, "status": 401}
                    
                return None
        except Exception as e:
            logger.warning(f"Auth check failed: {e}")
            return None
    
    async def connect(self, url: str, headers: Optional[Dict[str, str]] = None):
        """Connect to MCP server using Streamable HTTP"""
        logger.info(f"Connecting to MCP server: {url}")
        
        try:
            # Create streamable HTTP client
            self._streams_context = streamablehttp_client(
                url=url,
                headers=headers or {}
            )
            
            # Enter context and get streams
            read_stream, write_stream, _ = await self._streams_context.__aenter__()
            
            # Create client session
            self._session_context = ClientSession(read_stream, write_stream)
            self.session = await self._session_context.__aenter__()
            
            # Initialize session
            await self.session.initialize()
            logger.info("MCP client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to connect to MCP server: {e}")
            raise
    
    async def list_tools(self) -> Dict[str, Any]:
        """List available tools"""
        if not self.session:
            raise RuntimeError("Client not connected")
        
        response = await self.session.list_tools()
        return {
            "tools": [
                {
                    "name": tool.name,
                    "description": tool.description,
                    "inputSchema": tool.inputSchema
                }
                for tool in response.tools
            ]
        }
    
    async def call_tool(self, name: str, arguments: Dict[str, Any]) -> Any:
        """Call a tool"""
        if not self.session:
            raise RuntimeError("Client not connected")
        
        result = await self.session.call_tool(name, arguments)
        return result
    
    async def list_resources(self) -> Dict[str, Any]:
        """List available resources"""
        if not self.session:
            raise RuntimeError("Client not connected")
        
        response = await self.session.list_resources()
        return {
            "resources": [
                {
                    "uri": resource.uri,
                    "name": resource.name,
                    "description": getattr(resource, 'description', None)
                }
                for resource in response.resources
            ]
        }
    
    async def close(self):
        """Close the connection"""
        if self._session_context:
            await self._session_context.__aexit__(None, None, None)
        if self._streams_context:
            await self._streams_context.__aexit__(None, None, None)
        logger.info("MCP client closed")
