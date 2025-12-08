/**
 * Perplexity Tools - 客户端直接调用
 *
 * 注意：这是客户端直接调用 Perplexity API 的实现
 *
 * 推荐使用方式：
 * - 生产环境：使用 MCP 方式（通过后端）
 *   在 MCPSettings 中添加 Perplexity MCP server
 *
 * - 开发/测试：可以使用此客户端实现
 *   在 PerplexitySettings 中配置 API Key
 *
 * 此文件作为回退方案保留，当后端不可用时自动使用
 */

import { BuiltInTool } from './BuiltInTools';
import {
  getPerplexityEnabled,
  getPerplexityApiKey,
  getPerplexityBaseUrl,
  getPerplexityEnabledTools,
  getPerplexityToolDescriptions,
} from '../storage/StorageUtils';
import { PerplexitySearchClient } from '../search/PerplexitySearch';
import { createSuccessDebug, createErrorDebug } from './ToolDebugUtils';

// Default descriptions
const DEFAULT_DESCRIPTIONS = {
  search:
    'Search the web using Perplexity AI. Returns ranked search results with titles, URLs, snippets, and dates. Best for finding current information, news, or specific web content. Fast response (~5s).',
  ask: 'Ask Perplexity AI a question with real-time web search. Returns a conversational answer with citations. Best for quick questions and everyday searches. Response time ~10s.',
  research:
    'Perform deep, comprehensive research using Perplexity AI. Provides thorough analysis with citations. Best for complex topics requiring detailed investigation. WARNING: May take up to 5 minutes. Use only when deep research is needed.',
  reason:
    'Use Perplexity AI for advanced reasoning and problem-solving. Best for logical problems, complex analysis, decision-making, and tasks requiring step-by-step reasoning. Response time ~30s.',
};

/**
 * Create Perplexity Search Tool with custom description
 */
function createSearchTool(customDescription?: string): BuiltInTool {
  return {
    name: 'perplexity_search',
    description: customDescription || DEFAULT_DESCRIPTIONS.search,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query',
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results (1-20)',
        },
        recency_filter: {
          type: 'string',
          enum: ['day', 'week', 'month', 'year'],
          description: 'Filter by recency',
        },
      },
      required: ['query'],
    },
    execute: async (args: Record<string, unknown>) => {
      const startTime = Date.now();
      const apiKey = getPerplexityApiKey();
      const baseUrl = getPerplexityBaseUrl();
      if (!apiKey) {
        return {
          error: 'Perplexity API key not configured',
          _debug: createErrorDebug(
            'perplexity_search',
            'API key not configured',
            { query: String(args.query) },
            startTime
          ),
        };
      }

      try {
        const client = new PerplexitySearchClient(apiKey, baseUrl);
        const results = await client.search(
          {
            query: String(args.query),
            maxResults: args.max_results ? Number(args.max_results) : 10,
            recencyFilter: args.recency_filter as
              | 'day'
              | 'week'
              | 'month'
              | 'year'
              | undefined,
          },
          30000
        );

        return {
          results,
          formatted: client.formatResults(results),
          _debug: createSuccessDebug(
            'perplexity_search',
            {
              query: String(args.query),
              resultCount: results.length,
              apiUrl: `${baseUrl}/search`,
              timeout: 30000,
            },
            startTime
          ),
        };
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('[perplexity_search] Error:', errMsg);
        return {
          error: `Search failed: ${errMsg}`,
          _debug: createErrorDebug(
            'perplexity_search',
            error instanceof Error ? error : errMsg,
            {
              query: String(args.query),
              timeout: 30000,
            },
            startTime
          ),
        };
      }
    },
  };
}

/**
 * Create Perplexity Ask Tool with custom description
 */
function createAskTool(customDescription?: string): BuiltInTool {
  return {
    name: 'perplexity_ask',
    description: customDescription || DEFAULT_DESCRIPTIONS.ask,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The question to ask',
        },
      },
      required: ['query'],
    },
    execute: async (args: Record<string, unknown>) => {
      const startTime = Date.now();
      const apiKey = getPerplexityApiKey();
      const baseUrl = getPerplexityBaseUrl();
      if (!apiKey) {
        return {
          error: 'Perplexity API key not configured',
          _debug: createErrorDebug(
            'perplexity_ask',
            'API key not configured',
            { query: String(args.query) },
            startTime
          ),
        };
      }

      try {
        const client = new PerplexitySearchClient(apiKey, baseUrl);
        const answer = await client.ask({ query: String(args.query) }, 60000);

        return {
          answer,
          _debug: createSuccessDebug(
            'perplexity_ask',
            {
              query: String(args.query),
              apiUrl: `${baseUrl}/chat/completions`,
              model: 'sonar-pro',
              timeout: 60000,
            },
            startTime
          ),
        };
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('[perplexity_ask] Error:', errMsg);
        return {
          error: `Ask failed: ${errMsg}`,
          _debug: createErrorDebug(
            'perplexity_ask',
            error instanceof Error ? error : errMsg,
            {
              query: String(args.query),
              model: 'sonar-pro',
              timeout: 60000,
            },
            startTime
          ),
        };
      }
    },
  };
}

