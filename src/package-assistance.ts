import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

/**
 * Package-specific assistance tools for @rbxts packages
 */

// Enhanced schemas for package assistance
const PackageAnalyzeSchema = z.object({
  packageName: z.string().describe('Name of the @rbxts package to analyze'),
  codeContext: z.string().optional().describe('Existing code context for better assistance'),
});

const PackageIntegrationSchema = z.object({
  packages: z.array(z.string()).describe('List of @rbxts packages to integrate'),
  useCase: z.string().describe('Specific use case or feature being built'),
});

const PackageMigrationSchema = z.object({
  fromCode: z.string().describe('Existing vanilla Roblox/Lua code to migrate'),
  targetPackage: z.string().describe('Target @rbxts package to migrate to'),
});

const PackageTroubleshootSchema = z.object({
  packageName: z.string().describe('Package experiencing issues'),
  errorMessage: z.string().optional().describe('Error message if any'),
  codeSnippet: z.string().describe('Code that is causing issues'),
});

interface PackageInfo {
  description: string;
  version: string;
  coreTypes: Record<string, string>;
  commonPatterns: Record<string, string>;
  bestPractices: string[];
  commonMistakes?: string[];
  integrations?: Record<string, string>;
}

/**
 * Comprehensive package knowledge base
 */
