import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const routePath = fileURLToPath(new URL('../../src/app/api/[...path]/route.ts', import.meta.url));

function loadRoute(fetch, env = {}) {
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
      (id) => id === 'node:fs' ? { appendFileSync() {} } : id.startsWith('.') ? load(path.resolve(path.dirname(filename), `${id}.ts`)) : localRequire(id),
      mod, mod.exports, fetch, { env: { INTERNAL_BACKEND_URL: 'http://127.0.0.1:5000', PROXY_MAX_BODY_BYTES: '8', ...env }, cwd: process.cwd }, { error() {}, warn() {} },
    );
    return mod.exports;
  }
  return load(routePath);
}
function req(method = 'GET', body = null, headers = {}, signal = new AbortController().signal) {
  return { method, body, headers: new Headers(headers), signal, nextUrl: { search: '?a=1' }, arrayBuffer: () => new Response(body).arrayBuffer() };
}
const context = { params: Promise.resolve({ path: ['test'] }) };
const bytes = (s) => new TextEncoder().encode(s);
const chunks = (...values) => new ReadableStream({ start(c) { values.forEach(v => c.enqueue(bytes(v))); c.close(); } });

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
