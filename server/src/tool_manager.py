"""
Tool Manager - 统一管理所有工具
"""
import time
from typing import Dict, Any
from builtin_tools import BuiltInTools
from tool_stats import ToolStats
from mcp_integration.manager import MCPManager


class ToolManager:
    def __init__(self):
        self.builtin_tools = BuiltInTools()
        self.mcp_manager = MCPManager()
        self.stats = ToolStats()
    
    async def execute_tool(
        self,
        name: str,
        arguments: Dict[str, Any],
        config: Dict[str, Any]
    ) -> Any:
        """执行工具（带统计）"""
        start_time = time.time()
        
        try:
            # 判断工具类型
            if name.startswith("mcp:"):
                # MCP 工具：mcp:server_id:tool_name
                parts = name.split(":", 2)
                if len(parts) != 3:
                    raise ValueError(f"Invalid MCP tool name: {name}")
                
                server_id = parts[1]
                tool_name = parts[2]
                
                result = await self.mcp_manager.execute_tool(
                    server_id, tool_name, arguments
                )
            elif self.builtin_tools.has_tool(name):
                # 内置工具
                result = await self.builtin_tools.execute(
                    name, arguments, config
                )
            else:
                raise ValueError(f"Tool not found: {name}")
            
            # 记录成功
            duration = time.time() - start_time
            self.stats.record_success(name, duration)
            
            return result
            
        except Exception as e:
            # 记录失败
            self.stats.record_failure(name, str(e))
            raise
    
    def get_stats(self) -> Dict:
        """获取统计信息"""
        return self.stats.get_stats()