const PACKAGE_KNOWLEDGE: Record<string, PackageInfo> = {
  '@rbxts/fusion': {
    description: 'Reactive UI framework with declarative syntax',
    version: 'Latest',
    coreTypes: {
      'Value<T>': 'Reactive state container that holds a value and notifies changes',
      'Computed<T>': 'Derived reactive value computed from other reactive sources',
      'Observer': 'Observes reactive changes and executes side effects',
      'New': 'Factory function for creating instances with reactive properties',
      'Children': 'Reactive children property for dynamic UI structures',
      'OnEvent': 'Event handler property for instance events',
      'OnChange': 'Property change handler for reactive updates'
    },
    commonPatterns: {
      'Basic State': `const count = Value(0);
const doubledCount = Computed(() => count.get() * 2);`,
      'UI Component': `const button = New("TextButton")({
  Text: Computed(() => \`Count: \${count.get()}\`),
  Size: UDim2.fromScale(0.2, 0.1),
  [OnEvent("Activated")] = () => count.set(count.get() + 1)
});`,
      'Dynamic List': `const items = Value(["Item1", "Item2"]);
const listFrame = New("Frame")({
  Children = Computed(() => items.get().map(item => 
    New("TextLabel")({ Text: item })
  ))
});`,
      'Cleanup Pattern': `const cleanup = Observer(() => {
  print("Count changed to:", count.get());
});
// Later: cleanup();`
    },
    bestPractices: [
      'Always cleanup Observers to prevent memory leaks',
      'Use Computed for derived values instead of manual updates',
      'Batch state updates when possible',
      'Prefer New() over traditional Instance.new()',
      'Use OnEvent instead of manual event connections'
    ],
    commonMistakes: [
      'Forgetting to call cleanup() on Observers',
      'Using .Value instead of .get() and .set()',
      'Creating circular dependencies in Computed values',
      'Not understanding that Computed is lazy-evaluated'
    ],
    integrations: {
      'with @rbxts/net': 'Use reactive state to handle remote events automatically',
      'with @rbxts/profile-store': 'Create reactive UI that updates with profile data',
      'with @rbxts/zone-plus': 'Reactive zone-based UI updates'
    }
  },

  '@rbxts/profile-store': {
    description: 'Robust player data management with session locking',
    version: 'Latest',
    coreTypes: {
      'ProfileStore<T>': 'Main store class for managing profiles of type T',
      'Profile<T>': 'Individual player profile with session management',
      'ProfileTemplate': 'Default data structure for new profiles',
      'ProfileLoadPromise<T>': 'Promise that resolves to a loaded profile or undefined'
    },
    commonPatterns: {
      'Basic Setup': `interface PlayerData {
  coins: number;
  level: number;
  inventory: string[];
}

const ProfileTemplate: PlayerData = {
  coins: 100,
  level: 1,
  inventory: []
};

const PlayerProfiles = ProfileStore.create("PlayerData", ProfileTemplate);`,
      'Loading Profile': `export async function loadPlayerProfile(player: Player): Promise<Profile<PlayerData> | undefined> {
  const profile = await PlayerProfiles.loadProfileAsync(\`Player_\${player.UserId}\`);
  
  if (!profile) {
    player.Kick("Failed to load profile");
    return undefined;
  }
  
  profile.reconcile(); // Fills in missing data
  
  profile.listenToRelease(() => {
    player.Kick("Profile released");
  });
  
  return profile;
}`,
      'Safe Data Access': `function addCoins(profile: Profile<PlayerData>, amount: number): void {
  if (profile.IsActive()) {
    profile.Data.coins += amount;
    // Data saves automatically
  }
}`,
      'Profile Management': `const activeProfiles = new Map<Player, Profile<PlayerData>>();

Players.PlayerAdded.Connect(async (player) => {
  const profile = await loadPlayerProfile(player);
  if (profile) {
    activeProfiles.set(player, profile);
  }
});

Players.PlayerRemoving.Connect((player) => {
  const profile = activeProfiles.get(player);
  if (profile) {
    profile.Release();
    activeProfiles.delete(player);
  }
});`
    },
    bestPractices: [
      'Always check IsActive() before modifying profile data',
      'Use reconcile() to handle data structure updates',
      'Handle profile loading failures gracefully',
      'Release profiles when players leave',
      'Use meaningful profile keys (e.g., Player_UserId)',
      'Set up release listeners for session management'
    ],
    commonMistakes: [
      'Modifying profile.Data after profile is released',
      'Forgetting to call reconcile() after loading',
      'Not handling profile loading failures',
      'Using synchronous methods in async contexts',
      'Memory leaks from not releasing profiles'
    ],
    integrations: {
      'with @rbxts/net': 'Send profile data updates to clients',
      'with @rbxts/fusion': 'Create reactive UI based on profile data',
      'with game events': 'Save data on important game events'
    }
  },

  '@rbxts/net': {
    description: 'Type-safe networking with automatic serialization',
    version: 'Latest',
    coreTypes: {
      'NetDefinitions': 'Main class for defining remote events and functions',
      'ClientToServerEvent<T>': 'Event sent from client to server',
      'ServerToClientEvent<T>': 'Event sent from server to clients',
      'ClientToServerFunction<T, R>': 'Function called from client, executed on server',
      'ServerToClientFunction<T, R>': 'Function called from server, executed on client'
    },
    commonPatterns: {
      'Network Definitions': `// shared/network.ts
import { NetDefinitions } from "@rbxts/net";

interface CoinUpdateData {
  playerId: number;
  newAmount: number;
}

export const remotes = NetDefinitions.create({
  // Client to Server
  BuyItem: NetDefinitions.clientToServerEvent<[itemId: string, quantity: number]>(),
  RequestPlayerData: NetDefinitions.clientToServerEvent<[]>(),
  
  // Server to Client  
  CoinUpdate: NetDefinitions.serverToClientEvent<[CoinUpdateData]>(),
  PlayerJoined: NetDefinitions.serverToClientEvent<[Player]>(),
  
  // Functions
  GetPlayerStats: NetDefinitions.clientToServerFunction<[], PlayerStats>(),
});`,
      'Server Usage': `// server/main.ts
import { remotes } from "shared/network";

remotes.server.BuyItem.connect((player, itemId, quantity) => {
  const success = handleItemPurchase(player, itemId, quantity);
  if (success) {
    remotes.server.CoinUpdate.sendToPlayer(player, {
      playerId: player.UserId,
      newAmount: getPlayerCoins(player)
    });
  }
});

remotes.server.GetPlayerStats.setCallback((player) => {
  return getPlayerStats(player);
});`,
      'Client Usage': `// client/main.ts
import { remotes } from "shared/network";

// Send events
remotes.client.BuyItem.sendToServer("sword", 1);

// Listen for events
remotes.client.CoinUpdate.connect((data) => {
  updateCoinDisplay(data.newAmount);
});

// Call functions
const stats = await remotes.client.GetPlayerStats.invoke();`
    },
    bestPractices: [
      'Define all remotes in shared modules',
      'Use descriptive names for remote events',
      'Include type information in remote definitions',
      'Group related remotes together',
      'Use functions for request/response patterns',
      'Handle network errors gracefully'
    ],
    commonMistakes: [
      'Forgetting to import remotes in server/client',
      'Using wrong server/client methods',
      'Not handling function invoke failures',
      'Creating remotes in server/client code',
      'Incorrect type annotations'
    ]
  },

  '@rbxts/zone-plus': {
    description: 'Advanced spatial detection with optimized performance',
    version: 'Latest',
    coreTypes: {
      'Zone': 'Main zone class for spatial detection',
      'ZoneController': 'Global controller for managing multiple zones',
      'ZoneGroup': 'Collection of zones with shared properties'
    },
    commonPatterns: {
      'Basic Zone': `import { Zone } from "@rbxts/zone-plus";

const container = workspace.WaitForChild("SafeZone") as Model;
const safeZone = new Zone(container);

safeZone.playerEntered.Connect((player) => {
  print(\`\${player.Name} entered safe zone\`);
  // Apply safe zone effects
  player.Character?.SetAttribute("InSafeZone", true);
});

safeZone.playerExited.Connect((player) => {
  print(\`\${player.Name} left safe zone\`);
  player.Character?.SetAttribute("InSafeZone", false);
});`,
      'Zone Groups': `import { Zone, ZoneController } from "@rbxts/zone-plus";

// Create multiple related zones
const pvpZones = new Array<Zone>();
const pvpModels = workspace.PvpZones.GetChildren() as Model[];

for (const model of pvpModels) {
  const zone = new Zone(model);
  zone.playerEntered.Connect(enablePvP);
  zone.playerExited.Connect(disablePvP);
  pvpZones.push(zone);
}`,
      'Zone Detection': `// Check if player is in zone
const playersInZone = safeZone.getPlayers();
const isPlayerInZone = safeZone.findPlayer(player);

// Get all zones player is in
const allZones = ZoneController.getPlayerZones(player);`
    },
    bestPractices: [
      'Use Zone-Plus instead of Touched events',
      'Group zone parts under Models or Folders',
      'Set accurate zone boundaries',
      'Handle zone transitions smoothly',
      'Use ZoneController for global zone queries'
    ]
  }
};

