# 后端工具迁移方案

## 目标

将MCP、web_fetch和Perplexity search迁移到后端，实现：
1. ✅ 支持MCP的stdio transport（本地进程通信）
2. ✅ 统一的工具管理
3. ✅ 更好的性能和稳定性

---

## 架构设计

### 新架构

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native App                          │
│                                                               │
│                    ┌───────────────┐                         │
│                    │  Claude Model │                         │
│                    │ (Tool Calling)│                         │
│                    └───────┬───────┘                         │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Backend Server │
                    │   (FastAPI)     │
                    │                 │
                    │  /api/converse  │ ← 已有
                    │  /api/image     │ ← 已有
                    │  /api/models    │ ← 已有
                    │  /api/upgrade   │ ← 已有
                    │                 │
                    │  /api/tools     │ ← 新增：获取所有工具
                    │  /api/tool/exec │ ← 新增：执行工具
                    └─────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
            ┌───────▼──────┐  ┌──────▼──────┐
            │ MCP Manager  │  │Tool Executor│
            │              │  │             │
            │ - stdio MCP  │  │ - web_fetch │
            │ - http MCP   │  │ - perplexity│
            │ - OAuth MCP  │  │             │
            └──────────────┘  └─────────────┘
```

---

## 实施步骤

### Phase 1: Backend基础架构 (2小时)

#### 1.1 创建工具管理模块

**文件:** `server/src/tool_manager.py`

```python
from typing import List, Dict, Any
from pydantic import BaseModel

class Tool(BaseModel):
    name: str
    description: str
    inputSchema: Dict[str, Any]
    source: str  # 'mcp', 'builtin', 'perplexity'

class ToolManager:
    def __init__(self):
        self.tools: Dict[str, Tool] = {}
        self.mcp_manager = None
        self.builtin_tools = None
        self.perplexity_tools = None
    
    async def initialize(self):
        """初始化所有工具"""
        await self._load_mcp_tools()
        await self._load_builtin_tools()
        await self._load_perplexity_tools()
    
    async def list_tools(self) -> List[Tool]:
        """获取所有可用工具"""
        return list(self.tools.values())
    
    async def execute_tool(self, name: str, args: Dict[str, Any]) -> Any:
        """执行指定工具"""
        tool = self.tools.get(name)
        if not tool:
            raise ValueError(f"Tool {name} not found")
        
        if tool.source == 'mcp':
            return await self.mcp_manager.execute(name, args)
        elif tool.source == 'builtin':
            return await self.builtin_tools.execute(name, args)
        elif tool.source == 'perplexity':
            return await self.perplexity_tools.execute(name, args)
```

#### 1.2 创建MCP管理器（支持stdio）

**文件:** `server/src/mcp_manager.py`

```python
import asyncio
import json
from typing import List, Dict, Any
import subprocess

class MCPServer:
    def __init__(self, name: str, command: str, args: List[str]):
        self.name = name
        self.command = command
        self.args = args
        self.process = None
        self.tools = []
    
    async def start(self):
        """启动MCP服务器进程（stdio transport）"""
        self.process = await asyncio.create_subprocess_exec(
            self.command,
            *self.args,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        # 初始化：获取工具列表
        await self._send_request({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "tools/list"
        })
        
        response = await self._read_response()
        self.tools = response.get("result", {}).get("tools", [])
    
    async def _send_request(self, request: Dict[str, Any]):
        """发送JSON-RPC请求到stdio"""
        data = json.dumps(request) + "\n"
        self.process.stdin.write(data.encode())
        await self.process.stdin.drain()
    
    async def _read_response(self) -> Dict[str, Any]:
        """从stdio读取JSON-RPC响应"""
        line = await self.process.stdout.readline()
        return json.loads(line.decode())
    
    async def execute(self, tool_name: str, args: Dict[str, Any]) -> Any:
        """执行MCP工具"""
        await self._send_request({
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": args
            }
        })
        
        response = await self._read_response()
        return response.get("result")

class MCPManager:
    def __init__(self):
        self.servers: Dict[str, MCPServer] = {}
    
    async def add_server(self, name: str, command: str, args: List[str]):
        """添加并启动MCP服务器"""
        server = MCPServer(name, command, args)
        await server.start()
        self.servers[name] = server
    
    async def list_tools(self) -> List[Dict[str, Any]]:
        """获取所有MCP工具"""
        tools = []
        for server in self.servers.values():
            tools.extend(server.tools)
        return tools
    
    async def execute(self, tool_name: str, args: Dict[str, Any]) -> Any:
        """执行MCP工具"""
        for server in self.servers.values():
            for tool in server.tools:
                if tool["name"] == tool_name:
                    return await server.execute(tool_name, args)
        raise ValueError(f"Tool {tool_name} not found")
