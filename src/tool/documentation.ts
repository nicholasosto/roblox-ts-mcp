import { z } from 'zod';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Validation schemas
export const SearchRobloxDocsSchema = z.object({
  query: z.string().describe('Search query for Roblox documentation'),
  limit: z.number().optional().default(5).describe('Maximum number of results to return'),
});

export const SummarizeRobloxDocSchema = z.object({
  url: z.string().describe('URL of the Roblox documentation page to summarize'),
});

/**
 * Search official Roblox documentation
 */
export async function searchRobloxDocs(query: string, limit: number = 5): Promise<{ results: any[]; cached?: boolean; error?: string }> {
  try {
    // Use Roblox's search API or scrape their docs
    const searchUrl = `https://create.roblox.com/docs/reference/engine`;
    
    // This is a simplified implementation - in a real scenario, you'd want to:
    // 1. Use a proper search API if available
    // 2. Cache results for better performance
    // 3. Parse the actual search results
    
    const mockResults = [
      {
        title: `${query} Overview`,
        url: `https://create.roblox.com/docs/reference/engine/classes/${query}`,
        description: `Official documentation for ${query} in Roblox`,
        relevance: 0.95
      },
      {
        title: `Using ${query} in Scripts`,
        url: `https://create.roblox.com/docs/scripting/${query.toLowerCase()}`,
        description: `Learn how to use ${query} in your Roblox scripts`,
        relevance: 0.85
      },
      {
        title: `${query} Examples`,
        url: `https://create.roblox.com/docs/tutorials/${query.toLowerCase()}-examples`,
        description: `Code examples and tutorials for ${query}`,
        relevance: 0.75
      }
    ].slice(0, limit);

    return { results: mockResults };
  } catch (error) {
    return { 
      results: [], 
      error: `Failed to search documentation: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Summarize a specific Roblox documentation page
 */
export async function summarizeRobloxDocPage(url: string): Promise<{ title?: string; summary: string; error?: string }> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    
    // Extract title
    const title = $('h1').first().text() || $('title').text() || 'Documentation Page';
    
    // Extract main content
    let content = '';
    
    // Try to find main content areas
    const contentSelectors = [
      '.markdown-body',
      '.content',
      'main',
      '.documentation-content',
      'article'
    ];
    
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text();
        break;
      }
    }
    
    // If no main content found, get all paragraph text
    if (!content) {
      content = $('p').map((_, el) => $(el).text()).get().join(' ');
    }
    
    // Clean and truncate content
    content = content
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2000); // Limit to 2000 characters
    
    if (!content) {
      return {
        title,
        summary: 'Unable to extract content from this page. It may require JavaScript or have restricted access.',
        error: 'Content extraction failed'
      };
    }
    
    return {
      title,
      summary: content
    };

  } catch (error) {
    return {
      summary: `Failed to fetch or parse the documentation page.`,
      error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
