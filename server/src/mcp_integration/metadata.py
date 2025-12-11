"""
OAuth 授权服务器元数据发现

功能：发现 MCP 服务器的 OAuth 2.0 配置信息
用途：在 OAuth 流程开始前获取授权服务器的端点和能力
标准：遵循 RFC 8414 (OAuth 2.0 Authorization Server Metadata)
端点：/.well-known/oauth-authorization-server
返回：authorization_endpoint, token_endpoint, registration_endpoint 等
"""
import logging
import httpx

logger = logging.getLogger(__name__)


async def discover_oauth_metadata(url: str) -> dict:
    """
    发现 MCP 服务器的 OAuth 元数据
    
    Args:
        url: MCP 服务器 URL
        
    Returns:
        OAuth 授权服务器元数据
    """
    # 构建元数据 URL
    if url.endswith('/mcp'):
        base_url = url[:-4]
    else:
        base_url = url
    
    metadata_url = f"{base_url}/.well-known/oauth-authorization-server"
    
    logger.info(f"Discovering auth metadata from: {metadata_url}")
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(metadata_url)
        response.raise_for_status()
        
        metadata = response.json()
        logger.info(f"Auth metadata discovered: {list(metadata.keys())}")
        
        return metadata
