import { MCPClient, MCPTool } from './MCPClient';
import {
  getMCPEnabled,
  getMCPServerUrl,
  getMCPApiKey,
} from '../storage/StorageUtils';
import {
  getBuiltInTools,
  executeBuiltInTool,
  isBuiltInTool,
} from './BuiltInTools';

let mcpClient: MCPClient | null = null;
let cachedTools: MCPTool[] = [];

export function getMCPClient(): MCPClient | null {
  const enabled = getMCPEnabled();
  if (!enabled) {
    return null;
  }

  if (!mcpClient) {
    mcpClient = new MCPClient({
      enabled,
      serverUrl: getMCPServerUrl(),
      apiKey: getMCPApiKey(),
    });
  }

  return mcpClient;
}

export async function getMCPTools(): Promise<MCPTool[]> {
  // Always include built-in tools
  const builtInTools = getBuiltInTools().map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));

  // Add external MCP tools if enabled
  const client = getMCPClient();
  if (!client) {
    return builtInTools;
  }

  if (cachedTools.length === 0) {
    cachedTools = await client.listTools();
  }

  return [...builtInTools, ...cachedTools];
}

export function refreshMCPTools() {
  cachedTools = [];
  mcpClient = null;
}

export async function callMCPTool(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  // Check if it's a built-in tool
  if (isBuiltInTool(name)) {
    return await executeBuiltInTool(name, args);
  }

  // Otherwise, call external MCP server
  const client = getMCPClient();
  if (!client) {
    throw new Error('MCP not enabled');
  }

  return await client.callTool(name, args);
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
          tool.inputSchema
        )}`
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
  toolArgs: Record<string, unknown>
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const result = await callMCPTool(toolName, toolArgs);
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
