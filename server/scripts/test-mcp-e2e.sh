#!/bin/bash

# MCP 端到端测试

API_URL="${API_URL:-http://localhost:8080}"
API_KEY="${API_KEY:-20250112Research}"

echo "🧪 MCP End-to-End Test"
echo "API URL: $API_URL"
echo ""

# 1. 添加 MCP 服务器
echo "1️⃣  Adding MCP server (Filesystem)..."
SERVER_RESPONSE=$(curl -s "${API_URL}/api/mcp/servers" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Filesystem",
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"]
  }')

echo "$SERVER_RESPONSE" | jq .

SERVER_ID=$(echo "$SERVER_RESPONSE" | jq -r '.server_id')
echo "Server ID: $SERVER_ID"
echo ""

# 等待服务器启动
echo "⏳ Waiting for server to start..."
sleep 3

# 2. 列出所有工具（应该包含 MCP 工具）
echo "2️⃣  Listing all tools..."
curl -s "${API_URL}/api/tools/list" \
  -H "Authorization: Bearer ${API_KEY}" | jq '.tools[] | {name, description}'
echo ""

# 3. 获取服务器工具
echo "3️⃣  Getting server tools..."
curl -s "${API_URL}/api/mcp/servers/${SERVER_ID}/tools" \
  -H "Authorization: Bearer ${API_KEY}" | jq '.tools[] | {name, description}'
echo ""

# 4. 执行 MCP 工具（假设有 read_file 工具）
echo "4️⃣  Executing MCP tool (read_file)..."

# 先创建测试文件
echo "Hello from MCP!" > /tmp/test-mcp.txt

TOOL_NAME="mcp:${SERVER_ID}:read_file"
curl -s "${API_URL}/api/tool/exec" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"${TOOL_NAME}\",
    \"arguments\": {
      \"path\": \"/tmp/test-mcp.txt\"
    },
    \"config\": {}
  }" | jq .
echo ""

# 5. 查看统计
echo "5️⃣  Tool statistics..."
curl -s "${API_URL}/api/tools/stats" \
  -H "Authorization: Bearer ${API_KEY}" | jq .
echo ""

# 6. 清理
echo "6️⃣  Cleaning up..."
curl -s -X DELETE "${API_URL}/api/mcp/servers/${SERVER_ID}" \
  -H "Authorization: Bearer ${API_KEY}" | jq .

rm -f /tmp/test-mcp.txt

echo ""
echo "✅ End-to-end test completed!"
