"""
配置持久化 - 将MCP配置保存到文件
"""
import json
import os
from typing import Dict, List, Any
from pathlib import Path


class ConfigStore:
    def __init__(self, config_file: str = "mcp_config.json"):
        self.config_file = config_file
        self.config_path = Path(config_file)
    
    def save_mcp_servers(self, servers: List[Dict[str, Any]]):
        """保存MCP服务器配置"""
        try:
            config = {
                "mcp_servers": servers,
                "version": "1.0"
            }
            
            # 确保目录存在
            self.config_path.parent.mkdir(parents=True, exist_ok=True)
            
            # 写入文件
            with open(self.config_path, 'w') as f:
                json.dump(config, f, indent=2)
            
            print(f"[Config] Saved {len(servers)} MCP servers to {self.config_file}")
            return True
        except Exception as e:
            print(f"[Config] Failed to save config: {e}")
            return False
    
    def load_mcp_servers(self) -> List[Dict[str, Any]]:
        """加载MCP服务器配置"""
        try:
            if not self.config_path.exists():
                print(f"[Config] No config file found at {self.config_file}")
                return []
            
            with open(self.config_path, 'r') as f:
                config = json.load(f)
            
            servers = config.get("mcp_servers", [])
            print(f"[Config] Loaded {len(servers)} MCP servers from {self.config_file}")
            return servers
        except Exception as e:
            print(f"[Config] Failed to load config: {e}")
            return []
    
    def get_server_by_id(self, server_id: str) -> Dict[str, Any] | None:
        """根据ID获取服务器配置"""
        servers = self.load_mcp_servers()
        for server in servers:
            if server.get("id") == server_id:
                return server
        return None
    
    def update_server(self, server_id: str, updates: Dict[str, Any]) -> bool:
        """更新服务器配置"""
        servers = self.load_mcp_servers()
        for server in servers:
            if server.get("id") == server_id:
                server.update(updates)
                return self.save_mcp_servers(servers)
        return False
