#!/usr/bin/env node

/**
 * Simple test script to verify the MCP server functionality
 * Run with: node test-mcp.js
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test messages to send to the MCP server
const testMessages = [
  // Initialize the server
  {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {
        roots: {
          listChanged: true
        }
      },
      clientInfo: {
        name: "test-client",
        version: "1.0.0"
      }
    }
  },
  
  // List available resources
  {
    jsonrpc: "2.0",
    id: 2,
    method: "resources/list",
    params: {}
  },
  
  // List available tools
  {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/list",
    params: {}
  },
  
  // Test syntax validation tool
  {
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "validate-syntax",
      arguments: {
        code: `import { Players } from "@rbxts/services";
const player = Players.LocalPlayer;
// This should pass validation`
      }
    }
  },
  
  // Test pattern generation tool
  {
    jsonrpc: "2.0",
    id: 5,
    method: "tools/call",
    params: {
      name: "generate-pattern",
      arguments: {
        feature: "networking",
        libraries: ["net"]
      }
    }
  }
];

async function testMCPServer() {
  console.log('🚀 Starting MCP Server test...\n');
  
  // Start the MCP server
  const serverPath = join(__dirname, 'dist', 'server.js');
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let responseCount = 0;
  
  server.stdout.on('data', (data) => {
    const response = data.toString().trim();
    if (response) {
      console.log(`📥 Response ${++responseCount}:`, response);
      console.log('');
    }
  });
  
  server.stderr.on('data', (data) => {
    console.log('📊 Server info:', data.toString().trim());
  });
  
  server.on('close', (code) => {
    console.log(`\n✅ Server exited with code ${code}`);
  });
  
  // Wait a moment for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Send test messages
  for (const [index, message] of testMessages.entries()) {
    console.log(`📤 Sending message ${index + 1}: ${message.method}`);
    server.stdin.write(JSON.stringify(message) + '\n');
    
    // Wait between messages
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Give some time for responses
  setTimeout(() => {
    console.log('\n🏁 Test completed. Shutting down server...');
    server.kill();
  }, 3000);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

// Run the test
testMCPServer().catch(console.error);
