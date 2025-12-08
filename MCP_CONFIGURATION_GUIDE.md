# MCP Configuration Guide for SwiftChat

## Overview

SwiftChat **only supports HTTP/HTTPS MCP servers**. This guide explains how to configure MCP servers in SwiftChat.

## Important: Protocol Limitation

⚠️ **SwiftChat does NOT support stdio-based MCP servers** (like those used in Kiro CLI, Claude Desktop, etc.)

### What SwiftChat Supports
✅ HTTP/HTTPS MCP servers (e.g., `https://mcp.notion.com/mcp`)

### What SwiftChat Does NOT Support
❌ stdio-based MCP servers (command + args)
❌ Local process-based MCP servers (uvx, npx, etc.)

### Why?
SwiftChat is a cross-platform mobile/desktop app (Android, iOS, macOS). It uses HTTP `fetch()` API to communicate with MCP servers, not process spawning.

## Configuration Format

### Kiro CLI (stdio - NOT compatible)
```json
{
  "command": "uvx",
  "args": ["awslabs.core-mcp-server@latest"],
  "env": {
    "FASTMCP_LOG_LEVEL": "ERROR"
  }
}
```

### SwiftChat (HTTP only)
```json
{
  "id": "1234567890",
  "name": "Notion MCP",
  "url": "https://mcp.notion.com/mcp",
  "apiKey": "optional-api-key",
  "enabled": true,
  "env": {
    "NOTE": "For documentation purposes"
  }
}
```

## How to Use

### Step 1: Find an HTTP MCP Server

You need an MCP server that exposes HTTP endpoints. Examples:
- Notion MCP: `https://mcp.notion.com/mcp`
- Your own deployed MCP server
- Third-party HTTP MCP services

### Step 2: Configure in SwiftChat

1. Open SwiftChat Settings
2. Navigate to **MCP Settings**
3. Enable MCP
4. Click **+ Add Server**
5. Fill in the form:
   - **Server Name**: A friendly name (e.g., "Notion MCP")
   - **Server URL**: The HTTP/HTTPS URL (e.g., `https://mcp.notion.com/mcp`)
   - **API Key**: (Optional) If your MCP server requires authentication
   - **Environment Variables**: (Optional) JSON object for documentation
     ```json
     {"NOTE": "Configuration notes"}
     ```

### Step 3: Enable and Use

1. Toggle the switch to enable the server
2. The MCP tools will be available in your chat sessions

## Configuration Examples

### Example 1: Notion MCP Server
```
Name: Notion
URL: https://mcp.notion.com/mcp
API Key: your-notion-api-key
Environment Variables: (leave empty)
```

### Example 2: Custom HTTP MCP Server
```
Name: My Custom MCP
URL: https://my-mcp-server.example.com/api
API Key: my-secret-key
Environment Variables: {"region": "us-east-1"}
```

## Enhanced Features

### Environment Variables Support
The enhanced UI now supports environment variables that can be passed to the MCP server. This is useful for:
- Setting log levels
- Configuring timeouts
- Passing API keys for third-party services
- Custom configuration options

### Display Information
When a server has environment variables configured, they will be displayed in the server list:
```
Server Name
http://localhost:3000
Env: FASTMCP_LOG_LEVEL, TIMEOUT
```

## Troubleshooting

### Server Not Responding
- Ensure the MCP server is accessible via HTTP/HTTPS
- Check if the URL is correct
- Verify the server is online and responding

### Invalid Environment Variables
- Environment variables must be valid JSON object format
- Use double quotes for keys and string values
- Example: `{"KEY": "value", "NUMBER": "123"}`

### Connection Refused
- Verify the server URL is accessible from your device
- Check if HTTPS is required (some servers don't support HTTP)
- Ensure API key is correct if required

## Notes

- SwiftChat only supports HTTP/HTTPS MCP servers
- stdio-based MCP servers (Kiro CLI, Claude Desktop) are NOT compatible
- Environment variables in SwiftChat are for documentation purposes
- The MCP server must expose `/tools` and `/call` HTTP endpoints
