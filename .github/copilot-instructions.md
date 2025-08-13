<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Copilot Instructions for RobloxTS-MCP-Server

This is a Model Context Protocol (MCP) server project specifically designed for Roblox-ts development assistance. You can find more info and examples at https://modelcontextprotocol.io/llms-full.txt

## Project Context

This MCP server provides:
- **Resources**: Syntax guides, design patterns, and library best practices for Roblox-ts
- **Tools**: Code validation, pattern generation, and build simulation
- **Prompts**: Templates for code generation, debugging, and architecture design

## Key Technologies & Packages

When working on this project, always consider:

### Core Stack
- **TypeScript** with strict type checking
- **@modelcontextprotocol/sdk** for MCP server implementation
- **zod** for schema validation

### Roblox-ts Ecosystem (for generated patterns)
- **@rbxts/services** - Service imports (replace game.GetService)
- **@rbxts/net** - Type-safe networking (RemoteEvents/Functions)
- **@rbxts/profile-store** - Persistent data management
- **@rbxts/zone-plus** - Spatial zone detection
- **@rbxts/fusion** - Reactive UI framework

## Code Generation Guidelines

When generating Roblox-ts code examples or patterns:

1. **Always use @rbxts/services** for service access:
   ```typescript
   import { Players, Workspace } from "@rbxts/services";
   ```

2. **Enforce @rbxts/net** for networking:
   ```typescript
   import { NetDefinitions } from "@rbxts/net";
   ```

3. **Prefer @rbxts/profile-store** for data persistence over DataStoreService

4. **Use @rbxts/zone-plus** instead of Touched events for zone detection

5. **Recommend @rbxts/fusion** for reactive UI over manual Instance creation

6. **Always include proper TypeScript types and error handling**

7. **Follow modular architecture**: server/, client/, shared/ separation

## Development Principles

- Strict type safety throughout
- Performance-conscious code patterns
- Proper error handling and validation
- Clear separation of concerns
- Comprehensive documentation
- Best practices enforcement

## Context Plans

- For ongoing Roblox Open Cloud integration work, consult `.github/roblox-open-cloud-plan.yaml` for scope, tasks, and progress. Keep updates in that YAML to minimize context size and improve coordination.

## File Structure

- `src/server.ts` - Main MCP server entry point
- `src/resources.ts` - Static resources (guides, examples)
- `src/tools.ts` - Interactive tools (validation, generation)
- `src/prompts.ts` - Prompt templates for AI assistance

When modifying these files, ensure backward compatibility with the MCP protocol and maintain consistency with existing patterns.
