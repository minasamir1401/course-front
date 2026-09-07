import { NextRequest, NextResponse } from 'next/server';

// Runtime proxy: forwards all /api/* requests to the backend
// This runs at REQUEST TIME (not build time), so env vars are always available
import fs from 'node:fs';
import nodePath from 'node:path';
import { ProxyBodyTooLargeError, proxyBodyLimit, proxyLifetime, readProxyBody, proxyResponseBody } from '../../../lib/apiProxy';

const BACKEND_REQUEST_TIMEOUT_MS = Math.max(
  1_000,
  Number(process.env.BACKEND_REQUEST_TIMEOUT_MS) || 60_000
);
const BACKEND_WRITE_TIMEOUT_MS = Math.max(
  BACKEND_REQUEST_TIMEOUT_MS,
  Number(process.env.BACKEND_WRITE_TIMEOUT_MS) || 120_000
);
const BACKEND_UPLOAD_TIMEOUT_MS = Math.max(
  BACKEND_WRITE_TIMEOUT_MS,
  Number(process.env.BACKEND_UPLOAD_TIMEOUT_MS) || 300_000
);

// Give deployment platforms enough time for mobile uploads and large course saves.
export const maxDuration = 300;

const getBackendBase = () => {
  // Priority 1: Explicit internal Docker URL, if configured by the deployment (avoids DNS/loopback issues)
  const internalOrigin = process.env.INTERNAL_BACKEND_URL?.replace(/\/+$/, '')?.trim();
  if (internalOrigin) return internalOrigin.replace('localhost', '127.0.0.1');

  // Priority 2: Explicit public backend origin when present
  const publicOrigin = process.env.NEXT_PUBLIC_BACKEND_ORIGIN?.replace(/\/+$/, '')?.trim();
  if (publicOrigin) return publicOrigin.replace('localhost', '127.0.0.1');

  // Priority 3: BACKEND_ORIGIN env var
  const origin = process.env.BACKEND_ORIGIN?.replace(/\/+$/, '')?.trim();
  if (origin) return origin.replace('localhost', '127.0.0.1');

  // Priority 4: Extract origin from NEXT_PUBLIC_API_URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/"/g, '').trim();
  if (apiUrl) {
    try {
      return new URL(apiUrl).origin.replace('localhost', '127.0.0.1');
    } catch {}
  }

  // Priority 5: Dokploy internal network fallback
  if (process.env.NODE_ENV === 'production') {
    // Safest fallback: use the internal Docker hostname Dokploy generated for the backend
    // Or the public domain which is guaranteed to route correctly through NGINX
    return 'https://api.klevro.tech';
  }

  return 'http://127.0.0.1:5000';
};

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
]);

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const backendBase = getBackendBase();
  const targetUrl = `${backendBase}/api/${(path || []).join('/')}${req.nextUrl.search}`;

  const contentType = (req.headers.get('content-type') || '').toLowerCase();
  const isStream = contentType.includes('multipart/form-data');
  
  // Forward clean request headers to backend (strip hop-by-hop headers)
  const headers = new Headers();
  const requestHopHeaders = new Set([...HOP_BY_HOP_HEADERS, ...(req.headers.get('connection') || '').toLowerCase().split(',').map(value => value.trim())]);
  req.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (requestHopHeaders.has(lowerKey)) return;
    
    // Fetch computes buffered lengths; multipart stays chunked. Never trust the client length.
    if (lowerKey === 'content-length') {
      return;
    }
    
    headers.set(key, value);
  });

  let timeoutMs = isStream
    ? BACKEND_UPLOAD_TIMEOUT_MS
    : req.method === 'GET' || req.method === 'HEAD'
      ? BACKEND_REQUEST_TIMEOUT_MS
      : BACKEND_WRITE_TIMEOUT_MS;

  // Specific endpoints that take a long time
  if (targetUrl.includes('/admin/backup/download')) {
    timeoutMs = Math.max(timeoutMs, 600_000); // 10 minutes
  } else if (
    targetUrl.includes('/api/exams') ||
    targetUrl.includes('/api/courses') ||
    targetUrl.includes('/api/admin/exams')
  ) {
    timeoutMs = Math.max(timeoutMs, 120_000); // 2 minutes for heavy learning content
  }

  const lifetime = proxyLifetime(req.signal, timeoutMs);
  try {
    lifetime.signal.throwIfAborted();
    let bodyData: BodyInit | undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      if (isStream) {
        bodyData = req.body;
      } else {
        const limit = proxyBodyLimit();
        const declaredLength = Number(req.headers.get('content-length'));
        if (Number.isFinite(declaredLength) && declaredLength > limit) {
          void req.body.cancel().catch(() => {});
          throw new ProxyBodyTooLargeError();
        }
        bodyData = await readProxyBody(req.body, limit, lifetime.signal);
      }
    }
    const requestInit: RequestInit & { duplex?: 'half' } = {
      method: req.method,
      headers,
      body: bodyData,
      redirect: 'follow',
      cache: 'no-store',
      signal: lifetime.signal,
    };
    if (isStream && bodyData) requestInit.duplex = 'half';

    // A failed connection can occur after a write commits. Never replay writes.
    let backendResponse: Response;
    try {
      backendResponse = await fetch(targetUrl, requestInit);
    } catch (primaryFetchErr) {
      if (lifetime.signal.aborted || !['GET', 'HEAD'].includes(req.method)) throw primaryFetchErr;
      const fallback = new URL(targetUrl);
      if (fallback.hostname === '127.0.0.1') fallback.hostname = 'localhost';
      else if (fallback.hostname === 'localhost') fallback.hostname = '127.0.0.1';
      else throw primaryFetchErr;
      backendResponse = await fetch(fallback, requestInit);
    }

    // Copy response headers
    const responseHeaders = new Headers();
    const HEADERS_TO_SKIP = new Set([
      ...HOP_BY_HOP_HEADERS,
      ...(backendResponse.headers.get('connection') || '').toLowerCase().split(',').map(value => value.trim()),
      'access-control-allow-origin',
      'access-control-allow-credentials',
      'content-encoding',
      'content-length',
      'transfer-encoding',
      'connection',
      'keep-alive'
    ]);
    backendResponse.headers.forEach((value, key) => {
      if (!HEADERS_TO_SKIP.has(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    const noBody = req.method === 'HEAD' || [204, 205, 304].includes(backendResponse.status) || !backendResponse.body;
    if (noBody) {
      void backendResponse.body?.cancel().catch(() => {});
      lifetime.dispose();
    }
    const responseBody = noBody ? null : proxyResponseBody(backendResponse.body!, lifetime);
    return new NextResponse(responseBody, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    lifetime.dispose();
    if (error instanceof ProxyBodyTooLargeError) {
      return NextResponse.json({ error: error.message }, { status: 413 });
    }
    const isClientDisconnect = Boolean(req.signal?.aborted);
    const isTimeout =
      !isClientDisconnect &&
      (lifetime.signal.reason?.name === 'TimeoutError' || error?.name === 'TimeoutError' ||
       String(error?.message || '').toLowerCase().includes('timeout'));

    if (isClientDisconnect) {
      // Client closed tab, reloaded, or navigated away before response completed
      console.warn('[API Proxy Client Disconnect]', targetUrl);
      return new NextResponse(null, { status: 499 });
    }

    console.error('[API Proxy Error]', targetUrl, error?.message);
    try {
      fs.appendFileSync(nodePath.join(process.cwd(), 'proxy_error.log'), new Date().toISOString() + ' ' + targetUrl + ' ' + (error?.message || error) + '\n');
    } catch {}

    return NextResponse.json(
      {
        error: isTimeout ? 'Backend request timed out' : 'Failed to reach backend',
        details: error?.message,
      },
      { status: isTimeout ? 504 : 502 }
    );
  }
}

export const GET = handler;
export const HEAD = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;
