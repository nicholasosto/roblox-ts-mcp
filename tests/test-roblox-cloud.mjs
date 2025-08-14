import assert from 'node:assert/strict';
import { loadConfigFromEnv } from '../dist/roblox-cloud/config.js';
import { listDatastores } from '../dist/roblox-cloud/datastore.js';

console.log('Open Cloud tests placeholder - run after build.');
try {
  process.env.ROBLOX_API_KEY = 'test_key';
  process.env.ROBLOX_UNIVERSE_ID = '1234567890';
  const cfg = loadConfigFromEnv(process.env);
  assert.equal(cfg.apiKey, 'test_key');
  assert.equal(cfg.universeId, '1234567890');
  console.log('Config load OK');

  // Unit test: listDatastores with stubbed HttpClient (no real network)
  const stubHttp = {
    async get(url, { params } = {}) {
      // Basic assertions on request shape
      assert.ok(String(url).includes(`/datastores/v1/universes/${cfg.universeId}/standard-datastores`));
      if (params?.limit) {
        assert.ok(params.limit >= 1 && params.limit <= 100);
      }
      // Return a fake response resembling Axios
      return {
        data: {
          datastores: [
            { name: 'PlayerData' },
            { name: 'Inventory' },
            { name: 'Settings' },
          ],
        },
        headers: {},
        status: 200,
        config: { method: 'get' },
      };
    },
  };

  const listRes = await listDatastores(/** @type {any} */ (stubHttp), cfg, { limit: 5 });
  assert.equal(listRes.success, true);
  assert.ok(Array.isArray(listRes.datastores));
  assert.deepEqual(listRes.datastores, ['PlayerData', 'Inventory', 'Settings']);
  console.log('List datastores OK:', listRes.datastores.join(', '));
} catch (e) {
  console.error('Config load failed', e);
  process.exitCode = 1;
}
