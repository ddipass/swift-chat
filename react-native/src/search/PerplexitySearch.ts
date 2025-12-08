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

export interface PerplexityConfig {
  enabled: boolean;
  apiKey: string;
}

export class PerplexitySearchClient {
  private apiKey: string;
  private baseUrl = 'https://api.perplexity.ai';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(options: SearchOptions): Promise<SearchResult[]> {
    if (!this.apiKey) {
      throw new Error('Perplexity API key not configured');
    }

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
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Perplexity search failed: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.results || [];
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
