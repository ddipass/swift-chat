import { ChatMode, SystemPrompt } from './Chat.ts';

export type RouteParamList = {
  Bedrock: {
    sessionId?: number;
    tapIndex?: number;
    mode?: ChatMode;
  };
  Settings: NonNullable<unknown>;
  TokenUsage: NonNullable<unknown>;
  ToolsSettings: NonNullable<unknown>;
  MCPServers: NonNullable<unknown>;
  MCPServerConfig: {
    preset: any;
    onSave: (config: any) => void;
  };
  MCPServerTools: {
    serverId: string;
    serverName: string;
    tools: any[];
  };
  Prompt: {
    prompt?: SystemPrompt;
    promptType?: string | undefined;
  };
};
