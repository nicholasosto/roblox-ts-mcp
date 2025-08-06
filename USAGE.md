# Using RobloxTS-MCP Server in Your Projects

## Installation Methods

### Method 1: Global Installation (Recommended)

1. **Install globally via npm:**
   ```bash
   npm install -g /path/to/your/roblox-ts-mcp
   # Or if published to npm:
   npm install -g roblox-ts-mcp
   ```

2. **Configure in your VS Code settings:**
   ```json
   {
     "mcp.servers": {
       "roblox-ts": {
         "command": "roblox-ts-mcp-server",
         "args": []
       }
     }
   }
   ```

### Method 2: Project-Specific Installation

1. **Install as dev dependency:**
   ```bash
   cd your-roblox-project
   npm install --save-dev /path/to/your/roblox-ts-mcp
   ```

2. **Add to package.json scripts:**
   ```json
   {
     "scripts": {
       "mcp": "node node_modules/roblox-ts-mcp/dist/server.js"
     }
   }
   ```

### Method 3: Direct Node.js Usage

```bash
# Run directly from your built server
node /path/to/roblox-ts-mcp/dist/server.js
```

## VS Code Integration

### Claude Desktop Integration

Add to your Claude Desktop config (`~/.claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "roblox-ts": {
      "command": "node",
      "args": ["/absolute/path/to/roblox-ts-mcp/dist/server.js"]
    }
  }
}
```

### Continue.dev Integration

Add to your `.continuerc.json`:

```json
{
  "models": [
    {
      "provider": "anthropic",
      "model": "claude-3-5-sonnet-20241022",
      "apiKey": "your-key"
    }
  ],
  "mcpServers": [
    {
      "name": "roblox-ts",
      "command": "node",
      "args": ["/path/to/roblox-ts-mcp/dist/server.js"]
    }
  ]
}
```

## Available Features

### 🔧 Tools
- `validate-syntax` - Validate Roblox-ts code syntax and best practices
- `generate-pattern` - Generate boilerplate for networking, UI, data management, etc.
- `simulate-build` - Simulate TypeScript to Lua compilation
- `search-roblox-docs` - Search official Roblox documentation
- `summarize-roblox-doc` - Summarize specific documentation pages

### 📚 Resources
- `roblox-ts://syntax` - Syntax and type safety guidelines
- `roblox-ts://design-patterns` - Architectural patterns
- `roblox-ts://library-best-practices` - @rbxts package best practices
- `roblox-docs://search` - Searchable Roblox documentation

### 💡 Prompts
- `roblox-ts-code-generation` - Generate code following best practices
- `roblox-ts-debugging` - Debug and fix issues
- `roblox-ts-architecture` - Design project architecture
- `roblox-ts-migration` - Migrate Lua to TypeScript
- `roblox-ts-optimization` - Performance optimization
- `roblox-ts-testing` - Create tests

## Example Usage in Different Projects

### Game Development Project
```typescript
// Use the MCP to generate networking patterns
// Tool: generate-pattern -> networking
// Generates @rbxts/net setup with type safety

// Use docs search for Roblox API references
// Tool: search-roblox-docs -> "TweenService"
```

### UI Framework Project
```typescript
// Generate reactive UI patterns
// Tool: generate-pattern -> ui (with @rbxts/fusion)

// Validate component syntax
// Tool: validate-syntax -> your component code
```

### Data Management System
```typescript
// Generate ProfileStore patterns
// Tool: generate-pattern -> player-data

// Get DataStore documentation
// Tool: search-roblox-docs -> "DataStore"
```

## Project Types That Benefit

✅ **Roblox Game Development** - Complete game projects
✅ **Roblox Libraries** - Creating @rbxts packages  
✅ **Learning Projects** - Educational Roblox-ts code
✅ **Migration Projects** - Converting Lua to TypeScript
✅ **Team Development** - Consistent patterns across developers
✅ **Open Source Projects** - Documentation and examples

## Best Practices

1. **Consistent Usage**: Use across all team members for consistent patterns
2. **Pattern Generation**: Generate boilerplate instead of copying/pasting
3. **Documentation Integration**: Use docs search for up-to-date Roblox info
4. **Syntax Validation**: Validate code before committing
5. **Architecture Planning**: Use prompts for project structure decisions
