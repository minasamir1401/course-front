'use client';
import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AUTH_KEYS, checkAuthSession, clearAllAuthData } from '@/lib/auth';
import { loginForPage, pageAccess, pageRoleFallback } from '@/lib/pageAccess';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PageAccessGate({ children }: { children: React.ReactNode }) {
  const path = usePathname(), router = useRouter(), { language } = useLanguage();
  const [approvedPath, setApprovedPath] = useState<string | null>(null);
  const [status, setStatus] = useState<'checking' | 'ready' | 'unavailable'>('checking');
  const [revision, setRevision] = useState(0);
  const retry = useCallback(() => setRevision(value => value + 1), []);
  const protectedPage = Boolean(pageAccess(path));
  useEffect(() => {
    const policy = pageAccess(path);
    if (!policy) return;
    let active = true, version = 0, verified = false;
    const verify = async () => {
      const current = ++version;
      // Returning to an already verified page must not hide the workspace,
      // blur editors or move its scroll position while the request is pending.
      if (!verified) setStatus('checking');
      const session = await checkAuthSession();
      if (!active || current !== version) return;
      // A temporary network failure does not revoke an existing approval.
      // New routes still stay blocked until their first successful check.
      if (session.unavailable) { if (!verified) setStatus('unavailable'); return; }
      if (!session.authenticated || !session.user?.id) {
        setApprovedPath(null); clearAllAuthData(); router.replace(loginForPage(path, window.location.search)); return;
      }
      const role = session.user.role;
      if (!policy.roles.includes(role)) {
        setApprovedPath(null); router.replace(pageRoleFallback(path, window.location.search, role) || loginForPage(path, window.location.search)); return;
      }
      // Existing page controls use this display cache. It is hydrated only after
      // server verification; it never authenticates or grants a permission.
      try {
        const key = role === 'SUPER_ADMIN' ? AUTH_KEYS.SUPER_ADMIN : role === 'STUDENT' ? AUTH_KEYS.STUDENT : AUTH_KEYS.SCHOOL_ADMIN;
        for (const config of Object.values(AUTH_KEYS)) if (config !== key) { localStorage.removeItem(config.TOKEN); localStorage.removeItem(config.USER); localStorage.removeItem(`${config.TOKEN}_expires_at`); }
        localStorage.setItem(key.TOKEN, 'cookie_auth'); localStorage.setItem(key.USER, JSON.stringify(session.user));
      } catch { /* Cookie verification remains authoritative. */ }
      verified = true;
      setApprovedPath(path); setStatus('ready');
    };
    const visible = () => { if (document.visibilityState === 'visible') void verify(); };
    const storage = (event: StorageEvent) => { if (!event.key || /(?:_token|_user)$/.test(event.key)) void verify(); };
    void verify();
    window.addEventListener('focus', visible); window.addEventListener('pageshow', visible); window.addEventListener('storage', storage);
    document.addEventListener('visibilitychange', visible);
    return () => { active = false; window.removeEventListener('focus', visible); window.removeEventListener('pageshow', visible); window.removeEventListener('storage', storage); document.removeEventListener('visibilitychange', visible); };
  }, [path, router, revision]);
  if (!protectedPage) return <>{children}</>;
  const allowed = approvedPath === path && status === 'ready';
  return <>{!allowed && <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6" dir={language === 'ar' ? 'rtl' : 'ltr'}><section className="text-center space-y-4" role={status === 'unavailable' ? 'alert' : 'status'}>
    <p>{status === 'unavailable' ? (language === 'ar' ? 'تعذر التحقق من الجلسة. حاول مرة أخرى.' : 'Could not verify your session. Please retry.') : (language === 'ar' ? 'جارٍ التحقق من تسجيل الدخول…' : 'Verifying your session…')}</p>
    {status === 'unavailable' && <button type="button" onClick={retry} className="rounded-xl bg-indigo-700 px-5 py-3 text-white">{language === 'ar' ? 'إعادة المحاولة' : 'Retry'}</button>}
  </section></main>}{approvedPath === path && <div hidden={!allowed} style={!allowed ? { display: 'none' } : undefined}>{children}</div>}</>;
}
