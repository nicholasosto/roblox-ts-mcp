#!/usr/bin/env node

/**
 * RobloxTS MCP Server CLI
 * Allows running the server from command line
 */

const { spawn } = require('child_process');
const path = require('path');

// Get the server path (go up one level from bin to find dist)
const serverPath = path.join(__dirname, '..', 'dist', 'server.js');

// Start the server
const server = spawn('node', [serverPath], {
  stdio: 'inherit'
});

server.on('error', (error) => {
  console.error('Failed to start RobloxTS MCP Server:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  process.exit(code);
});
