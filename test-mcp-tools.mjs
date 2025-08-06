#!/usr/bin/env node

/**
 * Test MCP server tools directly
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Testing MCP Server Tools...\n');

function testMCPServer() {
  return new Promise((resolve) => {
    const serverProcess = spawn('node', [join(__dirname, 'dist', 'server.js')], {
      stdio: 'pipe'
    });
    
    // Test 1: List tools
    const listRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list'
    };
    
    let output = '';
    let hasResponded = false;
    
    const timeout = setTimeout(() => {
      if (!hasResponded) {
        console.log('❌ Server timed out');
        serverProcess.kill();
        resolve();
      }
    }, 10000);
    
    serverProcess.stdout.on('data', (data) => {
      output += data.toString();
      
      const lines = output.split('\n');
      for (const line of lines) {
        if (line.trim() && line.includes('"result"') && !hasResponded) {
          hasResponded = true;
          clearTimeout(timeout);
          
          try {
            const response = JSON.parse(line);
            if (response.result && response.result.tools) {
              const tools = response.result.tools;
              console.log(`✅ Server responding with ${tools.length} tools:`);
              tools.forEach(tool => {
                console.log(`   📦 ${tool.name}: ${tool.description}`);
              });
              
              // Check if our new tools are present
              const newTools = ['analyze-package', 'suggest-package-integration', 'troubleshoot-package'];
              const foundNewTools = newTools.filter(toolName => 
                tools.some(tool => tool.name === toolName)
              );
              
              if (foundNewTools.length === newTools.length) {
                console.log('\n🎉 All new package assistance tools are available!');
              } else {
                console.log(`\n⚠️  Missing tools: ${newTools.filter(t => !foundNewTools.includes(t)).join(', ')}`);
              }
            }
          } catch (error) {
            console.log(`❌ JSON parse error: ${error.message}`);
          }
          
          serverProcess.kill();
          resolve();
          break;
        }
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      // Server startup message goes to stderr, that's normal
      const message = data.toString();
      if (message.includes('RobloxTS-MCP server running')) {
        console.log('✅ Server started successfully');
      }
    });
    
    // Send the list tools request
    serverProcess.stdin.write(JSON.stringify(listRequest) + '\n');
  });
}

testMCPServer();
