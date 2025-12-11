#!/bin/bash
# Test SwiftChat API

API_URL="https://6hdggjygct.us-east-1.awsapprunner.com"
API_KEY="20250112Research"

echo "================================================"
echo "Testing SwiftChat API"
echo "================================================"
echo ""
echo "API URL: $API_URL"
echo "API Key: $API_KEY"
echo ""

# Test 1: List tools
echo "Test 1: List available tools"
echo "GET /api/tools/list"
echo ""
curl -X GET "$API_URL/api/tools/list" \
  -H "Authorization: Bearer $API_KEY" \
  -s | python3 -m json.tool
echo ""
echo "---"
echo ""

# Test 2: Execute web_fetch (regex mode)
echo "Test 2: Execute web_fetch tool (regex mode)"
echo "POST /api/tool/exec"
echo ""
curl -X POST "$API_URL/api/tool/exec" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "web_fetch",
    "arguments": {"url": "https://example.com"},
    "config": {
      "mode": "regex",
      "regexRemoveElements": "script,style,nav",
      "timeout": 60,
      "cacheTTL": 3600,
      "debug": true
    }
  }' \
  -s | python3 -m json.tool
echo ""
echo "---"
echo ""

# Test 3: Get tool stats
echo "Test 3: Get tool statistics"
echo "GET /api/tools/stats"
echo ""
curl -X GET "$API_URL/api/tools/stats" \
  -H "Authorization: Bearer $API_KEY" \
  -s | python3 -m json.tool
echo ""
echo "================================================"
echo "Tests complete!"
echo "================================================"
