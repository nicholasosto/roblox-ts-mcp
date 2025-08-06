import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ReadResourceRequestSchema,
  ListResourcesRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Resources for Roblox-ts development guidance
 */

// Resource data
const ROBLOX_TS_SYNTAX = {
  name: 'roblox-ts-syntax',
  description: 'Roblox-ts syntax and type safety guide',
  data: {
    imports: {
      description: 'Proper service imports in Roblox-ts',
      examples: [
        'import { Players } from "@rbxts/services";',
        'import { Workspace, ReplicatedStorage } from "@rbxts/services";',
        'import { RunService, UserInputService } from "@rbxts/services";'
      ],
      rules: [
        'Always import services from @rbxts/services package',
        'Use destructuring imports for multiple services',
        'Prefer specific service imports over generic game.GetService calls'
      ]
    },
    types: {
      description: 'Type safety best practices',
      examples: [
        'const player: Player = Players.LocalPlayer as Player;',
        'interface PlayerData { coins: number; level: number; }',
        'type GameMode = "adventure" | "creative" | "survival";'
      ],
      rules: [
        'Always use explicit type annotations for function parameters',
        'Define interfaces for complex data structures',
        'Use union types for constrained values',
        'Enable strict mode in tsconfig.json'
      ]
    },
    compilation: {
      description: 'TypeScript to Lua compilation considerations',
      rules: [
        'Avoid using JavaScript-specific APIs that don\'t exist in Lua',
        'Use @rbxts packages instead of native JavaScript equivalents',
        'Be mindful of array vs table differences',
        'Use proper Roblox-ts syntax for events and connections'
      ]
    }
  }
};

const DESIGN_PATTERNS = {
  name: 'design-patterns',
  description: 'Roblox-ts design patterns and architectural guidance',
  data: {
    modularity: {
      description: 'Project structure and module organization',
      structure: {
        'src/server/': 'Server-side scripts',
        'src/client/': 'Client-side scripts',
        'src/shared/': 'Shared modules and types',
        'src/server/services/': 'Server services (game logic)',
        'src/client/controllers/': 'Client controllers (UI, input)',
        'src/shared/types/': 'Type definitions',
        'src/shared/constants/': 'Game constants'
      },
      examples: [
        '// Shared type definition\nexport interface PlayerData {\n  coins: number;\n  level: number;\n  inventory: string[];\n}',
        '// Server service\nexport class PlayerDataService {\n  private playerData = new Map<Player, PlayerData>();\n  // ... service methods\n}'
      ]
    },
    mvc: {
      description: 'Model-View-Controller pattern for Roblox games',
      components: {
        model: 'Data and business logic (shared/server)',
        view: 'UI and visual components (client)',
        controller: 'Input handling and coordination (client/server)'
      },
      example: '// Controller example\nexport class GameController {\n  constructor(\n    private model: GameModel,\n    private view: GameView\n  ) {}\n\n  public start(): void {\n    this.view.render(this.model.getState());\n  }\n}'
    },
    objectPooling: {
      description: 'Object pooling for performance optimization',
      useCase: 'Bullets, effects, temporary objects',
      example: 'export class BulletPool {\n  private pool: Bullet[] = [];\n  \n  public getBullet(): Bullet {\n    return this.pool.pop() ?? new Bullet();\n  }\n  \n  public returnBullet(bullet: Bullet): void {\n    bullet.reset();\n    this.pool.push(bullet);\n  }\n}'
    }
  }
};

