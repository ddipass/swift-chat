/**
 * Unified debug information for all tools
 */

export interface ToolDebugInfo {
  tool: string;
  timestamp: string;
  duration_ms?: number;
  success: boolean;
  details: Record<string, unknown>;
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
}

/**
 * Create standardized debug information for tool execution
 */
export function createToolDebug(
  toolName: string,
  details: Record<string, unknown>,
  error?: Error | string,
  startTime?: number
): ToolDebugInfo {
  const debugInfo: ToolDebugInfo = {
    tool: toolName,
    timestamp: new Date().toISOString(),
    success: !error,
    details,
  };

  // Add duration if start time provided
  if (startTime) {
    debugInfo.duration_ms = Date.now() - startTime;
  }

  // Add error information if present
  if (error) {
    if (error instanceof Error) {
      debugInfo.error = {
        message: error.message,
        code: error.name,
        stack: error.stack,
      };
    } else {
      debugInfo.error = {
        message: String(error),
      };
    }
  }

  return debugInfo;
}

/**
 * Create debug info for successful execution
 */
export function createSuccessDebug(
  toolName: string,
  details: Record<string, unknown>,
  startTime?: number
): ToolDebugInfo {
  return createToolDebug(toolName, details, undefined, startTime);
}

/**
 * Create debug info for failed execution
 */
export function createErrorDebug(
  toolName: string,
  error: Error | string,
  details: Record<string, unknown> = {},
  startTime?: number
): ToolDebugInfo {
  return createToolDebug(toolName, details, error, startTime);
}
