import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ts = require('typescript');
function harness() {
  const effects = [], states = [], queued = [];
  let owner = { userId: 'account-a', schoolId: 'school-a' }, rejectStorage = false, resolveFetch;
  const react = { createContext: () => ({ Provider: 'provider' }), useContext() {}, useState(initial) { const index = states.length; states.push(initial); return [initial, next => { states[index] = typeof next === 'function' ? next(states[index]) : next; }]; }, useEffect: fn => effects.push(fn), useCallback: fn => fn, useRef: value => ({ current: value }) };
  const window = { location: { origin: 'https://example.invalid' }, addEventListener() {}, removeEventListener() {}, fetch: () => new Promise(resolve => { resolveFetch = resolve; }) };
  const offlineSync = { enqueue: async entry => { queued.push(entry); if (rejectStorage) throw new Error('quota'); }, getPending: () => [], flush: async () => {} };
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(new URL('../../src/context/NotificationContext.tsx', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  new Function('require', 'module', 'exports', 'window', 'navigator', 'localStorage', 'setTimeout', code)(id => id === 'react' ? react : id === '@/lib/offlineSync' ? { offlineSync, captureOfflineOwner: () => owner } : id === 'lucide-react' ? {} : require(id), mod, mod.exports, window, { onLine: true }, { getItem: () => 'en' }, () => 0);
  mod.exports.NotificationProvider({ children: null });
  effects.forEach(fn => fn());
  return { window, queued, states, switchOwner: () => { owner = { userId: 'account-b', schoolId: 'school-b' }; }, failStorage: () => { rejectStorage = true; }, resolve: () => resolveFetch(new Response('{}', { status: 503 })) };
}
test('failed request retains owner from before fetch despite account switch', async () => {
  const h = harness();
  const pending = h.window.fetch('/api/courses', { method: 'POST', body: '{}', headers: { 'content-type': 'application/json' } });
  h.switchOwner(); h.resolve(); await pending;
  assert.deepEqual(h.queued[0].owner, { userId: 'account-a', schoolId: 'school-a' });
});
test('failed durable queue persistence surfaces an error and does not replace HTTP result', async () => {
  const h = harness(); h.failStorage();
  const pending = h.window.fetch('/api/courses', { method: 'PUT', body: '{}' });
  h.resolve(); assert.equal((await pending).status, 503);
  assert.ok(h.states[0].some(toast => /could not be saved locally/i.test(toast.message)));
});
test('replay requests are never queued a second time', async () => {
  const h = harness();
  const pending = h.window.fetch('/api/courses', { method: 'PUT', body: '{}', headers: { 'X-Offline-User-Id': 'account-a' } });
  h.resolve(); await pending;
  assert.equal(h.queued.length, 0);
});
