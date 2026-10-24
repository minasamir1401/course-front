'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

type NavigationEntry = { url: string | null; index: number };
type NavigationWindow = Window & { navigation?: { currentEntry: NavigationEntry | null; entries: () => NavigationEntry[] } };

export default function AdminBackButton({ pathname, fallbackHref, showLabel = false }: { pathname: string; fallbackHref?: string; showLabel?: boolean }) {
  const router = useRouter();
  const { language } = useLanguage();
  const ar = language === 'ar';
  const label = ar ? 'الرجوع للصفحة السابقة' : 'Back to previous page';
  const back = () => {
    const navigation = (window as NavigationWindow).navigation;
    const previous = navigation?.entries().find(entry => entry.index === (navigation.currentEntry?.index ?? 0) - 1);
    const isAppPage = (url: string | null) => {
      if (!url) return false;
      const target = new URL(url, window.location.origin);
      return target.origin === window.location.origin && !/\/(?:login|logout)(?:\/|$)/.test(target.pathname);
    };
    if (navigation ? isAppPage(previous?.url ?? null) : window.history.length > 1 && isAppPage(document.referrer)) {
      router.back();
      return;
    }
    // A directly opened installed-app window has no previous application page.
    const prefix = pathname.startsWith('/super-admin') ? '/super-admin' : pathname.startsWith('/school-admin') ? '/school-admin' : null;
    if (!prefix) { router.replace(fallbackHref || '/dashboard'); return; }
    const section = pathname.slice(prefix.length).split('/').filter(Boolean)[0];
    const parent = section && pathname !== `${prefix}/${section}` ? `${prefix}/${section}` : prefix;
    router.replace(parent);
  };
  return <button type="button" onClick={back} aria-label={label} title={label}
    className="no-print inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-indigo-100 bg-indigo-50 px-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
    {ar ? <ArrowRight size={19} aria-hidden="true"/> : <ArrowLeft size={19} aria-hidden="true"/>}<span className={showLabel ? '' : 'hidden sm:inline'}>{ar ? 'رجوع' : 'Back'}</span>
  </button>;
}
