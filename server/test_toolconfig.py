#!/usr/bin/env python3
"""
测试 toolConfig 是否正确传递给 Bedrock
"""
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

import main
from main import create_bedrock_command
from tool_manager import ToolManager
from pydantic import BaseModel
from typing import List, Optional

class ConverseRequest(BaseModel):
    modelId: str
    region: str
    messages: List[dict]
    system: Optional[List[dict]] = None
    enableThinking: bool = False

async def test_toolconfig():
    print("=" * 60)
    print("测试 toolConfig 是否传递给 Bedrock")
    print("=" * 60)
    
    # 手动初始化 tool_manager
    print("\n初始化 tool_manager...")
    main.tool_manager = ToolManager()
    await main.tool_manager.initialize({})
    
    # 检查 tool_manager
    print(f"tool_manager 状态: {main.tool_manager}")
    if main.tool_manager:
        tools = main.tool_manager.list_tools()
        print(f"可用工具数量: {len(tools)}")
        for tool in tools:
            print(f"  - {tool['name']}: {tool['description'][:50]}...")
    else:
        print("⚠️  tool_manager 未初始化!")
    
    # 创建测试请求
    request = ConverseRequest(
        modelId="anthropic.claude-3-sonnet-20240229-v1:0",
        region="us-east-1",
        messages=[
            {
                "role": "user",
                "content": [{"text": "Hello"}]
            }
        ]
    )
    
    # 调用 create_bedrock_command
    client, command = await create_bedrock_command(request)
    
    print("\n生成的 command:")
    print(f"  modelId: {command.get('modelId')}")
    print(f"  messages: {len(command.get('messages', []))} 条消息")
    
    # 检查 toolConfig
    if 'toolConfig' in command:
        print(f"\n✓ toolConfig 存在!")
        tool_config = command['toolConfig']
        tools = tool_config.get('tools', [])
        print(f"  工具数量: {len(tools)}")
        
        for i, tool in enumerate(tools, 1):
            tool_spec = tool.get('toolSpec', {})
            print(f"\n  工具 {i}:")
            print(f"    名称: {tool_spec.get('name')}")
            print(f"    描述: {tool_spec.get('description', '')[:60]}...")
            input_schema = tool_spec.get('inputSchema', {}).get('json', {})
            properties = input_schema.get('properties', {})
            print(f"    参数: {list(properties.keys())}")
        
        return True
    else:
        print("\n✗ toolConfig 不存在!")
        print("  这意味着 AI 看不到任何工具")
        return False

if __name__ == "__main__":
    import asyncio
    result = asyncio.run(test_toolconfig())
    
    print("\n" + "=" * 60)
    if result:
        print("✓ 测试通过: toolConfig 正确传递")
    else:
        print("✗ 测试失败: toolConfig 未传递")
    print("=" * 60)
    
    sys.exit(0 if result else 1)
