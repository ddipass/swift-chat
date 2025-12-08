/**
 * Perplexity Search API Client
 * https://docs.perplexity.ai/api-reference/search-post
 */

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  date: string;
  last_updated: string;
}

export interface SearchOptions {
  query: string;
  maxResults?: number;
  country?: string;
  recencyFilter?: 'day' | 'week' | 'month' | 'year';
}

export interface ChatOptions {
  query: string;
  model?: string;
}

export type PerplexityToolType = 'search' | 'ask' | 'research' | 'reason';

export interface PerplexityConfig {
  enabled: boolean;
  apiKey: string;
  enabledTools: PerplexityToolType[];
  searchTimeout?: number;
  askTimeout?: number;
  researchTimeout?: number;
  reasonTimeout?: number;
}

export class PerplexitySearchClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl = 'https://api.perplexity.ai') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Search - Direct web search (fast, <5s)
   */
  async search(
    options: SearchOptions,
    timeout = 30000
  ): Promise<SearchResult[]> {
    if (!this.apiKey) {
      throw new Error('Perplexity API key not configured');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: options.query,
          max_results: options.maxResults || 10,
          country: options.country,
          search_recency_filter: options.recencyFilter,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(
          `Perplexity search failed: ${response.status} ${error}`
        );
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Search timeout after ${timeout / 1000}s`);
      }
      throw error;
    }
  }

  /**
   * Ask - Conversational AI with web search (medium, ~10s)
   */
  async ask(options: ChatOptions, timeout = 60000): Promise<string> {
    return this.chatCompletion(
      options.query,
      'sonar-pro',
      timeout,
      'Quick answer'
    );
  }

  /**
   * Research - Deep comprehensive research (slow, ~200s)
   */
  async research(options: ChatOptions, timeout = 300000): Promise<string> {
    return this.chatCompletion(
      options.query,
      'sonar-deep-research',
      timeout,
      'Deep research'
    );
  }

  /**
   * Reason - Advanced reasoning (medium, ~30s)
   */
  async reason(options: ChatOptions, timeout = 90000): Promise<string> {
    return this.chatCompletion(
      options.query,
      'sonar-reasoning-pro',
      timeout,
      'Reasoning'
    );
  }

  private async chatCompletion(
    query: string,
    model: string,
    timeout: number,
    taskName: string
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Perplexity API key not configured');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: query }],
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`${taskName} failed: ${response.status} ${error}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(
          `${taskName} timeout after ${
            timeout / 1000
          }s. This is normal for deep research tasks.`
        );
      }
      throw error;
    }
  }

  /**
   * Format search results as markdown
   */
  formatResults(results: SearchResult[]): string {
    if (results.length === 0) {
      return 'No results found.';
    }

    let markdown = `Found ${results.length} results:\n\n`;

    results.forEach((result, index) => {
      markdown += `### ${index + 1}. ${result.title}\n`;
      markdown += `**URL:** ${result.url}\n`;
      markdown += `**Date:** ${result.date}\n\n`;
      markdown += `${result.snippet}\n\n`;
      markdown += '---\n\n';
    });

    return markdown;
  }
}
