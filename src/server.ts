#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { addResources } from './resources';
import { addTools } from './tools';
import { addPrompts } from './prompts';

/**
 * RobloxTS-MCP Server
 * 
 * An MCP server that provides resources, tools, and prompts for Roblox-ts development.
 * Enforces best practices and proper usage of @rbxts packages.
 */
class RobloxTSMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'RobloxTS-MCP',
        version: '1.0.2',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
          prompts: {},
        },
      }
    );

    this.setupHandlers();
    this.registerResourcesToolsAndPrompts();
  }

  private setupHandlers(): void {
    // Error handling
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private registerResourcesToolsAndPrompts(): void {
    // Register resources, tools, and prompts
    addResources(this.server);
    addTools(this.server);
    addPrompts(this.server);
  }

  public async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('RobloxTS-MCP server running on stdio');
  }
}

// Create and start the server
const server = new RobloxTSMCPServer();
server.run().catch((error) => {
  console.error('Failed to run server:', error);
  process.exit(1);
});
