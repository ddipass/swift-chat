#!/usr/bin/env python3
"""测试 Notion MCP OAuth 流程"""
import asyncio
import httpx

async def test_notion_mcp():
    """测试 Notion MCP 连接流程"""
    base_url = "http://localhost:8080"
    api_key = "test_key"
    
    print("=" * 60)
    print("测试 Notion MCP OAuth 流程")
    print("=" * 60)
    
    async with httpx.AsyncClient() as client:
        # 1. 添加 Notion MCP 服务器
        print("\n1. 添加 Notion MCP 服务器...")
        response = await client.post(
            f"{base_url}/api/mcp/servers",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "name": "Notion Test",
                "command": "sse",
                "args": ["https://mcp.notion.com/mcp"],
                "callback_base_url": base_url
            }
        )
        
        if response.status_code != 200:
            print(f"❌ 添加失败: {response.status_code} - {response.text}")
            return
        
        result = response.json()
        server_id = result["server_id"]
        status = result["status"]
        
        print(f"✅ 服务器已添加")
        print(f"   Server ID: {server_id}")
        print(f"   状态: {status}")
        
        # 2. 等待 OAuth 流程触发
        print("\n2. 等待 OAuth 流程触发...")
        await asyncio.sleep(3)
        
        # 3. 检查服务器状态
        print("\n3. 检查服务器状态...")
        response = await client.get(
            f"{base_url}/api/mcp/servers",
            headers={"Authorization": f"Bearer {api_key}"}
        )
        
        if response.status_code != 200:
            print(f"❌ 获取状态失败: {response.status_code}")
            return
        
        servers = response.json()["servers"]
        server = next((s for s in servers if s["server_id"] == server_id), None)
        
        if not server:
            print(f"❌ 找不到服务器 {server_id}")
            return
        
        print(f"✅ 服务器状态: {server['status']}")
        
        if server["status"] == "pending_auth":
            print("\n" + "=" * 60)
            print("✅ OAuth 流程已成功触发！")
            print("=" * 60)
            print("\n下一步：")
            print("1. 查看服务器日志获取授权 URL:")
            print("   tail -200 server.log | grep 'Authorization URL:'")
            print("\n2. 在浏览器中打开授权 URL")
            print("\n3. 使用 Notion 账户登录并授权")
            print("\n4. 授权完成后，服务器会自动完成 token 交换")
            print("\n5. 再次检查服务器状态应该变为 'active'")
            
        elif server["status"] == "active":
            print(f"\n✅ 服务器已激活！")
            print(f"   工具数量: {server['tool_count']}")
            
        elif server["status"] == "error":
            print(f"\n❌ 服务器错误")
            
        else:
            print(f"\n⏳ 服务器状态: {server['status']}")
        
        # 4. 清理测试服务器
        print(f"\n4. 清理测试服务器...")
        response = await client.delete(
            f"{base_url}/api/mcp/servers/{server_id}",
            headers={"Authorization": f"Bearer {api_key}"}
        )
        
        if response.status_code == 200:
            print("✅ 测试服务器已删除")
        else:
            print(f"⚠️  删除失败: {response.status_code}")

if __name__ == "__main__":
    asyncio.run(test_notion_mcp())
