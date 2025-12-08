#!/usr/bin/env python3
"""
Backend Tools 测试脚本
"""
import asyncio
import sys
import os

# 添加src到路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from tool_manager import ToolManager


async def test_builtin_tools():
    """测试内置工具"""
    print("=" * 60)
    print("测试 Built-in Tools")
    print("=" * 60)
    
    manager = ToolManager()
    await manager.initialize({})
    
    # 列出工具
    tools = manager.list_tools()
    print(f"\n找到 {len(tools)} 个工具:")
    for tool in tools:
        print(f"  - {tool['name']}: {tool['description'][:50]}...")
    
    # 测试web_fetch
    print("\n测试 web_fetch:")
    try:
        result = await manager.execute_tool(
            "web_fetch",
            {
                "url": "https://example.com",
                "mode": "regex"
            }
        )
        print(f"  ✅ 成功!")
        print(f"  URL: {result['url']}")
        print(f"  文本长度: {result['length']}")
        print(f"  截断: {result['truncated']}")
        print(f"  前100字符: {result['text'][:100]}...")
    except Exception as e:
        print(f"  ❌ 失败: {e}")
    
    await manager.shutdown()


async def test_mcp_stdio():
    """测试MCP stdio"""
    print("\n" + "=" * 60)
    print("测试 MCP stdio")
    print("=" * 60)
    
    # 检查环境变量
    mcp_servers = os.environ.get("MCP_SERVERS", "")
    if not mcp_servers:
        print("  ⚠️  未配置 MCP_SERVERS 环境变量")
        print("  示例: export MCP_SERVERS='test:stdio:echo:hello'")
        return
    
    print(f"  MCP_SERVERS: {mcp_servers}")
    
    # 解析配置
    config = {"mcp_servers": []}
    for server_str in mcp_servers.split(";"):
        parts = server_str.split(":")
        if len(parts) >= 3:
            name = parts[0]
            transport = parts[1]
            if transport == "stdio":
                command = parts[2]
                args = parts[3:] if len(parts) > 3 else []
                config["mcp_servers"].append({
                    "name": name,
                    "transport": "stdio",
                    "command": command,
                    "args": args,
                    "env": {}
                })
    
    if not config["mcp_servers"]:
        print("  ⚠️  无法解析 MCP_SERVERS")
        return
    
    manager = ToolManager()
    
    try:
        print(f"\n  初始化 {len(config['mcp_servers'])} 个MCP服务器...")
        await manager.initialize(config)
        
        # 列出工具
        tools = manager.list_tools()
        mcp_tools = [t for t in tools if t['source'] == 'mcp']
        
        print(f"\n  找到 {len(mcp_tools)} 个MCP工具:")
        for tool in mcp_tools:
            print(f"    - {tool['name']} (from {tool['server']})")
        
        if mcp_tools:
            print("\n  ✅ MCP stdio 工作正常!")
        else:
            print("\n  ⚠️  没有找到MCP工具")
            
    except Exception as e:
        print(f"\n  ❌ MCP初始化失败: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await manager.shutdown()


async def test_api_endpoints():
    """测试API端点"""
    print("\n" + "=" * 60)
    print("测试 API 端点")
    print("=" * 60)
    
    try:
        import httpx
        
        # 假设服务器运行在localhost:8080
        base_url = "http://localhost:8080"
        api_key = "test-key"
        
        print(f"\n  测试 {base_url}")
        print(f"  (确保服务器正在运行: python src/main.py)")
        
        async with httpx.AsyncClient() as client:
            # 测试 /api/tools
            print("\n  测试 POST /api/tools")
            try:
                response = await client.post(
                    f"{base_url}/api/tools",
                    headers={"Authorization": f"Bearer {api_key}"},
                    json={},
                    timeout=5.0
                )
                if response.status_code == 200:
                    data = response.json()
                    print(f"    ✅ 成功! 找到 {len(data.get('tools', []))} 个工具")
                else:
                    print(f"    ❌ HTTP {response.status_code}")
            except httpx.ConnectError:
                print(f"    ⚠️  无法连接到服务器")
                print(f"    请先启动: python src/main.py")
                return
            except Exception as e:
                print(f"    ❌ 错误: {e}")
            
            # 测试 /api/tool/exec
            print("\n  测试 POST /api/tool/exec (web_fetch)")
            try:
                response = await client.post(
                    f"{base_url}/api/tool/exec",
                    headers={"Authorization": f"Bearer {api_key}"},
                    json={
                        "name": "web_fetch",
                        "arguments": {
                            "url": "https://example.com",
                            "mode": "regex"
                        }
                    },
                    timeout=30.0
                )
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        print(f"    ✅ 成功!")
                        result = data.get("result", {})
                        print(f"    文本长度: {result.get('length', 0)}")
                    else:
                        print(f"    ❌ 执行失败: {data.get('error')}")
                else:
                    print(f"    ❌ HTTP {response.status_code}")
            except Exception as e:
                print(f"    ❌ 错误: {e}")
                
    except ImportError:
        print("  ⚠️  需要安装 httpx: pip install httpx")


async def main():
    """主测试函数"""
    print("\n🧪 Backend Tools 测试\n")
    
    # 测试1: Built-in工具
    await test_builtin_tools()
    
    # 测试2: MCP stdio
    await test_mcp_stdio()
    
    # 测试3: API端点
    await test_api_endpoints()
    
    print("\n" + "=" * 60)
    print("测试完成!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
