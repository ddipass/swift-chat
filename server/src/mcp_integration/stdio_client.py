"""
MCP stdio 传输客户端

功能：通过标准输入/输出（stdin/stdout）与本地 MCP 服务器进程通信
用途：连接本地运行的 MCP 服务器
示例：AWS Labs Core (uvx awslabs.core-mcp-server@latest)
传输：启动子进程，通过管道进行 JSON-RPC 消息交换
"""
import asyncio
import json
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


class MCPClient:
    def __init__(self):
        self.process = None
        self.reader = None
        self.writer = None
        self.request_id = 0
        self.pending_requests: Dict[int, asyncio.Future] = {}
        self.running = False
    
    async def connect(self, command: str, args: list, env: dict):
        """启动 MCP 服务器进程"""
        logger.info(f"Starting MCP server: {command} {' '.join(args)}")
        
        self.process = await asyncio.create_subprocess_exec(
            command, *args,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=env
        )
        
        self.reader = self.process.stdout
        self.writer = self.process.stdin
        self.running = True
        
        # 启动读取循环
        asyncio.create_task(self._read_loop())
        
        logger.info("MCP server started")
    
    async def initialize(self) -> dict:
        """MCP 初始化握手"""
        return await self._send_request("initialize", {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {
                "name": "swiftchat",
                "version": "1.0.0"
            }
        })
    
    async def list_tools(self) -> list:
        """获取工具列表"""
        result = await self._send_request("tools/list", {})
        return result.get("tools", [])
    
    async def call_tool(self, name: str, arguments: dict) -> Any:
        """调用工具"""
        result = await self._send_request("tools/call", {
            "name": name,
            "arguments": arguments
        })
        return result
    
    async def _send_request(self, method: str, params: dict) -> Any:
        """发送 JSON-RPC 请求"""
        if not self.running:
            raise RuntimeError("MCP client not connected")
        
        self.request_id += 1
        request = {
            "jsonrpc": "2.0",
            "id": self.request_id,
            "method": method,
            "params": params
        }
        
        # 创建 Future 等待响应
        future = asyncio.Future()
        self.pending_requests[self.request_id] = future
        
        # 发送
        message = json.dumps(request) + "\n"
        self.writer.write(message.encode())
        await self.writer.drain()
        
        logger.debug(f"Sent request: {method}")
        
        # 等待响应（60秒超时，因为 uvx 首次下载包需要时间）
        try:
            result = await asyncio.wait_for(future, timeout=60.0)
            return result
        except asyncio.TimeoutError:
            self.pending_requests.pop(self.request_id, None)
            raise TimeoutError(f"Request {method} timed out")
    
    async def _read_loop(self):
        """读取响应循环"""
        try:
            while self.running:
                line = await self.reader.readline()
                if not line:
                    break
                
                try:
                    response = json.loads(line.decode())
                    request_id = response.get("id")
                    
                    if request_id and request_id in self.pending_requests:
                        future = self.pending_requests.pop(request_id)
                        
                        if "error" in response:
                            error = response["error"]
                            future.set_exception(
                                Exception(f"MCP Error: {error.get('message', error)}")
                            )
                        else:
                            future.set_result(response.get("result"))
                    
                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse response: {e}")
                except Exception as e:
                    logger.error(f"Error processing response: {e}")
        
        except Exception as e:
            logger.error(f"Read loop error: {e}")
        finally:
            self.running = False
    
    async def disconnect(self):
        """断开连接"""
        self.running = False
        
        if self.process:
            self.process.terminate()
            try:
                await asyncio.wait_for(self.process.wait(), timeout=5.0)
            except asyncio.TimeoutError:
                self.process.kill()
                await self.process.wait()
        
        logger.info("MCP server disconnected")
