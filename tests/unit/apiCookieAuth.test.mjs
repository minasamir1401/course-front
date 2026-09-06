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
