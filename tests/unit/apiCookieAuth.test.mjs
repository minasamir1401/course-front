import test from 'node:test';
import assert from 'node:assert/strict';
import { apiFetch } from '../../src/lib/api.ts';

test('apiFetch uses cookie credentials instead of sending the cookie_auth marker as a JWT', async (t) => {
  let sent;
  t.mock.method(globalThis, 'fetch', async (_url, init) => {
    sent = init;
    return new Response('{}', { status: 200 });
  });
  await apiFetch('https://example.invalid/api/super-admin/stats', { headers: { Authorization: 'Bearer cookie_auth' } });
  assert.equal(sent.headers.has('Authorization'), false);
  assert.equal(sent.credentials, 'include');
});
test('apiFetch preserves explicit real tokens for impersonated student sessions', async (t) => {
  let sent;
  t.mock.method(globalThis, 'fetch', async (_url, init) => {
    sent = init;
    return new Response('{}', { status: 200 });
  });
  await apiFetch('https://example.invalid/api/exams', { headers: { Authorization: 'Bearer student.jwt.signature' } });
  assert.equal(sent.headers.get('Authorization'), 'Bearer student.jwt.signature');
});

function browser(t) {
  const previousWindow = globalThis.window;
  const previousStorage = globalThis.localStorage;
  const values = new Map();
  const redirects = [];
  globalThis.localStorage = { getItem: key => values.get(key) || null,
    setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  globalThis.window = { location: { pathname: '/super-admin', replace: path => redirects.push(path) } };
  t.after(() => {
    if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow;
    if (previousStorage === undefined) delete globalThis.localStorage; else globalThis.localStorage = previousStorage;
  });
  return { values, redirects };
}

test('expired or missing access cookie refreshes and retries with cookie credentials', async t => {
  const { redirects, values } = browser(t);
  const requests = [];
  let refreshed = false;
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    requests.push({ url: String(url), init });
    if (String(url).endsWith('/auth/refresh-token')) {
      refreshed = true;
      return Response.json({ refreshed: true, expiresAt: Date.now() + 3600000 });
    }
    return refreshed ? Response.json({ schools: 5 }) : Response.json({ error: 'Access denied. No token provided.' }, { status: 401 });
  });
  const res = await apiFetch('http://localhost:5000/api/admin/schools', { headers: { Authorization: 'Bearer cookie_auth' } });
  assert.equal(res.status, 200);
  assert.equal(requests.length, 3);
  for (const request of requests) {
    assert.equal(request.init.credentials, 'include');
    assert.equal(new Headers(request.init.headers).has('Authorization'), false);
  }
  assert.equal(redirects.length, 0);
  assert.ok(values.get('super_admin_token_expires_at'));
});

test('parallel expired requests share one refresh', async t => {
  browser(t);
  let refreshed = false; let refreshes = 0;
  t.mock.method(globalThis, 'fetch', async url => {
    if (String(url).endsWith('/auth/refresh-token')) {
      refreshes++;
      await new Promise(resolve => setTimeout(resolve, 10));
      refreshed = true;
      return Response.json({ refreshed: true });
    }
    return refreshed ? Response.json({}) : Response.json({ code: 'TOKEN_EXPIRED' }, { status: 401 });
  });
  const responses = await Promise.all([apiFetch('/api/admin/schools'), apiFetch('/api/super-admin/stats')]);
  assert.ok(responses.every(res => res.status === 200));
  assert.equal(refreshes, 1);
});

test('temporary refresh failure does not delete the session or redirect', async t => {
  const { redirects, values } = browser(t);
  values.set('super_admin_token', 'cookie_auth');
  t.mock.method(globalThis, 'fetch', async url => String(url).endsWith('/auth/refresh-token')
    ? Response.json({ error: 'Temporary outage' }, { status: 503 })
    : Response.json({ code: 'TOKEN_EXPIRED' }, { status: 401 }));
  assert.equal((await apiFetch('/api/admin/schools')).status, 401);
  assert.equal(values.get('super_admin_token'), 'cookie_auth');
  assert.deepEqual(redirects, []);
});
