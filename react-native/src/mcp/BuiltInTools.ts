/**
 * Built-in Tools - 统一工具接口
 *
 * 工作模式：
 * 1. 优先使用后端工具（通过 BackendToolsClient）
 *    - 需要配置 apiUrl 和 apiKey
 *    - 工具由后端 MCP Manager 管理
 *    - 支持 MCP stdio/OAuth servers
 *
 * 2. 回退到客户端工具（直接调用）
 *    - 当后端未配置或不可用时
 *    - 工具直接在客户端执行
 *    - 包括 Perplexity 直接 API 调用
 *
 * 使用场景：
 * - 生产环境：推荐使用后端模式（更安全、统一管理）
 * - 开发测试：可以使用客户端模式（快速测试）
 * - 离线场景：自动回退到客户端模式
 */

import {
  getFetchTimeout,
  getFetchMaxContentLength,
  getContentProcessingMode,
  getAISummaryPrompt,
  getRemoveElements,
  getSummaryModel,
  getTextModel,
  saveTextModel,
} from '../storage/StorageUtils';
import { getPerplexityTools } from './PerplexityTools';
import { createSuccessDebug, createErrorDebug } from './ToolDebugUtils';

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
async function summarizeHTMLWithAI(
  html: string,
  url: string
): Promise<{
  content: string;
  processedBy: string;
  processingInfo: {
    attemptedMode: string;
    summaryModel?: string;
    fallbackReason?: string;
    htmlLength: number;
  };
}> {
  const htmlLength = html.length;

  try {
    const prompt = getAISummaryPrompt();
    const summaryModel = getSummaryModel();
    const originalModel = getTextModel();

    // Check if summary model is configured
    if (!summaryModel || !summaryModel.modelId) {
      return {
        content: cleanHTMLWithRegex(html),
        processedBy: 'regex',
        processingInfo: {
          attemptedMode: 'ai_summary',
          fallbackReason: 'Summary model not configured',
          htmlLength,
        },
      };
    }

    // Import bedrock-api dynamically to avoid circular dependency
    const { invokeBedrockWithCallBack } = await import('../api/bedrock-api');
    const { ChatMode } = await import('../types/Chat');

    // Check if we need to switch models
    const needModelSwitch = summaryModel.modelId !== originalModel.modelId;

    if (needModelSwitch) {
      console.log(
        '[web_fetch] Switching to summary model:',
        summaryModel.modelName
      );
      saveTextModel(summaryModel);
    } else {
      console.log('[web_fetch] Using current model (same as summary model)');
    }

    // Limit HTML size to avoid token overflow
    const maxHtmlLength = 50000;
    const truncatedHtml = html.substring(0, maxHtmlLength);
    console.log(
      '[web_fetch] HTML length:',
      html.length,
      'truncated to:',
      truncatedHtml.length
    );

    let summary = '';
    let isComplete = false;
    let hasError = false;

    try {
      // Wait for streaming to complete before returning
      await new Promise<void>((resolve, reject) => {
        // Set a timeout
        const timeoutId = setTimeout(() => {
          if (!isComplete) {
            console.warn(
              '[web_fetch] AI summarization timeout - callback never completed'
            );
            reject(new Error('AI summarization timeout after 90 seconds'));
          }
        }, 90000); // 90 seconds timeout

        console.log('[web_fetch] Calling invokeBedrockWithCallBack...');

        invokeBedrockWithCallBack(
          [
            {
              role: 'user',
              content: [
                {
                  text: `URL: ${url}\n\nHTML:\n${truncatedHtml}`,
                },
              ],
            },
          ],
          ChatMode.Text,
          { id: 0, name: 'Web Fetch', prompt: prompt, includeHistory: false },
          () => false,
          new AbortController(),
          (result: string, complete: boolean, needStop: boolean) => {
            console.log(
              '[web_fetch] Callback invoked - complete:',
              complete,
              'length:',
              result.length
            );

            if (needStop || hasError) {
              clearTimeout(timeoutId);
              hasError = true;
              reject(new Error('AI summarization was stopped'));
              return;
            }

            // Update summary with each chunk
            summary = result;

            if (complete) {
              clearTimeout(timeoutId);
              isComplete = true;
              console.log(
                '[web_fetch] AI summarization completed, final length:',
                summary.length
              );
              resolve();
            }
          }
        );

        // invokeBedrockWithCallBack doesn't return a promise, so we need to wait
        // If the callback is never called, the timeout will trigger
      });
    } finally {
      // Restore original model only if we switched
      if (needModelSwitch) {
        console.log(
          '[web_fetch] Restoring original model:',
          originalModel.modelName
        );
        saveTextModel(originalModel);
      }
    }

    // Check if summary is empty
    if (!summary || summary.trim().length === 0) {
      console.warn(
        '[web_fetch] AI returned empty summary, falling back to regex'
      );
      throw new Error('AI returned empty summary');
    }

    return {
      content: summary,
      processedBy: 'ai_summary',
      processingInfo: {
        attemptedMode: 'ai_summary',
        summaryModel: summaryModel.modelName,
        htmlLength,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: cleanHTMLWithRegex(html),
      processedBy: 'regex',
      processingInfo: {
        attemptedMode: 'ai_summary',
        summaryModel: getSummaryModel()?.modelName,
        fallbackReason: errorMessage,
        htmlLength,
      },
    };
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
    const startTime = Date.now();
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
        let processingInfo: {
          attemptedMode: string;
          summaryModel?: string;
          fallbackReason?: string;
          htmlLength: number;
        };

        if (mode === 'ai_summary') {
          const result = await summarizeHTMLWithAI(responseText, url);
          cleanText = result.content;
          processedBy = result.processedBy;
          processingInfo = result.processingInfo;
        } else {
          cleanText = cleanHTMLWithRegex(responseText);
          processedBy = 'regex';
          processingInfo = {
            attemptedMode: 'regex',
            htmlLength: responseText.length,
          };
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
          processingInfo,
          _debug: createSuccessDebug(
            'web_fetch',
            {
              url,
              mode: getContentProcessingMode(),
              summaryModel: getSummaryModel()?.modelName || 'not configured',
              processedBy,
              fallbackReason: processingInfo.fallbackReason || 'none',
              htmlLength: processingInfo.htmlLength,
              truncated,
            },
            startTime
          ),
        };
      }

      return { error: 'Unsupported content type: ' + contentType };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('[web_fetch] Error:', errMsg);
      return {
        error: `Failed to fetch: ${errMsg}`,
        _debug: createErrorDebug(
          'web_fetch',
          error instanceof Error ? error : errMsg,
          {
            url: String(args.url),
            mode: getContentProcessingMode(),
            summaryModel: getSummaryModel()?.modelName || 'not configured',
          },
          startTime
        ),
      };
    }
  },
};

