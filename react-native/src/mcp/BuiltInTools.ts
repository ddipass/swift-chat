/**
 * Built-in tools that work on all platforms
 */

import {
  getFetchTimeout,
  getFetchMaxContentLength,
} from '../storage/StorageUtils';

export interface BuiltInTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

/**
 * web_fetch - Fetch content from a URL
 */
const webFetchTool: BuiltInTool = {
  name: 'web_fetch',
  description:
    'Fetch and extract content from a web URL. Returns the main text content of the page.',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to fetch content from',
      },
    },
    required: ['url'],
  },
  execute: async (args: Record<string, unknown>) => {
    const url = args.url as string;

    // Validate URL
    if (!url || typeof url !== 'string') {
      return { error: 'Invalid URL: URL is required' };
    }

    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return {
          error: 'Invalid URL: Only HTTP/HTTPS protocols are supported',
        };
      }
    } catch (e) {
      return { error: 'Invalid URL format' };
    }

    // Setup timeout
    const controller = new AbortController();
    const timeoutMs = getFetchTimeout();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'SwiftChat/1.0',
        },
      });

      if (!response.ok) {
        clearTimeout(timeoutId);
        return {
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const json = await response.json();
        clearTimeout(timeoutId);
        return { content: JSON.stringify(json, null, 2), type: 'json' };
      }

      if (contentType.includes('text/')) {
        const text = await response.text();
        clearTimeout(timeoutId);

        // Simple content extraction - remove HTML tags
        const cleanText = text
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        const maxLength = getFetchMaxContentLength();
        const truncated = cleanText.length > maxLength;

        return {
          content: cleanText.substring(0, maxLength),
          type: 'text',
          url,
          truncated,
          originalLength: cleanText.length,
        };
      }

      clearTimeout(timeoutId);
      return {
        error: 'Unsupported content type: ' + contentType,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn('web_fetch error:', error);
      return {
        error: String(error),
      };
    }
  },
};

/**
 * Get all built-in tools
 */
export function getBuiltInTools(): BuiltInTool[] {
  return [webFetchTool];
}

/**
 * Execute a built-in tool by name
 */
export async function executeBuiltInTool(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const tool = getBuiltInTools().find(t => t.name === name);
  if (!tool) {
    throw new Error(`Built-in tool not found: ${name}`);
  }
  return await tool.execute(args);
}

/**
 * Check if a tool is built-in
 */
export function isBuiltInTool(name: string): boolean {
  return getBuiltInTools().some(t => t.name === name);
}
