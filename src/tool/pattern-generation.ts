import { z } from 'zod';

// Validation schemas
export const GeneratePatternSchema = z.object({
  feature: z.string().describe('Feature to generate pattern for'),
  libraries: z.array(z.string()).optional().describe('Specific @rbxts libraries to use'),
});

/**
 * Generate boilerplate code for common Roblox-ts patterns
 */
export function generatePattern(feature: string, libraries: string[] = []): { code: string; explanation: string; dependencies: string[] } {
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

  constructor() {
    Players.PlayerAdded.Connect((player) => this.onPlayerAdded(player));
    Players.PlayerRemoving.Connect((player) => this.onPlayerRemoving(player));
  }

  private onPlayerAdded(player: Player): void {
    const profile = PlayerProfiles.LoadProfileAsync(\`Player_\${player.UserId}\`);
    
    if (profile !== undefined) {
      profile.AddUserId(player.UserId);
      profile.Reconcile();
      
      profile.ListenToRelease(() => {
        this.profiles.delete(player);
        player.Kick();
      });
      
      if (player.IsDescendantOf(Players)) {
        this.profiles.set(player, profile);
      } else {
        profile.Release();
      }
    } else {
      player.Kick();
    }
  }

  private onPlayerRemoving(player: Player): void {
    const profile = this.profiles.get(player);
    if (profile !== undefined) {
      profile.Release();
    }
  }

  public getProfile(player: Player) {
    return this.profiles.get(player);
  }

  public addCoins(player: Player, amount: number): boolean {
    const profile = this.getProfile(player);
    if (profile !== undefined) {
      profile.Data.coins += amount;
      return true;
    }
    return false;
  }
}`;
      break;

    case 'networking':
    case 'remotes':
      dependencies.push('@rbxts/net');
      explanation = 'Type-safe networking setup using @rbxts/net for client-server communication';
      code = `// Type-safe Networking with @rbxts/net
import { NetDefinitions } from "@rbxts/net";

// Define your remote event/function types
const remotes = NetDefinitions.create({
  // Events (fire and forget)
  PlayerJoined: NetDefinitions.serverToClientEvent<[playerName: string]>(),
  UpdatePlayerStats: NetDefinitions.serverToClientEvent<[{ level: number; coins: number }]>(),
  PlayerAction: NetDefinitions.clientToServerEvent<[action: string, data?: unknown]>(),
  
  // Functions (request/response)
  GetPlayerStats: NetDefinitions.clientToServerFunction<[], { level: number; coins: number }>(),
  PurchaseItem: NetDefinitions.clientToServerFunction<[itemId: string], { success: boolean; error?: string }>(),
});

// Server-side implementation
export namespace ServerNetworking {
  export function init() {
    // Handle client requests
    remotes.server.GetPlayerStats.setCallback((player) => {
      // Return player stats from your data service
      return { level: 1, coins: 100 };
    });

    remotes.server.PurchaseItem.setCallback((player, itemId) => {
      // Handle item purchase logic
      return { success: true };
    });

    remotes.server.PlayerAction.connect((player, action, data) => {
      print(\`Player \${player.Name} performed action: \${action}\`);
    });
  }

  export function broadcastPlayerJoined(playerName: string) {
    remotes.server.PlayerJoined.sendToAllClients(playerName);
  }
}

// Client-side implementation
export namespace ClientNetworking {
  export function init() {
    // Listen for server events
    remotes.client.PlayerJoined.connect((playerName) => {
      print(\`\${playerName} joined the game!\`);
    });

    remotes.client.UpdatePlayerStats.connect((stats) => {
      // Update UI with new stats
      print(\`Stats updated: Level \${stats.level}, Coins \${stats.coins}\`);
    });
  }

  export async function getPlayerStats() {
    try {
      const stats = await remotes.client.GetPlayerStats();
      return stats;
    } catch (error) {
      warn("Failed to get player stats:", error);
      return undefined;
    }
  }

  export function sendPlayerAction(action: string, data?: unknown) {
    remotes.client.PlayerAction.send(action, data);
  }
}`;
      break;

    case 'zone':
    case 'area-detection':
      dependencies.push('@rbxts/zone-plus');
      explanation = 'Zone detection system using @rbxts/zone-plus for reliable area monitoring';
      code = `// Zone Detection with @rbxts/zone-plus
import { Zone } from "@rbxts/zone-plus";
import { Players, Workspace } from "@rbxts/services";

export class ZoneManager {
  private zones = new Map<string, Zone>();

  constructor() {
    this.setupZones();
  }

  private setupZones(): void {
    // Create zones from parts in workspace
    const zoneParts = Workspace.GetChildren().filter(
      (child): child is Part => child.IsA("Part") && child.Name.includes("Zone")
    );

    zoneParts.forEach((part) => {
      this.createZone(part.Name, part);
    });
  }

  public createZone(name: string, ...parts: BasePart[]): Zone {
    const zone = new Zone(parts);
    
    // Setup zone events
    zone.playerEntered.Connect((player) => {
      this.onPlayerEnteredZone(name, player);
    });

    zone.playerExited.Connect((player) => {
      this.onPlayerExitedZone(name, player);
    });

    this.zones.set(name, zone);
    return zone;
  }

  private onPlayerEnteredZone(zoneName: string, player: Player): void {
    print(\`\${player.Name} entered zone: \${zoneName}\`);
    
    // Handle specific zone types
    switch (zoneName.toLowerCase()) {
      case "safe-zone":
        this.handleSafeZoneEntry(player);
        break;
      case "pvp-zone":
        this.handlePvpZoneEntry(player);
        break;
      case "shop-zone":
        this.handleShopZoneEntry(player);
        break;
    }
  }

  private onPlayerExitedZone(zoneName: string, player: Player): void {
    print(\`\${player.Name} exited zone: \${zoneName}\`);
    
    switch (zoneName.toLowerCase()) {
      case "safe-zone":
        this.handleSafeZoneExit(player);
        break;
      case "pvp-zone":
        this.handlePvpZoneExit(player);
        break;
    }
  }

  private handleSafeZoneEntry(player: Player): void {
    // Make player invulnerable, show safe zone UI
  }

  private handleSafeZoneExit(player: Player): void {
    // Remove invulnerability
  }

  private handlePvpZoneEntry(player: Player): void {
    // Enable PvP, show warning
  }

  private handlePvpZoneExit(player: Player): void {
    // Disable PvP
  }

  private handleShopZoneEntry(player: Player): void {
    // Show shop UI
  }

  public getZone(name: string): Zone | undefined {
    return this.zones.get(name);
  }

  public getPlayersInZone(name: string): Player[] {
    const zone = this.zones.get(name);
    return zone ? zone.getPlayers() : [];
  }
}`;
      break;

    case 'ui':
    case 'interface':
      dependencies.push('@rbxts/fusion');
      explanation = 'Reactive UI system using @rbxts/fusion for modern interface development';
      code = `// Reactive UI with @rbxts/fusion
import Fusion from "@rbxts/fusion";
import { Players } from "@rbxts/services";

const { New, Children, Value, Computed, OnEvent } = Fusion;

// Create reactive state
const playerCoins = Value(100);
const playerLevel = Value(1);
const shopVisible = Value(false);

// Computed values
const levelProgress = Computed(() => {
  const level = playerLevel.get();
  const requiredXP = level * 100;
  const currentXP = (level - 1) * 100 + 50; // Mock current XP
  return currentXP / requiredXP;
});

export function createPlayerUI(player: Player): ScreenGui {
  const playerGui = player.WaitForChild("PlayerGui") as PlayerGui;

  return New("ScreenGui")({
    Name: "MainUI",
    Parent: playerGui,
    ResetOnSpawn: false,

    [Children]: [
      // Main HUD Frame
      New("Frame")({
        Name: "HUD",
        Size: UDim2.fromScale(1, 0.1),
        Position: UDim2.fromScale(0, 0),
        BackgroundTransparency: 1,

        [Children]: [
          // Coins Display
          New("Frame")({
            Name: "CoinsFrame",
            Size: UDim2.fromScale(0.15, 0.8),
            Position: UDim2.fromScale(0.02, 0.1),
            BackgroundColor3: Color3.fromRGB(45, 45, 45),
            BorderSizePixel: 0,

            [Children]: [
              New("UICorner")({
                CornerRadius: new UDim(0, 8),
              }),

              New("TextLabel")({
                Name: "CoinsLabel",
                Size: UDim2.fromScale(1, 1),
                BackgroundTransparency: 1,
                Text: Computed(() => \`💰 \${playerCoins.get()}\`),
                TextColor3: Color3.fromRGB(255, 255, 255),
                TextScaled: true,
                Font: Enum.Font.GothamBold,
              }),
            ],
          }),

          // Level Display
          New("Frame")({
            Name: "LevelFrame",
            Size: UDim2.fromScale(0.15, 0.8),
            Position: UDim2.fromScale(0.19, 0.1),
            BackgroundColor3: Color3.fromRGB(45, 45, 45),
            BorderSizePixel: 0,

            [Children]: [
              New("UICorner")({
                CornerRadius: new UDim(0, 8),
              }),

              New("TextLabel")({
                Name: "LevelLabel",
                Size: UDim2.fromScale(1, 0.6),
                BackgroundTransparency: 1,
                Text: Computed(() => \`Level \${playerLevel.get()}\`),
                TextColor3: Color3.fromRGB(255, 255, 255),
                TextScaled: true,
                Font: Enum.Font.Gotham,
              }),

              New("Frame")({
                Name: "ProgressBar",
                Size: UDim2.fromScale(0.9, 0.2),
                Position: UDim2.fromScale(0.05, 0.7),
                BackgroundColor3: Color3.fromRGB(100, 100, 100),
                BorderSizePixel: 0,

                [Children]: [
                  New("UICorner")({
                    CornerRadius: new UDim(0, 4),
                  }),

                  New("Frame")({
                    Name: "Progress",
                    Size: Computed(() => UDim2.fromScale(levelProgress.get(), 1)),
                    BackgroundColor3: Color3.fromRGB(0, 255, 100),
                    BorderSizePixel: 0,

                    [Children]: [
                      New("UICorner")({
                        CornerRadius: new UDim(0, 4),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          // Shop Button
          New("TextButton")({
            Name: "ShopButton",
            Size: UDim2.fromScale(0.1, 0.8),
            Position: UDim2.fromScale(0.88, 0.1),
            BackgroundColor3: Color3.fromRGB(50, 150, 255),
            Text: "🛒 Shop",
            TextColor3: Color3.fromRGB(255, 255, 255),
            TextScaled: true,
            Font: Enum.Font.GothamBold,
            BorderSizePixel: 0,

            [Children]: [
              New("UICorner")({
                CornerRadius: new UDim(0, 8),
              }),
            ],

            [OnEvent("Activated")]: () => {
              shopVisible.set(!shopVisible.get());
            },
          }),
        ],
      }),

      // Shop Window (conditional rendering)
      Computed(() => {
        if (!shopVisible.get()) return undefined;

        return New("Frame")({
          Name: "ShopWindow",
          Size: UDim2.fromScale(0.5, 0.6),
          Position: UDim2.fromScale(0.25, 0.2),
          BackgroundColor3: Color3.fromRGB(30, 30, 30),
          BorderSizePixel: 0,

          [Children]: [
            New("UICorner")({
              CornerRadius: new UDim(0, 12),
            }),

            New("TextLabel")({
              Name: "Title",
              Size: UDim2.fromScale(1, 0.15),
              BackgroundTransparency: 1,
              Text: "🛒 Item Shop",
              TextColor3: Color3.fromRGB(255, 255, 255),
              TextScaled: true,
              Font: Enum.Font.GothamBold,
            }),

            New("TextButton")({
              Name: "CloseButton",
              Size: UDim2.fromScale(0.1, 0.1),
              Position: UDim2.fromScale(0.88, 0.02),
              BackgroundColor3: Color3.fromRGB(255, 50, 50),
              Text: "❌",
              TextColor3: Color3.fromRGB(255, 255, 255),
              TextScaled: true,
              BorderSizePixel: 0,

              [Children]: [
                New("UICorner")({
                  CornerRadius: new UDim(0, 6),
                }),
              ],

              [OnEvent("Activated")]: () => {
                shopVisible.set(false);
              },
            }),
          ],
        });
      }, Fusion.cleanup),
    ],
  });
}

// Export functions to update state
export const UIState = {
  setPlayerCoins: (amount: number) => playerCoins.set(amount),
  setPlayerLevel: (level: number) => playerLevel.set(level),
  toggleShop: () => shopVisible.set(!shopVisible.get()),
};`;
      break;

    case 'service':
    case 'game-service':
      explanation = 'Custom game service using the Knit framework pattern';
      code = `// Custom Game Service
import { Players, RunService } from "@rbxts/services";

interface ServiceConfig {
  name: string;
  priority?: number;
}

export abstract class BaseService {
  public readonly name: string;
  public readonly priority: number;
  protected initialized = false;
  protected started = false;

  constructor(config: ServiceConfig) {
    this.name = config.name;
    this.priority = config.priority ?? 0;
  }

  /**
   * Called when the service is initialized
   * Use this for setting up connections and initial state
   */
  public abstract init(): void | Promise<void>;

  /**
   * Called when the service is started
   * All services will be initialized before any are started
   */
  public abstract start(): void | Promise<void>;

  /**
   * Called when the service is destroyed
   */
  public destroy(): void {
    this.started = false;
    this.initialized = false;
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public isStarted(): boolean {
    return this.started;
  }
}

// Example: Player Management Service
export class PlayerService extends BaseService {
  private players = new Map<Player, PlayerData>();
  private connections: RBXScriptConnection[] = [];

  constructor() {
    super({ name: "PlayerService", priority: 1 });
  }

  public init(): void {
    // Set up player connections
    this.connections.push(
      Players.PlayerAdded.Connect((player) => this.onPlayerAdded(player)),
      Players.PlayerRemoving.Connect((player) => this.onPlayerRemoving(player))
    );

    this.initialized = true;
  }

  public start(): void {
    // Handle existing players
    Players.GetPlayers().forEach((player) => this.onPlayerAdded(player));
    this.started = true;
  }

  public destroy(): void {
    super.destroy();
    this.connections.forEach(conn => conn.Disconnect());
    this.connections.clear();
    this.players.clear();
  }

  private onPlayerAdded(player: Player): void {
    const playerData: PlayerData = {
      userId: player.UserId,
      name: player.Name,
      joinTime: tick(),
      coins: 100,
      level: 1,
    };

    this.players.set(player, playerData);
    print(\`Player \${player.Name} has joined the game\`);
  }

  private onPlayerRemoving(player: Player): void {
    this.players.delete(player);
    print(\`Player \${player.Name} has left the game\`);
  }

  public getPlayerData(player: Player): PlayerData | undefined {
    return this.players.get(player);
  }

  public getAllPlayers(): Map<Player, PlayerData> {
    return new Map(this.players);
  }

  public updatePlayerCoins(player: Player, amount: number): boolean {
    const data = this.players.get(player);
    if (data) {
      data.coins += amount;
      return true;
    }
    return false;
  }
}

interface PlayerData {
  userId: number;
  name: string;
  joinTime: number;
  coins: number;
  level: number;
}

// Service Manager
export class ServiceManager {
  private static services: BaseService[] = [];
  private static initialized = false;

  public static addService(service: BaseService): void {
    if (this.initialized) {
      throw new Error("Cannot add services after initialization");
    }
    this.services.push(service);
  }

  public static async initialize(): Promise<void> {
    if (this.initialized) return;

    // Sort services by priority
    this.services.sort((a, b) => b.priority - a.priority);

    // Initialize all services
    for (const service of this.services) {
      await service.init();
    }

    // Start all services
    for (const service of this.services) {
      await service.start();
    }

    this.initialized = true;
  }

  public static getService<T extends BaseService>(serviceClass: new (...args: any[]) => T): T | undefined {
    return this.services.find(s => s instanceof serviceClass) as T;
  }
}

// Usage example:
// const playerService = new PlayerService();
// ServiceManager.addService(playerService);
// ServiceManager.initialize();`;
      break;

    default:
      throw new Error(`Unknown pattern: ${feature}. Available patterns: player-data, networking, zone, ui, service`);
  }

  return { code, explanation, dependencies };
}
