"""
Tool Manager - 统一管理所有工具
"""
from typing import List, Dict, Any
from mcp_manager import MCPManager
from builtin_tools import BuiltInTools


class ToolManager:
    def __init__(self):
        self.mcp_manager = MCPManager()
        self.builtin_tools = BuiltInTools()

    async def initialize(self, config: Dict[str, Any]):
        """初始化所有工具"""
        # 初始化MCP服务器
        mcp_servers = config.get("mcp_servers", [])
        for server_config in mcp_servers:
            name = server_config["name"]
            transport = server_config.get("transport", "stdio")

            if transport == "stdio":
                await self.mcp_manager.add_stdio_server(
                    name=name,
                    command=server_config["command"],
                    args=server_config.get("args", []),
                    env=server_config.get("env", {}),
                )
            elif transport == "oauth":
                await self.mcp_manager.add_oauth_server(
                    name=name,
                    url=server_config["url"],
                    oauth_token=server_config.get("oauth_token"),
                )

    def list_tools(self) -> List[Dict[str, Any]]:
        """获取所有工具"""
        tools = []

        # MCP工具
        tools.extend(self.mcp_manager.list_tools())

        # Built-in工具
        tools.extend(self.builtin_tools.list_tools())

        return tools

    async def execute_tool(self, tool_name: str, arguments: Dict[str, Any], debug: bool = False) -> Any:
        """执行工具"""
        # 先查找MCP工具
        try:
            return await self.mcp_manager.execute_tool(tool_name, arguments, debug)
        except ValueError:
            pass

        # 再查找Built-in工具
        try:
            return await self.builtin_tools.execute(tool_name, arguments, debug)
        except ValueError:
            pass

        raise ValueError(f"Tool {tool_name} not found")

    async def shutdown(self):
        """关闭"""
        await self.mcp_manager.shutdown()
