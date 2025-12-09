"""
Built-in Tools - web_fetch
"""
import httpx
import re
import time
from bs4 import BeautifulSoup
from typing import Dict, Any


# 简单的内存缓存
_fetch_cache: Dict[str, Dict[str, Any]] = {}
_cache_ttl = 3600  # 1小时


class BuiltInTools:
    def __init__(self):
        self.tools = [
            {
                "name": "web_fetch",
                "description": "Fetch and extract content from a web page. Supports both regex cleaning and AI summary modes.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "url": {"type": "string", "description": "The URL to fetch"},
                        "mode": {
                            "type": "string",
                            "enum": ["regex", "ai_summary"],
                            "description": "Processing mode: regex (fast) or ai_summary (detailed)",
                        },
                    },
                    "required": ["url"],
                },
            }
        ]

    def list_tools(self):
        """获取工具列表"""
        return [
            {**tool, "source": "builtin"}
            for tool in self.tools
        ]

    async def execute(self, tool_name: str, arguments: Dict[str, Any], debug: bool = False) -> Any:
        """执行工具"""
        if tool_name == "web_fetch":
            return await self.web_fetch(arguments, debug)
        raise ValueError(f"Unknown tool: {tool_name}")

    async def web_fetch(self, arguments: Dict[str, Any], debug: bool = False) -> Dict[str, Any]:
        """获取网页内容（带缓存）"""
        url = arguments.get("url")
        mode = arguments.get("mode", "regex")

        if not url:
            raise ValueError("URL is required")

        debug_info = {
            "url": url,
            "mode": mode,
            "steps": []
        }
        
        # 检查缓存
        cache_key = f"{url}:{mode}"
        current_time = time.time()
        
        if cache_key in _fetch_cache:
            cached = _fetch_cache[cache_key]
            if current_time - cached["timestamp"] < _cache_ttl:
                debug_info["steps"].append("Using cached result")
                debug_info["cache_hit"] = True
                result = cached["result"].copy()
                if debug:
                    result["_debug"] = debug_info
                return result
            else:
                # 缓存过期，删除
                del _fetch_cache[cache_key]
                debug_info["steps"].append("Cache expired")

        # 下载内容
        debug_info["steps"].append("Fetching URL...")
        async with httpx.AsyncClient(follow_redirects=True) as client:
            response = await client.get(url, timeout=30.0)
            html = response.text
            debug_info["steps"].append(f"Downloaded {len(html)} bytes")
            debug_info["status_code"] = response.status_code
            debug_info["content_type"] = response.headers.get("content-type", "unknown")

        # 处理内容
        if mode == "regex":
            debug_info["steps"].append("Cleaning HTML with regex...")
            text = self._clean_html(html)
            debug_info["steps"].append(f"Extracted {len(text)} characters")
        elif mode == "ai_summary":
            debug_info["steps"].append("Using AI summary mode...")
            text = await self._ai_summary(html, url, debug_info)
        else:
            text = self._clean_html(html)

        # 截断过长内容
        max_length = 50000
        truncated = len(text) > max_length
        if truncated:
            text = text[:max_length]
            debug_info["steps"].append(f"Truncated to {max_length} characters")

        result = {
            "url": url,
            "text": text,
            "truncated": truncated,
            "length": len(text),
            "mode": mode,
        }
        
        # 保存到缓存
        _fetch_cache[cache_key] = {
            "result": result.copy(),
            "timestamp": current_time
        }
        debug_info["steps"].append("Cached result")
        
        # 清理过期缓存（简单策略：超过100个条目时清理）
        if len(_fetch_cache) > 100:
            expired_keys = [
                k for k, v in _fetch_cache.items()
                if current_time - v["timestamp"] > _cache_ttl
            ]
            for k in expired_keys:
                del _fetch_cache[k]
            if expired_keys:
                debug_info["steps"].append(f"Cleaned {len(expired_keys)} expired cache entries")

        if debug:
            result["_debug"] = debug_info

        return result

    def _clean_html(self, html: str) -> str:
        """使用BeautifulSoup和regex清理HTML"""
        soup = BeautifulSoup(html, "html.parser")

        # 移除不需要的标签
        for tag in soup(["script", "style", "nav", "footer", "header", "aside", "iframe", "noscript"]):
            tag.decompose()

        # 提取文本
        text = soup.get_text(separator=" ", strip=True)

        # 清理多余空白 - 使用regex
        text = re.sub(r'\s+', ' ', text)  # 多个空白符替换为单个空格
        text = re.sub(r'\n\s*\n', '\n\n', text)  # 多个换行替换为双换行
        
        # 清理每行
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        text = "\n".join(lines)

        return text

    async def _ai_summary(self, html: str, url: str, debug_info: Dict) -> str:
        """使用AI总结网页内容"""
        # 先用regex清理
        cleaned_text = self._clean_html(html)
        debug_info["steps"].append(f"Cleaned HTML: {len(cleaned_text)} chars")
        
        # 如果内容太长，先截断再发送给AI
        max_input = 100000
        if len(cleaned_text) > max_input:
            cleaned_text = cleaned_text[:max_input]
            debug_info["steps"].append(f"Truncated input to {max_input} chars for AI")
        
        try:
            # 调用Bedrock进行总结
            import boto3
            import json
            
            bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
            
            prompt = f"""Please summarize the following web page content from {url}.
Focus on the main topics, key information, and important details.
Keep the summary concise but comprehensive.

Content:
{cleaned_text}

Summary:"""
            
            debug_info["steps"].append("Calling Bedrock for AI summary...")
            
            response = bedrock.invoke_model(
                modelId='anthropic.claude-3-haiku-20240307-v1:0',
                body=json.dumps({
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 4096,
                    "messages": [
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ]
                })
            )
            
            result = json.loads(response['body'].read())
            summary = result['content'][0]['text']
            
            debug_info["steps"].append(f"AI summary generated: {len(summary)} chars")
            debug_info["ai_model"] = "claude-3-haiku"
            debug_info["input_tokens"] = result.get('usage', {}).get('input_tokens', 0)
            debug_info["output_tokens"] = result.get('usage', {}).get('output_tokens', 0)
            
            return summary
            
        except Exception as e:
            debug_info["steps"].append(f"AI summary failed: {str(e)}, falling back to regex")
            debug_info["ai_error"] = str(e)
            return cleaned_text
