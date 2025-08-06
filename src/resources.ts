import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ReadResourceRequestSchema,
  ListResourcesRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

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
      
      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  });
}
