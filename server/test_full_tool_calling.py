#!/usr/bin/env python3
"""
完整的工具调用端到端测试
"""
import requests
import json
import time

API_URL = "http://localhost:8080"
API_KEY = "test-key"

def test_tool_calling():
    print("=" * 60)
    print("完整工具调用测试")
    print("=" * 60)
    
    # 构造请求 - 明确要求使用工具
    request_data = {
        "modelId": "anthropic.claude-3-sonnet-20240229-v1:0",
        "region": "us-east-1",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "text": "请使用 web_fetch 工具获取 https://example.com 的内容，然后告诉我这个网站是关于什么的。"
                    }
                ]
            }
        ],
        "enableThinking": False
    }
    
    print("\n发送请求...")
    print(f"问题: {request_data['messages'][0]['content'][0]['text']}")
    
    try:
        response = requests.post(
            f"{API_URL}/api/converse/v3",
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json"
            },
            json=request_data,
            stream=True,
            timeout=60
        )
        
        print(f"\n状态码: {response.status_code}")
        
        if response.status_code == 200:
            print("\nAI 响应流:")
            print("-" * 60)
            
            full_response = ""
            tool_use_detected = False
            tool_name = None
            
            for line in response.iter_lines():
                if line:
                    try:
                        chunk = json.loads(line.decode('utf-8'))
                        
                        # 检测 toolUse
                        if 'contentBlockStart' in chunk:
                            start = chunk['contentBlockStart'].get('start', {})
                            if 'toolUse' in start:
                                tool_use_detected = True
                                tool_name = start['toolUse'].get('name')
                                print(f"\n[检测到工具调用: {tool_name}]")
                        
                        # 检测 stopReason
                        if 'messageStop' in chunk:
                            stop_reason = chunk['messageStop'].get('stopReason')
                            if stop_reason == 'tool_use':
                                print(f"[停止原因: tool_use - 需要执行工具]")
                        
                        # 显示文本
                        if 'contentBlockDelta' in chunk:
                            delta = chunk['contentBlockDelta']['delta']
                            if 'text' in delta:
                                text = delta['text']
                                full_response += text
                                print(text, end='', flush=True)
                    except:
                        pass
            
            print("\n" + "-" * 60)
            
            # 验证结果
            print("\n测试结果:")
            if tool_use_detected:
                print(f"✓ 工具调用检测成功: {tool_name}")
            else:
                print("✗ 未检测到工具调用")
            
            if 'example' in full_response.lower() or 'domain' in full_response.lower():
                print("✓ 响应包含预期内容")
            else:
                print("⚠️  响应内容可能不完整")
            
            return tool_use_detected
        else:
            print(f"✗ HTTP 错误: {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"✗ 请求失败: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    result = test_tool_calling()
    
    print("\n" + "=" * 60)
    if result:
        print("✓ 测试通过: 工具调用流程正常")
    else:
        print("✗ 测试失败: 工具调用未正常工作")
    print("=" * 60)
