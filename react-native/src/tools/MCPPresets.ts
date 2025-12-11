/**
 * MCP Server Presets - 预设的 MCP 服务器配置
 */

export interface MCPPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  config: {
    name: string;
    command: string;
    args: string[];
    env?: Record<string, string>;
    oauth?: {
      provider: string;
      scopes: string[];
    };
    // 高级配置
    timeout?: number;
    toolTimeout?: number;
    autoRestart?: boolean;
    maxRestarts?: number;
    restartDelay?: number;
    workingDirectory?: string;
    logLevel?: 'ERROR' | 'INFO' | 'DEBUG';
    enableDebug?: boolean;
  };
  requiresOAuth: boolean;
  requiresEnv?: string[];
  transportType?: 'stdio' | 'http'; // 新增：传输类型
  tips?: string; // 配置提示
}

export const MCP_PRESETS: MCPPreset[] = [
  {
    id: 'notion',
    name: 'Notion',
    description: 'Access your Notion workspace (Remote MCP)',
    icon: '📝',
    config: {
      name: 'Notion MCP',
      command: 'sse',
      args: ['https://mcp.notion.com/mcp'],
      timeout: 30,
      toolTimeout: 20,
    },
    requiresOAuth: true,
    transportType: 'http',
    tips: 'Requires OAuth authorization with your Notion account. Click authorize when prompted.',
  },
  {
    id: 'awslabs-core',
    name: 'AWS Labs Core',
    description: 'AWS expert guidance and prompt understanding',
    icon: '☁️',
    config: {
      name: 'AWS Labs Core MCP',
      command: 'uvx',
      args: ['awslabs.core-mcp-server@latest'],
      env: {
        FASTMCP_LOG_LEVEL: 'ERROR',
      },
      timeout: 60,
      toolTimeout: 30,
      autoRestart: true,
      maxRestarts: 3,
      logLevel: 'ERROR',
    },
    requiresOAuth: false,
    transportType: 'stdio',
    tips: 'First run may take 30-60s to download packages',
  },
  {
    id: 'filesystem',
    name: 'Filesystem',
    description: 'Read and write files on your local filesystem',
    icon: '📁',
    config: {
      name: 'Filesystem',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
      timeout: 30,
      toolTimeout: 10,
      workingDirectory: '/tmp',
    },
    requiresOAuth: false,
    transportType: 'stdio',
    tips: 'Change /tmp to your desired directory path',
  },
  {
    id: 'brave-search',
    name: 'Brave Search',
    description: 'Search the web using Brave Search API',
    icon: '🔍',
    config: {
      name: 'Brave Search',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-brave-search'],
      env: {
        BRAVE_API_KEY: '',
      },
      timeout: 30,
      toolTimeout: 15,
    },
    requiresOAuth: false,
    transportType: 'stdio',
    requiresEnv: ['BRAVE_API_KEY'],
    tips: 'Get your API key from https://brave.com/search/api/',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Access GitHub repositories and issues',
    icon: '🐙',
    config: {
      name: 'GitHub',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: {
        GITHUB_PERSONAL_ACCESS_TOKEN: '',
      },
      timeout: 30,
      toolTimeout: 20,
    },
    requiresOAuth: false,
    transportType: 'stdio',
    requiresEnv: ['GITHUB_PERSONAL_ACCESS_TOKEN'],
    tips: 'Create a token at https://github.com/settings/tokens',
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Access your Google Drive files (OAuth)',
    icon: '📂',
    config: {
      name: 'Google Drive',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-gdrive'],
      oauth: {
        provider: 'google',
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      },
      timeout: 30,
      toolTimeout: 20,
    },
    requiresOAuth: true,
    tips: 'Requires OAuth configuration on the server',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send messages and read channels in Slack',
    icon: '💬',
    config: {
      name: 'Slack',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-slack'],
      env: {
        SLACK_BOT_TOKEN: '',
      },
      timeout: 30,
      toolTimeout: 15,
    },
    requiresOAuth: false,
    transportType: 'stdio',
    requiresEnv: ['SLACK_BOT_TOKEN'],
    tips: 'Get bot token from https://api.slack.com/apps',
  },
  {
    id: 'postgres',
    name: 'PostgreSQL',
    description: 'Query PostgreSQL databases',
    icon: '🐘',
    config: {
      name: 'PostgreSQL',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-postgres'],
      env: {
        POSTGRES_CONNECTION_STRING: '',
      },
      timeout: 30,
      toolTimeout: 30,
    },
    requiresOAuth: false,
    transportType: 'stdio',
    requiresEnv: ['POSTGRES_CONNECTION_STRING'],
    tips: 'Format: postgresql://user:pass@host:5432/dbname',
  },
  {
    id: 'puppeteer',
    name: 'Puppeteer',
    description: 'Browser automation and web scraping',
    icon: '🎭',
    config: {
      name: 'Puppeteer',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-puppeteer'],
      timeout: 45,
      toolTimeout: 60,
    },
    requiresOAuth: false,
    transportType: 'stdio',
    tips: 'First run downloads Chromium (~170MB)',
  },
  {
    id: 'sqlite',
    name: 'SQLite',
    description: 'Query SQLite databases',
    icon: '💾',
    config: {
      name: 'SQLite',
      command: 'npx',
      args: [
        '-y',
        '@modelcontextprotocol/server-sqlite',
        '/path/to/database.db',
      ],
      timeout: 30,
      toolTimeout: 20,
      workingDirectory: '/tmp',
    },
    requiresOAuth: false,
    transportType: 'stdio',
    tips: 'Replace /path/to/database.db with your database path',
  },
  {
    id: 'notion',
    name: 'Notion',
    description: 'Access and search your Notion workspace (MCP OAuth)',
    icon: '📝',
    config: {
      name: 'Notion',
      command: 'sse',
      args: ['https://mcp.notion.com/mcp'],
      timeout: 30,
      toolTimeout: 20,
    },
    requiresOAuth: false, // MCP OAuth 是自动的
    tips: 'Official Notion MCP server with automatic OAuth. You will be redirected to authorize access to your Notion workspace.',
  },
];

// 默认高级配置
export const DEFAULT_ADVANCED_CONFIG = {
  timeout: 60,
  toolTimeout: 30,
  autoRestart: true,
  maxRestarts: 3,
  restartDelay: 5,
  workingDirectory: '',
  logLevel: 'ERROR' as const,
  enableDebug: false,
};
