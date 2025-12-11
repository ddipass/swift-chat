/**
 * MCP Client - MCP 服务器管理 API 客户端
 */

export interface MCPServer {
  server_id: string;
  name: string;
  status: 'connecting' | 'pending_auth' | 'active' | 'error';
  tool_count: number;
}

export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  oauth?: {
    provider: string;
    scopes: string[];
  };
  callback_base_url?: string;
  // 高级配置
  timeout?: number;
  toolTimeout?: number;
  autoRestart?: boolean;
  maxRestarts?: number;
  restartDelay?: number;
  workingDirectory?: string;
  logLevel?: 'ERROR' | 'INFO' | 'DEBUG';
  enableDebug?: boolean;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

export class MCPClient {
  constructor(private apiUrl: string, private apiKey: string) {}

  async addServer(config: MCPServerConfig): Promise<{
    server_id: string;
    status: string;
    auth_url?: string;
  }> {
    const response = await fetch(`${this.apiUrl}/api/mcp/servers`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  }

  async listServers(): Promise<MCPServer[]> {
    const response = await fetch(`${this.apiUrl}/api/mcp/servers`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.servers;
  }

  async removeServer(serverId: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/api/mcp/servers/${serverId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  }

  async getServerTools(serverId: string): Promise<MCPTool[]> {
    const response = await fetch(
      `${this.apiUrl}/api/mcp/servers/${serverId}/tools`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.tools;
  }

  async getServerStatus(serverId: string): Promise<{
    server_id: string;
    name: string;
    status: string;
  }> {
    const response = await fetch(
      `${this.apiUrl}/api/mcp/servers/${serverId}/status`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  }
}
