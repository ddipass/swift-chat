/**
 * Tools Client - 后端工具 API 客户端
 */

export interface WebFetchConfig {
  // Processing
  mode: 'regex' | 'ai_summary';
  summaryModel?: string;
  summaryPrompt?: string;
  regexRemoveElements?: string;

  // Performance
  timeout: number;
  cacheTTL: number;
  maxRetries: number;
  debug: boolean;

  // AWS Credentials
  awsRegion?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsSessionToken?: string;
}

export class ToolsClient {
  constructor(private apiUrl: string, private apiKey: string) {}

  async executeTool(
    name: string,
    args: Record<string, unknown>,
    config: WebFetchConfig
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
        config,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Tool execution failed');
    }

    return data.result;
  }
}
