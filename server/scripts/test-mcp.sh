#!/bin/bash

# 测试 MCP API

API_URL="${API_URL:-http://localhost:8080}"
API_KEY="${API_KEY:-20250112Research}"

echo "🧪 Testing MCP API..."
echo "API URL: $API_URL"
echo ""

# 1. 列出服务器（应该为空）
echo "1️⃣  Listing MCP servers..."
curl -s "${API_URL}/api/mcp/servers" \
  --header "Authorization: Bearer ${API_KEY}" | jq .

echo ""
echo "✅ Phase 1 (Backend) completed!"
echo ""
echo "Next steps:"
echo "  - Implement frontend MCPClient"
echo "  - Create MCPServersScreen UI"
echo "  - Test adding a simple stdio MCP server"
