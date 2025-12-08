#!/usr/bin/env python3
"""
测试 AI 是否能看到并提到工具
"""
import requests
import json

API_URL = "http://localhost:8080"
API_KEY = "test-key"

def test_ai_awareness():
    print("=" * 60)
    print("测试: AI 是否知道有 web_fetch 工具")
    print("=" * 60)
    
    # 构造请求 - 询问 AI 能做什么
    request_data = {
        "modelId": "anthropic.claude-3-sonnet-20240229-v1:0",
        "region": "us-east-1",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "text": "你有什么工具可以使用吗？请列出所有可用的工具。"
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
            timeout=30
        )
        
        print(f"\n状态码: {response.status_code}")
        
        if response.status_code == 200:
            print("\nAI 响应:")
            print("-" * 60)
            
            full_response = ""
            for line in response.iter_lines():
                if line:
                    try:
                        chunk = json.loads(line.decode('utf-8'))
                        if 'contentBlockDelta' in chunk:
                            delta = chunk['contentBlockDelta']['delta']
                            if 'text' in delta:
                                text = delta['text']
                                full_response += text
                                print(text, end='', flush=True)
                    except:
                        pass
            
            print("\n" + "-" * 60)
            
            # 检查响应中是否提到工具
            if 'web_fetch' in full_response.lower() or '工具' in full_response or 'tool' in full_response.lower():
                print("\n✓ AI 提到了工具!")
                print("  这说明 toolConfig 成功传递给了 AI")
                return True
            else:
                print("\n⚠️  AI 没有提到任何工具")
                print("  可能 toolConfig 没有正确传递")
                return False
        else:
            print(f"✗ HTTP 错误: {response.status_code}")
            print(response.text)
            return False
            
    except Exception as e:
        print(f"✗ 请求失败: {e}")
        return False

if __name__ == "__main__":
    result = test_ai_awareness()
    
    print("\n" + "=" * 60)
    if result:
        print("✓ 测试通过: AI 知道有工具可用")
    else:
        print("✗ 测试失败: AI 不知道工具")
    print("=" * 60)
