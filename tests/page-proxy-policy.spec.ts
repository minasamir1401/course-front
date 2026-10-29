import { test, expect } from '@playwright/test';
import { NextRequest } from 'next/server';
import { proxy } from '../src/proxy';

test('a failed verification service fails closed without discarding credentials', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response('Service unavailable', { status: 503 });
  try {
    const response = await proxy(new NextRequest('http://localhost:3000/dashboard', { headers: { Cookie: 'auth_token=unit-test-only' } }));
    expect(response.status).toBe(503); expect(response.headers.get('cache-control')).toContain('no-store');
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(await response.text()).not.toContain('unit-test-only');
  } finally { globalThis.fetch = original; }
});

test('client-supplied role headers cannot override the verified role', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ authenticated: true, user: { id: 'synthetic', role: 'STUDENT' } });
  try {
    const response = await proxy(new NextRequest('http://localhost:3000/super-admin/settings', { headers: { Cookie: 'auth_token=unit-test-only', 'x-user-role': 'SUPER_ADMIN' } }));
    expect(response.status).toBe(307); expect(response.headers.get('location')).toContain('/super-admin/login');
  } finally { globalThis.fetch = original; }
});

test('authorization headers and URL tokens cannot replace the browser login cookie', async () => {
  const original = globalThis.fetch; let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({ authenticated: true, user: { id: 'synthetic', role: 'SUPER_ADMIN' } }); };
  try {
    const response = await proxy(new NextRequest('http://localhost:3000/super-admin?token=pretend-token', { headers: { Authorization: 'Bearer pretend-token' } }));
    expect(response.status).toBe(307); expect(calls).toBe(0);
  } finally { globalThis.fetch = original; }
});
