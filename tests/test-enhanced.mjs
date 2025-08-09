#!/usr/bin/env node

/**
 * Enhanced test script for comprehensive MCP server testing
 * Run with: node test-enhanced.mjs
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Comprehensive test suite
const testSuite = [
  {
    name: "Server Initialization",
    message: {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: { roots: { listChanged: true } },
        clientInfo: { name: "enhanced-test", version: "1.0.0" }
      }
    }
  },
  
  {
    name: "List Resources",
    message: {
      jsonrpc: "2.0",
      id: 2,
      method: "resources/list",
      params: {}
    }
  },
  
  {
    name: "List Tools",
    message: {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/list",
      params: {}
    }
  },
  
  {
    name: "List Prompts",
    message: {
      jsonrpc: "2.0",
      id: 4,
      method: "prompts/list",
      params: {}
    }
  },
  
  {
    name: "Validate Valid Syntax",
    message: {
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "validate-syntax",
        arguments: {
          code: `import { Players, Workspace } from "@rbxts/services";

const player = Players.LocalPlayer;
if (player) {
    print(\`Welcome \${player.Name}!\`);
}`
        }
      }
    }
  },
  
  {
    name: "Validate Invalid Syntax",
    message: {
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: {
        name: "validate-syntax",
        arguments: {
          code: `// This should fail validation
const badCode = game.GetService("Players"); // Should use @rbxts/services
const unclosed = "string without closing quote`
        }
      }
    }
  },
  
  {
    name: "Generate Networking Pattern",
    message: {
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: {
        name: "generate-pattern",
        arguments: {
          feature: "networking",
          libraries: ["net"]
        }
      }
    }
  },
  
  {
    name: "Generate Player Data Pattern",
    message: {
      jsonrpc: "2.0",
      id: 8,
      method: "tools/call",
      params: {
        name: "generate-pattern",
        arguments: {
          feature: "player-data",
          libraries: ["profile-store"]
        }
      }
    }
  },
  
  {
    name: "Generate UI Pattern",
    message: {
      jsonrpc: "2.0",
      id: 9,
      method: "tools/call",
      params: {
        name: "generate-pattern",
        arguments: {
          feature: "ui",
          libraries: ["fusion"]
        }
      }
    }
  },
  
  {
    name: "Simulate Server Build",
    message: {
      jsonrpc: "2.0",
      id: 10,
      method: "tools/call",
      params: {
        name: "simulate-build",
        arguments: {
          code: `import { DataStoreService } from "@rbxts/services";

export class ServerDataManager {
    private dataStore = DataStoreService.GetDataStore("PlayerData");
    
    public async saveData(userId: number, data: object): Promise<boolean> {
        try {
            await this.dataStore.SetAsync(tostring(userId), data);
            return true;
        } catch (error) {
            warn("Failed to save data:", error);
            return false;
        }
    }
}`,
          target: "server"
        }
      }
    }
  },
  
  {
    name: "Simulate Client Build",
    message: {
      jsonrpc: "2.0",
      id: 11,
      method: "tools/call",
      params: {
        name: "simulate-build",
        arguments: {
          code: `import { Players, TweenService } from "@rbxts/services";

export class ClientUIManager {
    public animateButton(button: GuiButton): void {
        const tweenInfo = new TweenInfo(0.2, Enum.EasingStyle.Quad);
        const tween = TweenService.Create(button, tweenInfo, { Size: button.Size.mul(1.1) });
        tween.Play();
    }
}`,
          target: "client"
        }
      }
    }
  },
  
  {
    name: "Search Roblox Docs - RemoteEvents",
    message: {
      jsonrpc: "2.0",
      id: 12,
      method: "tools/call",
      params: {
        name: "search-roblox-docs",
        arguments: {
          query: "RemoteEvents",
          limit: 3
        }
      }
    }
  },
  
  {
    name: "Search Roblox Docs - DataStore",
    message: {
      jsonrpc: "2.0",
      id: 13,
      method: "tools/call",
      params: {
        name: "search-roblox-docs",
        arguments: {
          query: "DataStore",
          limit: 2
        }
      }
    }
  },
  
  {
    name: "Summarize TweenService Documentation",
    message: {
      jsonrpc: "2.0",
      id: 14,
      method: "tools/call",
      params: {
        name: "summarize-roblox-doc",
        arguments: {
          url: "https://create.roblox.com/docs/reference/engine/classes/TweenService"
        }
      }
    }
  }
];

async function runEnhancedTest() {
  console.log('🚀 Starting Enhanced MCP Server Test Suite...\n');
  
  const serverPath = join(__dirname, 'dist', 'server.js');
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let responseCount = 0;
  let completedTests = 0;
  
  server.stdout.on('data', (data) => {
    const responses = data.toString().trim().split('\n').filter(line => line);
    responses.forEach(response => {
      if (response) {
        responseCount++;
        try {
          const parsed = JSON.parse(response);
          console.log(`✅ Test ${responseCount} Response:`, JSON.stringify(parsed, null, 2));
        } catch {
          console.log(`📥 Raw Response ${responseCount}:`, response);
        }
        console.log('─'.repeat(80) + '\n');
      }
    });
  });
  
  server.stderr.on('data', (data) => {
    console.log('📊 Server:', data.toString().trim());
  });
  
  server.on('close', (code) => {
    console.log(`\n🎯 Test suite completed. Server exited with code ${code}`);
    console.log(`📈 Total responses received: ${responseCount}`);
  });
  
  // Wait for server startup
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Run test suite
  for (const test of testSuite) {
    console.log(`🧪 Running: ${test.name}`);
    server.stdin.write(JSON.stringify(test.message) + '\n');
    await new Promise(resolve => setTimeout(resolve, 800));
  }
  
  // Allow time for all responses
  setTimeout(() => {
    console.log('\n🏁 All tests completed. Shutting down...');
    server.kill();
  }, 5000);
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});

// Run the enhanced test
runEnhancedTest().catch(console.error);
