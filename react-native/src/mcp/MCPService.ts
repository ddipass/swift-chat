import { MCPClient, MCPTool } from './MCPClient';
import { getMCPEnabled, getMCPServers } from '../storage/StorageUtils';
import {
  getBuiltInTools,
  getBuiltInToolsAsync,
  executeBuiltInTool,
  isBuiltInTool,
} from './BuiltInTools';

const mcpClients = new Map<string, MCPClient>();
let cachedTools: MCPTool[] = [];
let cachedBuiltInTools: MCPTool[] = [];

function getMCPClients(): MCPClient[] {
  const enabled = getMCPEnabled();
  if (!enabled) {
    return [];
  }

  const servers = getMCPServers();
  const clients: MCPClient[] = [];

  for (const server of servers) {
    if (!server.enabled) {
      continue;
    }

    let client = mcpClients.get(server.id);
    if (!client) {
      client = new MCPClient({
        enabled: true,
        serverUrl: server.url,
        apiKey: server.apiKey,
        oauthToken: server.oauthToken,
      });
      mcpClients.set(server.id, client);
    }
    clients.push(client);
  }

  return clients;
}

export async function getMCPTools(): Promise<MCPTool[]> {
  // Load built-in tools (async to support backend)
  if (cachedBuiltInTools.length === 0) {
    try {
      const builtInTools = await getBuiltInToolsAsync();
      cachedBuiltInTools = builtInTools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      }));
    } catch (error) {
      console.error('Failed to load built-in tools:', error);
      // Fallback to sync version
      cachedBuiltInTools = getBuiltInTools().map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      }));
    }
  }

  // Add external MCP tools if enabled
  const clients = getMCPClients();
  if (clients.length === 0) {
    return cachedBuiltInTools;
  }

  if (cachedTools.length === 0) {
    const allTools: MCPTool[] = [];
    for (const client of clients) {
      try {
        const tools = await client.listTools();
        allTools.push(...tools);
      } catch (error) {
        console.error('Failed to list tools from MCP server:', error);
      }
    }
    cachedTools = allTools;
  }

  return [...cachedBuiltInTools, ...cachedTools];
}

export function refreshMCPTools() {
  cachedTools = [];
  cachedBuiltInTools = [];
  mcpClients.clear();
}

export async function callMCPTool(
  name: string,
  args: Record<string, unknown>,
  debug: boolean = false,
): Promise<unknown> {
  // Check if it's a built-in tool
  if (isBuiltInTool(name)) {
    return await executeBuiltInTool(name, args, debug);
  }

  // Try calling the tool on all enabled MCP servers
  const clients = getMCPClients();
  if (clients.length === 0) {
    throw new Error('MCP not enabled');
  }

  let lastError: Error | null = null;
  for (const client of clients) {
    try {
      const result = await client.callTool(name, args);

      // 如果开启debug，打印调用信息
      if (debug) {
        console.log('[MCP Tool Debug]', {
          tool: name,
          args,
          result,
          client: client.constructor.name,
        });
      }

      return result;
    } catch (error) {
      lastError = error as Error;
      // Continue to next server
    }
  }

  throw lastError || new Error('All MCP servers failed');
}

/**
 * Format tools for AI prompt
 */
export function formatToolsForPrompt(tools: MCPTool[]): string {
  if (tools.length === 0) {
    return '';
  }

  const toolDescriptions = tools
    .map(
      tool =>
        `- ${tool.name}: ${tool.description}\n  Input: ${JSON.stringify(
          tool.inputSchema,
        )}`,
    )
    .join('\n');

  return `\n\nAvailable tools:\n${toolDescriptions}\n\nTo use a tool, respond with JSON in this format:\n{"toolUse": {"name": "tool_name", "arguments": {...}}}`;
}

/**
 * Detect if AI response contains a tool call
 * Returns the tool name and arguments if found
 */
export function detectToolCall(response: string): {
  hasToolCall: boolean;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
} {
  try {
    // Look for JSON pattern with toolUse
    const jsonMatch = response.match(/\{[\s\S]*"toolUse"[\s\S]*\}/);
    if (!jsonMatch) {
      return { hasToolCall: false };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.toolUse && parsed.toolUse.name) {
      return {
        hasToolCall: true,
        toolName: parsed.toolUse.name,
        toolArgs: parsed.toolUse.arguments || {},
      };
    }
  } catch (e) {
    // Not a valid tool call
  }

  return { hasToolCall: false };
}

/**
 * Add tool descriptions to user message
 */
export async function addToolsToMessage(message: string): Promise<string> {
  const tools = await getMCPTools();
  if (tools.length === 0) {
    return message;
  }

  const toolPrompt = formatToolsForPrompt(tools);
  return message + toolPrompt;
}

/**
 * Execute tool and format result
 */
export async function executeToolCall(
  toolName: string,
  toolArgs: Record<string, unknown>,
  debug: boolean = false,
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const result = await callMCPTool(toolName, toolArgs, debug);
    return {
      success: true,
      data: `Tool "${toolName}" result:\n${JSON.stringify(result, null, 2)}`,
    };
  } catch (error) {
    return {
      success: false,
      error: `Tool "${toolName}" error: ${String(error)}`,
    };
  }
}
