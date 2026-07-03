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

/**
 * Centralized fetch wrapper.
 * - Auto-detects expired / invalid tokens (400 or 401)
 * - Clears the relevant localStorage keys
 * - Redirects to the correct login page without an infinite loop
 */
export const apiFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  const res = await fetch(input, init);

  if (typeof window !== 'undefined' && (res.status === 401 || res.status === 400)) {
    // Clone so we can still read the body after returning
    const cloned = res.clone();
    try {
      const json = await cloned.json();
      const isTokenError =
        json?.code === 'TOKEN_EXPIRED' ||
        json?.error === 'Invalid token.' ||
        json?.error?.includes('انتهت صلاحية الجلسة');

      if (isTokenError) {
        const path = window.location.pathname;
        if (path.startsWith('/super-admin')) {
          localStorage.removeItem('super_admin_token');
          localStorage.removeItem('super_admin_user');
          if (!path.endsWith('/login')) window.location.replace('/super-admin/login');
        } else if (path.startsWith('/school-admin')) {
          localStorage.removeItem('school_admin_token');
          localStorage.removeItem('school_admin_user');
          if (!path.endsWith('/login')) window.location.replace('/school-admin/login');
        } else {
          localStorage.removeItem('lms_token');
          localStorage.removeItem('lms_user');
          if (!path.endsWith('/login')) window.location.replace('/login');
        }
      }
    } catch (_) { /* not JSON, ignore */ }
  }

  return res;
};
