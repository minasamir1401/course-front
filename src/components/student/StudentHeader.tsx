"use client";
import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Menu, X, LogOut, Maximize, Minimize, ArrowLeftCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useModalFocus } from '@/hooks/useModalFocus';
import ReferenceIcon from './ReferenceIcon';
import styles from './StudentHeader.module.css';
import { logout, stopImpersonation } from '@/lib/auth';
import NotificationBell from '@/components/platform/NotificationBell';
import { Download } from 'lucide-react';
import AdminBackButton from '@/components/platform/AdminBackButton';

export default function StudentHeader({ pathname, isFullscreen, onToggleFullscreen, adminHome }: { pathname: string; isFullscreen?: boolean; onToggleFullscreen?: () => void; adminHome?: string }) {
  const { language, setLanguage } = useLanguage(); const ar = language === 'ar'; const router = useRouter();
  const [open, setOpen] = useState(false); const modal = useRef<HTMLDivElement>(null);
  useModalFocus(open, modal, () => setOpen(false));
  const links = [
    { href: '/dashboard', label: ar ? 'الرئيسية' : 'Home', icon: 'grid' },
    { href: '/courses', label: ar ? 'مقرراتي' : 'Courses', icon: 'book-open' },
    { href: '/exams', label: ar ? 'الامتحانات' : 'Exams', icon: 'clipboard' },
    { href: '/activities', label: ar ? 'الأنشطة والمهارات' : 'Skills & activities', icon: 'sparkles' },
    { href: '/calendar', label: ar ? 'التقويم' : 'Calendar', icon: 'calendar' },
    { href: '/reports', label: ar ? 'تقارير الأداء' : 'Reports', icon: 'chart-bars' },
    { href: '/certificates', label: ar ? 'شهاداتي' : 'My certificates', icon: 'star' },
    { href: '/competitions', label: ar ? 'المسابقات' : 'Competitions', icon: 'target' },
    { href: '/notifications', label: ar ? 'الإشعارات' : 'Notifications', icon: 'calendar' },
    { href: '/profile', label: ar ? 'ملفي الشخصي' : 'My profile', icon: 'user' },
    { href: '/settings', label: ar ? 'الإعدادات' : 'Settings', icon: 'filter' },
  ];
  const primaryLinks = [...links.slice(0, 6), links[7]];
  const dockLinks = [links[0], links[1], links[2], links[7]];
  const active = (href: string) => pathname === href || pathname.startsWith(href + '/') || (href === '/courses' && pathname.startsWith('/lessons/'));
  const navLink = (item: typeof links[number], compact = false) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} aria-current={active(item.href) ? 'page' : undefined}
    className={compact ? `student-dock-link ${active(item.href) ? 'student-nav-active' : ''}` : `student-nav-link ${active(item.href) ? 'student-nav-active' : ''}`}><ReferenceIcon name={item.icon} size={18}/><span>{item.label}</span></Link>;
  return <>
    <header className={`student-header no-print ${styles.header}`}><div className={styles.inner}>
      <Link href="/dashboard" aria-label={ar ? 'Klevro — الرئيسية' : 'Klevro — Home'} className={styles.brand}><Image src="/klevro/brand/klevro-logo.jpg" alt="" width={64} height={64} sizes="64px" priority className={styles.logo} /></Link>
      {!isFullscreen && <nav aria-label={ar ? 'التنقل الرئيسي' : 'Main navigation'} className={styles.desktopNav}>{primaryLinks.map(item => navLink(item))}</nav>}
      <div className={styles.tools}>
        <NotificationBell />
        <button className="student-icon-button text-xs font-black" onClick={() => setLanguage(ar ? 'en' : 'ar')} aria-label={ar ? 'التبديل للإنجليزية' : 'Switch to Arabic'}>{ar ? 'EN' : 'عربي'}</button>
        {onToggleFullscreen && <button className="student-icon-button" onClick={onToggleFullscreen} aria-label={ar ? (isFullscreen ? 'تصغير مساحة الدراسة' : 'تكبير مساحة الدراسة') : (isFullscreen ? 'Exit fullscreen' : 'Expand study area')}>{isFullscreen ? <Minimize size={19} /> : <Maximize size={19} />}</button>}
        <button className="student-icon-button" aria-label={ar ? 'القائمة والحساب' : 'Menu & account'} aria-expanded={open} aria-controls="student-menu" onClick={() => setOpen(true)}><Menu size={22} /></button>
      </div>
    </div>{adminHome && <div className="px-4 pb-2"><AdminBackButton pathname={pathname} fallbackHref={adminHome} showLabel/></div>}</header>
    <nav aria-label={ar ? 'التنقل السريع' : 'Quick navigation'} className={`student-dock no-print ${styles.dock}`}>{dockLinks.map(item => navLink(item, true))}<button className={`student-dock-link ${links.some(item => !dockLinks.includes(item) && active(item.href)) ? 'student-nav-active' : ''}`} onClick={() => setOpen(true)} aria-expanded={open} aria-controls="student-menu"><Menu size={20}/><span>{ar ? 'المزيد' : 'More'}</span></button></nav>
    {open && <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-3 bg-slate-900/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div id="student-menu" ref={modal} role="dialog" aria-modal="true" aria-labelledby="student-menu-title" tabIndex={-1} className="bg-white rounded-[30px] shadow-xl border border-slate-200 w-full max-w-xl max-h-[85dvh] overflow-y-auto p-5 sm:p-7" onClick={event => event.stopPropagation()}>
        <div className="flex items-center justify-between mb-5"><h2 id="student-menu-title" className="text-xl font-black">{ar ? 'مساحتك الدراسية' : 'Your learning space'}</h2><button className="student-icon-button" onClick={() => setOpen(false)} aria-label={ar ? 'إغلاق القائمة' : 'Close menu'}><X size={20}/></button></div>
        <nav aria-label={ar ? 'كل الصفحات' : 'All pages'} className="grid grid-cols-1 sm:grid-cols-2 gap-2">{links.map(item => navLink(item))}</nav>
        <div className="mt-5 border-t border-slate-200 pt-4 flex flex-wrap gap-3">
          <button className="report-secondary" onClick={() => { setOpen(false); window.dispatchEvent(new Event('klevro-install')); }}><Download size={18}/>{ar ? 'تثبيت التطبيق' : 'Install app'}</button>
          {typeof window !== 'undefined' && localStorage.getItem('is_impersonating') === 'true' && <button className="report-secondary" onClick={() => stopImpersonation()}><ArrowLeftCircle size={18}/>{ar ? 'العودة للإدارة' : 'Return to admin'}</button>}
          <button className="report-secondary text-rose-700" onClick={() => logout(router, pathname)}><LogOut size={18}/>{ar ? 'تسجيل الخروج' : 'Sign out'}</button>
        </div>
      </div>
    </div>}
  </>;
}
