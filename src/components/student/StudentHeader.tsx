"use client";
import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, BookOpen, ClipboardList, CalendarDays, Sparkles, BarChart3, User, Settings, Menu, X, LogOut, Maximize, Minimize, ArrowLeftCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useModalFocus } from '@/hooks/useModalFocus';
import { logout, stopImpersonation } from '@/lib/auth';

export default function StudentHeader({ pathname, isFullscreen, onToggleFullscreen }: { pathname: string; isFullscreen?: boolean; onToggleFullscreen?: () => void }) {
  const { language, setLanguage } = useLanguage(); const ar = language === 'ar'; const router = useRouter();
  const [open, setOpen] = useState(false); const modal = useRef<HTMLDivElement>(null);
  useModalFocus(open, modal, () => setOpen(false));
  const links = [
    { href: '/dashboard', label: ar ? 'الرئيسية' : 'Home', icon: LayoutDashboard },
    { href: '/courses', label: ar ? 'مقرراتي' : 'Courses', icon: BookOpen },
    { href: '/exams', label: ar ? 'الامتحانات' : 'Exams', icon: ClipboardList },
    { href: '/assignments', label: ar ? 'الواجبات' : 'Assignments', icon: ClipboardList },
    { href: '/activities', label: ar ? 'الأنشطة والمهارات' : 'Skills & activities', icon: Sparkles },
    { href: '/calendar', label: ar ? 'التقويم' : 'Calendar', icon: CalendarDays },
    { href: '/reports', label: ar ? 'تقارير الأداء' : 'Reports', icon: BarChart3 },
    { href: '/profile', label: ar ? 'ملفي الشخصي' : 'My profile', icon: User },
    { href: '/settings', label: ar ? 'الإعدادات' : 'Settings', icon: Settings },
  ];
  const active = (href: string) => pathname === href || pathname.startsWith(href + '/') || (href === '/courses' && pathname.startsWith('/lessons/'));
  const navLink = (item: typeof links[number], compact = false) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} aria-current={active(item.href) ? 'page' : undefined}
    className={compact ? `student-dock-link ${active(item.href) ? 'student-nav-active' : ''}` : `student-nav-link ${active(item.href) ? 'student-nav-active' : ''}`}><item.icon size={20} aria-hidden="true" /><span>{item.label}</span></Link>;
  return <>
    <header className="student-header no-print"><div className="max-w-[1400px] mx-auto flex items-center justify-between gap-3 px-4 sm:px-6 py-3">
      <Link href="/dashboard" aria-label={ar ? 'Klevro — الرئيسية' : 'Klevro — Home'} className="flex items-center gap-2 shrink-0"><Image src="/logo.jpeg" alt="" width={42} height={42} className="rounded-xl" /><span className="font-black text-lg text-slate-900 hidden sm:block">Klevro</span></Link>
      {!isFullscreen && <nav aria-label={ar ? 'التنقل الرئيسي' : 'Main navigation'} className="hidden xl:flex items-center gap-1">{links.slice(0, 7).map(item => navLink(item))}</nav>}
      <div className="flex items-center gap-2">
        <button className="student-icon-button text-xs font-black" onClick={() => setLanguage(ar ? 'en' : 'ar')} aria-label={ar ? 'التبديل للإنجليزية' : 'Switch to Arabic'}>{ar ? 'EN' : 'عربي'}</button>
        {onToggleFullscreen && <button className="student-icon-button" onClick={onToggleFullscreen} aria-label={ar ? (isFullscreen ? 'تصغير مساحة الدراسة' : 'تكبير مساحة الدراسة') : (isFullscreen ? 'Exit fullscreen' : 'Expand study area')}>{isFullscreen ? <Minimize size={19} /> : <Maximize size={19} />}</button>}
        <button className="student-icon-button" aria-label={ar ? 'القائمة والحساب' : 'Menu & account'} aria-expanded={open} aria-controls="student-menu" onClick={() => setOpen(true)}><Menu size={22} /></button>
      </div>
    </div></header>
    <nav aria-label={ar ? 'التنقل السريع' : 'Quick navigation'} className="student-dock no-print">{links.slice(0, 4).map(item => navLink(item, true))}<button className={`student-dock-link ${links.slice(4).some(item => active(item.href)) ? 'student-nav-active' : ''}`} onClick={() => setOpen(true)} aria-expanded={open} aria-controls="student-menu"><Menu size={20}/><span>{ar ? 'المزيد' : 'More'}</span></button></nav>
    {open && <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-3 bg-slate-900/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div id="student-menu" ref={modal} role="dialog" aria-modal="true" aria-labelledby="student-menu-title" tabIndex={-1} className="bg-white rounded-[30px] shadow-xl border border-slate-200 w-full max-w-xl max-h-[85dvh] overflow-y-auto p-5 sm:p-7" onClick={event => event.stopPropagation()}>
        <div className="flex items-center justify-between mb-5"><h2 id="student-menu-title" className="text-xl font-black">{ar ? 'مساحتك الدراسية' : 'Your learning space'}</h2><button className="student-icon-button" onClick={() => setOpen(false)} aria-label={ar ? 'إغلاق القائمة' : 'Close menu'}><X size={20}/></button></div>
        <nav aria-label={ar ? 'كل الصفحات' : 'All pages'} className="grid grid-cols-1 sm:grid-cols-2 gap-2">{links.map(item => navLink(item))}</nav>
        <div className="mt-5 border-t border-slate-200 pt-4 flex flex-wrap gap-3">
          {typeof window !== 'undefined' && localStorage.getItem('is_impersonating') === 'true' && <button className="report-secondary" onClick={() => stopImpersonation()}><ArrowLeftCircle size={18}/>{ar ? 'العودة للإدارة' : 'Return to admin'}</button>}
          <button className="report-secondary text-rose-700" onClick={() => logout(router, pathname)}><LogOut size={18}/>{ar ? 'تسجيل الخروج' : 'Sign out'}</button>
        </div>
      </div>
    </div>}
  </>;
}
