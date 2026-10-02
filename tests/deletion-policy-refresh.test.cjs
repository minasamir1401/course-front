const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function mountHook(fetchPolicy) {
  const states = [], effects = [], timers = [], events = new Map();
  const listen = (name, callback) => events.set(name, callback);
  const window = { addEventListener: listen, removeEventListener() {}, setInterval: callback => timers.push(callback), clearInterval() {} };
  const document = { visibilityState: 'visible', addEventListener: listen, removeEventListener() {} };
  const react = { useState: initial => {
    const index = states.length; states.push(initial);
    return [initial, value => { states[index] = value; }];
  }, useEffect: effect => effects.push(effect) };
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(require.resolve('../src/hooks/useDeletionPolicy.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('require', 'module', 'exports', 'window', 'document', code)(
    name => name === 'react' ? react : { API_URL: '/api', apiFetch: fetchPolicy }, module, module.exports, window, document,
  );
  return { states, effects, timers, events, hook: module.exports.useDeletionPolicy };
}
const flush = () => new Promise(resolve => setImmediate(resolve));

test('policy changes are read on mount, polling and focus instead of caching forever', async () => {
  let allowed = true, requests = 0;
  const mounted = mountHook(async () => { requests++; return Response.json({ allowContentDeletion: allowed }); });
  mounted.hook('SCHOOL_ADMIN');
  const cleanup = mounted.effects[0]();
  await flush(); assert.equal(mounted.states[0], true);
  allowed = false; mounted.timers[0]();
  await flush(); assert.equal(mounted.states[0], false);
  allowed = true; mounted.events.get('focus')();
  await flush(); assert.equal(mounted.states[0], true);
  assert.equal(requests, 3); cleanup();
});

test('failed policy fetch fails closed and can recover on the next refresh', async () => {
  let failed = true;
  const mounted = mountHook(async () => failed ? new Response('{}', { status: 503 }) : Response.json({ allowContentDeletion: true }));
  mounted.hook('TEACHER'); mounted.effects[0]();
  await flush(); assert.equal(mounted.states[0], false);
  failed = false; mounted.events.get('content-deletion-policy-changed')();
  await flush(); assert.equal(mounted.states[0], true);
});

test('super admin always has deletion access and simultaneous readers share a request', async () => {
  let requests = 0;
  const mounted = mountHook(async () => { requests++; return Response.json({ allowContentDeletion: true }); });
  assert.equal(mounted.hook('SUPER_ADMIN'), true); mounted.effects[0]();
  await flush(); assert.equal(requests, 0);
  mounted.hook('SCHOOL_ADMIN'); mounted.hook('TEACHER');
  mounted.effects[1](); mounted.effects[2]();
  await flush(); assert.equal(requests, 1);
  assert.equal(mounted.states[1], true); assert.equal(mounted.states[2], true);
});
