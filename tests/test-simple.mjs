#!/usr/bin/env node

/**
 * Simple manual test for package assistance
 */

import { analyzePackage, suggestPackageIntegration } from '../dist/package-assistance.js';

console.log('🧪 Testing Package Assistance Functions\n');

// Test 1: Analyze @rbxts/fusion
console.log('📦 Testing @rbxts/fusion analysis:');
try {
  const fusionAnalysis = analyzePackage('@rbxts/fusion');
  console.log(fusionAnalysis.substring(0, 300) + '...\n');
  console.log('✅ Fusion analysis: SUCCESS\n');
} catch (error) {
  console.log('❌ Fusion analysis: FAILED -', error.message);
}

// Test 2: Test integration
console.log('🔗 Testing package integration:');
try {
  const integration = suggestPackageIntegration(['@rbxts/fusion', '@rbxts/profile-store'], 'Player stats UI');
  console.log(integration.substring(0, 300) + '...\n');
  console.log('✅ Package integration: SUCCESS\n');
} catch (error) {
  console.log('❌ Package integration: FAILED -', error.message);
}

// Test 3: Test unknown package
console.log('❓ Testing unknown package:');
try {
  const unknown = analyzePackage('@rbxts/nonexistent');
  console.log(unknown.substring(0, 200) + '...\n');
  console.log('✅ Unknown package handling: SUCCESS\n');
} catch (error) {
  console.log('❌ Unknown package handling: FAILED -', error.message);
}
