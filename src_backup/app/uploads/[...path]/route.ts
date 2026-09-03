import { NextRequest, NextResponse } from 'next/server';

// Runtime proxy: forwards all /uploads/* requests to the backend uploads folder
const BACKEND_REQUEST_TIMEOUT_MS = Math.max(
  1_000,
  Number(process.env.BACKEND_REQUEST_TIMEOUT_MS) || 20_000
);

const getBackendBase = () => {
  const internalOrigin = process.env.INTERNAL_BACKEND_URL?.replace(/\/+$/, '').trim();
  if (internalOrigin) return internalOrigin;

  const publicOrigin = process.env.NEXT_PUBLIC_BACKEND_ORIGIN?.replace(/\/+$/, '').trim();
  if (publicOrigin) return publicOrigin;

  const origin = process.env.BACKEND_ORIGIN?.replace(/\/+$/, '').trim();
  if (origin) return origin;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/"/g, '').trim();
  if (apiUrl) {
    try {
      return new URL(apiUrl).origin;
    } catch {}
  }

  return 'http://backend:5000';
};

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const backendBase = getBackendBase();
  const targetUrl = `${backendBase}/uploads/${path.join('/')}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey !== 'host' && lowerKey !== 'content-length') {
      headers.set(key, value);
    }
  });

  try {
    let bodyData: any = undefined;
    let isStream = false;

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      const contentType = req.headers.get('content-type') || '';
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
      cache: req.method === 'GET' || req.method === 'HEAD' ? 'force-cache' : 'no-store',
    };

    if (isStream) {
      requestInit.duplex = 'half';
    }

    const backendResponse = await fetch(targetUrl, {
      ...requestInit,
      signal: AbortSignal.timeout(BACKEND_REQUEST_TIMEOUT_MS),
    });

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
    if (req.method === 'GET' || req.method === 'HEAD') {
      responseHeaders.set('Cache-Control', 'public, max-age=2592000, immutable');
    }

    const responseBody = await backendResponse.arrayBuffer();
    return new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('[Upload Proxy Error]', targetUrl, error?.message);
    return NextResponse.json(
      {
        error: error?.name === 'TimeoutError' ? 'Backend request timed out' : 'Failed to reach backend',
        details: error?.message,
      },
      { status: error?.name === 'TimeoutError' ? 504 : 502 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;
