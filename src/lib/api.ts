const getApiUrl = () => {
  // In the browser (client-side): always use relative /api
  // This routes through Next.js Route Handler proxy → no CORS issues at all
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api`;
  }

  // Server-side (SSR/build): use env variable or fallback to internal Docker URL
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/"/g, '').trim();
  if (envUrl) return envUrl;

  return 'http://localhost:5000/api';
};

export const API_URL = getApiUrl();

export const getFullImageUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith('data:') || path.startsWith('http')) return path;
  // Remove /api from end of API_URL to get base server URL
  const baseUrl = API_URL.replace(/\/api$/, '');
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${baseUrl}/${cleanPath}`;
};

// ==========================================
// 🔄 TOKEN KEYS CONFIG
// ==========================================
const TOKEN_EXPIRY_BUFFER_MS = 30 * 60 * 1000; // refresh if < 30 min left
let _isRefreshing = false;
let _refreshPromise: Promise<string | null> | null = null;

const TOKEN_CONFIG: Record<string, { token: string; user: string; loginPath: string }> = {
  'super-admin': { token: 'super_admin_token', user: 'super_admin_user', loginPath: '/super-admin/login' },
  'school-admin': { token: 'school_admin_token', user: 'school_admin_user', loginPath: '/school-admin/login' },
  'student': { token: 'lms_token', user: 'lms_user', loginPath: '/login' },
};

const detectSection = (): keyof typeof TOKEN_CONFIG => {
  if (typeof window === 'undefined') return 'student';
  const path = window.location.pathname;
  if (path.startsWith('/super-admin')) return 'super-admin';
  if (path.startsWith('/school-admin')) return 'school-admin';
  return 'student';
};

const getActiveTokenKey = (): string => TOKEN_CONFIG[detectSection()].token;
const getActiveUserKey = (): string => TOKEN_CONFIG[detectSection()].user;
const getLoginPath = (): string => TOKEN_CONFIG[detectSection()].loginPath;

/** Get all stored tokens (tries all keys) */
export const getActiveToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  const section = detectSection();
  return localStorage.getItem(TOKEN_CONFIG[section].token) || null;
};

/** Store token + expiry time in localStorage */
const persistToken = (token: string) => {
  if (typeof window === 'undefined') return;
  const key = getActiveTokenKey();
  const expiresAt = Date.now() + (8 * 60 * 60 * 1000); // 8h
  localStorage.setItem(key, token);
  localStorage.setItem(`${key}_expires_at`, String(expiresAt));
};

/** Check if current token needs proactive refresh (< 30 min left) */
const shouldProactivelyRefresh = (): boolean => {
  if (typeof window === 'undefined') return false;
  const key = getActiveTokenKey();
  const expiresAt = Number(localStorage.getItem(`${key}_expires_at`) || 0);
  if (!expiresAt) return false; // no stored expiry → don't refresh
  return (expiresAt - Date.now()) < TOKEN_EXPIRY_BUFFER_MS;
};

/** Silently refresh token in the background */
const silentRefresh = async (): Promise<string | null> => {
  if (_isRefreshing) return _refreshPromise;
  _isRefreshing = true;
  _refreshPromise = (async () => {
    try {
      const currentToken = getActiveToken();
      if (!currentToken) return null;
      const res = await fetch(`${API_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.token) {
        persistToken(data.token);
        // Also update user object if provided
        if (data.user) {
          const userKey = getActiveUserKey();
          const existingUser = localStorage.getItem(userKey);
          const merged = existingUser ? { ...JSON.parse(existingUser), ...data.user } : data.user;
          localStorage.setItem(userKey, JSON.stringify(merged));
        }
        console.log('🔄 Token silently refreshed.');
        return data.token;
      }
      return null;
    } catch {
      return null;
    } finally {
      _isRefreshing = false;
      _refreshPromise = null;
    }
  })();
  return _refreshPromise;
};

/** Clear session and redirect to login */
const clearSessionAndRedirect = () => {
  if (typeof window === 'undefined') return;
  const section = detectSection();
  const config = TOKEN_CONFIG[section];
  const loginPath = config.loginPath;
  localStorage.removeItem(config.token);
  localStorage.removeItem(`${config.token}_expires_at`);
  localStorage.removeItem(config.user);
  if (!window.location.pathname.endsWith('/login')) {
    window.location.replace(loginPath);
  }
};

/**
 * Centralized fetch wrapper with auto token refresh.
 * - Proactively refreshes token if < 30 min from expiry
 * - On 401 TOKEN_EXPIRED: attempts one silent refresh, then retries
 * - On hard 401/400 token errors with no refresh option: redirects to login
 */
export const apiFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  // Proactive refresh before the request if token is expiring soon
  if (typeof window !== 'undefined' && shouldProactivelyRefresh()) {
    await silentRefresh();
  }

  // Get the latest token (may have been refreshed)
  const token = getActiveToken();

  // Inject Authorization header if not already present and token exists
  let finalInit = init;
  if (token && (!init?.headers || !(init.headers as any)['Authorization'])) {
    const headers = new Headers(init?.headers || {});
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    finalInit = { ...init, headers };
  }

  let res = await fetch(input, finalInit);

  // Handle token expiry errors
  if (typeof window !== 'undefined' && res.status === 401) {
    const cloned = res.clone();
    try {
      const json = await cloned.json();
      const isTokenExpired =
        json?.code === 'TOKEN_EXPIRED' ||
        json?.error?.includes('انتهت صلاحية الجلسة') ||
        json?.error === 'Invalid token.';

      if (isTokenExpired) {
        // Try one silent refresh
        const newToken = await silentRefresh();
        if (newToken) {
          // Retry the original request with the new token
          const retryHeaders = new Headers(init?.headers || {});
          retryHeaders.set('Authorization', `Bearer ${newToken}`);
          res = await fetch(input, { ...init, headers: retryHeaders });
          if (!res.ok && res.status === 401) {
            clearSessionAndRedirect();
          }
          return res;
        } else {
          clearSessionAndRedirect();
        }
      }
    } catch (_) { /* not JSON */ }
  }

  return res;
};
