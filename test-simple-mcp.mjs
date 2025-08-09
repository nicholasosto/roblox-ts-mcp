import { spawn } from 'child_process';
import { createWriteStream } from 'fs';

// Simple test script that sends MCP messages directly
async function testMCPServer() {
  console.log('Testing MCP server with GDD manager...');
  
  const server = spawn('node', ['dist/server.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let responseData = '';
  
  server.stdout.on('data', (data) => {
    responseData += data.toString();
  });

  server.stderr.on('data', (data) => {
    console.error('Server error:', data.toString());
  });

  // Send initialize request
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };

  server.stdin.write(JSON.stringify(initRequest) + '\n');

  // Wait a bit for response
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Send list tools request
  const listToolsRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list',
    params: {}
  };

  server.stdin.write(JSON.stringify(listToolsRequest) + '\n');

  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('Server responses:');
  console.log(responseData);

  // Test GDD manager tool call
  const gddToolRequest = {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: {
      name: 'gdd-manager',
      arguments: {
        action: 'read',
        file_path: 'test-gdd.md'
      }
    }
  };

  server.stdin.write(JSON.stringify(gddToolRequest) + '\n');

  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\nFinal responses:');
  console.log(responseData);

  server.kill();
}

testMCPServer().catch(console.error);
