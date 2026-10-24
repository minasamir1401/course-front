const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('installed app fetches current navigations, keeps offline fallback and does not intercept API requests', async () => {
  const handlers = {}, calls = [], removed = [];
  let offline = false, claimed = false;
  vm.runInNewContext(fs.readFileSync(require.resolve('../public/sw.js'), 'utf8'), {
    self: { addEventListener: (name, fn) => { handlers[name] = fn; }, clients: { claim: () => { claimed = true; } } },
    caches: { keys: async () => ['klevro-public-offline-v1', 'klevro-public-offline-v2', 'other-app-cache'], delete: async key => { removed.push(key); }, match: async url => ({ offline: url }) },
    fetch: async (request, options) => { calls.push({ request, options }); if (offline) throw Error('offline'); return { fresh: true }; },
  });
  let pending;
  handlers.activate({ waitUntil: value => { pending = value; } }); await pending;
  assert.deepEqual(removed, ['klevro-public-offline-v1']); assert.equal(claimed, true);
  const request = { mode: 'navigate', method: 'GET' };
  handlers.fetch({ request, respondWith: value => { pending = value; } });
  assert.equal((await pending).fresh, true); assert.equal(calls[0].options.cache, 'no-store');
  offline = true;
  handlers.fetch({ request, respondWith: value => { pending = value; } });
  assert.equal((await pending).offline, '/offline.html');
  let intercepted = false;
  handlers.fetch({ request: { mode: 'cors', method: 'GET' }, respondWith: () => { intercepted = true; } });
  assert.equal(intercepted, false);
});
