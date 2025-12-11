"""
Built-in Tools - web_fetch
"""
import httpx
import time
import json
import boto3
import re
from bs4 import BeautifulSoup
from typing import Dict, Any


class BuiltInTools:
    def __init__(self):
        self.cache = {}  # {cache_key: {result, timestamp}}
    
    def has_tool(self, name: str) -> bool:
        """检查是否有该工具"""
        return name == "web_fetch"
    
    async def execute(
        self,
        name: str,
        arguments: Dict[str, Any],
        config: Dict[str, Any]
    ) -> Any:
        """执行工具"""
        if name == "web_fetch":
            return await self._web_fetch(arguments, config)
        raise ValueError(f"Unknown tool: {name}")
    
    async def _web_fetch(
        self,
        arguments: Dict[str, Any],
        config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Web Fetch 工具
        
        支持两种模式：
        1. regex: 快速清理HTML
        2. ai_summary: 使用Bedrock AI总结
        """
        url = arguments.get("url")
        if not url:
            raise ValueError("URL is required")
        
        # 读取配置
        mode = config.get("mode", "regex")
        timeout = config.get("timeout", 60)
        cache_ttl = config.get("cacheTTL", 3600)
        debug = config.get("debug", False)
        
        debug_info = {
            "url": url,
            "mode": mode,
            "steps": [],
            "cache_hit": False
        }
        
        # 检查缓存
        cache_key = f"{url}:{mode}"
        current_time = time.time()
        
        if cache_key in self.cache:
            cached = self.cache[cache_key]
            if current_time - cached["timestamp"] < cache_ttl:
                debug_info["steps"].append("Cache hit")
                debug_info["cache_hit"] = True
                result = cached["result"].copy()
                if debug:
                    result["_debug"] = debug_info
                return result
        
        debug_info["steps"].append("Cache miss, fetching URL...")
        
        # 下载网页
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            response = await client.get(url)
            html = response.text
            debug_info["steps"].append(f"Downloaded {len(html)} bytes")
            debug_info["status_code"] = response.status_code
        
        # 处理内容
        if mode == "regex":
            text = self._clean_html_regex(html, config, debug_info)
            processed_by = "regex"
        elif mode == "ai_summary":
            text = await self._clean_html_ai(html, url, config, debug_info)
            processed_by = "ai_summary"
        else:
            text = self._clean_html_regex(html, config, debug_info)
            processed_by = "regex"
        
        # 构建结果
        result = {
            "url": url,
            "text": text,
            "length": len(text),
            "processed_by": processed_by
        }
        
        # 保存缓存
        self.cache[cache_key] = {
            "result": result.copy(),
            "timestamp": current_time
        }
        debug_info["steps"].append("Cached result")
        
        # 清理过期缓存
        self._cleanup_cache(cache_ttl, debug_info)
        
        if debug:
            result["_debug"] = debug_info
        
        return result
    
    def _clean_html_regex(
        self,
        html: str,
        config: Dict[str, Any],
        debug_info: Dict
    ) -> str:
        """使用 BeautifulSoup + Regex 清理HTML"""
        debug_info["steps"].append("Cleaning HTML with regex...")
        
        # 获取要移除的元素
        remove_elements = config.get(
            "regexRemoveElements",
            "script,style,nav,footer,header,aside,iframe,noscript"
        )
        remove_tags = [tag.strip() for tag in remove_elements.split(",")]
        
        # 使用 BeautifulSoup 解析
        soup = BeautifulSoup(html, "html.parser")
        
        # 移除指定标签
        for tag in remove_tags:
            for element in soup.find_all(tag):
                element.decompose()
        
        # 提取文本
        text = soup.get_text(separator=" ", strip=True)
        
        # 清理空白
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'\n\s*\n', '\n\n', text)
        
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        text = "\n".join(lines)
        
        debug_info["steps"].append(f"Extracted {len(text)} characters")
        
        return text
    
    async def _clean_html_ai(
        self,
        html: str,
        url: str,
        config: Dict[str, Any],
        debug_info: Dict
    ) -> str:
        """使用 Bedrock AI 总结网页"""
        debug_info["steps"].append("Using AI summary mode...")
        
        # 先用 regex 清理
        cleaned_text = self._clean_html_regex(html, config, debug_info)
        
        # 截断过长内容
        max_input = 100000
        if len(cleaned_text) > max_input:
            cleaned_text = cleaned_text[:max_input]
            debug_info["steps"].append(f"Truncated to {max_input} chars for AI")
        
        # 获取配置
        summary_model = config.get(
            "summaryModel",
            "anthropic.claude-3-5-sonnet-20241022-v2:0"
        )
        summary_prompt = config.get(
            "summaryPrompt",
            "Please summarize the following web page content. "
            "Focus on the main topics, key information, and important details. "
            "Keep it concise but comprehensive."
        )
        aws_region = config.get("awsRegion", "us-east-1")
        
        debug_info["steps"].append(f"Calling Bedrock: {summary_model}")
        
        try:
            # 创建 Bedrock 客户端
            bedrock_kwargs = {
                'region_name': aws_region
            }
            
            # 添加凭证（如果提供）
            if config.get("awsAccessKeyId"):
                bedrock_kwargs['aws_access_key_id'] = config.get("awsAccessKeyId")
            if config.get("awsSecretAccessKey"):
                bedrock_kwargs['aws_secret_access_key'] = config.get("awsSecretAccessKey")
            if config.get("awsSessionToken"):
                bedrock_kwargs['aws_session_token'] = config.get("awsSessionToken")
            
            bedrock = boto3.client('bedrock-runtime', **bedrock_kwargs)
            
            # 构建提示词
            full_prompt = f"""{summary_prompt}

URL: {url}

Content:
{cleaned_text}

Summary:"""
            
            # 调用 Bedrock
            response = bedrock.invoke_model(
                modelId=summary_model,
                body=json.dumps({
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 4096,
                    "messages": [
                        {
                            "role": "user",
                            "content": full_prompt
                        }
                    ]
                })
            )
            
            # 解析响应
            result = json.loads(response['body'].read())
            summary = result['content'][0]['text']
            
            debug_info["steps"].append(f"AI summary: {len(summary)} chars")
            debug_info["ai_model"] = summary_model
            debug_info["input_tokens"] = result.get('usage', {}).get('input_tokens', 0)
            debug_info["output_tokens"] = result.get('usage', {}).get('output_tokens', 0)
            
            return summary
            
        except Exception as e:
            debug_info["steps"].append(f"AI failed: {str(e)}, fallback to regex")
            debug_info["ai_error"] = str(e)
            return cleaned_text
    
    def _cleanup_cache(self, cache_ttl: int, debug_info: Dict):
        """清理过期缓存"""
        current_time = time.time()
        expired_keys = [
            k for k, v in self.cache.items()
            if current_time - v["timestamp"] > cache_ttl
        ]
        
        for k in expired_keys:
            del self.cache[k]
        
        if expired_keys:
            debug_info["steps"].append(f"Cleaned {len(expired_keys)} expired cache entries")
