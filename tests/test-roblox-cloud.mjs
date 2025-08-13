import assert from 'node:assert/strict';
import { loadConfigFromEnv } from '../dist/roblox-cloud/config.js';

console.log('Open Cloud tests placeholder - run after build.');
try {
  process.env.ROBLOX_API_KEY = 'test_key';
  process.env.ROBLOX_UNIVERSE_ID = '1234567890';
  const cfg = loadConfigFromEnv(process.env);
  assert.equal(cfg.apiKey, 'test_key');
  assert.equal(cfg.universeId, '1234567890');
  console.log('Config load OK');
} catch (e) {
  console.error('Config load failed', e);
  process.exitCode = 1;
}
