"""
MCP 配置和 Token 存储

功能：持久化存储 MCP 服务器配置和 OAuth tokens
存储位置：
  - 本地开发：~/.mcp/ 目录（JSON 文件）
  - 生产环境：AWS SSM Parameter Store（加密存储）
存储内容：
  - 服务器配置（名称、命令、参数等）
  - OAuth tokens（access_token、refresh_token）
安全：生产环境使用 SSM 加密存储敏感信息
"""
import boto3
import json
import os
from typing import Optional, Dict


class MCPStorage:
    def __init__(self):
        # 本地测试时使用文件存储
        self.use_local = os.environ.get('LOCAL_API_KEY') is not None
        
        if not self.use_local:
            self.ssm = boto3.client('ssm')
        
        self.prefix = "/swiftchat/mcp"
        self.local_storage = {}  # 本地测试用
    
    def save_config(self, server_id: str, config: dict):
        """保存服务器配置"""
        if self.use_local:
            self.local_storage[f"{server_id}_config"] = config
            return
        
        self.ssm.put_parameter(
            Name=f"{self.prefix}/{server_id}/config",
            Value=json.dumps(config),
            Type='String',
            Overwrite=True
        )
    
    def load_config(self, server_id: str) -> Optional[dict]:
        """加载服务器配置"""
        if self.use_local:
            return self.local_storage.get(f"{server_id}_config")
        
        try:
            response = self.ssm.get_parameter(
                Name=f"{self.prefix}/{server_id}/config"
            )
            return json.loads(response['Parameter']['Value'])
        except self.ssm.exceptions.ParameterNotFound:
            return None
    
    def save_token(self, server_id: str, tokens: dict):
        """保存 token (别名)"""
        return self.save_tokens(server_id, tokens)
    
    def save_tokens(self, server_id: str, tokens: dict):
        """保存 OAuth tokens"""
        if self.use_local:
            self.local_storage[f"{server_id}_tokens"] = tokens
            return
        
        self.ssm.put_parameter(
            Name=f"{self.prefix}/{server_id}/tokens",
            Value=json.dumps(tokens),
            Type='SecureString',
            Overwrite=True
        )
    
    def load_tokens(self, server_id: str) -> Optional[dict]:
        """加载 OAuth tokens"""
        if self.use_local:
            return self.local_storage.get(f"{server_id}_tokens")
        
        try:
            response = self.ssm.get_parameter(
                Name=f"{self.prefix}/{server_id}/tokens",
                WithDecryption=True
            )
            return json.loads(response['Parameter']['Value'])
        except self.ssm.exceptions.ParameterNotFound:
            return None
    
    def delete_config(self, server_id: str):
        """删除配置"""
        if self.use_local:
            self.local_storage.pop(f"{server_id}_config", None)
            return
        
        try:
            self.ssm.delete_parameter(
                Name=f"{self.prefix}/{server_id}/config"
            )
        except:
            pass
    
    def delete_tokens(self, server_id: str):
        """删除 tokens"""
        if self.use_local:
            self.local_storage.pop(f"{server_id}_tokens", None)
            return
        
        try:
            self.ssm.delete_parameter(
                Name=f"{self.prefix}/{server_id}/tokens"
            )
        except:
            pass
