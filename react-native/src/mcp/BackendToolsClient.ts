/**
 * Backend Tools Client - 后端工具 API 客户端
 *
 * 通过 HTTP API 与后端 ToolManager 通信
 * 后端负责管理所有 MCP servers 和内置工具
 *
 * 优势：
 * - 统一管理：所有工具由后端统一管理
 * - 安全性：API Key 不暴露在客户端
 * - MCP 支持：支持 stdio 和 OAuth transport
 * - 可扩展：易于添加新的 MCP servers
 */

export interface BackendTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  source: string;
  server?: string;
}

export class BackendToolsClient {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  async listTools(): Promise<BackendTool[]> {
    try {
      const response = await fetch(`${this.apiUrl}/api/tools`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.tools || [];
    } catch (error) {
      console.error('[BackendToolsClient] List tools error:', error);
      return [];
    }
  }

  async executeTool(
    name: string,
    args: Record<string, unknown>,
    debug: boolean = false,
  ): Promise<unknown> {
    const response = await fetch(`${this.apiUrl}/api/tool/exec`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        arguments: args,
        debug,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Tool execution failed');
    }

    // 如果开启debug，打印debug信息
    if (debug && data._debug) {
      console.log('[Tool Debug]', JSON.stringify(data._debug, null, 2));
    }

    return data.result;
  }

  async syncMCPConfig(servers: unknown[]): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/mcp/config`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          servers,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.success || false;
    } catch (error) {
      console.error('[BackendToolsClient] Sync MCP config error:', error);
      return false;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/tools`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(5000),
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }
}
