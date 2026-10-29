export type PageAccess = { login: string; roles: readonly string[] };
export function pageAccess(pathname: string): PageAccess | null {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/' || path === '/login' || path === '/super-admin/login' || path === '/school-admin/login') return null;
  if (path === '/super-admin' || path.startsWith('/super-admin/')) return { login: '/super-admin/login', roles: ['SUPER_ADMIN'] };
  if (path === '/school-admin' || path.startsWith('/school-admin/')) return { login: '/school-admin/login', roles: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'] };
  if (/^\/(?:dashboard|courses|lessons|exams|reports|assignments|activities|competitions|calendar|certificates|messages|notifications|profile|settings|assistant|skills|skills-hub|games|quizzes|assessments|evaluations)(?:\/|$)/.test(path)) {
    // Staff can still open the existing teaching/preview flows. Backend resource
    // permissions continue to decide which student's data they may read.
    return { login: '/login', roles: ['STUDENT', 'SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'] };
  }
  return null;
}

export function pageRoleFallback(pathname: string, search: string, role: string) {
  if ((role === 'SCHOOL_ADMIN' || role === 'TEACHER') && /^\/super-admin\/exams\/edit\/[^/]+\/?$/.test(pathname)) {
    return pathname.replace(/^\/super-admin/, '/school-admin') + search;
  }
  return null;
}

export const loginForPage = (pathname: string, search = '') => {
  const login = pageAccess(pathname)?.login || '/login';
  return `${login}?next=${encodeURIComponent(pathname + search)}`;
};
