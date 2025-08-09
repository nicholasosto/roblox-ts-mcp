# Package-Specific Assistance for @rbxts Libraries

This document demonstrates the comprehensive package-specific assistance now available in the Roblox-ts MCP server.

## 🎯 **Overview**

The MCP server now includes **4 new tools** specifically designed to provide deep assistance with popular @rbxts packages:

1. **`analyze-package`** - Detailed analysis of specific @rbxts packages
2. **`suggest-package-integration`** - Multi-package integration guidance  
3. **`troubleshoot-package`** - Debug common package issues
4. **Enhanced `generate-pattern`** - Now with package-specific knowledge

## 📦 **Supported Packages**

### Core Packages Supported:
- **@rbxts/fusion** - Reactive UI framework
- **@rbxts/profile-store** - Player data management
- **@rbxts/net** - Type-safe networking
- **@rbxts/zone-plus** - Spatial detection

## 🛠️ **Tool Examples**

### 1. Analyzing @rbxts/fusion

```json
{
  "tool": "analyze-package",
  "args": {
    "packageName": "@rbxts/fusion"
  }
}
```

**Returns comprehensive information including:**
- Core types (Value<T>, Computed<T>, Observer, etc.)
- Common usage patterns
- Best practices
- Common mistakes to avoid
- Integration suggestions

### 2. Package Integration Guidance

```json
{
  "tool": "suggest-package-integration", 
  "args": {
    "packages": ["@rbxts/fusion", "@rbxts/profile-store"],
    "useCase": "Create reactive player stats UI"
  }
}
```

**Provides:**
- Specific integration patterns
- Code examples showing packages working together
- Implementation checklists
- Performance considerations

### 3. Troubleshooting Assistance

```json
{
  "tool": "troubleshoot-package",
  "args": {
    "packageName": "@rbxts/fusion", 
    "codeSnippet": "const count = Value(0); console.log(count.Value);",
    "errorMessage": "Cannot read property get of undefined"
  }
}
```

**Helps identify:**
- Common mistakes (like using .Value instead of .get())
- Best practice violations
- Integration issues

## 🎨 **Real-World Examples**

### Fusion Reactive UI Pattern

```typescript
// Player health UI that updates reactively
import { Value, Computed, New, OnEvent } from "@rbxts/fusion";

const playerHealth = Value(100);
const maxHealth = Value(100);

const healthBar = New("Frame")({
  Size: Computed(() => {
    const healthPercent = playerHealth.get() / maxHealth.get();
    return UDim2.fromScale(healthPercent, 1);
  }),
  BackgroundColor3: Computed(() => {
    const healthPercent = playerHealth.get() / maxHealth.get();
    return healthPercent > 0.5 ? Color3.new(0, 1, 0) : Color3.new(1, 0, 0);
  }),
  Parent: playerGui
});
```

### ProfileStore + Fusion Integration

```typescript
// Reactive UI based on profile data
import { ProfileStore, Profile } from "@rbxts/profile-store";
import { Value, Computed, New } from "@rbxts/fusion";

interface PlayerData {
  coins: number;
  level: number;
}

const currentProfile = Value<PlayerData | undefined>(undefined);

const coinsLabel = New("TextLabel")({
  Text: Computed(() => {
    const profile = currentProfile.get();
    return profile ? `Coins: ${profile.coins}` : "Loading...";
  })
});

// Update UI when profile loads
function onProfileLoaded(profile: Profile<PlayerData>) {
  currentProfile.set(profile.Data);
}
```

### Net + ProfileStore Server Pattern

```typescript
// Type-safe networking with profile updates
import { NetDefinitions } from "@rbxts/net";
import { ProfileStore } from "@rbxts/profile-store";

const remotes = NetDefinitions.create({
  UpdateCoins: NetDefinitions.serverToClientEvent<[amount: number]>(),
  BuyItem: NetDefinitions.clientToServerEvent<[itemId: string]>()
});

remotes.server.BuyItem.connect((player, itemId) => {
  const profile = getPlayerProfile(player);
  if (profile?.IsActive() && canAffordItem(profile, itemId)) {
    purchaseItem(profile, itemId);
    remotes.server.UpdateCoins.sendToPlayer(player, profile.Data.coins);
  }
});
```

## 🔧 **Advanced Features**

### Context-Aware Analysis
The tools can analyze your existing code and provide targeted recommendations:

```json
{
  "tool": "analyze-package",
  "args": {
    "packageName": "@rbxts/fusion",
    "codeContext": "const health = Value(100); const ui = New('Frame')({});"
  }
}
```

### Multi-Package Scenarios
Get guidance for complex scenarios involving multiple packages:

```json
{
  "tool": "suggest-package-integration",
  "args": {
    "packages": ["@rbxts/fusion", "@rbxts/profile-store", "@rbxts/net", "@rbxts/zone-plus"],
    "useCase": "Building a comprehensive RPG game with reactive UI, player data, networking, and zone detection"
  }
}
```

## 📈 **Benefits for LLM Development**

### Enhanced Context Understanding
- **Deep API Knowledge**: Understand complex package APIs beyond basic documentation
- **Integration Patterns**: Learn how packages work together effectively
- **Best Practices**: Follow established patterns from the Roblox-ts community

### Common Problem Resolution
- **Type Issues**: Understand complex generic types in packages like ProfileStore
- **Reactive Patterns**: Master Fusion's reactive programming model
- **Network Architecture**: Implement proper client-server patterns with Net

### Code Quality Improvement
- **Mistake Prevention**: Avoid common pitfalls with each package
- **Performance Optimization**: Follow performance best practices
- **Memory Management**: Proper cleanup and resource management

## 🚀 **Getting Started**

1. **Explore a Package**: Use `analyze-package` to understand any supported package
2. **Plan Integration**: Use `suggest-package-integration` for multi-package projects
3. **Debug Issues**: Use `troubleshoot-package` when facing specific problems
4. **Generate Patterns**: Use enhanced `generate-pattern` with package context

This comprehensive package assistance transforms the MCP server into a specialized Roblox-ts development companion, providing the deep package knowledge that LLMs need to assist effectively with complex @rbxts projects.
