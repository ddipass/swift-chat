/**
 * Built-in tools that work on all platforms
 */

import {
  getFetchTimeout,
  getFetchMaxContentLength,
  getContentProcessingMode,
  getAISummaryPrompt,
  getRemoveElements,
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
 * Clean HTML using regex
 */
function cleanHTMLWithRegex(html: string): string {
  const removeElements = getRemoveElements()
    .split(',')
    .map(s => s.trim());
  let cleaned = html;

  // Remove specified elements
  removeElements.forEach(tag => {
    const regex = new RegExp(
      `<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`,
      'gi'
    );
    cleaned = cleaned.replace(regex, '');
  });

  // Remove all remaining HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');

  // Clean up whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Summarize HTML using AI
 */
async function summarizeHTMLWithAI(html: string, url: string): Promise<string> {
  try {
    const prompt = getAISummaryPrompt();

    // Import bedrock-api dynamically to avoid circular dependency
    const { invokeBedrockWithCallBack } = await import('../api/bedrock-api');
    const { ChatMode } = await import('../types/Chat');

    // Limit HTML size to avoid token overflow
    const maxHtmlLength = 50000;
    const truncatedHtml = html.substring(0, maxHtmlLength);

    let summary = '';

    // Wait for streaming to complete before returning
    // Unlike ChatScreen which updates UI progressively, tool calls must return complete results
    await new Promise<void>(resolve => {
      invokeBedrockWithCallBack(
        [
          {
            role: 'user',
            content: [
              {
                text: `${prompt}\n\nURL: ${url}\n\nHTML:\n${truncatedHtml}`,
              },
            ],
          },
        ],
        ChatMode.Text,
        { id: 0, name: 'Web Fetch', prompt: '', includeHistory: false },
        () => false,
        new AbortController(),
        (result: string, complete: boolean) => {
          summary = result;
          if (complete) {
            resolve();
          }
        }
      );
    });

    return summary;
  } catch (error) {
    console.warn('AI summarization failed:', error);
    // Fallback to regex cleaning
    return cleanHTMLWithRegex(html);
  }
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

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const RNFetchBlob = require('react-native-blob-util').default;
    const timeoutMs = getFetchTimeout();

    try {
      const response = await RNFetchBlob.config({
        timeout: timeoutMs,
      }).fetch('GET', url, {
        'User-Agent': 'SwiftChat/1.0',
      });

      const status = response.info().status;
      if (status < 200 || status >= 400) {
        return { error: `HTTP ${status}` };
      }

      const headers = response.info().headers;
      const contentType = (
        headers['content-type'] ||
        headers['Content-Type'] ||
        ''
      ).toLowerCase();
      const responseText = response.data;

      if (contentType.includes('application/json')) {
        const json = JSON.parse(responseText);
        return { content: JSON.stringify(json, null, 2), type: 'json' };
      }

      if (contentType.includes('text/')) {
        const mode = getContentProcessingMode();
        let cleanText: string;
        let processedBy: string;

        if (mode === 'ai_summary') {
          cleanText = await summarizeHTMLWithAI(responseText, url);
          processedBy = 'ai_summary';
        } else {
          cleanText = cleanHTMLWithRegex(responseText);
          processedBy = 'regex';
        }

        const maxLength = getFetchMaxContentLength();
        const truncated = cleanText.length > maxLength;

        return {
          content: cleanText.substring(0, maxLength),
          type: 'text',
          url,
          truncated,
          originalLength: cleanText.length,
          processedBy,
        };
      }

      return { error: 'Unsupported content type: ' + contentType };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('[web_fetch] Error:', errMsg);
      return { error: `Failed to fetch: ${errMsg}` };
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
