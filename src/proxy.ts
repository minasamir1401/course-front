import { NextRequest, NextResponse } from 'next/server';
import { getBackendBase } from './lib/backendOrigin';
import { loginForPage, pageAccess, pageRoleFallback } from './lib/pageAccess';

export async function proxy(request: NextRequest) {
  const access = pageAccess(request.nextUrl.pathname);
  if (!access) return NextResponse.next();
  const cookies = ['auth_token', 'auth_refresh'].flatMap(name => {
    const value = request.cookies.get(name)?.value;
    return value ? [`${name}=${encodeURIComponent(value)}`] : [];
  }).join('; ');
  const finish = (response: NextResponse, refreshed: string[] = []) => {
    response.headers.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
    for (const cookie of refreshed) response.headers.append('Set-Cookie', cookie);
    return response;
  };
  const signIn = () => finish(NextResponse.redirect(new URL(loginForPage(request.nextUrl.pathname, request.nextUrl.search), request.url)));
  if (!cookies) return signIn();
  try {
    const endpoint = `${getBackendBase()}/api/auth`;
    const init = { headers: { Cookie: cookies }, cache: 'no-store' as const, redirect: 'manual' as const, signal: AbortSignal.timeout(8000) };
    let session: { authenticated?: boolean; refreshed?: boolean; user?: { id?: string; role?: string } } = {};
    let response = await fetch(`${endpoint}/me`, init);
    let refreshed: string[] = [];
    if ([400, 401].includes(response.status) && request.cookies.has('auth_refresh')) {
      response = await fetch(`${endpoint}/refresh-token`, { ...init, method: 'POST', signal: AbortSignal.timeout(8000) });
      if (response.ok) refreshed = response.headers.getSetCookie();
    }
    if (response.status >= 500 || response.status === 429) throw new Error('Session service unavailable');
    if (!response.ok) return signIn();
    session = await response.json();
    if (!(session.authenticated || session.refreshed) || !session.user?.id || !session.user.role) return signIn();
    if (!access.roles.includes(session.user.role)) {
      const fallback = pageRoleFallback(request.nextUrl.pathname, request.nextUrl.search, session.user.role);
      return finish(NextResponse.redirect(new URL(fallback || loginForPage(request.nextUrl.pathname, request.nextUrl.search), request.url)), refreshed);
    }
    const headers = new Headers(request.headers);
    if (refreshed.length) {
      const updated = new Map(cookies.split('; ').map(cookie => { const index = cookie.indexOf('='); return [cookie.slice(0, index), cookie.slice(index + 1)]; }));
      for (const cookie of refreshed) { const pair = cookie.split(';')[0], index = pair.indexOf('='); updated.set(pair.slice(0, index), pair.slice(index + 1)); }
      headers.set('cookie', [...updated].map(([name, value]) => `${name}=${value}`).join('; '));
    }
    return finish(NextResponse.next({ request: { headers } }), refreshed);
  } catch {
    return finish(new NextResponse('<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><title>تعذر التحقق من الجلسة</title><body><main><h1>تعذر التحقق من تسجيل الدخول</h1><p>حاول تحديث الصفحة بعد قليل. لم يتم فتح بيانات الحساب.</p><a href="/login">تسجيل الدخول</a></main></body></html>', { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Retry-After': '10' } }));
  }
}

export const config = { matcher: [
  '/super-admin/:path*', '/school-admin/:path*', '/dashboard/:path*', '/courses/:path*', '/lessons/:path*', '/exams/:path*', '/reports/:path*',
  '/assignments/:path*', '/activities/:path*', '/competitions/:path*', '/calendar/:path*', '/certificates/:path*', '/messages/:path*',
  '/notifications/:path*', '/profile/:path*', '/settings/:path*', '/assistant/:path*', '/skills/:path*', '/skills-hub/:path*',
  '/games/:path*', '/quizzes/:path*', '/assessments/:path*', '/evaluations/:path*',
] };