const LIBRARY_BEST_PRACTICES = {
  name: 'library-best-practices',
  description: 'Best practices for @rbxts packages',
  data: {
    net: {
      package: '@rbxts/net',
      description: 'Networking with type safety',
      setup: 'npm install @rbxts/net',
      examples: [
        '// Shared network definitions\nimport { NetDefinitions } from "@rbxts/net";\n\nconst remotes = NetDefinitions.create({\n  PlayerJoined: NetDefinitions.serverToClientEvent<[player: Player]>(),\n  BuyItem: NetDefinitions.clientToServerEvent<[itemId: string, cost: number]>()\n});',
        '// Server usage\nremotes.server.PlayerJoined.sendToAllClients(player);\nremotes.server.BuyItem.connect((player, itemId, cost) => {\n  // Handle purchase logic\n});',
        '// Client usage\nremotes.client.PlayerJoined.connect((player) => {\n  print(`${player.Name} joined!`);\n});\nremotes.client.BuyItem.sendToServer("sword", 100);'
      ],
      rules: [
        'Always define remotes in shared modules',
        'Use type-safe remote definitions',
        'Avoid using traditional RemoteEvent/RemoteFunction directly',
        'Group related remotes together'
      ]
    },
    profileStore: {
      package: '@rbxts/profile-store',
      description: 'Persistent player data management',
      setup: 'npm install @rbxts/profile-store',
      examples: [
        '// Profile template\ninterface PlayerProfile {\n  coins: number;\n  level: number;\n  inventory: string[];\n  settings: {\n    music: boolean;\n    sfx: boolean;\n  };\n}',
        '// ProfileStore setup\nimport { ProfileStore } from "@rbxts/profile-store";\n\nconst ProfileTemplate: PlayerProfile = {\n  coins: 0,\n  level: 1,\n  inventory: [],\n  settings: { music: true, sfx: true }\n};\n\nconst PlayerProfiles = ProfileStore.create("PlayerData", ProfileTemplate);',
        '// Loading player profile\nconst profile = PlayerProfiles.loadProfileAsync(`Player_${player.UserId}`);\nif (profile) {\n  profile.reconcile();\n  profile.listenToRelease(() => {\n    player.kick("Profile released");\n  });\n  // Use profile.data for player data\n}'
      ],
      rules: [
        'Always use ProfileStore for persistent data',
        'Never directly modify profile.data properties, use profile methods',
        'Handle profile loading failures gracefully',
        'Always call profile.reconcile() after loading'
      ]
    },
    zonePlus: {
      package: '@rbxts/zone-plus',
      description: 'Spatial zone detection and management',
      setup: 'npm install @rbxts/zone-plus',
      examples: [
        '// Creating a zone\nimport { Zone } from "@rbxts/zone-plus";\n\nconst safezoneContainer = workspace.FindFirstChild("SafeZone") as Model;\nconst safeZone = new Zone(safezoneContainer);',
        '// Zone events\nsafeZone.playerEntered.Connect((player) => {\n  print(`${player.Name} entered the safe zone`);\n  // Apply safe zone effects\n});\n\nsafeZone.playerExited.Connect((player) => {\n  print(`${player.Name} left the safe zone`);\n  // Remove safe zone effects\n});',
        '// Zone detection\nconst playersInZone = safeZone.getPlayers();\nconst isPlayerInZone = safeZone.findPlayer(player);'
      ],
      rules: [
        'Use Zone-Plus for reliable spatial detection',
        'Group zone parts under a Model or Folder',
        'Handle zone events for enter/exit logic',
        'Avoid using Touched events for zone detection'
      ]
    },
    fusion: {
      package: '@rbxts/fusion',
      description: 'Reactive UI framework for Roblox',
      setup: 'npm install @rbxts/fusion',
      examples: [
        '// Basic reactive state\nimport { New, Value } from "@rbxts/fusion";\n\nconst playerCoins = Value(100);\nconst doubledCoins = Value(() => playerCoins.get() * 2);',
        '// UI component with reactivity\nconst coinDisplay = New("TextLabel")({\n  Text: Value(() => `Coins: ${playerCoins.get()}`),\n  Size: new UDim2(0, 200, 0, 50),\n  Parent: playerGui.ScreenGui\n});',
        '// Dynamic list\nconst playersList = Value([] as Player[]);\nconst playersDisplay = New("ScrollingFrame")({\n  Children: Value(() => {\n    return playersList.get().map(player => \n      New("TextLabel")({\n        Text: player.Name,\n        Size: new UDim2(1, 0, 0, 30)\n      })\n    );\n  })\n});'
      ],
      rules: [
        'Use Value() for reactive state management',
        'Prefer Fusion over traditional GUI manipulation',
        'Use New() constructor for creating instances',
        'Leverage reactive computations for dynamic content'
      ]
    }
  }
};

