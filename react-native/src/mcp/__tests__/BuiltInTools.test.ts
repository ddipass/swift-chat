/**
 * @jest-environment node
 */

// Mock react-native-blob-util
jest.mock('react-native-blob-util', () => ({
  default: {
    config: jest.fn(() => ({
      fetch: jest.fn(async () => ({
        info: () => ({
          status: 200,
          headers: { 'content-type': 'text/html' },
        }),
        text: () => '<html><body><h1>Test</h1><p>Content</p></body></html>',
      })),
    })),
  },
}));

// Mock storage utils
jest.mock('../../storage/StorageUtils', () => ({
  getFetchTimeout: () => 10000,
  getFetchMaxContentLength: () => 50000,
  getContentProcessingMode: () => 'regex',
  getAISummaryPrompt: () => 'Summarize this',
  getSummaryModel: () => 'claude-3-haiku',
  getRemoveElements: () => 'script,style,nav,footer',
}));

import { getBuiltInTools } from '../BuiltInTools';

interface BuiltInTool {
  name: string;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

describe('web_fetch tool', () => {
  let webFetchTool: BuiltInTool;

  beforeAll(() => {
    const tools = getBuiltInTools();
    webFetchTool = tools.find(t => t.name === 'web_fetch') as BuiltInTool;
  });

  test('should exist', () => {
    expect(webFetchTool).toBeDefined();
    expect(webFetchTool.name).toBe('web_fetch');
  });

  test('should reject invalid URL', async () => {
    const result = await webFetchTool.execute({ url: 'invalid' });
    expect(result).toHaveProperty('error');
  });

  test('should reject non-http protocols', async () => {
    const result = await webFetchTool.execute({ url: 'ftp://example.com' });
    expect(result).toHaveProperty('error');
    expect((result as { error: string }).error).toContain('HTTP/HTTPS');
  });

  test('should fetch and process HTML content', async () => {
    const result = await webFetchTool.execute({ url: 'https://example.com' });
    expect(result).toHaveProperty('content');
    expect(result).toHaveProperty('type', 'text');
    expect((result as { content: string }).content).toContain('Test');
  });
});
