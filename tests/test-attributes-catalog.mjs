#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

(async function run() {
  console.log('🔧 Testing generate-pattern for attributes-catalog...');
  const serverPath = join(__dirname, '..', 'dist', 'server.js');
  const server = spawn('node', [serverPath], { stdio: ['pipe', 'pipe', 'pipe'] });

  let id = 1;
  const send = (msg) => server.stdin.write(JSON.stringify(msg) + '\n');

  server.stderr.on('data', d => process.stderr.write(d));
  server.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        const resp = JSON.parse(line);
        if (resp.result && resp.result.content) {
          console.log('✅ Tool response received.');
          console.log(resp.result.content[0]?.text?.slice(0, 600) + '\n...');
        } else if (resp.error) {
          console.error('❌ Error:', resp.error.message || resp.error);
        }
      } catch {
        // Non-JSON logs from server
        console.log('📥', line);
      }
    }
  });

  // Initialize MCP server
  send({
    jsonrpc: '2.0',
    id: id++,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'attributes-catalog-test', version: '1.0.0' },
    },
  });

  // Wait briefly then call tool
  setTimeout(() => {
    send({
      jsonrpc: '2.0',
      id: id++,
      method: 'tools/call',
      params: {
        name: 'generate-pattern',
        arguments: { feature: 'attributes-catalog' },
      },
    });
  }, 600);

  // Exit after a short delay
  setTimeout(() => {
    server.kill();
  }, 2500);
})();
