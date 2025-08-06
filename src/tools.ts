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
  PackageMigrationSchema,
  PackageTroubleshootSchema 
} from './package-assistance.js';

/**
 * Tools for Roblox-ts development assistance
 */

// Validation schemas
const ValidateSyntaxSchema = z.object({
  code: z.string().describe('Roblox-ts code to validate'),
});

const GeneratePatternSchema = z.object({
  feature: z.string().describe('Feature to generate pattern for'),
  libraries: z.array(z.string()).optional().describe('Specific @rbxts libraries to use'),
});

const SimulateBuildSchema = z.object({
  code: z.string().describe('TypeScript code to simulate compilation'),
  target: z.enum(['server', 'client', 'shared']).optional().describe('Target environment'),
});

const SearchRobloxDocsSchema = z.object({
  query: z.string().describe('Search query for Roblox documentation'),
  limit: z.number().optional().default(5).describe('Maximum number of results to return'),
});

const SummarizeRobloxDocSchema = z.object({
  url: z.string().describe('URL of the Roblox documentation page to summarize'),
});

/**
 * Validate Roblox-ts code for proper syntax and library usage
 */
function validateSyntax(code: string): { valid: boolean; errors: string[]; warnings: string[]; suggestions: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Check for proper service imports
  if (code.includes('game.GetService') && !code.includes('@rbxts/services')) {
    errors.push('Use @rbxts/services for service imports instead of game.GetService()');
    suggestions.push('Replace game.GetService("Players") with import { Players } from "@rbxts/services"');
  }

  // Check for networking without @rbxts/net
  if ((code.includes('RemoteEvent') || code.includes('RemoteFunction')) && !code.includes('@rbxts/net')) {
    warnings.push('Consider using @rbxts/net for type-safe networking instead of raw RemoteEvents');
    suggestions.push('Install @rbxts/net and define remote events with type safety');
  }

  // Check for data storage without ProfileStore
  if (code.includes('DataStoreService') && !code.includes('@rbxts/profile-store')) {
    warnings.push('Consider using @rbxts/profile-store for robust data management');
    suggestions.push('ProfileStore provides session locking and data reconciliation');
  }

  // Check for zone detection with Touched events
  if (code.includes('.Touched') && !code.includes('@rbxts/zone-plus')) {
    warnings.push('Consider using @rbxts/zone-plus for reliable zone detection instead of Touched events');
    suggestions.push('Zone-Plus handles overlapping parts and provides better performance');
  }

  // Check for manual GUI manipulation without Fusion
  if (code.includes('new Instance') && code.includes('ScreenGui') && !code.includes('@rbxts/fusion')) {
    suggestions.push('Consider using @rbxts/fusion for reactive UI development');
  }

  // Check for type annotations
  if (code.includes('function') && !code.includes(':') && code.includes('=')) {
    warnings.push('Consider adding explicit type annotations for better type safety');
    suggestions.push('Example: function processPlayer(player: Player): void { ... }');
  }

  // Check for proper error handling
  if (code.includes('pcall') || code.includes('xpcall')) {
    suggestions.push('Use try-catch blocks for error handling in TypeScript instead of pcall');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
}

/**
 * Generate boilerplate code for common Roblox-ts patterns
 */
function generatePattern(feature: string, libraries: string[] = []): { code: string; explanation: string; dependencies: string[] } {
  const dependencies: string[] = [];
  let code = '';
  let explanation = '';

  switch (feature.toLowerCase()) {
    case 'player-data':
    case 'data-management':
      dependencies.push('@rbxts/profile-store');
      explanation = 'Complete player data management system using ProfileStore for persistence';
      code = `// Player Data Management with ProfileStore
import { ProfileStore } from "@rbxts/profile-store";
import { Players } from "@rbxts/services";

// Define the player data structure
interface PlayerProfile {
  coins: number;
  level: number;
  experience: number;
  inventory: string[];
  settings: {
    musicEnabled: boolean;
    sfxEnabled: boolean;
  };
}

// Default profile template
const ProfileTemplate: PlayerProfile = {
  coins: 100,
  level: 1,
  experience: 0,
  inventory: [],
  settings: {
    musicEnabled: true,
    sfxEnabled: true,
  },
};

// Create ProfileStore
const PlayerProfiles = ProfileStore.create("PlayerData", ProfileTemplate);

export class PlayerDataService {
  private profiles = new Map<Player, typeof PlayerProfiles.mock>();

  public async loadPlayer(player: Player): Promise<boolean> {
    const profile = PlayerProfiles.loadProfileAsync(\`Player_\${player.UserId}\`);
    
    if (profile) {
      profile.reconcile();
      profile.listenToRelease(() => {
        this.profiles.delete(player);
        player.kick("Profile session ended");
      });
      
      this.profiles.set(player, profile);
      return true;
    }
    
    return false;
  }

  public getProfile(player: Player) {
    return this.profiles.get(player);
  }

  public addCoins(player: Player, amount: number): void {
    const profile = this.getProfile(player);
    if (profile) {
      profile.data.coins += amount;
    }
  }

  public playerLeaving(player: Player): void {
    const profile = this.profiles.get(player);
    if (profile) {
      profile.release();
    }
  }
}`;
      break;

    case 'networking':
    case 'remotes':
      dependencies.push('@rbxts/net');
      explanation = 'Type-safe networking setup using @rbxts/net';
      code = `// Type-safe Networking with @rbxts/net
import { NetDefinitions } from "@rbxts/net";

// Define all remote events and functions in a shared module
const remotes = NetDefinitions.create({
  // Server to Client events
  PlayerJoined: NetDefinitions.serverToClientEvent<[player: Player]>(),
  CoinUpdate: NetDefinitions.serverToClientEvent<[newAmount: number]>(),
  
  // Client to Server events
  BuyItem: NetDefinitions.clientToServerEvent<[itemId: string, cost: number]>(),
  RequestData: NetDefinitions.clientToServerEvent<[]>(),
  
  // Remote functions
  GetPlayerStats: NetDefinitions.clientToServerFunction<[], { level: number; coins: number }>(),
});

// Export for use in client and server
export default remotes;

// Server usage example:
// remotes.server.PlayerJoined.sendToAllClients(player);
// remotes.server.BuyItem.connect((player, itemId, cost) => {
//   // Handle purchase logic
// });

// Client usage example:
// remotes.client.CoinUpdate.connect((newAmount) => {
//   updateCoinDisplay(newAmount);
// });
// remotes.client.BuyItem.sendToServer("sword", 100);`;
      break;

    case 'zone':
    case 'area-detection':
      dependencies.push('@rbxts/zone-plus');
      explanation = 'Zone detection system using Zone-Plus for reliable spatial detection';
      code = `// Zone Detection with Zone-Plus
import { Zone } from "@rbxts/zone-plus";
import { Players } from "@rbxts/services";

export class ZoneManager {
  private zones = new Map<string, Zone>();

  public createZone(name: string, container: Model | Folder): Zone {
    const zone = new Zone(container);
    this.zones.set(name, zone);

    // Set up zone events
    zone.playerEntered.Connect((player) => {
      this.onPlayerEnterZone(name, player);
    });

    zone.playerExited.Connect((player) => {
      this.onPlayerExitZone(name, player);
    });

    return zone;
  }

  public getZone(name: string): Zone | undefined {
    return this.zones.get(name);
  }

  public getPlayersInZone(name: string): Player[] {
    const zone = this.zones.get(name);
    return zone ? zone.getPlayers() : [];
  }

  public isPlayerInZone(name: string, player: Player): boolean {
    const zone = this.zones.get(name);
    return zone ? zone.findPlayer(player) !== undefined : false;
  }

  private onPlayerEnterZone(zoneName: string, player: Player): void {
    print(\`\${player.Name} entered zone: \${zoneName}\`);
    
    // Add zone-specific logic here
    switch (zoneName) {
      case "safe-zone":
        // Apply safe zone effects
        break;
      case "pvp-zone":
        // Enable PvP for player
        break;
    }
  }

  private onPlayerExitZone(zoneName: string, player: Player): void {
    print(\`\${player.Name} exited zone: \${zoneName}\`);
    
    // Remove zone-specific effects
  }
}`;
      break;

    case 'ui':
    case 'interface':
      dependencies.push('@rbxts/fusion');
      explanation = 'Reactive UI system using Fusion for dynamic interfaces';
      code = `// Reactive UI with Fusion
import { New, Value, Computed } from "@rbxts/fusion";
import { Players } from "@rbxts/services";

const playerGui = Players.LocalPlayer.WaitForChild("PlayerGui") as PlayerGui;

// Reactive state
const playerCoins = Value(100);
const playerLevel = Value(1);
const isShopOpen = Value(false);

// Computed values
const levelProgress = Computed(() => {
  const level = playerLevel.get();
  return \`Level \${level} (\${level * 100} XP to next)\`;
});

// Create main UI
const mainGui = New("ScreenGui")({
  Name: "MainGui",
  Parent: playerGui,
  
  Children: [
    // Coin display
    New("Frame")({
      Name: "CoinFrame",
      Size: new UDim2(0, 200, 0, 50),
      Position: new UDim2(0, 10, 0, 10),
      BackgroundColor3: Color3.fromRGB(0, 0, 0),
      BackgroundTransparency: 0.3,
      
      Children: [
        New("TextLabel")({
          Size: new UDim2(1, 0, 1, 0),
          BackgroundTransparency: 1,
          Text: Computed(() => \`Coins: \${playerCoins.get()}\`),
          TextColor3: Color3.fromRGB(255, 255, 255),
          TextScaled: true,
          Font: Enum.Font.GothamBold,
        }),
      ],
    }),
    
    // Level display
    New("Frame")({
      Name: "LevelFrame",
      Size: new UDim2(0, 200, 0, 50),
      Position: new UDim2(0, 10, 0, 70),
      BackgroundColor3: Color3.fromRGB(0, 100, 0),
      BackgroundTransparency: 0.3,
      
      Children: [
        New("TextLabel")({
          Size: new UDim2(1, 0, 1, 0),
          BackgroundTransparency: 1,
          Text: levelProgress,
          TextColor3: Color3.fromRGB(255, 255, 255),
          TextScaled: true,
          Font: Enum.Font.Gotham,
        }),
      ],
    }),
    
    // Shop button
    New("TextButton")({
      Name: "ShopButton",
      Size: new UDim2(0, 100, 0, 50),
      Position: new UDim2(1, -110, 0, 10),
      BackgroundColor3: Color3.fromRGB(100, 0, 100),
      Text: "Shop",
      TextColor3: Color3.fromRGB(255, 255, 255),
      TextScaled: true,
      Font: Enum.Font.GothamBold,
      
      [New.Event("Activated")] = () => {
        isShopOpen.set(!isShopOpen.get());
      },
    }),
  ],
});

// Export functions to update state
export const UIController = {
  updateCoins: (amount: number) => playerCoins.set(amount),
  updateLevel: (level: number) => playerLevel.set(level),
  toggleShop: () => isShopOpen.set(!isShopOpen.get()),
};`;
      break;

    case 'service':
    case 'game-service':
      explanation = 'Server-side service template following best practices';
      code = `// Game Service Template
import { Players, RunService } from "@rbxts/services";

export class GameService {
  private isRunning = false;
  private connections: RBXScriptConnection[] = [];

  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.setupConnections();
    this.onStart();
  }

  public stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    this.cleanupConnections();
    this.onStop();
  }

  protected onStart(): void {
    // Override in subclasses for start logic
  }

  protected onStop(): void {
    // Override in subclasses for cleanup logic
  }

  private setupConnections(): void {
    // Player connections
    this.connections.push(
      Players.PlayerAdded.Connect((player) => this.onPlayerAdded(player))
    );
    
    this.connections.push(
      Players.PlayerRemoving.Connect((player) => this.onPlayerRemoving(player))
    );

    // Game loop connection (if needed)
    this.connections.push(
      RunService.Heartbeat.Connect((deltaTime) => this.onUpdate(deltaTime))
    );
  }

  private cleanupConnections(): void {
    for (const connection of this.connections) {
      connection.Disconnect();
    }
    this.connections.clear();
  }

  protected onPlayerAdded(player: Player): void {
    print(\`Player \${player.Name} joined the game\`);
    // Override in subclasses
  }

  protected onPlayerRemoving(player: Player): void {
    print(\`Player \${player.Name} is leaving the game\`);
    // Override in subclasses
  }

  protected onUpdate(deltaTime: number): void {
    // Override in subclasses for game loop logic
  }
}`;
      break;

    default:
      explanation = 'Basic Roblox-ts class template';
      code = `// Basic Roblox-ts Class Template
export class ${feature.replace(/[^a-zA-Z0-9]/g, '')} {
  constructor() {
    // Initialize your class here
  }

  public start(): void {
    // Start logic here
  }

  public stop(): void {
    // Cleanup logic here
  }
}`;
      break;
  }

  return { code, explanation, dependencies };
}

/**
 * Simulate TypeScript to Lua compilation
 */
function simulateBuild(code: string, target: 'server' | 'client' | 'shared' = 'shared'): { success: boolean; output?: string; errors?: string[] } {
  const errors: string[] = [];
  
  // Check for common compilation issues
  if (code.includes('document') || code.includes('window')) {
    errors.push('Browser APIs like "document" and "window" are not available in Roblox Lua');
  }
  
  if (code.includes('localStorage') || code.includes('sessionStorage')) {
    errors.push('Web storage APIs are not available in Roblox - use DataStoreService or ProfileStore');
  }
  
  if (code.includes('fetch') || code.includes('XMLHttpRequest')) {
    errors.push('HTTP APIs are not available in Roblox client - use HttpService on server');
  }
  
  if (target === 'client' && code.includes('HttpService')) {
    errors.push('HttpService is only available on the server');
  }
  
  if (target === 'client' && code.includes('DataStoreService')) {
    errors.push('DataStoreService is only available on the server');
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  // Simulate successful compilation
  const luaOutput = `-- Compiled Lua output (simulated)
-- Target: ${target}
-- Original TypeScript compiled successfully

${code.split('\n').map(line => `-- ${line}`).join('\n')}

-- Note: This is a simulation. Actual roblox-ts compilation would produce optimized Lua code.`;

  return { success: true, output: luaOutput };
}

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
