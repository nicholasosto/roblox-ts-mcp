import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { 
  analyzePackage, 
  suggestPackageIntegration, 
  PackageAnalyzeSchema,
  PackageIntegrationSchema,
  PackageTroubleshootSchema 
} from './package-assistance.js';

// Import modular tool functions
import { validateSyntax, ValidateSyntaxSchema } from './tool/validation.js';
import { generatePattern, GeneratePatternSchema } from './tool/pattern-generation.js';
import { simulateBuild, SimulateBuildSchema } from './tool/build-simulation.js';
import { manageGDD, GDDManagerSchema } from './tool/gdd-manager.js';

/**
 * Tools for Roblox-ts development assistance
 */

const SearchRobloxDocsSchema = z.object({
  query: z.string().describe('Search query for Roblox documentation'),
  limit: z.number().optional().default(5).describe('Maximum number of results to return'),
});

const SummarizeRobloxDocSchema = z.object({
  url: z.string().describe('URL of the Roblox documentation page to summarize'),
});

/**
 * Search Roblox documentation for relevant content
 */
async function searchRobloxDocs(query: string, limit: number = 5): Promise<{ results: any[]; cached?: boolean; error?: string }> {
  // Simple in-memory cache
  const cacheKey = `search_${query.toLowerCase().trim()}`;
  const cached = (global as any).docCache?.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < 300000) { // 5 min cache
    return { ...cached.data, cached: true };
  }

  try {
    const commonPages = [
      { title: 'RemoteEvents and Callbacks', url: 'https://create.roblox.com/docs/scripting/events/remote', keywords: ['remote', 'event', 'callback', 'networking'] },
      { title: 'DataStores', url: 'https://create.roblox.com/docs/cloud-services/datastores', keywords: ['datastore', 'data', 'save', 'persistence'] },
      { title: 'TweenService', url: 'https://create.roblox.com/docs/reference/engine/classes/TweenService', keywords: ['tween', 'animation', 'smooth'] },
      { title: 'UserInputService', url: 'https://create.roblox.com/docs/reference/engine/classes/UserInputService', keywords: ['input', 'keyboard', 'mouse', 'touch'] },
      { title: 'Players Service', url: 'https://create.roblox.com/docs/reference/engine/classes/Players', keywords: ['player', 'character', 'spawn'] },
      { title: 'Workspace', url: 'https://create.roblox.com/docs/reference/engine/classes/Workspace', keywords: ['workspace', 'parts', 'models'] },
      { title: 'GUI Creation', url: 'https://create.roblox.com/docs/ui/gui-objects', keywords: ['gui', 'ui', 'interface', 'screen'] },
      { title: 'Scripting Guide', url: 'https://create.roblox.com/docs/scripting/', keywords: ['script', 'coding', 'programming', 'lua'] },
      { title: 'Events and Callbacks', url: 'https://create.roblox.com/docs/scripting/events/', keywords: ['event', 'callback', 'listener'] }
    ];

    const queryLower = query.toLowerCase();
    const matchingPages = commonPages.filter(page => 
      page.title.toLowerCase().includes(queryLower) ||
      page.keywords.some(keyword => queryLower.includes(keyword) || keyword.includes(queryLower))
    ).slice(0, limit);

    const results = [];
    
    for (const page of matchingPages) {
      try {
        const response = await axios.get(page.url, {
          headers: { 'User-Agent': 'RobloxTS-MCP-Server/1.0.0' },
          timeout: 8000
        });
        
        const $ = cheerio.load(response.data);
        const description = $('meta[name="description"]').attr('content') || 
                          $('p').first().text().trim().slice(0, 200);

        results.push({
          title: page.title,
          url: page.url,
          snippet: description + (description.length >= 200 ? '...' : ''),
          relevance: page.keywords.filter(k => queryLower.includes(k)).length
        });
      } catch (error) {
        console.warn(`Failed to fetch ${page.url}:`, error);
      }
    }

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);

    const result = { results: results.slice(0, limit) };
    
    // Cache result
    if (!(global as any).docCache) (global as any).docCache = new Map();
    (global as any).docCache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    return result;
  } catch (error) {
    return { 
      results: [], 
      error: `Failed to search Roblox documentation: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

/**
 * Summarize a specific Roblox documentation page
 */
async function summarizeRobloxDocPage(url: string): Promise<{ title?: string; summary: string; error?: string }> {
  if (!url.startsWith('https://create.roblox.com/docs') && !url.startsWith('https://developer.roblox.com')) {
    return { 
      summary: '',
      error: 'URL must be from official Roblox documentation (create.roblox.com/docs or developer.roblox.com)' 
    };
  }

  try {
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'RobloxTS-MCP-Server/1.0.0' },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    
    const title = $('h1, title').first().text().trim()
      .replace(' | Roblox Creator Documentation', '')
      .replace(' | Roblox Developer Hub', '');
    
    const sections: string[] = [];
    
    // Get description
    const description = $('meta[name="description"]').attr('content') || 
                      $('.description, .summary').first().text().trim() ||
                      $('p').first().text().trim();
    
    if (description) sections.push(`Description: ${description}`);
    
    // Get code examples (limit to 2)
    $('pre code, .highlight code').slice(0, 2).each((i, el) => {
      const code = $(el).text().trim();
      if (code && code.length < 400) {
        sections.push(`Code Example ${i + 1}:\n${code}`);
      }
    });
    
    // Get key sections
    $('h2, h3').slice(0, 3).each((i, el) => {
      const heading = $(el).text().trim();
      const nextP = $(el).next('p').text().trim();
      if (heading && nextP) {
        sections.push(`${heading}: ${nextP.slice(0, 150)}${nextP.length > 150 ? '...' : ''}`);
      }
    });

    const summary = sections.join('\n\n').slice(0, 1200) + 
                   (sections.join('\n\n').length > 1200 ? '\n\n[Content truncated...]' : '');
    
    return {
      title,
      summary: summary || 'Unable to extract meaningful content from this page.'
    };
  } catch (error) {
    return {
      summary: '',
      error: `Failed to summarize page: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Add all tools to the MCP server
 */
export function addTools(server: Server): void {
  // List tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'validate-syntax',
          description: 'Validate Roblox-ts code for syntax and library usage compliance',
          inputSchema: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'The Roblox-ts code to validate'
              }
            },
            required: ['code']
          }
        },
        {
          name: 'generate-pattern',
          description: 'Generate boilerplate code for common Roblox-ts patterns and features',
          inputSchema: {
            type: 'object',
            properties: {
              feature: {
                type: 'string',
                description: 'The feature to generate pattern for (e.g., "player-data", "networking", "ui", "zone")'
              },
              libraries: {
                type: 'array',
                items: { type: 'string' },
                description: 'Specific @rbxts libraries to use (optional)'
              }
            },
            required: ['feature']
          }
        },
        {
          name: 'simulate-build',
          description: 'Simulate TypeScript to Lua compilation and check for common issues',
          inputSchema: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'The TypeScript code to simulate compilation for'
              },
              target: {
                type: 'string',
                enum: ['server', 'client', 'shared'],
                description: 'Target environment (server, client, or shared)'
              }
            },
            required: ['code']
          }
        },
        {
          name: 'search-roblox-docs',
          description: 'Search official Roblox documentation for relevant content and examples',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query for Roblox documentation (e.g., "RemoteEvents", "DataStore", "TweenService")'
              },
              limit: {
                type: 'number',
                description: 'Maximum number of results to return (default: 5)',
                minimum: 1,
                maximum: 10
              }
            },
            required: ['query']
          }
        },
        {
          name: 'summarize-roblox-doc',
          description: 'Fetch and summarize a specific Roblox documentation page',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'URL of the official Roblox documentation page to summarize'
              }
            },
            required: ['url']
          }
        },
        {
          name: 'analyze-package',
          description: 'Analyze and provide detailed assistance for a specific @rbxts package',
          inputSchema: {
            type: 'object',
            properties: {
              packageName: {
                type: 'string',
                description: 'Name of the @rbxts package to analyze (e.g., "@rbxts/fusion", "@rbxts/profile-store")'
              },
              codeContext: {
                type: 'string',
                description: 'Optional existing code context for better assistance'
              }
            },
            required: ['packageName']
          }
        },
        {
          name: 'suggest-package-integration',
          description: 'Suggest how to integrate multiple @rbxts packages for a specific use case',
          inputSchema: {
            type: 'object',
            properties: {
              packages: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of @rbxts packages to integrate'
              },
              useCase: {
                type: 'string',
                description: 'Specific use case or feature being built'
              }
            },
            required: ['packages', 'useCase']
          }
        },
        {
          name: 'troubleshoot-package',
          description: 'Troubleshoot common issues with @rbxts packages',
          inputSchema: {
            type: 'object',
            properties: {
              packageName: {
                type: 'string',
                description: 'Package experiencing issues'
              },
              errorMessage: {
                type: 'string',
                description: 'Error message if any'
              },
              codeSnippet: {
                type: 'string',
                description: 'Code that is causing issues'
              }
            },
            required: ['packageName', 'codeSnippet']
          }
        },
        {
          name: 'gdd-manager',
          description: 'Manage Game Design Documents with structured operations for reading, updating, and querying GDD content including milestones, features, tasks, and documentation sections',
          inputSchema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: [
                  'read',
                  'update_frontmatter',
                  'update_content',
                  'add_feature',
                  'update_feature',
                  'add_task',
                  'update_task',
                  'query_milestones',
                  'query_features',
                  'query_tasks',
                  'validate_structure',
                  'export_summary'
                ],
                description: 'The operation to perform on the GDD'
              },
              file_path: {
                type: 'string',
                description: 'Path to the GDD file (required for all actions)'
              },
              updates: {
                type: 'object',
                description: 'Object containing fields to update (for update actions)',
                additionalProperties: true
              },
              section: {
                type: 'string',
                description: 'Section header to update (for update_content action)'
              },
              content: {
                type: 'string',
                description: 'New content for the section (for update_content action)'
              },
              operation: {
                type: 'string',
                enum: ['replace', 'append', 'prepend'],
                description: 'How to modify the section content'
              },
              feature: {
                type: 'object',
                description: 'Feature data (for add_feature action)',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  milestone: { type: 'string' },
                  priority: { type: 'string', enum: ['P1', 'P2', 'P3'] },
                  acceptance: { type: 'array', items: { type: 'string' } },
                  tasks: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        title: { type: 'string' },
                        estimate: { type: 'number' }
                      }
                    }
                  }
                }
              },
              feature_id: {
                type: 'string',
                description: 'ID of the feature to modify'
              },
              task: {
                type: 'object',
                description: 'Task data (for add_task action)',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                  estimate: { type: 'number' }
                }
              },
              task_id: {
                type: 'string',
                description: 'ID of the task to modify'
              },
              milestone_id: {
                type: 'string',
                description: 'Filter by milestone ID'
              },
              include_features: {
                type: 'boolean',
                description: 'Include associated features in milestone queries'
              },
              milestone: {
                type: 'string',
                description: 'Filter by milestone'
              },
              priority: {
                type: 'string',
                enum: ['P1', 'P2', 'P3'],
                description: 'Filter by priority'
              },
              include_tasks: {
                type: 'boolean',
                description: 'Include associated tasks in feature queries'
              },
              check_type: {
                type: 'string',
                enum: ['all', 'frontmatter', 'content', 'references'],
                description: 'Type of validation to perform'
              },
              format: {
                type: 'string',
                enum: ['markdown', 'json', 'csv'],
                description: 'Output format for summaries'
              },
              include: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['milestones', 'features', 'tasks', 'progress', 'estimates']
                },
                description: 'Elements to include in summary'
              }
            },
            required: ['action', 'file_path']
          }
        }
      ]
    };
  });

  // Call tool handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'validate-syntax': {
          const parsed = ValidateSyntaxSchema.parse(args);
          const result = validateSyntax(parsed.code);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }]
          };
        }

        case 'generate-pattern': {
          const parsed = GeneratePatternSchema.parse(args);
          const result = generatePattern(parsed.feature, parsed.libraries);
          return {
            content: [{
              type: 'text',
              text: `## Generated Pattern: ${parsed.feature}

${result.explanation}

### Dependencies
${result.dependencies.length > 0 ? result.dependencies.map(dep => `- ${dep}`).join('\n') : 'No additional dependencies required'}

### Code
\`\`\`typescript
${result.code}
\`\`\``
            }]
          };
        }

        case 'search-roblox-docs': {
          const parsed = SearchRobloxDocsSchema.parse(args);
          const result = await searchRobloxDocs(parsed.query, parsed.limit);
          
          if (result.error) {
            return {
              content: [{
                type: 'text',
                text: `## Search Failed

**Error:** ${result.error}

Try refining your search query or check your network connection.`
              }]
            };
          }

          const resultsText = result.results.length > 0 
            ? result.results.map((doc, i) => 
                `### ${i + 1}. ${doc.title}
**URL:** ${doc.url}
**Description:** ${doc.snippet}
**Relevance:** ${doc.relevance > 0 ? `${doc.relevance} keyword matches` : 'General match'}`
              ).join('\n\n')
            : 'No relevant documentation found. Try different search terms like "RemoteEvents", "DataStore", "TweenService", etc.';

          return {
            content: [{
              type: 'text',
              text: `## Roblox Documentation Search Results

**Query:** "${parsed.query}"
${result.cached ? '*(Results from cache)*' : ''}

${resultsText}

---
*Tip: Use the 'summarize-roblox-doc' tool with any of the URLs above to get detailed summaries.*`
            }]
          };
        }

        case 'summarize-roblox-doc': {
          const parsed = SummarizeRobloxDocSchema.parse(args);
          const result = await summarizeRobloxDocPage(parsed.url);
          
          if (result.error) {
            return {
              content: [{
                type: 'text',
                text: `## Summarization Failed

**Error:** ${result.error}

Please ensure the URL is from official Roblox documentation (create.roblox.com/docs).`
              }]
            };
          }

          return {
            content: [{
              type: 'text',
              text: `## ${result.title || 'Documentation Summary'}

**Source:** ${parsed.url}

${result.summary}

---
*This summary was extracted from the official Roblox documentation. Visit the source URL for complete details.*`
            }]
          };
        }

        case 'simulate-build': {
          const parsed = SimulateBuildSchema.parse(args);
          const result = simulateBuild(parsed.code, parsed.target);
          
          if (!result.success) {
            return {
              content: [{
                type: 'text',
                text: `## Compilation Failed

**Errors:**
${result.errors?.map(error => `- ${error}`).join('\n') || 'Unknown error'}`
              }]
            };
          }

          return {
            content: [{
              type: 'text',
              text: `## Compilation Successful

**Target:** ${parsed.target || 'shared'}

**Output:**
\`\`\`lua
${result.output}
\`\`\``
            }]
          };
        }

        case 'analyze-package': {
          const parsed = PackageAnalyzeSchema.parse(args);
          const result = analyzePackage(parsed.packageName, parsed.codeContext);
          
          return {
            content: [{
              type: 'text',
              text: result
            }]
          };
        }

        case 'suggest-package-integration': {
          const parsed = PackageIntegrationSchema.parse(args);
          const result = suggestPackageIntegration(parsed.packages, parsed.useCase);
          
          return {
            content: [{
              type: 'text',
              text: result
            }]
          };
        }

        case 'troubleshoot-package': {
          const parsed = PackageTroubleshootSchema.parse(args);
          // For now, provide basic troubleshooting based on package analysis
          const packageAnalysis = analyzePackage(parsed.packageName, parsed.codeSnippet);
          
          const troubleshootResult = `# Package Troubleshooting: ${parsed.packageName}

## 🔍 Issue Analysis

**Package:** ${parsed.packageName}
${parsed.errorMessage ? `**Error Message:** ${parsed.errorMessage}` : ''}

**Code Snippet:**
\`\`\`typescript
${parsed.codeSnippet}
\`\`\`

## 📋 Package Information

${packageAnalysis}

## 💡 Common Solutions

1. **Check Import Statements**: Ensure you're importing from the correct package
2. **Verify Types**: Make sure you're using the correct TypeScript types
3. **Review Best Practices**: Follow the best practices listed above
4. **Check Dependencies**: Ensure the package is properly installed in your project

## 🚀 Next Steps

- Compare your code against the common patterns shown above
- Look for the common mistakes listed in the package information
- Consider using the suggested integration patterns if using multiple packages`;

          return {
            content: [{
              type: 'text',
              text: troubleshootResult
            }]
          };
        }

        case 'gdd-manager': {
          const parsed = GDDManagerSchema.parse(args);
          const result = await manageGDD(parsed);
          
          if (!result.success) {
            return {
              content: [{
                type: 'text',
                text: `## GDD Manager Error

**Action:** ${parsed.action}
**File:** ${parsed.file_path}
**Error:** ${result.error}

${result.warnings && result.warnings.length > 0 ? `**Warnings:**\n${result.warnings.map(w => `- ${w}`).join('\n')}` : ''}`
              }]
            };
          }

          // Format success response based on action
          let responseText = `## GDD Manager - ${parsed.action}

**File:** ${parsed.file_path}
**Status:** ✅ Success

`;

          // Add metadata if available
          if (result.metadata) {
            responseText += `**File Info:**
- Size: ${result.metadata.fileSize} bytes
- Last Modified: ${new Date(result.metadata.lastModified).toLocaleString()}
- Features: ${result.metadata.featureCount}
- Tasks: ${result.metadata.taskCount}

`;
          }

          // Add warnings if any
          if (result.warnings && result.warnings.length > 0) {
            responseText += `**Warnings:**
${result.warnings.map(w => `⚠️ ${w}`).join('\n')}

`;
          }

          // Format result data based on action type
          switch (parsed.action) {
            case 'read':
              responseText += `**Project:** ${result.data.frontmatter.project}
**Version:** ${result.data.frontmatter.version}
**Milestones:** ${result.data.frontmatter.milestones.length}
**Features:** ${result.data.frontmatter.features.length}

**Content Preview:**
\`\`\`markdown
${result.data.content.slice(0, 300)}${result.data.content.length > 300 ? '...' : ''}
\`\`\``;
              break;

            case 'query_milestones':
            case 'query_features':
            case 'query_tasks':
              responseText += `**Query Results:**
\`\`\`json
${JSON.stringify(result.data, null, 2)}
\`\`\``;
              break;

            case 'validate_structure':
              responseText += `**Validation Results:**
- **Valid:** ${result.data.valid ? '✅ Yes' : '❌ No'}
- **Errors:** ${result.data.errors.length}
- **Warnings:** ${result.data.warnings.length}

${result.data.errors.length > 0 ? `**Errors:**\n${result.data.errors.map((e: string) => `❌ ${e}`).join('\n')}\n` : ''}
${result.data.warnings.length > 0 ? `**Warnings:**\n${result.data.warnings.map((w: string) => `⚠️ ${w}`).join('\n')}\n` : ''}`;
              break;

            case 'export_summary':
              responseText += `**Summary Export:**
\`\`\`${parsed.format || 'markdown'}
${result.data}
\`\`\``;
              break;

            case 'add_feature':
            case 'update_feature':
              responseText += `**Feature Details:**
- **ID:** ${result.data.id}
- **Title:** ${result.data.title}
- **Milestone:** ${result.data.milestone}
- **Priority:** ${result.data.priority}
- **Tasks:** ${result.data.tasks.length}`;
              break;

            case 'add_task':
            case 'update_task':
              responseText += `**Task Details:**
- **ID:** ${result.data.id}
- **Title:** ${result.data.title}
- **Estimate:** ${result.data.estimate || 'Not specified'}`;
              break;

            default:
              responseText += `**Result:**
\`\`\`json
${JSON.stringify(result.data, null, 2)}
\`\`\``;
          }

          return {
            content: [{
              type: 'text',
              text: responseText
            }]
          };
        }

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid parameters: ${error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`
        );
      }
      throw error;
    }
  });
}
