import { NextRequest, NextResponse } from 'next/server';

// Runtime proxy: forwards all /api/* requests to the backend
// This runs at REQUEST TIME (not build time), so env vars are always available
import fs from 'node:fs';
import nodePath from 'node:path';

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
  if (internalOrigin) return internalOrigin;

  // Priority 2: Explicit public backend origin when present
  const publicOrigin = process.env.NEXT_PUBLIC_BACKEND_ORIGIN?.replace(/\/+$/, '')?.trim();
  if (publicOrigin) return publicOrigin;

  // Priority 3: BACKEND_ORIGIN env var
  const origin = process.env.BACKEND_ORIGIN?.replace(/\/+$/, '')?.trim();
  if (origin) return origin;

  // Priority 4: Extract origin from NEXT_PUBLIC_API_URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/"/g, '').trim();
  if (apiUrl) {
    try {
      return new URL(apiUrl).origin;
    } catch {}
  }

  // Priority 5: Dokploy internal network fallback
  if (process.env.NODE_ENV === 'production') {
    // Safest fallback: use the internal Docker hostname Dokploy generated for the backend
    // Or the public domain which is guaranteed to route correctly through NGINX
    return 'https://api.klevro.tech';
  }

  return 'http://backend:5000';
};

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const backendBase = getBackendBase();
  const targetUrl = `${backendBase}/api/${(path || []).join('/')}${req.nextUrl.search}`;

  const contentType = req.headers.get('content-type') || '';
  
  // Forward the request to the backend
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    // Skip host header to avoid conflicts
    if (lowerKey === 'host') return;
    
    // Skip content-length ONLY for multipart to prevent multer 'request aborted' errors
    if (lowerKey === 'content-length' && contentType.includes('multipart/form-data')) {
      return;
    }
    
    headers.set(key, value);
  });

  try {
    let bodyData: any = undefined;
    let isStream = false;


    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      if (contentType.includes('multipart/form-data')) {
        bodyData = req.body;
        isStream = true;
      } else {
        const arrayBuffer = await req.arrayBuffer();
        if (arrayBuffer.byteLength > 0) {
          bodyData = arrayBuffer;
        }
      }
    }

    const requestInit: RequestInit & { duplex?: 'half' } = {
      method: req.method,
      headers,
      body: bodyData,
      redirect: 'follow',
      cache: 'no-store',
    };

    if (isStream) {
      requestInit.duplex = 'half';
    }

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

    const backendResponse = await fetch(targetUrl, {
      ...requestInit,
      signal: AbortSignal.timeout(timeoutMs),
    });

    // Copy response headers
    const responseHeaders = new Headers();
    const HEADERS_TO_SKIP = new Set([
      'access-control-allow-origin',
      'access-control-allow-credentials',
      'content-encoding',
      'content-length',
      'transfer-encoding'
    ]);
    backendResponse.headers.forEach((value, key) => {
      if (!HEADERS_TO_SKIP.has(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    const responseBody = await backendResponse.arrayBuffer();
    return new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    const isTimeout =
      error?.name === 'TimeoutError' ||
      error?.name === 'AbortError' ||
      String(error?.message || '').toLowerCase().includes('abort') ||
      String(error?.message || '').toLowerCase().includes('timeout');

    console.error('[API Proxy Error]', targetUrl, error?.message);
    fs.appendFileSync(nodePath.join(process.cwd(), 'proxy_error.log'), new Date().toISOString() + ' ' + targetUrl + ' ' + error?.message + '\n');
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
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;
