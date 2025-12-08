export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface MCPConfig {
  enabled: boolean;
  serverUrl: string;
  apiKey?: string;
  oauthToken?: string;
}

export class MCPClient {
  private config: MCPConfig;

  constructor(config: MCPConfig) {
    this.config = config;
    this.validateConfig();
  }

  private validateConfig(): void {
    if (!this.config.serverUrl) {
      return;
    }
    try {
      const url = new URL(this.config.serverUrl);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('Invalid protocol');
      }
    } catch (error) {
      console.error('Invalid MCP server URL:', this.config.serverUrl);
      this.config.enabled = false;
    }
  }

  async listTools(): Promise<MCPTool[]> {
    if (!this.config.enabled || !this.config.serverUrl) {
      return [];
    }

    try {
      const response = await fetch(`${this.config.serverUrl}/tools`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.tools || [];
    } catch (error) {
      console.error('Failed to list MCP tools:', error);
      return [];
    }
  }

  async callTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    if (!this.config.enabled || !this.config.serverUrl) {
      throw new Error('MCP not configured');
    }

    try {
      const response = await fetch(`${this.config.serverUrl}/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getHeaders(),
        },
        body: JSON.stringify({ name, arguments: args }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to call MCP tool:', error);
      throw error;
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    // OAuth token takes precedence
    if (this.config.oauthToken) {
      headers.Authorization = `Bearer ${this.config.oauthToken}`;
    } else if (this.config.apiKey) {
      headers.Authorization = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }
}