/**
 * Analyze a specific @rbxts package and provide detailed assistance
 */
function analyzePackage(packageName: string, codeContext?: string): string {
  const knowledge = PACKAGE_KNOWLEDGE[packageName as keyof typeof PACKAGE_KNOWLEDGE];
  
  if (!knowledge) {
    return `Package "${packageName}" not found in knowledge base. 

Available packages:
${Object.keys(PACKAGE_KNOWLEDGE).map(pkg => `- ${pkg}`).join('\n')}

For comprehensive assistance, try one of the supported packages above.`;
  }

  const analysis = `# ${packageName} Analysis & Assistance

## 📖 Overview
${knowledge.description}

## 🏗️ Core Types
${Object.entries(knowledge.coreTypes).map(([type, desc]) => `- **\`${type}\`**: ${desc}`).join('\n')}

## 📝 Common Patterns

${Object.entries(knowledge.commonPatterns).map(([name, code]) => `### ${name}
\`\`\`typescript
${code}
\`\`\`
`).join('\n')}

## ✅ Best Practices
${knowledge.bestPractices.map(practice => `- ${practice}`).join('\n')}

## ❌ Common Mistakes to Avoid
${knowledge.commonMistakes?.map(mistake => `- ${mistake}`).join('\n') || 'None documented'}

## 🔗 Package Integrations
${knowledge.integrations ? Object.entries(knowledge.integrations).map(([pkg, desc]) => `- **${pkg}**: ${desc}`).join('\n') : 'None documented'}

${codeContext ? `## 💡 Context-Specific Recommendations

Based on your code context:
\`\`\`typescript
${codeContext}
\`\`\`

Consider these improvements:
- Ensure you're following the best practices listed above
- Check for common mistakes in your implementation
- Consider integrating with other @rbxts packages for enhanced functionality` : ''}`;

  return analysis;
}

/**
 * Suggest how to integrate multiple packages effectively
 */
function suggestPackageIntegration(packages: string[], useCase: string): string {
  const validPackages = packages.filter(pkg => pkg in PACKAGE_KNOWLEDGE);
  
  if (validPackages.length === 0) {
    return `No supported packages found in: ${packages.join(', ')}

