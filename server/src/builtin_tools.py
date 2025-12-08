"""
Built-in Tools - web_fetch
"""
import httpx
from bs4 import BeautifulSoup
from typing import Dict, Any


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

    async def execute(self, tool_name: str, arguments: Dict[str, Any]) -> Any:
        """执行工具"""
        if tool_name == "web_fetch":
            return await self.web_fetch(arguments)
        raise ValueError(f"Unknown tool: {tool_name}")

    async def web_fetch(self, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """获取网页内容"""
        url = arguments.get("url")
        mode = arguments.get("mode", "regex")

        if not url:
            raise ValueError("URL is required")

        # 下载内容
        async with httpx.AsyncClient(follow_redirects=True) as client:
            response = await client.get(url, timeout=30.0)
            html = response.text

        # 处理内容
        if mode == "regex":
            text = self._clean_html(html)
        else:
            # AI summary模式 - 暂时使用regex，后续可以调用Bedrock
            text = self._clean_html(html)

        # 截断过长内容
        max_length = 50000
        truncated = len(text) > max_length
        if truncated:
            text = text[:max_length]

        return {
            "url": url,
            "text": text,
            "truncated": truncated,
            "length": len(text),
            "mode": mode,
        }

    def _clean_html(self, html: str) -> str:
        """使用BeautifulSoup清理HTML"""
        soup = BeautifulSoup(html, "html.parser")

        # 移除不需要的标签
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()

        # 提取文本
        text = soup.get_text(separator=" ", strip=True)

        # 清理多余空白
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        text = "\n".join(lines)

        return text
