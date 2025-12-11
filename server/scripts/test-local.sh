#!/bin/bash
API_URL="http://localhost:8080"
API_KEY="test123"

echo "Testing local API..."
echo ""

echo "1. List tools:"
curl -X GET "$API_URL/api/tools/list" -H "Authorization: Bearer $API_KEY" -s | python3 -m json.tool
echo ""

echo "2. Execute web_fetch:"
curl -X POST "$API_URL/api/tool/exec" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"web_fetch","arguments":{"url":"https://example.com"},"config":{"mode":"regex","timeout":60,"debug":true}}' \
  -s | python3 -m json.tool | head -30
echo ""

echo "3. Get stats:"
curl -X GET "$API_URL/api/tools/stats" -H "Authorization: Bearer $API_KEY" -s | python3 -m json.tool
