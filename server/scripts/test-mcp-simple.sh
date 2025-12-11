#!/bin/bash

# 简化的 MCP 测试 - 只测试 API 可用性

API_URL="${API_URL:-http://localhost:8080}"
API_KEY="${API_KEY:-20250112Research}"

echo "🧪 MCP Simple Test"
echo "API URL: $API_URL"
echo ""

# 1. 测试健康检查
echo "1️⃣  Health check..."
curl -s "${API_URL}/" | jq .
echo ""

# 2. 列出服务器（应该为空）
echo "2️⃣  List servers (should be empty)..."
curl -s "${API_URL}/api/mcp/servers" \
  -H "Authorization: Bearer ${API_KEY}" | jq .
echo ""

# 3. 列出所有工具（应该只有 web_fetch）
echo "3️⃣  List all tools..."
curl -s "${API_URL}/api/tools/list" \
  -H "Authorization: Bearer ${API_KEY}" | jq '.tools[] | {name, description}'
echo ""

# 4. 测试工具统计
echo "4️⃣  Tool statistics..."
curl -s "${API_URL}/api/tools/stats" \
  -H "Authorization: Bearer ${API_KEY}" | jq .
echo ""

echo "✅ Basic API tests passed!"
echo ""
echo "📝 To add a real MCP server, use:"
echo "   npx @modelcontextprotocol/server-filesystem /tmp"
echo ""
echo "   Then add via API:"
echo "   curl -X POST ${API_URL}/api/mcp/servers \\"
echo "     -H 'Authorization: Bearer ${API_KEY}' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"name\":\"Filesystem\",\"command\":\"npx\",\"args\":[\"-y\",\"@modelcontextprotocol/server-filesystem\",\"/tmp\"]}'"
