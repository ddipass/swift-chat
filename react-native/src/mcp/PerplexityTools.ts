import { BuiltInTool } from './BuiltInTools';
import {
  getPerplexityEnabled,
  getPerplexityApiKey,
  getPerplexityEnabledTools,
  getPerplexityToolDescriptions,
} from '../storage/StorageUtils';
import { PerplexitySearchClient } from '../search/PerplexitySearch';

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
      const apiKey = getPerplexityApiKey();
      if (!apiKey) {
        return { error: 'Perplexity API key not configured' };
      }

      try {
        const client = new PerplexitySearchClient(apiKey);
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
        };
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('[perplexity_search] Error:', errMsg);
        return { error: `Search failed: ${errMsg}` };
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
      const apiKey = getPerplexityApiKey();
      if (!apiKey) {
        return { error: 'Perplexity API key not configured' };
      }

      try {
        const client = new PerplexitySearchClient(apiKey);
        const answer = await client.ask({ query: String(args.query) }, 60000);

        return { answer };
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('[perplexity_ask] Error:', errMsg);
        return { error: `Ask failed: ${errMsg}` };
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
      const apiKey = getPerplexityApiKey();
      if (!apiKey) {
        return { error: 'Perplexity API key not configured' };
      }

      try {
        const client = new PerplexitySearchClient(apiKey);
        const report = await client.research(
          { query: String(args.query) },
          300000
        );

        return { report };
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('[perplexity_research] Error:', errMsg);
        return { error: `Research failed: ${errMsg}` };
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
      const apiKey = getPerplexityApiKey();
      if (!apiKey) {
        return { error: 'Perplexity API key not configured' };
      }

      try {
        const client = new PerplexitySearchClient(apiKey);
        const reasoning = await client.reason(
          { query: String(args.query) },
          90000
        );

        return { reasoning };
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('[perplexity_reason] Error:', errMsg);
        return { error: `Reasoning failed: ${errMsg}` };
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
      if (!factory) return undefined;
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
