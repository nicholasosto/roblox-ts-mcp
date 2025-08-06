import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

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
