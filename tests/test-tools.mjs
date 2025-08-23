#!/usr/bin/env node

/**
 * Individual tool testing script
 * Run with: node test-tools.mjs
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test cases for individual tools
const toolTests = [
  {
    tool: "validate-syntax",
    cases: [
      {
        name: "Valid Roblox-ts Code",
        args: {
          code: `import { Players, Workspace } from "@rbxts/services";

const player = Players.LocalPlayer;
if (player) {
    const character = player.Character || player.CharacterAdded.Wait()[0];
    const humanoid = character.FindFirstChild("Humanoid") as Humanoid;
    if (humanoid) {
        humanoid.WalkSpeed = 20;
    }
}`
        },
        expectValid: true
      },
      {
        name: "Invalid Syntax",
        args: {
          code: `import { Players } from "@rbxts/services";
const unclosedString = "this string is not closed;
const player = Players.LocalPlayer;`
        },
        expectValid: false
      }
    ]
  },
  
  {
    tool: "generate-pattern",
    cases: [
      { name: "Networking Pattern", args: { feature: "networking", libraries: ["net"] } },
      { name: "Player Data Pattern", args: { feature: "player-data", libraries: ["profile-store"] } },
      { name: "Zone Detection Pattern", args: { feature: "zone", libraries: ["zone-plus"] } },
      { name: "Damage Types Catalog", args: { feature: "damage-types-catalog" } },
      { name: "Key/Meta Catalog", args: { feature: "key-meta-catalog" } },
      { name: "UI Pattern with Fusion", args: { feature: "ui", libraries: ["fusion"] } }
    ]
  },
  
  {
    tool: "simulate-build",
    cases: [
      {
        name: "Server-side Code",
        args: {
          code: `import { Players, DataStoreService } from "@rbxts/services";

export class GameManager {
    private playerData = DataStoreService.GetDataStore("PlayerStats");
    
    public async initializePlayer(player: Player): Promise<void> {
        const data = await this.playerData.GetAsync(\`\${player.UserId}\`);
        print(\`Player \${player.Name} initialized with data:\`, data);
    }
}`,
          target: "server"
        }
      },
      {
        name: "Client-side Code",
        args: {
          code: `import { Players, UserInputService } from "@rbxts/services";

export class InputHandler {
    constructor() {
        UserInputService.InputBegan.Connect((input) => {
            if (input.KeyCode === Enum.KeyCode.Space) {
                print("Space key pressed!");
            }
        });
    }
}`,
          target: "client"
        }
      }
    ]
  }
];

async function runToolTests() {
  console.log('🔧 Starting Individual Tool Tests...\n');
  
  const serverPath = join(__dirname, 'dist', 'server.js');
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let messageId = 1;
  
  server.stdout.on('data', (data) => {
    const responses = data.toString().trim().split('\n').filter(line => line);
    responses.forEach(response => {
      if (response) {
        try {
          const parsed = JSON.parse(response);
          if (parsed.result) {
            console.log('✅ Success:', JSON.stringify(parsed.result, null, 2));
          } else if (parsed.error) {
            console.log('❌ Error:', parsed.error);
          }
        } catch {
          console.log('📥 Response:', response);
        }
        console.log('─'.repeat(60));
      }
    });
  });
  
  server.stderr.on('data', (data) => {
    console.log('📊 Server:', data.toString().trim());
  });
  
  // Initialize server
  server.stdin.write(JSON.stringify({
    jsonrpc: "2.0",
    id: messageId++,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "tool-tester", version: "1.0.0" }
    }
  }) + '\n');
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Run all tool tests
  for (const toolTest of toolTests) {
    console.log(`\n🛠️  Testing Tool: ${toolTest.tool}`);
    console.log('═'.repeat(50));
    
    for (const testCase of toolTest.cases) {
      console.log(`\n📋 Test Case: ${testCase.name}`);
      
      const message = {
        jsonrpc: "2.0",
        id: messageId++,
        method: "tools/call",
        params: {
          name: toolTest.tool,
          arguments: testCase.args
        }
      };
      
      server.stdin.write(JSON.stringify(message) + '\n');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  setTimeout(() => {
    console.log('\n🎯 All tool tests completed!');
    server.kill();
  }, 3000);
}

runToolTests().catch(console.error);
