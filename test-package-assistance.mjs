#!/usr/bin/env node

/**
 * Comprehensive test suite for Package Assistance Tools
 * Tests the new @rbxts package-specific assistance features
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let testsPassed = 0;
let testsFailed = 0;

console.log('🚀 Starting Package Assistance Tools Test Suite...\n');

// Helper function to test MCP tool
async function testTool(toolName, args, description) {
  return new Promise((resolve) => {
    console.log(`⚡ Testing: ${description}`);
    
    const serverProcess = spawn('node', [join(__dirname, 'dist', 'server.js')], {
      stdio: 'pipe'
    });
    
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    };
    
    let output = '';
    let hasResponded = false;
    
    const timeout = setTimeout(() => {
      if (!hasResponded) {
        console.log(`❌ ${toolName}: Test timed out`);
        testsFailed++;
        serverProcess.kill();
        resolve();
      }
    }, 15000);
    
    serverProcess.stdout.on('data', (data) => {
      output += data.toString();
      
      // Look for complete JSON response
      const lines = output.split('\n');
      for (const line of lines) {
        if (line.trim() && line.includes('"result"') && !hasResponded) {
          hasResponded = true;
          clearTimeout(timeout);
          
          try {
            const response = JSON.parse(line);
            if (response.result && response.result.content) {
              const content = response.result.content[0].text;
              console.log(`✅ ${toolName}: Success`);
              console.log(`   Preview: ${content.substring(0, 100)}...`);
              console.log('');
              testsPassed++;
            } else {
              console.log(`❌ ${toolName}: No content in response`);
              console.log(`   Response: ${JSON.stringify(response, null, 2)}`);
              console.log('');
              testsFailed++;
            }
          } catch (error) {
            console.log(`❌ ${toolName}: JSON parse error - ${error.message}`);
            console.log(`   Raw output: ${line}`);
            console.log('');
            testsFailed++;
          }
          
          serverProcess.kill();
          resolve();
          break;
        }
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      const error = data.toString();
      if (!hasResponded) {
        hasResponded = true;
        clearTimeout(timeout);
        console.log(`❌ ${toolName}: Server error - ${error}`);
        testsFailed++;
        serverProcess.kill();
        resolve();
      }
    });
    
    serverProcess.on('close', (code) => {
      if (!hasResponded) {
        hasResponded = true;
        clearTimeout(timeout);
        if (code !== 0) {
          console.log(`❌ ${toolName}: Server exited with code ${code}`);
          testsFailed++;
        }
        resolve();
      }
    });
    
    // Send the request
    serverProcess.stdin.write(JSON.stringify(request) + '\n');
  });
}

// Test suite for package assistance tools
async function runPackageAssistanceTests() {
  console.log('📦 Package Assistance Tools Tests\n');
  
  // Test 1: Analyze @rbxts/fusion
  await testTool(
    'analyze-package', 
    { packageName: '@rbxts/fusion' },
    'Analyzing @rbxts/fusion package'
  );
  
  // Test 2: Analyze @rbxts/profile-store
  await testTool(
    'analyze-package', 
    { packageName: '@rbxts/profile-store' },
    'Analyzing @rbxts/profile-store package'
  );
  
  // Test 3: Analyze @rbxts/net
  await testTool(
    'analyze-package', 
    { packageName: '@rbxts/net' },
    'Analyzing @rbxts/net package'
  );
  
  // Test 4: Analyze @rbxts/zone-plus
  await testTool(
    'analyze-package', 
    { packageName: '@rbxts/zone-plus' },
    'Analyzing @rbxts/zone-plus package'
  );
  
  // Test 5: Analyze unknown package
  await testTool(
    'analyze-package', 
    { packageName: '@rbxts/unknown-package' },
    'Analyzing unknown package (should list available packages)'
  );
  
  // Test 6: Package integration - Fusion + ProfileStore
  await testTool(
    'suggest-package-integration',
    { 
      packages: ['@rbxts/fusion', '@rbxts/profile-store'],
      useCase: 'Create reactive player stats UI'
    },
    'Suggesting integration for Fusion + ProfileStore'
  );
  
  // Test 7: Package integration - All major packages
  await testTool(
    'suggest-package-integration',
    { 
      packages: ['@rbxts/fusion', '@rbxts/profile-store', '@rbxts/net', '@rbxts/zone-plus'],
      useCase: 'Building a comprehensive RPG game system'
    },
    'Suggesting integration for all major packages'
  );
  
  // Test 8: Troubleshoot Fusion code
  await testTool(
    'troubleshoot-package',
    { 
      packageName: '@rbxts/fusion',
      errorMessage: 'Cannot read property get of undefined',
      codeSnippet: `const count = Value(0);
console.log(count.Value); // Wrong! Should be count.get()`
    },
    'Troubleshooting Fusion code with common mistake'
  );
  
  // Test 9: Troubleshoot ProfileStore code
  await testTool(
    'troubleshoot-package',
    { 
      packageName: '@rbxts/profile-store',
      errorMessage: 'Profile is not active',
      codeSnippet: `profile.Data.coins = 100; // Missing IsActive() check`
    },
    'Troubleshooting ProfileStore code without IsActive check'
  );
  
  // Test 10: Analyze with code context
  await testTool(
    'analyze-package',
    { 
      packageName: '@rbxts/fusion',
      codeContext: `const playerHealth = Value(100);
const healthBar = New("Frame")({
  Size: Computed(() => UDim2.new(playerHealth.get() / 100, 0, 0, 20))
});`
    },
    'Analyzing Fusion with existing code context'
  );
}

// Run all tests
async function runAllTests() {
  await runPackageAssistanceTests();
  
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📈 Total: ${testsPassed + testsFailed}`);
  
  if (testsFailed === 0) {
    console.log('\n🎉 All package assistance tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above.');
    process.exit(1);
  }
}

// Handle process cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Test suite interrupted');
  process.exit(1);
});

// Run the tests
runAllTests().catch(error => {
  console.error('💥 Test suite crashed:', error);
  process.exit(1);
});
