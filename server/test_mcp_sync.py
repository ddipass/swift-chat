#!/usr/bin/env python3
"""
测试MCP配置同步功能
"""
import requests
import json

API_URL = "http://localhost:8080"
API_KEY = "test-key"  # 测试用，实际需要从SSM获取

def test_sync_mcp_config():
    """测试同步MCP配置"""
    print("=" * 60)
    print("测试: 同步MCP配置到后端")
    print("=" * 60)
    
    # 模拟前端发送的MCP服务器配置
    servers_config = [
        {
            "id": "1",
            "name": "Perplexity",
            "url": "stdio://npx/-y/@perplexity-ai/mcp-server",
            "apiKey": "",
            "enabled": True,
            "transport": "stdio",
            "env": {
                "PERPLEXITY_API_KEY": "pplx-test-key"
            }
        }
    ]
    
    try:
        response = requests.post(
            f"{API_URL}/api/mcp/config",
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json"
            },
            json={"servers": servers_config},
            timeout=10
        )
        
        print(f"状态码: {response.status_code}")
        print(f"响应: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                print("✓ MCP配置同步成功")
                return True
            else:
                print(f"✗ MCP配置同步失败: {data.get('error')}")
                return False
        else:
            print(f"✗ HTTP错误: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"✗ 请求失败: {e}")
        return False


def test_list_tools_after_sync():
    """测试同步后列出工具"""
    print("\n" + "=" * 60)
    print("测试: 同步后列出工具")
    print("=" * 60)
    
    try:
        response = requests.post(
            f"{API_URL}/api/tools",
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json"
            },
            json={},
            timeout=10
        )
        
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            tools = data.get("tools", [])
            print(f"✓ 获取到 {len(tools)} 个工具")
            
            for tool in tools:
                print(f"  - {tool['name']} (来自: {tool.get('server', 'unknown')})")
                print(f"    {tool.get('description', 'No description')}")
            
            return True
        else:
            print(f"✗ HTTP错误: {response.status_code}")
            print(f"响应: {response.text}")
            return False
            
    except Exception as e:
        print(f"✗ 请求失败: {e}")
        return False


if __name__ == "__main__":
    print("开始测试MCP配置同步功能...\n")
    
    # 注意: 这个测试需要后端服务器运行，但不需要真实的API Key验证
    # 因为我们使用的是测试环境
    
    result1 = test_sync_mcp_config()
    result2 = test_list_tools_after_sync()
    
    print("\n" + "=" * 60)
    print("测试总结")
    print("=" * 60)
    print(f"MCP配置同步: {'✓ 通过' if result1 else '✗ 失败'}")
    print(f"工具列表获取: {'✓ 通过' if result2 else '✗ 失败'}")
    
    if result1 and result2:
        print("\n✓ 所有测试通过!")
    else:
        print("\n✗ 部分测试失败")
