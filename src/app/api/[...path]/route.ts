import { NextRequest, NextResponse } from 'next/server';

// Runtime proxy: forwards all /api/* requests to the backend
// This runs at REQUEST TIME (not build time), so env vars are always available
const getBackendBase = () => {
  // Priority 1: BACKEND_ORIGIN env var
  const origin = process.env.BACKEND_ORIGIN?.replace(/\/+$/, '').trim();
  if (origin) return origin;

  // Priority 2: Extract origin from NEXT_PUBLIC_API_URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/"/g, '').trim();
  if (apiUrl) {
    try {
      return new URL(apiUrl).origin;
    } catch {}
  }

  // Priority 3: Docker internal fallback
  return 'http://backend:5000';
};

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const backendBase = getBackendBase();
  const targetUrl = `${backendBase}/api/${path.join('/')}${req.nextUrl.search}`;

  // Forward the request to the backend
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    // Skip host header to avoid conflicts
    if (key.toLowerCase() !== 'host') {
      headers.set(key, value);
    }
  });

  try {
    const backendResponse = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined,
      duplex: 'half',
      // @ts-ignore
      redirect: 'follow',
    } as RequestInit);

    // Copy response headers
    const responseHeaders = new Headers();
    backendResponse.headers.forEach((value, key) => {
      // Skip CORS headers from backend - Next.js handles them
      if (!['access-control-allow-origin', 'access-control-allow-credentials'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    const responseBody = await backendResponse.arrayBuffer();
    return new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('[API Proxy Error]', targetUrl, error?.message);
    return NextResponse.json(
      { error: 'Failed to reach backend', details: error?.message },
      { status: 502 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;
