/**
 * Built-in tools that work on all platforms
 */

import {
  getFetchTimeout,
  getFetchMaxContentLength,
  getContentProcessingMode,
  getAISummaryPrompt,
  getSummaryModel,
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
    const model = getSummaryModel();

    // Import bedrock-api dynamically to avoid circular dependency
    const { invokeBedrockWithCallBack } = await import('../api/bedrock-api');

    // Limit HTML size to avoid token overflow
    const maxHtmlLength = 50000;
    const truncatedHtml = html.substring(0, maxHtmlLength);

    let summary = '';

    // Create a temporary session for summarization
    await invokeBedrockWithCallBack(
      [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `${prompt}\n\nURL: ${url}\n\nHTML:\n${truncatedHtml}`,
            },
          ],
        },
      ],
      model,
      (result, _complete) => {
        summary += result;
      },
      undefined,
      undefined,
      undefined,
      undefined
    );

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

        // Get processing mode
        const mode = getContentProcessingMode();
        let cleanText: string;
        let processedBy: string;

        if (mode === 'ai_summary') {
          // AI summarization
          cleanText = await summarizeHTMLWithAI(text, url);
          processedBy = 'ai_summary';
        } else {
          // Regex cleaning
          cleanText = cleanHTMLWithRegex(text);
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
