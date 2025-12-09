"""
MCP Manager - 支持stdio和OAuth两种transport方式
"""
import asyncio
import json
import httpx
from typing import List, Dict, Any, Optional
from enum import Enum


class TransportType(str, Enum):
    STDIO = "stdio"
    OAUTH = "oauth"


class MCPTool:
    def __init__(self, name: str, description: str, input_schema: Dict[str, Any]):
        self.name = name
        self.description = description
        self.input_schema = input_schema


class MCPServer:
    def __init__(
        self,
        name: str,
        transport_type: TransportType,
        command: Optional[str] = None,
        args: Optional[List[str]] = None,
        url: Optional[str] = None,
        oauth_token: Optional[str] = None,
        env: Optional[Dict[str, str]] = None,
    ):
        self.name = name
        self.transport_type = transport_type
        self.command = command
        self.args = args or []
        self.url = url
        self.oauth_token = oauth_token
        self.env = env or {}
        self.process = None
        self.tools: List[MCPTool] = []
        self.request_id = 0

    async def start(self):
        """启动MCP服务器"""
        if self.transport_type == TransportType.STDIO:
            await self._start_stdio()
        else:
            await self._start_oauth()

    async def _start_stdio(self):
        """启动stdio transport"""
        import os

        # 准备环境变量
        env = os.environ.copy()
        env.update(self.env)

        # 启动子进程
        self.process = await asyncio.create_subprocess_exec(
            self.command,
            *self.args,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=env,
        )

        # 初始化：获取工具列表
        response = await self._send_stdio_request({"method": "tools/list", "params": {}})

        if "result" in response and "tools" in response["result"]:
            for tool_data in response["result"]["tools"]:
                tool = MCPTool(
                    name=tool_data["name"],
                    description=tool_data.get("description", ""),
                    input_schema=tool_data.get("inputSchema", {}),
                )
                self.tools.append(tool)

    async def _start_oauth(self):
        """启动OAuth transport"""
        # OAuth方式直接通过HTTP获取工具列表
        async with httpx.AsyncClient() as client:
            headers = {}
            if self.oauth_token:
                headers["Authorization"] = f"Bearer {self.oauth_token}"

            response = await client.post(
                f"{self.url}/tools/list", headers=headers, timeout=30.0
            )
            data = response.json()

            if "tools" in data:
                for tool_data in data["tools"]:
                    tool = MCPTool(
                        name=tool_data["name"],
                        description=tool_data.get("description", ""),
                        input_schema=tool_data.get("inputSchema", {}),
                    )
                    self.tools.append(tool)

    async def _send_stdio_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """发送stdio请求"""
        self.request_id += 1
        full_request = {"jsonrpc": "2.0", "id": self.request_id, **request}

        # 发送请求
        data = json.dumps(full_request) + "\n"
        self.process.stdin.write(data.encode())
        await self.process.stdin.drain()

        # 读取响应
        line = await self.process.stdout.readline()
        return json.loads(line.decode())

    async def execute(self, tool_name: str, arguments: Dict[str, Any]) -> Any:
        """执行工具"""
        if self.transport_type == TransportType.STDIO:
            return await self._execute_stdio(tool_name, arguments)
        else:
            return await self._execute_oauth(tool_name, arguments)

    async def _execute_stdio(self, tool_name: str, arguments: Dict[str, Any]) -> Any:
        """通过stdio执行工具"""
        response = await self._send_stdio_request(
            {"method": "tools/call", "params": {"name": tool_name, "arguments": arguments}}
        )

        if "error" in response:
            raise Exception(f"MCP Error: {response['error']}")

        return response.get("result")

    async def _execute_oauth(self, tool_name: str, arguments: Dict[str, Any]) -> Any:
        """通过OAuth执行工具"""
        async with httpx.AsyncClient() as client:
            headers = {}
            if self.oauth_token:
                headers["Authorization"] = f"Bearer {self.oauth_token}"

            response = await client.post(
                f"{self.url}/tools/call",
                headers=headers,
                json={"name": tool_name, "arguments": arguments},
                timeout=60.0,
            )
            data = response.json()

            if "error" in data:
                raise Exception(f"MCP Error: {data['error']}")

            return data.get("result")

    async def stop(self):
        """停止MCP服务器"""
        if self.process:
            self.process.terminate()
            await self.process.wait()


class MCPManager:
    def __init__(self):
        self.servers: Dict[str, MCPServer] = {}

    async def add_stdio_server(
        self, name: str, command: str, args: List[str], env: Optional[Dict[str, str]] = None
    ):
        """添加stdio MCP服务器"""
        server = MCPServer(
            name=name, transport_type=TransportType.STDIO, command=command, args=args, env=env
        )
        await server.start()
        self.servers[name] = server

    async def add_oauth_server(self, name: str, url: str, oauth_token: Optional[str] = None):
        """添加OAuth MCP服务器"""
        server = MCPServer(
            name=name, transport_type=TransportType.OAUTH, url=url, oauth_token=oauth_token
        )
        await server.start()
        self.servers[name] = server

    def list_tools(self) -> List[Dict[str, Any]]:
        """获取所有工具"""
        tools = []
        for server_name, server in self.servers.items():
            for tool in server.tools:
                tools.append(
                    {
                        "name": tool.name,
                        "description": tool.description,
                        "inputSchema": tool.input_schema,
                        "source": "mcp",
                        "server": server_name,
                    }
                )
        return tools

    async def execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Any:
        """执行工具"""
        for server in self.servers.values():
            for tool in server.tools:
                if tool.name == tool_name:
                    return await server.execute(tool_name, arguments)

        raise ValueError(f"Tool {tool_name} not found")

    async def shutdown(self):
        """关闭所有服务器"""
        for server in self.servers.values():
            await server.stop()

    async def update_server_token(self, server_name: str, oauth_token: str):
        """更新服务器的OAuth token"""
        if server_name in self.servers:
            server = self.servers[server_name]
            server.oauth_token = oauth_token
            # 如果服务器已启动，重新启动以使用新token
            if server.transport_type == TransportType.OAUTH:
                await server.stop()
                await server.start()

    async def initialize_from_config(self, servers_config: List[Dict[str, Any]]):
        """从配置初始化MCP服务器"""
        # 先关闭现有服务器
        await self.shutdown()
        self.servers.clear()

        # 启动新服务器
        for config in servers_config:
            if not config.get("enabled", True):
                continue

            name = config.get("name")
            transport = config.get("transport", "http")
            url = config.get("url", "")
            env = config.get("env", {})

            try:
                if transport == "stdio":
                    # 解析stdio URL: stdio://command/arg1/arg2
                    if url.startswith("stdio://"):
                        parts = url[8:].split("/")
                        command = parts[0]
                        args = parts[1:] if len(parts) > 1 else []
                        await self.add_stdio_server(name, command, args, env)
                else:
                    # HTTP/OAuth transport
                    oauth_token = config.get("oauthToken")
                    await self.add_oauth_server(name, url, oauth_token)
            except Exception as e:
                print(f"Failed to initialize MCP server {name}: {e}")
