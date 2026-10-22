"use client";
import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useModalFocus } from '@/hooks/useModalFocus';
import styles from '@/components/student/LandingContent.module.css';
export default function Navbar() {
  const { language, setLanguage, ready } = useLanguage(); const ar = language === 'ar';
  const [open, setOpen] = useState(false); const ref = useRef<HTMLDivElement>(null);
  useModalFocus(open, ref, () => setOpen(false));
  const links = [['#features', ar ? 'المنصة' : 'Platform'], ['#for-everyone', ar ? 'لمن Klevro؟' : 'Who is it for?'], ['#how-it-works', ar ? 'كيف تبدأ؟' : 'How to start'], ['#account-help', ar ? 'الأسئلة الشائعة' : 'FAQs']];
  return <><header className={styles.header}><div className={`${styles.container} ${styles.navInner}`}><Link href="/" aria-label={ar ? 'Klevro — الصفحة الرئيسية' : 'Klevro — Home'} className={styles.brand}><Image src="/logo.jpeg" alt="" width={40} height={40} priority /><span>Klevro</span></Link><nav aria-label={ar ? 'التنقل الرئيسي' : 'Main navigation'} className={styles.navigation}>{links.map(([href, label]) => <a key={href} href={href}>{label}</a>)}</nav><div className={styles.navActions}><button type="button" disabled={!ready} className={styles.languageButton} onClick={() => setLanguage(ar ? 'en' : 'ar')} aria-label={ar ? 'التبديل للإنجليزية' : 'Switch to Arabic'}>{ar ? 'EN' : 'عربي'}</button><Link href="/login" className={styles.navSignIn}>{ar ? 'تسجيل الدخول' : 'Sign in'}</Link><button type="button" disabled={!ready} className={styles.menuButton} aria-label={ar ? 'افتح القائمة' : 'Open menu'} aria-expanded={open} aria-controls="landing-menu" onClick={() => setOpen(true)}><Menu size={20} aria-hidden="true" /></button></div></div></header>{open && <div className={styles.menuOverlay} onClick={() => setOpen(false)}><div ref={ref} id="landing-menu" tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="landing-menu-title" className={styles.menuDialog} onClick={event => event.stopPropagation()}><div className={styles.menuTitle}><h2 id="landing-menu-title">{ar ? 'اكتشف Klevro' : 'Explore Klevro'}</h2><button type="button" className={styles.languageButton} onClick={() => setOpen(false)} aria-label={ar ? 'إغلاق القائمة' : 'Close menu'}><X size={20} aria-hidden="true" /></button></div><nav aria-label={ar ? 'روابط الصفحة' : 'Page navigation'}>{links.map(([href, label]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}</nav></div></div>}</>;
}
