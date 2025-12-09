"""
MCP OAuth Handler
Handles OAuth flow for HTTP-based MCP servers
"""
import secrets
import hashlib
import base64
from typing import Dict, Optional
from datetime import datetime, timedelta
import httpx

# In-memory storage for OAuth states (in production, use Redis or database)
oauth_states: Dict[str, dict] = {}

REDIRECT_URI = "http://localhost:8000/api/mcp/oauth/callback"


def generate_code_verifier() -> str:
    """Generate PKCE code verifier"""
    return base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')


def generate_code_challenge(verifier: str) -> str:
    """Generate PKCE code challenge from verifier"""
    digest = hashlib.sha256(verifier.encode('utf-8')).digest()
    return base64.urlsafe_b64encode(digest).decode('utf-8').rstrip('=')


async def get_oauth_config(server_url: str) -> dict:
    """Get OAuth configuration from MCP server"""
    config_url = f"{server_url}/.well-known/oauth-authorization-server"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(config_url)
        response.raise_for_status()
        return response.json()


async def register_client(registration_endpoint: str, app_name: str) -> str:
    """Register OAuth client dynamically"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            registration_endpoint,
            json={
                "client_name": app_name,
                "redirect_uris": [REDIRECT_URI],
                "grant_types": ["authorization_code", "refresh_token"],
                "response_types": ["code"],
                "token_endpoint_auth_method": "none",
            }
        )
        response.raise_for_status()
        data = response.json()
        return data["client_id"]


def build_auth_url(
    auth_endpoint: str,
    client_id: str,
    code_challenge: str,
    state: str
) -> str:
    """Build OAuth authorization URL"""
    params = {
        "client_id": client_id,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
        "state": state,
    }
    param_str = "&".join(f"{k}={v}" for k, v in params.items())
    return f"{auth_endpoint}?{param_str}"


async def start_oauth_flow(server_id: str, server_url: str, server_name: str) -> str:
    """
    Start OAuth flow for MCP server
    Returns: Authorization URL for user to open
    """
    # Get OAuth config
    config = await get_oauth_config(server_url)
    
    if not config.get("authorization_endpoint") or not config.get("token_endpoint"):
        raise ValueError("Invalid OAuth configuration")
    
    # Register client if registration endpoint exists
    client_id = None
    if config.get("registration_endpoint"):
        client_id = await register_client(config["registration_endpoint"], server_name)
    else:
        # Use pre-configured client_id (should be in server config)
        raise ValueError("Dynamic client registration not supported, client_id required")
    
    # Generate PKCE
    code_verifier = generate_code_verifier()
    code_challenge = generate_code_challenge(code_verifier)
    
    # Generate state
    state = secrets.token_urlsafe(32)
    
    # Store OAuth state
    oauth_states[state] = {
        "server_id": server_id,
        "code_verifier": code_verifier,
        "client_id": client_id,
        "token_endpoint": config["token_endpoint"],
        "created_at": datetime.now(),
    }
    
    # Build authorization URL
    auth_url = build_auth_url(
        config["authorization_endpoint"],
        client_id,
        code_challenge,
        state
    )
    
    return auth_url


async def exchange_code_for_token(
    token_endpoint: str,
    code: str,
    client_id: str,
    code_verifier: str
) -> dict:
    """Exchange authorization code for access token"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            token_endpoint,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": REDIRECT_URI,
                "client_id": client_id,
                "code_verifier": code_verifier,
            }
        )
        response.raise_for_status()
        return response.json()


async def refresh_access_token(
    token_endpoint: str,
    refresh_token: str,
    client_id: str
) -> dict:
    """Refresh access token using refresh token"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            token_endpoint,
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
                "client_id": client_id,
            }
        )
        response.raise_for_status()
        return response.json()


def cleanup_expired_states():
    """Clean up expired OAuth states (older than 10 minutes)"""
    now = datetime.now()
    expired = [
        state for state, data in oauth_states.items()
        if now - data["created_at"] > timedelta(minutes=10)
    ]
    for state in expired:
        del oauth_states[state]
