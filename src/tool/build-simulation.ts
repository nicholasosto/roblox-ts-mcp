import { z } from 'zod';

// Validation schemas
export const SimulateBuildSchema = z.object({
  code: z.string().describe('TypeScript code to simulate compilation'),
  target: z.enum(['server', 'client', 'shared']).optional().describe('Target environment'),
});

/**
 * Simulate TypeScript to Lua compilation and check for common issues
 */
export function simulateBuild(code: string, target: 'server' | 'client' | 'shared' = 'shared'): { success: boolean; output?: string; errors?: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for server-only code in client target
  if (target === 'client') {
    if (code.includes('DataStoreService') || code.includes('ProfileStore')) {
      errors.push('DataStore operations are not allowed on the client');
    }
    if (code.includes('ServerScriptService')) {
      errors.push('ServerScriptService is not accessible from client');
    }
  }

  // Check for client-only code in server target  
  if (target === 'server') {
    if (code.includes('UserInputService') || code.includes('ContextActionService')) {
      errors.push('Input services are not available on the server');
    }
    if (code.includes('PlayerGui') || code.includes('StarterGui')) {
      errors.push('GUI services are not accessible from server');
    }
  }

  // Check for problematic TypeScript patterns
  if (code.includes('eval(')) {
    errors.push('eval() is not supported in roblox-ts');
  }
  
  if (code.includes('with (')) {
    errors.push('with statements are not supported in roblox-ts');
  }

  // Check for missing imports
  if (code.includes('game.GetService') && !code.includes('import')) {
    warnings.push('Consider using @rbxts/services for better type safety');
  }

  const success = errors.length === 0;
  let output = '';
  
  if (success) {
    output = `✅ Build simulation successful for ${target} target!\n\n`;
    if (warnings.length > 0) {
      output += `⚠️ Warnings:\n${warnings.map(w => `- ${w}`).join('\n')}\n\n`;
    }
    output += `Your code should compile successfully to Lua.`;
  }

  return {
    success,
    output: success ? output : undefined,
    errors: errors.length > 0 ? errors : undefined
  };
}
