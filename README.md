# RobloxTS-MCP-Server

A Model Context Protocol (MCP) server designed specifically for Roblox-ts development. This server provides AI models with comprehensive resources, tools, and prompt templates to understand and enforce best practices for Roblox-ts game development.

## Features

### 🔧 Resources
- **Roblox-ts Syntax Guide**: Proper service imports, type safety, and compilation considerations
- **Design Patterns**: Modular architecture, MVC pattern, object pooling, and project structure
- **Library Best Practices**: Comprehensive guides for @rbxts ecosystem packages

### 🛠️ Tools
- **Syntax Validator**: Validates code for proper @rbxts library usage and best practices
- **Pattern Generator**: Generates boilerplate code for common features (networking, data management, UI, zones)
- **Build Simulator**: Simulates TypeScript-to-Lua compilation and catches common issues
- **Documentation Search**: Search and summarize official Roblox documentation
- **Package Assistant**: Analyze, integrate, and troubleshoot @rbxts packages
- **GDD Manager**: Comprehensive Game Design Document management with structured operations for milestones, features, and tasks

### 📝 Prompt Templates
- **Code Generation**: Generate complete Roblox-ts modules following best practices
- **Debugging Assistant**: Debug and fix Roblox-ts code issues
- **Architecture Design**: Design scalable project architectures
- **Migration Helper**: Convert Lua code to Roblox-ts
- **Performance Optimization**: Optimize code for better performance
- **Testing**: Create comprehensive test suites

## Enforced Libraries

This MCP server enforces the use of these recommended @rbxts packages:

- **[@rbxts/services](https://www.npmjs.com/package/@rbxts/services)**: Type-safe service access
- **[@rbxts/net](https://www.npmjs.com/package/@rbxts/net)**: Type-safe networking
- **[@rbxts/profile-store](https://www.npmjs.com/package/@rbxts/profile-store)**: Persistent data management
- **[@rbxts/zone-plus](https://www.npmjs.com/package/@rbxts/zone-plus)**: Reliable zone detection
- **[@rbxts/fusion](https://www.npmjs.com/package/@rbxts/fusion)**: Reactive UI framework

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- An MCP-compatible client (Claude Desktop, Anthropic's MCP tools, etc.)

### Building the Server

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the TypeScript code:
   ```bash
   npm run build
   ```
4. Test the server:
   ```bash
   npm start
   ```

## Usage with MCP Clients

### Claude Desktop Configuration

Add the following to your Claude Desktop MCP configuration:

```json
{
  "servers": {
    "roblox-ts-mcp": {
      "type": "stdio",
      "command": "node",
      "args": ["path/to/roblox-ts-mcp/dist/server.js"]
    }
  }
}
```

### Available Resources

Query these resources for development guidance:
- `roblox-ts://syntax` - Syntax and type safety guide
- `roblox-ts://design-patterns` - Architecture patterns
- `roblox-ts://library-best-practices` - @rbxts library usage

### Available Tools

Use these tools for code assistance:

- `validate-syntax` - Check code compliance
- `generate-pattern` - Create boilerplate code
- `simulate-build` - Test compilation
- `search-roblox-docs` - Search official Roblox documentation
- `summarize-roblox-doc` - Summarize Roblox documentation pages
- `analyze-package` - Analyze @rbxts packages
- `suggest-package-integration` - Suggest package integration strategies
- `troubleshoot-package` - Troubleshoot package issues
- `gdd-manager` - Manage Game Design Documents with structured operations

#### GDD Manager Tool

The `gdd-manager` tool provides comprehensive Game Design Document management with support for:

- **Reading & Parsing**: Parse YAML frontmatter and Markdown content
- **Feature Management**: Add, update, and query features with priorities and milestones
- **Task Management**: Organize tasks within features with estimates
- **Content Updates**: Modify specific sections of document content
- **Validation**: Comprehensive structure and reference validation
- **Export & Reporting**: Generate summaries in Markdown, JSON, or CSV formats

See [GDD-MANAGER-GUIDE.md](./GDD-MANAGER-GUIDE.md) for detailed usage instructions.

### Available Prompts

Use these prompt templates:
- `roblox-ts-code-generation` - Generate new code
- `roblox-ts-debugging` - Fix issues
- `roblox-ts-architecture` - Design architecture
- `roblox-ts-migration` - Convert Lua to TypeScript
- `roblox-ts-optimization` - Improve performance
- `roblox-ts-testing` - Create tests

## Development

### Project Structure

```
src/
├── server.ts      # Main MCP server
├── resources.ts   # Static resources and guides
├── tools.ts       # Interactive tools
└── prompts.ts     # Prompt templates
```

### Adding New Features

1. **Resources**: Add new guides to `resources.ts`
2. **Tools**: Implement new tools in `tools.ts`
3. **Prompts**: Create templates in `prompts.ts`

### Testing

Run the build to check for TypeScript errors:
```bash
npm run build
```

Test the server with an MCP client or debugging tools.

## Examples

### Using the Syntax Validator

```json
{
  "tool": "validate-syntax",
  "arguments": {
    "code": "import { Players } from '@rbxts/services';\nconst player = Players.LocalPlayer;"
  }
}
```

### Generating a Player Data System

```json
{
  "tool": "generate-pattern",
  "arguments": {
    "feature": "player-data",
    "libraries": ["profile-store"]
  }
}
```

### Creating Architecture Guidance

```json
{
  "prompt": "roblox-ts-architecture",
  "arguments": {
    "project_type": "multiplayer RPG",
    "features": ["combat", "inventory", "quests", "guilds"],
    "scale": "100+ concurrent players"
  }
}
```

## Best Practices Enforced

- **Type Safety**: Strict TypeScript usage with proper annotations
- **Service Access**: Use @rbxts/services instead of game.GetService()
- **Networking**: Type-safe remotes with @rbxts/net
- **Data Management**: ProfileStore for persistence over raw DataStore
- **Zone Detection**: Zone-Plus instead of Touched events
- **UI Development**: Fusion for reactive interfaces
- **Architecture**: Modular server/client/shared structure
- **Performance**: Optimized patterns for Roblox environments

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `npm run build`
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues, feature requests, or questions:
- Open an issue on the repository
- Check the MCP documentation at https://modelcontextprotocol.io

## Related Projects

- [roblox-ts](https://roblox-ts.com/) - TypeScript to Lua compiler for Roblox
- [Model Context Protocol](https://modelcontextprotocol.io/) - Protocol for AI model context
- [@rbxts packages](https://www.npmjs.com/search?q=%40rbxts) - TypeScript packages for Roblox