```

#### 1.3 创建内置工具（web_fetch）

**文件:** `server/src/builtin_tools.py`

```python
import httpx
from bs4 import BeautifulSoup
from typing import Dict, Any

class BuiltInTools:
    async def execute(self, name: str, args: Dict[str, Any]) -> Any:
        if name == "web_fetch":
            return await self.web_fetch(args)
        raise ValueError(f"Unknown tool: {name}")
    
    async def web_fetch(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """获取网页内容"""
        url = args.get("url")
        mode = args.get("mode", "regex")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=30.0)
            html = response.text
        
        if mode == "regex":
            # 使用BeautifulSoup清理HTML
            soup = BeautifulSoup(html, 'html.parser')
            # 移除script、style等标签
            for tag in soup(['script', 'style', 'nav', 'footer']):
                tag.decompose()
            text = soup.get_text(separator=' ', strip=True)
        else:
            # AI summary模式
            text = await self._ai_summary(html)
        
        return {
            "url": url,
            "text": text,
            "truncated": len(text) > 50000
        }
    
    async def _ai_summary(self, html: str) -> str:
        """使用AI总结HTML内容"""
        # 调用Bedrock API进行总结
        # 实现略
        pass
```

#### 1.4 创建Perplexity工具

**文件:** `server/src/perplexity_tools.py`

```python
import httpx
from typing import Dict, Any

class PerplexityTools:
    def __init__(self, api_key: str, base_url: str = "https://api.perplexity.ai"):
        self.api_key = api_key
        self.base_url = base_url
    
    async def execute(self, name: str, args: Dict[str, Any]) -> Any:
        if name == "perplexity_search":
            return await self.search(args)
        elif name == "perplexity_ask":
            return await self.ask(args)
        # ... 其他工具
    
    async def search(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Perplexity搜索"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/search",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={"query": args["query"]},
                timeout=30.0
            )
            data = response.json()
        
        return {
            "results": data.get("results", []),
            "formatted": self._format_results(data.get("results", []))
        }
```

#### 1.5 添加API端点

**文件:** `server/src/main.py`

```python
from tool_manager import ToolManager, Tool
from typing import Dict, Any

# 全局工具管理器
tool_manager = ToolManager()

@app.on_event("startup")
async def startup_event():
    """启动时初始化工具"""
    await tool_manager.initialize()
    
    # 添加MCP服务器（stdio）
    # 从配置文件读取
    # await tool_manager.mcp_manager.add_server(
    #     "notion",
    #     "npx",
    #     ["-y", "@modelcontextprotocol/server-notion"]
    # )

class ToolListRequest(BaseModel):
    pass

class ToolExecuteRequest(BaseModel):
    name: str
    arguments: Dict[str, Any]

@app.post("/api/tools")
async def list_tools(
    request: ToolListRequest,
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]
):
    """获取所有可用工具"""
    verify_token(credentials.credentials)
    tools = await tool_manager.list_tools()
    return {"tools": [tool.dict() for tool in tools]}

@app.post("/api/tool/exec")
async def execute_tool(
    request: ToolExecuteRequest,
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]
):
    """执行工具"""
    verify_token(credentials.credentials)
    
    try:
        result = await tool_manager.execute_tool(
            request.name,
            request.arguments
        )
        return {"success": True, "result": result}
    except Exception as e:
        return {"success": False, "error": str(e)}
```

---

### Phase 2: 客户端适配 (1.5小时)

#### 2.1 创建后端工具客户端

**文件:** `react-native/src/mcp/BackendToolsClient.ts`

```typescript
export class BackendToolsClient {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  async listTools(): Promise<Tool[]> {
    const response = await fetch(`${this.apiUrl}/api/tools`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return data.tools;
  }

  async executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    const response = await fetch(`${this.apiUrl}/api/tool/exec`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        arguments: args,
      }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error);
    }
    return data.result;
  }
}
```

#### 2.2 修改BuiltInTools使用后端

**文件:** `react-native/src/mcp/BuiltInTools.ts`

```typescript
import { BackendToolsClient } from './BackendToolsClient';
import { getApiUrl, getApiKey } from '../storage/StorageUtils';

