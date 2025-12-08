#!/usr/bin/env python3
"""
端到端测试：完整的 MCP Perplexity 配置和使用流程
"""
import requests
import json
import time

API_URL = "http://localhost:8080"
API_KEY = "test-key"

def print_section(title):
    print("\n" + "=" * 60)
    print(title)
    print("=" * 60)

def test_1_sync_perplexity_config():
    """测试1: 同步 Perplexity MCP 配置"""
    print_section("测试 1: 同步 Perplexity MCP 配置")
    
    servers_config = [
        {
            "id": str(int(time.time())),
            "name": "Perplexity",
            "url": "stdio://npx/-y/@perplexity-ai/mcp-server",
            "apiKey": "",
            "enabled": True,
            "transport": "stdio",
            "env": {
                "PERPLEXITY_API_KEY": "pplx-test-key-placeholder"
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
        data = response.json()
        print(f"响应: {json.dumps(data, indent=2, ensure_ascii=False)}")
        
        if response.status_code == 200 and data.get("success"):
            print("✓ Perplexity MCP 配置同步成功")
            return True
        else:
            print(f"✗ 配置同步失败: {data.get('error')}")
            return False
            
    except Exception as e:
        print(f"✗ 请求失败: {e}")
        return False

def test_2_list_tools():
    """测试2: 列出所有可用工具"""
    print_section("测试 2: 列出所有可用工具")
    
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
            print(f"✓ 获取到 {len(tools)} 个工具:")
            
            for tool in tools:
                source = tool.get('source', 'unknown')
                server = tool.get('server', '')
                server_info = f" (来自: {server})" if server else ""
                print(f"  - {tool['name']} [{source}]{server_info}")
                print(f"    {tool.get('description', 'No description')[:80]}...")
            
            # 检查是否有 web_fetch
            has_web_fetch = any(t['name'] == 'web_fetch' for t in tools)
            print(f"\n{'✓' if has_web_fetch else '✗'} web_fetch 工具可用")
            
            return True
        else:
            print(f"✗ HTTP错误: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"✗ 请求失败: {e}")
        return False

def test_3_execute_web_fetch():
    """测试3: 执行 web_fetch 工具"""
    print_section("测试 3: 执行 web_fetch 工具")
    
    try:
        response = requests.post(
            f"{API_URL}/api/tool/exec",
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "name": "web_fetch",
                "arguments": {
                    "url": "https://example.com",
                    "mode": "regex"
                }
            },
            timeout=30
        )
        
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                result = str(data.get("result", ""))
                print(f"✓ web_fetch 执行成功")
                print(f"  提取内容长度: {len(result)} 字符")
                if len(result) > 100:
                    print(f"  内容预览: {result[:100]}...")
                else:
                    print(f"  内容: {result}")
                return True
            else:
                print(f"✗ 工具执行失败: {data.get('error')}")
                return False
        else:
            print(f"✗ HTTP错误: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"✗ 请求失败: {e}")
        return False

def test_4_backend_health():
    """测试4: 后端健康检查"""
    print_section("测试 4: 后端健康检查")
    
    try:
        start_time = time.time()
        response = requests.post(
            f"{API_URL}/api/tools",
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json"
            },
            json={},
            timeout=5
        )
        duration = time.time() - start_time
        
        if response.status_code == 200:
            print(f"✓ 后端在线")
            print(f"  响应时间: {duration:.2f}s")
            return True
        else:
            print(f"✗ 后端响应异常: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"✗ 后端离线: {e}")
        return False

def test_5_config_update():
    """测试5: 更新配置（禁用服务器）"""
    print_section("测试 5: 更新配置（禁用 Perplexity）")
    
    servers_config = [
        {
            "id": str(int(time.time())),
            "name": "Perplexity",
            "url": "stdio://npx/-y/@perplexity-ai/mcp-server",
            "apiKey": "",
            "enabled": False,  # 禁用
            "transport": "stdio",
            "env": {
                "PERPLEXITY_API_KEY": "pplx-test-key-placeholder"
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
        
        if response.status_code == 200 and response.json().get("success"):
            print("✓ 配置更新成功（Perplexity 已禁用）")
            return True
        else:
            print("✗ 配置更新失败")
            return False
            
    except Exception as e:
        print(f"✗ 请求失败: {e}")
        return False

def main():
    print("=" * 60)
    print("SwiftChat MCP 端到端测试")
    print("=" * 60)
    print(f"API URL: {API_URL}")
    print(f"测试时间: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {
        "配置同步": test_1_sync_perplexity_config(),
        "工具列表": test_2_list_tools(),
        "工具执行": test_3_execute_web_fetch(),
        "健康检查": test_4_backend_health(),
        "配置更新": test_5_config_update(),
    }
    
    print_section("测试总结")
    for test_name, result in results.items():
        status = "✓ 通过" if result else "✗ 失败"
        print(f"{test_name}: {status}")
    
    passed = sum(results.values())
    total = len(results)
    print(f"\n总计: {passed}/{total} 测试通过")
    
    if passed == total:
        print("\n🎉 所有测试通过!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} 个测试失败")
        return 1

if __name__ == "__main__":
    exit(main())
