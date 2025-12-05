# MCP Integration Guide

SwiftChat now supports Model Context Protocol (MCP) integration with proper multi-turn tool calling flow.

## Features

- ✅ Works on iOS, iPad, Android, and macOS
- ✅ HTTP-based MCP server support
- ✅ Optional API key authentication
- ✅ Automatic tool detection and execution
- ✅ Multi-turn conversation flow (like Q CLI)
- ✅ Tool result display in chat
- ✅ Easy configuration through Settings

## How It Works (Phase 1)

SwiftChat implements the proper tool calling flow inspired by Q CLI:

1. **User sends first message** → Tool descriptions are added once
2. **AI responds** → May include tool call in JSON format
3. **Tool detection** → SwiftChat detects `{"toolUse": {...}}` pattern
4. **Tool execution** → Calls MCP server and gets result
5. **Tool result (hidden)** → Sent to AI in conversation history (not shown in UI)
6. **Final AI response** → AI generates natural language answer based on tool result

### Key Features

- **Token Efficient**: Tool descriptions are only added to the first message, not every message
- **Clean UI**: Tool results are hidden from chat UI, only final AI responses are shown
- **Error Handling**: Failed tool executions show friendly error messages
- **Iteration Limit**: Prevents infinite loops with configurable max iterations (default: 2)

### Example Flow

```
User: "What's the weather in Seattle?"
  ↓ (SwiftChat adds tool descriptions - only once)
AI: {"toolUse": {"name": "get_weather", "arguments": {"location": "Seattle"}}}
  ↓ (SwiftChat detects tool call)
  ↓ (Shows: "🔧 Executing tool: get_weather... (iteration 1/2)")
  ↓ (Executes tool, gets result)
  ↓ (Shows: "✅ Tool executed: get_weather. Generating response...")
  ↓ (Tool result sent to AI - hidden from user)
AI: "The current weather in Seattle is 72°F and sunny."
  ↓ (User only sees this final response)
```

## Setup

### 1. Configure MCP Server

In SwiftChat Settings:
1. Enable "Enable MCP" toggle
2. Enter your MCP Server URL (e.g., `http://localhost:3000`)
3. (Optional) Enter API Key if your server requires authentication
4. (Optional) Set "Max Tool Call Iterations" (default: 2, max: 10)

### Max Tool Call Iterations

This setting prevents infinite loops when AI repeatedly calls tools. 

- **Default**: 2 iterations
- **Range**: 1-10
- **Behavior**: If AI tries to call tools more than the limit, SwiftChat will stop and show a warning

Example with max iterations = 2:
```
User: "What's the weather?"
  ↓ Iteration 1
AI: Tool call → Execute → Result
  ↓ Iteration 2  
AI: Tool call → Execute → Result
  ↓ Max reached
AI: ⚠️ Maximum tool call iterations (2) reached. Stopping tool execution.
```

### 2. Start an MCP Server

You need to run an MCP server that exposes tools via HTTP. Here are some options:

#### Option A: Use existing MCP HTTP server

```bash
npm install -g @modelcontextprotocol/server-http
mcp-server-http --port 3000
```

#### Option B: Create a simple Node.js bridge

Create `mcp-bridge.js`:

```javascript
const express = require('express');
const app = express();
app.use(express.json());

// List available tools
app.get('/tools', (req, res) => {
  res.json({
    tools: [
      {
        name: 'get_weather',
        description: 'Get current weather for a location',
        inputSchema: {
          type: 'object',
          properties: {
            location: { type: 'string' }
          }
        }
      }
    ]
  });
});

// Call a tool
app.post('/call', async (req, res) => {
  const { name, arguments: args } = req.body;
  
  if (name === 'get_weather') {
    // Your tool implementation
    res.json({ temperature: 72, condition: 'sunny' });
  } else {
    res.status(404).json({ error: 'Tool not found' });
  }
});

app.listen(3000, () => console.log('MCP server running on port 3000'));
```

Run it:
```bash
npm install express
node mcp-bridge.js
```

## Usage

Once configured, SwiftChat will automatically:
1. Include tool descriptions in your prompts
2. Detect when the AI wants to use a tool
3. Execute the tool and show results

### Example Conversation

**You**: "What's the weather in Seattle?"

**AI**: (internally calls weather tool)
```json
{"tool": "get_weather", "args": {"location": "Seattle"}}
```

**SwiftChat**: (executes tool, gets result)

**AI**: "The current weather in Seattle is 72°F and sunny."

### Tool Call Format

The AI should respond with JSON in this format:
```json
{
  "toolUse": {
    "name": "tool_name",
    "arguments": {
      "param1": "value1",
      "param2": "value2"
    }
  }
}
```

SwiftChat will automatically:
1. Detect this pattern in the AI response
2. Execute the tool via your MCP server
3. Send the result back to the AI
4. Display the final natural language response

## Troubleshooting

- For local development, use `http://localhost:3000`
- For remote servers, always use HTTPS
- Use API keys for authentication when exposing servers publicly
- Consider using Cloudflare Tunnel or similar for secure remote access

## Troubleshooting

- **Connection failed**: Make sure your MCP server is running and accessible
- **iOS can't connect to localhost**: Use your computer's IP address instead (e.g., `http://192.168.1.100:3000`)
- **Tools not working**: Check server logs for errors

## API Specification

### GET /tools
Returns list of available tools.

Response:
```json
{
  "tools": [
    {
      "name": "tool_name",
      "description": "Tool description",
      "inputSchema": { /* JSON Schema */ }
    }
  ]
}
```

### POST /call
Executes a tool.

Request:
```json
{
  "name": "tool_name",
  "arguments": { /* tool arguments */ }
}
```

Response:
```json
{
  /* tool result */
}
```

## Next Steps

The current implementation provides the foundation. Future enhancements could include:
- Automatic tool detection and calling based on user messages
- Tool result formatting in chat UI
- Multiple MCP server support
- Built-in tool library