export function getBuiltInTools(): BuiltInTool[] {
  const apiUrl = getApiUrl();
  const apiKey = getApiKey();
  
  if (!apiUrl || !apiKey) {
    // 如果没有配置backend，返回空数组
    return [];
  }

  const client = new BackendToolsClient(apiUrl, apiKey);

  // 返回代理工具
  return [
    {
      name: 'web_fetch',
      description: 'Fetch and process web page content',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to fetch' },
          mode: { type: 'string', enum: ['regex', 'ai_summary'] },
        },
        required: ['url'],
      },
      execute: async (args) => {
        return await client.executeTool('web_fetch', args);
      },
    },
  ];
}
```

#### 2.3 修改MCP工具使用后端

**文件:** `react-native/src/mcp/MCPTools.ts`

```typescript
export async function getMCPTools(): Promise<BuiltInTool[]> {
  const apiUrl = getApiUrl();
  const apiKey = getApiKey();
  
  if (!apiUrl || !apiKey) {
    return [];
  }

  const client = new BackendToolsClient(apiUrl, apiKey);
  const tools = await client.listTools();

  // 过滤出MCP工具
  const mcpTools = tools.filter(t => t.source === 'mcp');

  return mcpTools.map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
    execute: async (args) => {
      return await client.executeTool(tool.name, args);
    },
  }));
}
```

---

### Phase 3: 配置管理 (1小时)

#### 3.1 Backend配置文件

**文件:** `server/config.yaml`

```yaml
mcp_servers:
  - name: notion
    command: npx
    args:
      - "-y"
      - "@modelcontextprotocol/server-notion"
    env:
      NOTION_API_KEY: ${NOTION_API_KEY}
  
  - name: filesystem
    command: npx
    args:
      - "-y"
      - "@modelcontextprotocol/server-filesystem"
      - "/path/to/allowed/directory"

perplexity:
  enabled: true
  api_key: ${PERPLEXITY_API_KEY}
  base_url: https://api.perplexity.ai

builtin_tools:
  web_fetch:
    enabled: true
    timeout: 30
    max_content_length: 100000
```

#### 3.2 配置加载

**文件:** `server/src/config.py`

```python
import yaml
import os

class Config:
    def __init__(self, config_file: str = "config.yaml"):
        with open(config_file) as f:
            self.data = yaml.safe_load(f)
        self._expand_env_vars()
    
    def _expand_env_vars(self):
        """展开环境变量"""
        # 递归处理配置中的${VAR}
        pass
    
    def get_mcp_servers(self):
        return self.data.get("mcp_servers", [])
    
    def get_perplexity_config(self):
        return self.data.get("perplexity", {})

config = Config()
```

---

## 优势分析

### 1. MCP stdio支持

**之前（HTTP）:**
```
App → HTTP → MCP Server (需要独立运行)
```

**现在（stdio）:**
```
Backend → stdio → MCP Server (作为子进程)
```

**优势:**
- ✅ 不需要独立运行MCP服务器
- ✅ 更好的性能（进程间通信）
- ✅ 更简单的部署
- ✅ 自动管理生命周期

### 2. 统一管理

所有工具在backend统一管理：
- ✅ 统一的认证
- ✅ 统一的日志
- ✅ 统一的监控
- ✅ 统一的配置

### 3. 更好的隔离

- ✅ 工具执行与App隔离
- ✅ 失败不影响App
- ✅ 可以限制资源使用

---

## 迁移路径

### 阶段1: Backend开发（1周）
1. 实现tool_manager
2. 实现mcp_manager（stdio支持）
3. 实现builtin_tools
4. 实现perplexity_tools
5. 添加API端点
6. 测试

### 阶段2: 客户端适配（3天）
1. 创建BackendToolsClient
2. 修改BuiltInTools
3. 修改MCPTools
4. 修改PerplexityTools
5. 测试

### 阶段3: 部署和文档（2天）
1. 更新部署脚本
2. 更新配置文档
3. 更新用户文档
4. 测试端到端流程

---

## 兼容性

### 向后兼容

保留客户端工具作为fallback：
```typescript
export function getBuiltInTools(): BuiltInTool[] {
  const useBackend = getUseBackendTools();
  
  if (useBackend) {
    return getBackendTools();
  } else {
    return getClientTools();
  }
}
```

用户可以选择：
- 使用backend工具（推荐）
- 使用客户端工具（兼容模式）

---

## 下一步

你想让我：
1. 开始实现Phase 1（Backend基础架构）？
2. 先创建一个最小可行版本（MVP）？
3. 还是先讨论更多细节？

请告诉我你的想法！