// Roblox Documentation Integration
interface RobloxDocResult {
  title: string;
  snippet: string;
  url: string;
}

interface RobloxDocResponse {
  query: string;
  results: RobloxDocResult[] | string;
  cached?: boolean;
}

// Simple in-memory cache to avoid excessive requests
const docCache = new Map<string, { data: RobloxDocResponse; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Search Roblox documentation for relevant content
 */
async function searchRobloxDocs(query: string): Promise<RobloxDocResponse> {
  // Check cache first
  const cacheKey = query.toLowerCase().trim();
  const cached = docCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { ...cached.data, cached: true };
  }

  try {
    // Search in Roblox Creator documentation
    const searchUrl = 'https://create.roblox.com/docs';
    const response = await axios.get(searchUrl, {
      params: { q: query },
      headers: {
        'User-Agent': 'RobloxTS-MCP-Server/1.0.0 (+https://github.com/roblox-ts/roblox-ts)'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const results: RobloxDocResult[] = [];

    // Parse documentation sections
    $('article, .content-section, .doc-content').each((i, element) => {
      if (results.length >= 5) return false; // Limit results

      const $el = $(element);
      const title = $el.find('h1, h2, h3').first().text().trim();
      const content = $el.find('p, .description').first().text().trim();
      
      if (title && content && (
        title.toLowerCase().includes(query.toLowerCase()) ||
        content.toLowerCase().includes(query.toLowerCase())
      )) {
        results.push({
          title,
          snippet: content.slice(0, 200) + (content.length > 200 ? '...' : ''),
          url: response.request.res.responseUrl || searchUrl
        });
      }
    });

    // If no specific results, try common Roblox doc pages
    if (results.length === 0) {
      const commonPages = [
        { title: 'RemoteEvents', url: 'https://create.roblox.com/docs/scripting/events/remote-events-and-callbacks' },
        { title: 'DataStores', url: 'https://create.roblox.com/docs/cloud-services/data-stores' },
        { title: 'TweenService', url: 'https://create.roblox.com/docs/reference/engine/classes/TweenService' },
        { title: 'UserInputService', url: 'https://create.roblox.com/docs/reference/engine/classes/UserInputService' },
        { title: 'Players', url: 'https://create.roblox.com/docs/reference/engine/classes/Players' }
      ];

      const matchingPage = commonPages.find(page => 
        page.title.toLowerCase().includes(query.toLowerCase()) ||
        query.toLowerCase().includes(page.title.toLowerCase())
      );

      if (matchingPage) {
        const pageResponse = await axios.get(matchingPage.url, {
          headers: {
            'User-Agent': 'RobloxTS-MCP-Server/1.0.0'
          },
          timeout: 10000
        });
        
        const $page = cheerio.load(pageResponse.data);
        const description = $page('meta[name="description"]').attr('content') || 
                          $page('.description, .summary, p').first().text().trim();

        results.push({
          title: matchingPage.title,
          snippet: description.slice(0, 200) + (description.length > 200 ? '...' : ''),
          url: matchingPage.url
        });
      }
    }

    const result: RobloxDocResponse = {
      query,
      results: results.length > 0 ? results : 'No relevant documentation found. Try refining your search terms.'
    };

    // Cache the result
    docCache.set(cacheKey, { data: result, timestamp: Date.now() });
    
    return result;
  } catch (error) {
    return {
      query,
      results: `Failed to fetch Roblox documentation: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Summarize a specific Roblox documentation page
 */
async function summarizeRobloxDocPage(url: string): Promise<{ summary: string; title?: string; error?: string }> {
  if (!url.startsWith('https://create.roblox.com/docs') && !url.startsWith('https://developer.roblox.com')) {
    return { error: 'URL must be from official Roblox documentation (create.roblox.com/docs or developer.roblox.com)', summary: '' };
  }

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'RobloxTS-MCP-Server/1.0.0'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    
    // Extract title
    const title = $('h1, title').first().text().trim().replace(' | Roblox Creator Documentation', '');
    
    // Extract main content
    const mainContent = $('main, .content, .documentation-content, .doc-content, article').first();
    
    // Get key sections
    const sections: string[] = [];
    
    // Description/summary
    const description = mainContent.find('.description, .summary, p').first().text().trim();
    if (description) sections.push(`Description: ${description}`);
    
    // Code examples
    mainContent.find('pre code, .code-example').each((i, el) => {
      if (i < 2) { // Limit to 2 code examples
        const code = $(el).text().trim();
        if (code.length < 300) {
          sections.push(`Example: ${code}`);
        }
      }
    });
    
    // Key points from headers
    mainContent.find('h2, h3').each((i, el) => {
      if (i < 3) { // Limit to 3 headers
        const headerText = $(el).text().trim();
        const nextP = $(el).next('p').text().trim();
        if (headerText && nextP) {
          sections.push(`${headerText}: ${nextP.slice(0, 100)}${nextP.length > 100 ? '...' : ''}`);
        }
      }
    });

    const summary = sections.join('\n\n').slice(0, 1000) + (sections.join('\n\n').length > 1000 ? '\n\n...' : '');
    
    return {
      title,
      summary: summary || 'No content could be extracted from this page.',
    };
  } catch (error) {
    return {
      error: `Failed to summarize documentation page: ${error instanceof Error ? error.message : 'Unknown error'}`,
      summary: ''
    };
  }
}

const ROBLOX_DOCS_RESOURCE = {
  name: 'roblox-official-docs',
  description: 'Search and access official Roblox documentation with intelligent caching',
  data: {
    description: 'This resource provides access to official Roblox documentation with search capabilities and caching for better performance.',
    usage: 'Query this resource with search terms to find relevant documentation sections.',
    examples: [
      'RemoteEvents',
      'DataStore',
      'TweenService',
      'UserInputService',
      'scripting basics',
      'GUI creation'
    ],
    features: [
      'Intelligent content parsing',
      'Caching to reduce API calls',
      'Integration with Roblox-ts patterns',
      'Code example extraction',
      'Summary generation'
    ]
  }
};

/**
 * Add all resources to the MCP server
 */
export function addResources(server: Server): void {
  // List resources handler
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: 'roblox-ts://syntax',
          mimeType: 'application/json',
          name: ROBLOX_TS_SYNTAX.name,
          description: ROBLOX_TS_SYNTAX.description
        },
        {
          uri: 'roblox-ts://design-patterns',
          mimeType: 'application/json',
          name: DESIGN_PATTERNS.name,
          description: DESIGN_PATTERNS.description
        },
        {
          uri: 'roblox-ts://library-best-practices',
          mimeType: 'application/json',
          name: LIBRARY_BEST_PRACTICES.name,
          description: LIBRARY_BEST_PRACTICES.description
        },
        {
          uri: 'roblox-docs://search',
          mimeType: 'application/json',
          name: ROBLOX_DOCS_RESOURCE.name,
          description: ROBLOX_DOCS_RESOURCE.description
        }
      ]
    };
  });

  // Get resource handler
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    
    switch (uri) {
      case 'roblox-ts://syntax':
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(ROBLOX_TS_SYNTAX.data, null, 2)
          }]
        };
      
      case 'roblox-ts://design-patterns':
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(DESIGN_PATTERNS.data, null, 2)
          }]
        };
      
      case 'roblox-ts://library-best-practices':
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(LIBRARY_BEST_PRACTICES.data, null, 2)
          }]
        };
      
      case 'roblox-docs://search':
        // Extract query from URI fragment or use a default
        const queryParam = (request.params as any).arguments?.query || 'RemoteEvents';
        const searchResults = await searchRobloxDocs(queryParam as string);
        return {
          contents: [{
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({
              ...ROBLOX_DOCS_RESOURCE.data,
              searchResults
            }, null, 2)
          }]
        };
      
      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  });
}
