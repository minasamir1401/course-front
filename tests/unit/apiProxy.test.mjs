import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const routePath = fileURLToPath(new URL('../../src/app/api/[...path]/route.ts', import.meta.url));

function loadRoute(fetch, env = {}, entryPath = routePath) {
  const cache = new Map();
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename).exports;
    const mod = { exports: {} };
    cache.set(filename, mod);
    const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const localRequire = createRequire(filename);
    new Function('require', 'module', 'exports', 'fetch', 'process', 'console', code)(
      (id) => id === 'node:fs' ? { appendFileSync() {} } : id.startsWith('@/') ? load(fileURLToPath(new URL(`../../src/${id.slice(2)}.ts`, import.meta.url))) : id.startsWith('.') ? load(path.resolve(path.dirname(filename), `${id}.ts`)) : localRequire(id),
      mod, mod.exports, fetch, { env: { INTERNAL_BACKEND_URL: 'http://127.0.0.1:5000', PROXY_MAX_BODY_BYTES: '8', ...env }, cwd: process.cwd }, { error() {}, warn() {} },
    );
    return mod.exports;
  }
  return load(entryPath);
}
function req(method = 'GET', body = null, headers = {}, signal = new AbortController().signal) {
  return { method, body, headers: new Headers(headers), signal, nextUrl: { search: '?a=1' }, arrayBuffer: () => new Response(body).arrayBuffer() };
}
const context = { params: Promise.resolve({ path: ['test'] }) };
const bytes = (s) => new TextEncoder().encode(s);
const chunks = (...values) => new ReadableStream({ start(c) { values.forEach(v => c.enqueue(bytes(v))); c.close(); } });

test('frontend and backend classify the three large import routes identically', () => {
  function policy(relative) {
    const filename = fileURLToPath(new URL(relative, import.meta.url));
    const source = ts.createSourceFile(filename, fs.readFileSync(filename, 'utf8'), ts.ScriptTarget.Latest, true);
    const declaration = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'acceptsLargeBody');
    assert.ok(declaration);
    return declaration.getText(source).replace(/^export /, '').replace(/\r/g, '');
  }
  const frontend = policy('../../src/lib/apiProxy.ts');
  assert.equal(frontend, policy('../../../back/src/lib/requestBodyPolicy.ts'));
  const code = ts.transpileModule(frontend, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const accepts = new Function(`${code}; return acceptsLargeBody;`)();
  for (const path of ['/api/exams', '/api/skills-hub/lessons/l/upload-excel', '/api/school/users']) assert.equal(accepts(path, 'POST'), true);
  assert.equal(accepts('/api/auth/login', 'POST'), false);
});

test('proxy forwards access and refresh cookies as separate Set-Cookie headers', async () => {
  const headers = new Headers();
  headers.append('set-cookie', 'auth_token=access; HttpOnly; Path=/; Expires=Thu, 01 Oct 2026 12:00:00 GMT');
  headers.append('set-cookie', 'auth_refresh=refresh; HttpOnly; Path=/');
  const route = loadRoute(async () => new Response('{}', { headers }));
  const response = await route.POST(req('POST'), context);
  assert.deepEqual(response.headers.getSetCookie(), headers.getSetCookie());
  await response.text();
});

test('route returns response headers and first bytes before upstream ends', async () => {
  let controller;
  const upstream = new Response(new ReadableStream({ start(c) { controller = c; c.enqueue(bytes('first')); } }), {
    status: 206, headers: { 'content-type': 'application/octet-stream', 'content-length': '99', 'content-encoding': 'gzip', 'content-range': 'bytes 0-98/100', 'connection': 'x-private', 'x-private': 'remove', 'set-cookie': 'session=ok; HttpOnly' },
  });
  const route = loadRoute(async () => upstream);
  let returned = false;
  const pending = route.GET(req(), context).then(res => { returned = true; return res; });
  await new Promise(resolve => setTimeout(resolve, 80));
  const beforeEnd = returned;
  controller.close();
  const response = await pending;
  assert.equal(beforeEnd, true, 'must not wait for upstream EOF');
  assert.equal(response.status, 206);
  assert.equal(await response.text(), 'first');
  assert.equal(response.headers.get('content-range'), 'bytes 0-98/100');
  assert.equal(response.headers.get('set-cookie'), 'session=ok; HttpOnly');
  for (const name of ['content-length', 'content-encoding', 'connection', 'x-private']) assert.equal(response.headers.has(name), false, name);
});
for (const length of [undefined, '1', '99']) {
  test(`nonmultipart oversized body returns 413 without fetch (length=${length})`, async () => {
    let calls = 0;
    const route = loadRoute(async () => { calls++; return new Response('ok'); });
    const response = await route.POST(req('POST', chunks('12345', '6789'), length ? { 'content-length': length } : {}), context);
    assert.equal(response.status, 413);
    assert.equal(calls, 0);
  });
}
test('exact body limit succeeds and false content-length is recomputed', async () => {
  let sent;
  const route = loadRoute(async (_url, init) => { sent = init; return new Response(null, { status: 204 }); });
  const response = await route.POST(req('POST', chunks('1234', '5678'), { 'content-length': '1', 'connection': 'x-private', 'x-private': 'remove' }), context);
  assert.equal(response.status, 204);
  assert.equal(new Uint8Array(sent.body).length, 8);
  assert.equal(sent.headers.has('content-length'), false);
  assert.equal(sent.headers.has('x-private'), false);
});
test('multipart body remains an unbuffered stream', async () => {
  const body = chunks('larger than the configured nonmultipart limit');
  let sent;
  const route = loadRoute(async (_url, init) => { sent = init; return new Response('ok'); });
  assert.equal((await route.POST(req('POST', body, { 'content-type': 'multipart/form-data; boundary=x', 'content-length': '99' }), context)).status, 200);
  assert.equal(sent.body, body);
  assert.equal(sent.duplex, 'half');
  assert.equal(sent.headers.has('content-length'), false);
});
for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
  test(`${method} is never retried after upstream connection failure`, async () => {
    let calls = 0;
    const route = loadRoute(async () => { calls++; throw new Error('connection reset after commit'); });
    assert.equal((await route[method](req(method, chunks('{}')), context)).status, 502);
    assert.equal(calls, 1);
  });
}
for (const status of [204, 205, 304]) {
  test(`forwards bodyless ${status} response`, async () => {
    const route = loadRoute(async () => new Response(null, { status }));
    const response = await route.GET(req(), context);
    assert.equal(response.status, status);
    assert.equal(response.body, null);
  });
}

