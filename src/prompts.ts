import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

/**
 * Prompt templates for Roblox-ts development
 */

const PROMPTS = {
  'roblox-ts-code-generation': {
    name: 'roblox-ts-code-generation',
    description: 'Generate Roblox-ts code following best practices and library standards',
    template: `Generate a complete Roblox-ts module for {{feature}}.

Requirements:
- Use TypeScript with strict type checking
- Import services from @rbxts/services (e.g., import { Players } from "@rbxts/services")
- For networking: Use @rbxts/net with type-safe remote definitions
- For data storage: Use @rbxts/profile-store for player data persistence
- For zone detection: Use @rbxts/zone-plus instead of Touched events
- For UI: Use @rbxts/fusion for reactive interfaces
- Follow modular architecture (server/client/shared separation)
- Include proper error handling and type annotations
- Add comprehensive comments explaining the code

{{#if libraries}}
Specifically use these libraries: {{#each libraries}}@rbxts/{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

{{#if target}}
Target environment: {{target}} (server/client/shared)
{{/if}}

{{#if pattern}}
Follow this design pattern: {{pattern}}
{{/if}}

The code should be production-ready and follow Roblox-ts best practices.`
  },

  'roblox-ts-debugging': {
    name: 'roblox-ts-debugging',
    description: 'Debug and fix Roblox-ts code issues',
    template: `Analyze and fix the following Roblox-ts code:

\`\`\`typescript
{{code}}
\`\`\`

{{#if error}}
Error message: {{error}}
{{/if}}

Please:
1. Identify any syntax or logical errors
2. Check for proper @rbxts package usage:
   - Services should be imported from @rbxts/services
   - Networking should use @rbxts/net
   - Data persistence should use @rbxts/profile-store
   - Zone detection should use @rbxts/zone-plus
   - UI should use @rbxts/fusion
3. Ensure type safety and proper TypeScript usage
4. Suggest performance improvements
5. Provide the corrected code with explanations

Focus on Roblox-ts specific best practices and common pitfalls.`
  },

  'roblox-ts-architecture': {
    name: 'roblox-ts-architecture',
    description: 'Design architecture for Roblox-ts projects',
    template: `Design a complete architecture for a Roblox-ts {{project_type}} project.

Project requirements:
{{#if features}}
Features needed: {{#each features}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
{{/if}}

{{#if scale}}
Expected scale: {{scale}}
{{/if}}

Please provide:
1. Project structure (folder organization)
2. Module organization (server/client/shared)
3. Recommended @rbxts packages and their usage
4. Data flow and communication patterns
5. Performance considerations
6. Testing strategy
7. Build and deployment setup

Follow these principles:
- Modular and scalable architecture
- Type safety throughout
- Proper separation of concerns
- Use appropriate @rbxts packages for each domain
- Consider performance and maintainability`
  },

  'roblox-ts-migration': {
    name: 'roblox-ts-migration',
    description: 'Migrate existing Lua code to Roblox-ts',
    template: `Migrate the following Roblox Lua code to Roblox-ts:

\`\`\`lua
{{lua_code}}
\`\`\`

Requirements for migration:
1. Convert to TypeScript with proper type annotations
2. Replace service access with @rbxts/services imports
3. Use appropriate @rbxts packages where applicable:
   - @rbxts/net for networking
   - @rbxts/profile-store for data storage
   - @rbxts/zone-plus for zone detection
   - @rbxts/fusion for UI
4. Follow TypeScript best practices
5. Maintain the same functionality
6. Improve code organization and structure
7. Add proper error handling

{{#if preserve_logic}}
Preserve the original logic exactly: {{preserve_logic}}
{{/if}}

{{#if modernize}}
Modernize and improve the code: {{modernize}}
{{/if}}

Provide the migrated TypeScript code with explanations of changes made.`
  },

  'roblox-ts-optimization': {
    name: 'roblox-ts-optimization',
    description: 'Optimize Roblox-ts code for performance',
    template: `Optimize the following Roblox-ts code for better performance:

\`\`\`typescript
{{code}}
\`\`\`

{{#if performance_issues}}
Known performance issues: {{performance_issues}}
{{/if}}

{{#if target_fps}}
Target FPS: {{target_fps}}
{{/if}}

{{#if player_count}}
Expected player count: {{player_count}}
{{/if}}

Please analyze and optimize for:
1. Memory usage and garbage collection
2. CPU performance and frame rate
3. Network efficiency (if applicable)
4. Roblox-specific optimizations
5. TypeScript compilation efficiency
6. Proper use of @rbxts packages for performance

Provide:
- Identified performance bottlenecks
- Optimized code with improvements
- Explanation of optimizations made
- Performance impact estimates
- Additional recommendations`
  },

  'roblox-ts-testing': {
    name: 'roblox-ts-testing',
    description: 'Create tests for Roblox-ts code',
    template: `Create comprehensive tests for the following Roblox-ts code:

\`\`\`typescript
{{code}}
\`\`\`

{{#if test_type}}
Test type: {{test_type}} (unit/integration/e2e)
{{/if}}

{{#if test_framework}}
Preferred test framework: {{test_framework}}
{{/if}}

Please provide:
1. Unit tests for individual functions/methods
2. Integration tests for component interactions
3. Mock setups for Roblox services and @rbxts packages
4. Test data and fixtures
5. Error condition testing
6. Performance test considerations

Focus on:
- Testing Roblox-ts specific functionality
- Mocking @rbxts package dependencies
- Handling async operations (ProfileStore, RemoteEvents)
- Edge cases and error scenarios
- Type safety verification

Include test setup, teardown, and assertion strategies.`
  }
};

/**
 * Add all prompts to the MCP server
 */
export function addPrompts(server: Server): void {
  // List prompts handler
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: Object.values(PROMPTS).map(prompt => ({
        name: prompt.name,
        description: prompt.description
      }))
    };
  });

  // Get prompt handler
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    const prompt = PROMPTS[name as keyof typeof PROMPTS];
    if (!prompt) {
      throw new Error(`Unknown prompt: ${name}`);
    }

    // Simple template processing (replace {{variable}} with values)
    let processedTemplate = prompt.template;
    
    if (args) {
      for (const [key, value] of Object.entries(args)) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        processedTemplate = processedTemplate.replace(regex, String(value));
      }

      // Handle conditional blocks {{#if condition}}...{{/if}}
      processedTemplate = processedTemplate.replace(
        /\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
        (match, condition, content) => {
          return args[condition] ? content : '';
        }
      );

      // Handle each loops {{#each array}}...{{/each}}
      processedTemplate = processedTemplate.replace(
        /\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
        (match, arrayName, content) => {
          const array = args[arrayName];
          if (Array.isArray(array)) {
            return array.map((item, index) => {
              let itemContent = content;
              itemContent = itemContent.replace(/\{\{this\}\}/g, item);
              itemContent = itemContent.replace(/\{\{@last\}\}/g, String(index === array.length - 1));
              itemContent = itemContent.replace(/\{\{#unless @last\}\}([\s\S]*?)\{\{\/unless\}\}/g, 
                index === array.length - 1 ? '' : '$1');
              return itemContent;
            }).join('');
          }
          return '';
        }
      );
    }

    return {
      description: prompt.description,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: processedTemplate
          }
        }
      ]
    };
  });
}