/**
 * Create Perplexity Research Tool with custom description
 */
function createResearchTool(customDescription?: string): BuiltInTool {
  return {
    name: 'perplexity_research',
    description: customDescription || DEFAULT_DESCRIPTIONS.research,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The research topic',
        },
      },
      required: ['query'],
    },
    execute: async (args: Record<string, unknown>) => {
      const startTime = Date.now();
      const apiKey = getPerplexityApiKey();
      const baseUrl = getPerplexityBaseUrl();
      if (!apiKey) {
        return {
          error: 'Perplexity API key not configured',
          _debug: createErrorDebug(
            'perplexity_research',
            'API key not configured',
            { query: String(args.query) },
            startTime
          ),
        };
      }

      try {
        const client = new PerplexitySearchClient(apiKey, baseUrl);
        const report = await client.research(
          { query: String(args.query) },
          300000
        );

        return {
          report,
          _debug: createSuccessDebug(
            'perplexity_research',
            {
              query: String(args.query),
              apiUrl: `${baseUrl}/chat/completions`,
              model: 'sonar-deep-research',
              timeout: 300000,
            },
            startTime
          ),
        };
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('[perplexity_research] Error:', errMsg);
        return {
          error: `Research failed: ${errMsg}`,
          _debug: createErrorDebug(
            'perplexity_research',
            error instanceof Error ? error : errMsg,
            {
              query: String(args.query),
              model: 'sonar-deep-research',
              timeout: 300000,
            },
            startTime
          ),
        };
      }
    },
  };
}

/**
 * Create Perplexity Reason Tool with custom description
 */
function createReasonTool(customDescription?: string): BuiltInTool {
  return {
    name: 'perplexity_reason',
    description: customDescription || DEFAULT_DESCRIPTIONS.reason,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The problem or question requiring reasoning',
        },
      },
      required: ['query'],
    },
    execute: async (args: Record<string, unknown>) => {
      const startTime = Date.now();
      const apiKey = getPerplexityApiKey();
      const baseUrl = getPerplexityBaseUrl();
      if (!apiKey) {
        return {
          error: 'Perplexity API key not configured',
          _debug: createErrorDebug(
            'perplexity_reason',
            'API key not configured',
            { query: String(args.query) },
            startTime
          ),
        };
      }

      try {
        const client = new PerplexitySearchClient(apiKey, baseUrl);
        const reasoning = await client.reason(
          { query: String(args.query) },
          90000
        );

        return {
          reasoning,
          _debug: createSuccessDebug(
            'perplexity_reason',
            {
              query: String(args.query),
              apiUrl: `${baseUrl}/chat/completions`,
              model: 'sonar-reasoning-pro',
              timeout: 90000,
            },
            startTime
          ),
        };
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('[perplexity_reason] Error:', errMsg);
        return {
          error: `Reasoning failed: ${errMsg}`,
          _debug: createErrorDebug(
            'perplexity_reason',
            error instanceof Error ? error : errMsg,
            {
              query: String(args.query),
              model: 'sonar-reasoning-pro',
              timeout: 90000,
            },
            startTime
          ),
        };
      }
    },
  };
}

/**
 * Get enabled Perplexity tools based on user configuration
 */
export function getPerplexityTools(): BuiltInTool[] {
  if (!getPerplexityEnabled()) {
    return [];
  }

  const enabledToolIds = getPerplexityEnabledTools();
  const customDescriptions = getPerplexityToolDescriptions();

  const toolFactories: Record<string, (desc?: string) => BuiltInTool> = {
    search: createSearchTool,
    ask: createAskTool,
    research: createResearchTool,
    reason: createReasonTool,
  };

  return enabledToolIds
    .map(id => {
      const factory = toolFactories[id];
      if (!factory) {
        return undefined;
      }
      return factory(customDescriptions[id as keyof typeof customDescriptions]);
    })
    .filter((tool): tool is BuiltInTool => tool !== undefined);
}

/**
 * Get default descriptions for UI
 */
export function getDefaultToolDescriptions() {
  return DEFAULT_DESCRIPTIONS;
}