Supported packages: ${Object.keys(PACKAGE_KNOWLEDGE).join(', ')}`;
  }

  const integrations = `# Package Integration Strategy

## 🎯 Use Case: ${useCase}

## 📦 Packages to Integrate: ${validPackages.join(', ')}

## 🔧 Integration Patterns

${generateIntegrationExamples(validPackages, useCase)}

## 📋 Implementation Checklist

${generateImplementationChecklist(validPackages)}

## ⚠️ Potential Conflicts & Solutions

${generateConflictResolutions(validPackages)}

## 🚀 Performance Considerations

${generatePerformanceTips(validPackages)}`;

  return integrations;
}

function generateIntegrationExamples(packages: string[], useCase: string): string {
  const examples = [];
  
  if (packages.includes('@rbxts/fusion') && packages.includes('@rbxts/profile-store')) {
    examples.push(`### Fusion + ProfileStore (Reactive Player Data UI)

\`\`\`typescript
// Reactive UI that updates with profile data
const playerProfile = Value<PlayerData | undefined>(undefined);

// Update UI when profile changes
const coinsDisplay = New("TextLabel")({
  Text: Computed(() => {
    const profile = playerProfile.get();
    return profile ? \`Coins: \${profile.coins}\` : "Loading...";
  }),
  Parent: playerGui
});

// Update reactive state when profile data changes
function updateProfileState(profile: Profile<PlayerData>) {
  playerProfile.set(profile.Data);
}
\`\`\``);
  }

  if (packages.includes('@rbxts/net') && packages.includes('@rbxts/profile-store')) {
    examples.push(`### Net + ProfileStore (Networked Data Management)

\`\`\`typescript
// Server: Send profile updates to client
remotes.server.ProfileUpdate.connect((player) => {
  const profile = getPlayerProfile(player);
  if (profile?.IsActive()) {
    remotes.server.ProfileData.sendToPlayer(player, profile.Data);
  }
});

// Client: Receive and handle profile updates
remotes.client.ProfileData.connect((profileData) => {
  updatePlayerUI(profileData);
});
\`\`\``);
  }

  return examples.join('\n\n') || 'No specific integration examples available for this combination.';
}

function generateImplementationChecklist(packages: string[]): string {
  const checklist: string[] = [];
  
  packages.forEach(pkg => {
    const knowledge = PACKAGE_KNOWLEDGE[pkg];
    if (knowledge?.bestPractices) {
      checklist.push(`### ${pkg}
${knowledge.bestPractices.map(practice => `- [ ] ${practice}`).join('\n')}`);
    }
  });
  
  return checklist.join('\n\n');
}

function generateConflictResolutions(packages: string[]): string {
  if (packages.includes('@rbxts/fusion') && packages.includes('@rbxts/roact')) {
    return '- **Fusion + Roact**: These are competing UI frameworks. Choose one or the other, not both.';
  }
  
  return 'No known conflicts between the selected packages.';
}

function generatePerformanceTips(packages: string[]): string {
  const tips = [];
  
  if (packages.includes('@rbxts/fusion')) {
    tips.push('- **Fusion**: Use Observer cleanup to prevent memory leaks, batch state updates');
  }
  
  if (packages.includes('@rbxts/profile-store')) {
    tips.push('- **ProfileStore**: Release profiles properly, use reconcile() for data updates');
  }
  
  if (packages.includes('@rbxts/zone-plus')) {
    tips.push('- **Zone-Plus**: Optimize zone boundaries, use zone groups for related areas');
  }
  
  return tips.join('\n') || 'No specific performance tips available.';
}

/**
 * Export the package assistance functions
 */
export {
  analyzePackage,
  suggestPackageIntegration,
  PACKAGE_KNOWLEDGE,
  PackageAnalyzeSchema,
  PackageIntegrationSchema,
  PackageMigrationSchema,
  PackageTroubleshootSchema
};
