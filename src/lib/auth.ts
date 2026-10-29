/**
 * 🔒 AUTHENTICATION ARCHITECTURE NOTE:
 * Actual JWTs are NEVER stored in localStorage to protect against XSS token exfiltration.
 * Authentication uses httpOnly cookies ('auth_token') sent automatically via credentials: 'include'.
 * The TOKEN keys below only store the UI marker string 'cookie_auth' for client-side route guards.
 */
import { apiFetch } from './api';

export const AUTH_KEYS = {
  SUPER_ADMIN: {
    TOKEN: "super_admin_token",
    USER: "super_admin_user",
    LOGIN_PATH: "/super-admin/login",
    DASHBOARD_PATH: "/super-admin"
  },
  SCHOOL_ADMIN: {
    TOKEN: "school_admin_token",
    USER: "school_admin_user",
    LOGIN_PATH: "/school-admin/login",
    DASHBOARD_PATH: "/school-admin"
  },
  STUDENT: {
    TOKEN: "lms_token",
    USER: "lms_user",
    LOGIN_PATH: "/login",
    DASHBOARD_PATH: "/dashboard"
  }
};

type AuthSession = { authenticated: boolean; user: any | null; unavailable?: boolean };
let sessionRequest: Promise<AuthSession> | null = null;
export const checkAuthSession = (): Promise<AuthSession> => {
  // Multiple guards on one page share the current request, never a cached identity.
  if (sessionRequest) return sessionRequest;
  sessionRequest = readAuthSession().finally(() => { sessionRequest = null; });
  return sessionRequest;
};
const readAuthSession = async (): Promise<AuthSession> => {
  try {
    const res = await apiFetch('/api/auth/me');
    if (!res.ok) return { authenticated: false, user: null, ...(res.status >= 500 || res.status === 429 ? { unavailable: true } : {}) };
    const data = await res.json();
    return { authenticated: Boolean(data.authenticated), user: data.user || null };
  } catch {
    return { authenticated: false, user: null, unavailable: true };
  }
};

export const clearAllAuthData = () => {
  sessionRequest = null;
  Object.values(AUTH_KEYS).forEach(config => {
    localStorage.removeItem(config.TOKEN);
    localStorage.removeItem(config.USER);
    localStorage.removeItem(`${config.TOKEN}_expires_at`);
  });
  // Also clear impersonation data
  localStorage.removeItem("is_impersonating");
  localStorage.removeItem("original_admin_token");
  localStorage.removeItem("original_admin_user");
  localStorage.removeItem("original_admin_type");
};

export const logout = async (router: any, currentPath: string = "") => {
  let redirectPath = AUTH_KEYS.STUDENT.LOGIN_PATH;
  let authKey = AUTH_KEYS.STUDENT;
  
  if (currentPath.startsWith("/super-admin")) {
    redirectPath = AUTH_KEYS.SUPER_ADMIN.LOGIN_PATH;
    authKey = AUTH_KEYS.SUPER_ADMIN;
  } else if (currentPath.startsWith("/school-admin")) {
    redirectPath = AUTH_KEYS.SCHOOL_ADMIN.LOGIN_PATH;
    authKey = AUTH_KEYS.SCHOOL_ADMIN;
  }

  // Remove this browser's push endpoint before clearing the authenticated cookie.
  // Unsubscribing also invalidates the push endpoint if the server is unreachable.
  if (!currentPath.startsWith('/school-admin') && !currentPath.startsWith('/super-admin') && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration('/');
      const subscription = await registration?.pushManager?.getSubscription();
      if (subscription) {
        try { await fetch('/api/push/subscriptions', { method: 'DELETE', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: subscription.endpoint }), signal: AbortSignal.timeout(3000) }); } catch {}
        await subscription.unsubscribe();
      }
    } catch { /* The generic lock-screen payload contains no private learning data. */ }
  }
  // Clear httpOnly cookie on server
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include', signal: AbortSignal.timeout(3000) });
  } catch {
    // Non-fatal
  }

  localStorage.removeItem(authKey.TOKEN);
  localStorage.removeItem(authKey.USER);
  localStorage.removeItem(`${authKey.TOKEN}_expires_at`);
  clearAllAuthData();

  if (router && typeof router.replace === 'function') {
    router.replace(redirectPath);
  } else if (typeof window !== 'undefined') {
    window.location.replace(redirectPath);
  }
};

export const startImpersonation = (targetUserOrLegacyToken: any, targetRoleOrUser: any, legacyRole?: string) => {
  // The third-argument form is accepted temporarily for old compiled/source backups,
  // but the legacy token is deliberately ignored and never persisted.
  const targetUser = legacyRole ? targetRoleOrUser : targetUserOrLegacyToken;
  const targetRole = legacyRole || targetRoleOrUser;
  // 1. Capture current admin display data (no raw JWT)
  const adminUser = localStorage.getItem(AUTH_KEYS.SUPER_ADMIN.USER) || localStorage.getItem(AUTH_KEYS.SCHOOL_ADMIN.USER);
  const adminType = localStorage.getItem(AUTH_KEYS.SUPER_ADMIN.USER) ? 'SUPER' : 'SCHOOL';

  // 2. Clear previous session display state
  clearAllAuthData();

  // 3. Save display backup metadata (NOT the raw JWT)
  localStorage.setItem("original_admin_user", adminUser || "");
  localStorage.setItem("original_admin_type", adminType);
  localStorage.setItem("is_impersonating", "true");

  // 4. Set target session display info; token is safely kept in httpOnly cookie
  if (targetRole === 'STUDENT') {
    localStorage.setItem(AUTH_KEYS.STUDENT.TOKEN, 'cookie_auth');
    localStorage.setItem(AUTH_KEYS.STUDENT.USER, JSON.stringify(targetUser));
  } else if (targetRole === 'SCHOOL_ADMIN' || targetRole === 'TEACHER') {
    localStorage.setItem(AUTH_KEYS.SCHOOL_ADMIN.TOKEN, 'cookie_auth');
    localStorage.setItem(AUTH_KEYS.SCHOOL_ADMIN.USER, JSON.stringify(targetUser));
  }
};

export const stopImpersonation = async () => {
  const adminUser = localStorage.getItem("original_admin_user");
  const adminType = localStorage.getItem("original_admin_type");

  try {
    await fetch('/api/admin/stop-impersonate', {
      method: 'POST',
      credentials: 'include'
    });
  } catch {
    // Non-fatal, server might be offline
  }

  // Clear current impersonation session
  localStorage.removeItem("lms_token");
  localStorage.removeItem("lms_user");
  localStorage.removeItem("school_admin_token");
  localStorage.removeItem("school_admin_user");
  localStorage.removeItem("is_impersonating");
  localStorage.removeItem("original_admin_token");
  localStorage.removeItem("original_admin_user");
  localStorage.removeItem("original_admin_type");

  if (adminType) {
    const key = adminType === 'SUPER' ? AUTH_KEYS.SUPER_ADMIN : AUTH_KEYS.SCHOOL_ADMIN;
    localStorage.setItem(key.TOKEN, 'cookie_auth');
    if (adminUser) {
      localStorage.setItem(key.USER, adminUser);
    }
    window.location.href = key.DASHBOARD_PATH;
  } else {
    window.location.href = AUTH_KEYS.STUDENT.LOGIN_PATH;
  }
};