/**
 * Get all built-in tools
 */
export function getBuiltInTools(): BuiltInTool[] {
  // 检查是否使用后端工具
  const apiUrl = getApiUrl();
  const apiKey = getApiKey();

  if (apiUrl && apiKey) {
    // 使用后端工具（异步加载）
    return [];
  }

  // 使用客户端工具（兼容模式）
  const tools = [webFetchTool];

  // Add Perplexity tools if enabled
  const perplexityTools = getPerplexityTools();
  tools.push(...perplexityTools);

  return tools;
}

/**
 * Get all built-in tools (async version for backend)
 */
export async function getBuiltInToolsAsync(): Promise<BuiltInTool[]> {
  const { getApiUrl, getApiKey } = await import('../storage/StorageUtils');
  const apiUrl = getApiUrl();
  const apiKey = getApiKey();

  if (!apiUrl || !apiKey) {
    // 使用客户端工具
    return getBuiltInTools();
  }

  // 使用后端工具
  const { BackendToolsClient } = await import('./BackendToolsClient');
  const client = new BackendToolsClient(apiUrl, apiKey);

  try {
    const backendTools = await client.listTools();

    return backendTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      execute: async (args: Record<string, unknown>) => {
        return await client.executeTool(tool.name, args);
      },
    }));
  } catch (error) {
    console.error('[BuiltInTools] Failed to load backend tools:', error);
    // Fallback to client tools
    return getBuiltInTools();
  }
}

/**
 * Execute a built-in tool by name
 */
export async function executeBuiltInTool(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  // Try to get tools from backend first
  const tools = await getBuiltInToolsAsync();
  const tool = tools.find(t => t.name === name);

  if (!tool) {
    throw new Error(`Built-in tool not found: ${name}`);
  }

  return await tool.execute(args);
}

/**
 * Check if a tool is built-in
 */
export async function isBuiltInToolAsync(name: string): Promise<boolean> {
  const tools = await getBuiltInToolsAsync();
  return tools.some(t => t.name === name);
}

/**
 * Check if a tool is built-in (sync version for compatibility)
 */
export function isBuiltInTool(name: string): boolean {
  return getBuiltInTools().some(t => t.name === name);
}