test('client disconnect during incoming body read cancels it and returns 499', async () => {
  const client = new AbortController();
  let cancelled = false, calls = 0;
  const body = new ReadableStream({ cancel() { cancelled = true; } });
  const route = loadRoute(async () => { calls++; return new Response('unexpected'); });
  const pending = route.POST(req('POST', body, {}, client.signal), context);
  await new Promise(resolve => setImmediate(resolve));
  client.abort();
  assert.equal((await pending).status, 499);
  assert.equal(cancelled, true);
  assert.equal(calls, 0);
});
test('downstream cancellation cancels upstream and aborts its fetch signal', async () => {
  let cancelled = false, signal;
  const route = loadRoute(async (_url, init) => {
    signal = init.signal;
    return new Response(new ReadableStream({ cancel() { cancelled = true; } }));
  });
  const response = await route.GET(req(), context);
  await response.body.cancel();
  assert.equal(cancelled, true);
  assert.equal(signal.aborted, true);
});
test('GET timeout returns 504 without loopback retry', async () => {
  let calls = 0;
  const route = loadRoute(async (_url, init) => {
    calls++;
    return new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason), { once: true }));
  }, { BACKEND_REQUEST_TIMEOUT_MS: '1000' });
  const keepAlive = setTimeout(() => {}, 1500);
  try { assert.equal((await route.GET(req(), context)).status, 504); }
  finally { clearTimeout(keepAlive); }
  assert.equal(calls, 1);
});


test('default body cap stays at 2MiB even if an old deployment sets a larger global cap', async () => {
  let calls = 0;
  const route = loadRoute(async () => { calls++; return new Response('unexpected'); }, { PROXY_MAX_BODY_BYTES: String(100 * 1024 * 1024) });
  const response = await route.POST(req('POST', chunks('tiny actual body'), { 'content-length': String(2 * 1024 * 1024 + 1) }), context);
  assert.equal(response.status, 413); assert.equal(calls, 0);
});

test('large content body authenticates before reading bytes and rejects student roles', async () => {
  let reads = 0, calls = 0;
  const body = new ReadableStream({ pull(c) { reads++; c.enqueue(bytes('content')); c.close(); } }, { highWaterMark: 0 });
  const route = loadRoute(async (url) => {
    calls++; assert.equal(reads, 0); assert.match(url, /api\/auth\/me$/);
    return Response.json({ authenticated: true, user: { id: 's', role: 'STUDENT' } });
  });
  const response = await route.PUT(req('PUT', body), { params: Promise.resolve({ path: ['lessons', 'l'] }) });
  assert.equal(response.status, 403); assert.equal(reads, 0); assert.equal(calls, 1);
});

test('authorized content save accepts a body above the small default', async () => {
  const urls = [];
  const route = loadRoute(async (url, init) => {
    urls.push(url);
    if (url.endsWith('/api/auth/me')) return Response.json({ authenticated: true, user: { id: 't', role: 'TEACHER' } });
    assert.equal(new Uint8Array(init.body).length, 16);
    return Response.json({ saved: true });
  });
  const response = await route.PUT(req('PUT', chunks('1234567890abcdef')), { params: Promise.resolve({ path: ['lessons', 'l'] }) });
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), { saved: true }); assert.equal(urls.length, 2);
});

test('proxy error responses never expose internal exception details', async () => {
  const route = loadRoute(async () => { throw new Error('private-db-host secret database field'); });
  const response = await route.POST(req('POST'), context);
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: 'Failed to reach backend' });
});

test('session proxy preserves client forwarding for both verification and refresh', async () => {
  const calls = [];
  const entry = fileURLToPath(new URL('../../src/proxy.ts', import.meta.url));
  const sessionProxy = loadRoute(async (url, init) => {
    calls.push({ url, init });
    if (url.endsWith('/me')) return new Response('{}', { status: 401 });
    return Response.json({ refreshed: true, user: { id: 's', role: 'STUDENT' } }, { headers: { 'set-cookie': 'auth_token=new; HttpOnly' } });
  }, {}, entry);
  const response = await sessionProxy.proxy({
    nextUrl: { pathname: '/dashboard', search: '' }, url: 'https://school.example/dashboard',
    headers: new Headers({ 'x-forwarded-for': '203.0.113.10, 10.0.0.2' }),
    cookies: { get: name => ({ value: name === 'auth_token' ? 'old' : 'refresh' }), has: () => true },
  });
  assert.equal(response.status, 200); assert.equal(calls.length, 2);
  for (const call of calls) assert.equal(call.init.headers.get('x-forwarded-for'), '203.0.113.10, 10.0.0.2');
  assert.ok(response.headers.getSetCookie().some(value => value.startsWith('auth_token=new')));
});
