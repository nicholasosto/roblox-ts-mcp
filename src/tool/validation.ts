import { z } from 'zod';

// Validation schemas
export const ValidateSyntaxSchema = z.object({
  code: z.string().describe('Roblox-ts code to validate'),
});

/**
 * Validate Roblox-ts code for proper syntax and library usage
 */
export function validateSyntax(code: string): { valid: boolean; errors: string[]; warnings: string[]; suggestions: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Check for proper service imports
  if (code.includes('game.GetService') && !code.includes('@rbxts/services')) {
    errors.push('Use @rbxts/services for service imports instead of game.GetService()');
    suggestions.push('Replace game.GetService("Players") with import { Players } from "@rbxts/services"');
  }

  // Check for networking without @rbxts/net
  if ((code.includes('RemoteEvent') || code.includes('RemoteFunction')) && !code.includes('@rbxts/net')) {
    warnings.push('Consider using @rbxts/net for type-safe networking instead of raw RemoteEvents');
    suggestions.push('Install @rbxts/net and define remote events with type safety');
  }

  // Check for data storage without ProfileStore
  if (code.includes('DataStoreService') && !code.includes('@rbxts/profile-store')) {
    warnings.push('Consider using @rbxts/profile-store for robust data management');
    suggestions.push('ProfileStore provides session locking and data reconciliation');
  }

  // Check for zone detection with Touched events
  if (code.includes('.Touched') && !code.includes('@rbxts/zone-plus')) {
    warnings.push('Consider using @rbxts/zone-plus for reliable zone detection instead of Touched events');
    suggestions.push('Zone-Plus handles overlapping parts and provides better performance');
  }

  // Check for manual GUI manipulation without Fusion
  if (code.includes('new Instance') && code.includes('ScreenGui') && !code.includes('@rbxts/fusion')) {
    suggestions.push('Consider using @rbxts/fusion for reactive UI development');
  }

  // Check for type annotations
  if (code.includes('function') && !code.includes(':') && code.includes('=')) {
    warnings.push('Consider adding explicit type annotations for better type safety');
    suggestions.push('Example: function processPlayer(player: Player): void { ... }');
  }

  // Check for proper error handling
  if (code.includes('pcall') || code.includes('xpcall')) {
    suggestions.push('Use try-catch blocks for error handling in TypeScript instead of pcall');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
}
