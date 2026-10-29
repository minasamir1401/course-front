'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Download, Smartphone, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './Platform.module.css';
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const REMIND_AFTER = 30 * 60 * 1000;
export default function InstallApp() {
  const { language } = useLanguage(); const ar = language === 'ar'; const pathname = usePathname();
  const [open, setOpen] = useState(false); const [installed, setInstalled] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const installRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const update = () => setAssistantOpen(document.documentElement.dataset.aiChatOpen === 'true');
    update(); window.addEventListener('klevro:assistant-open', update);
    return () => window.removeEventListener('klevro:assistant-open', update);
  }, []);
  const [prompt, setPrompt] = useState<InstallEvent | null>(null); const [guide, setGuide] = useState(false); const [busy, setBusy] = useState(false); const [ios, setIos] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const installedRef = useRef(false);
  const schedule = useCallback((dismissed?: number) => {
    if (timer.current) clearTimeout(timer.current);
    if (installedRef.current) return;
    let last = dismissed || 0;
    if (!dismissed) { try { last = Number(localStorage.getItem('klevro-install-dismissed') || 0); } catch {} }
    const remaining = Math.max(0, REMIND_AFTER - Math.max(0, Date.now() - last));
    if (!last || !remaining) { setOpen(true); return; }
    timer.current = setTimeout(() => { if (!installedRef.current) { setGuide(false); setOpen(true); } }, remaining);
  }, []);
  const dismiss = useCallback(() => {
    setOpen(false); setGuide(false);
    const now = Date.now(); try { localStorage.setItem('klevro-install-dismissed', String(now)); } catch {}
    schedule(now);
  }, [schedule]);
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
    let registration: ServiceWorkerRegistration | undefined;
    const checkForUpdate = () => {
      if (!document.hidden) void registration?.update().catch(() => {});
    };
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then(value => { registration = value; checkForUpdate(); }).catch(() => {});
    window.addEventListener('pageshow', checkForUpdate);
    document.addEventListener('visibilitychange', checkForUpdate);
    let knownInstalled = false; try { knownInstalled = localStorage.getItem('klevro-app-installed') === 'true'; } catch {}
    const standalone = window.matchMedia('(display-mode: standalone)').matches || !!(navigator as Navigator & { standalone?: boolean }).standalone;
    const isInstalled = standalone || knownInstalled;
    if (standalone) { try { localStorage.setItem('klevro-app-installed', 'true'); } catch {} }
    installedRef.current = isInstalled; setInstalled(isInstalled); setIos(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
    schedule();
    const before = (event: Event) => { event.preventDefault(); setPrompt(event as InstallEvent); if (!standalone) { try { localStorage.removeItem('klevro-app-installed'); } catch {} installedRef.current = false; setInstalled(false); schedule(); } };
    const done = () => { try { localStorage.setItem('klevro-app-installed', 'true'); } catch {} installedRef.current = true; if (timer.current) clearTimeout(timer.current); setInstalled(true); setOpen(false); setPrompt(null); };
    const show = () => { if (standalone) return; try { localStorage.removeItem('klevro-app-installed'); } catch {} installedRef.current = false; setInstalled(false); setOpen(true); };
    window.addEventListener('beforeinstallprompt', before); window.addEventListener('appinstalled', done); window.addEventListener('klevro-install', show);
    const sync = () => { if (!document.hidden) { try { if (localStorage.getItem('klevro-app-installed') === 'true') { done(); return; } } catch {} setOpen(false); schedule(); } };
    window.addEventListener('storage', sync); document.addEventListener('visibilitychange', sync);
    return () => { if (timer.current) clearTimeout(timer.current); window.removeEventListener('beforeinstallprompt', before); window.removeEventListener('appinstalled', done); window.removeEventListener('klevro-install', show); window.removeEventListener('storage', sync); document.removeEventListener('visibilitychange', sync); window.removeEventListener('pageshow', checkForUpdate); document.removeEventListener('visibilitychange', checkForUpdate); };
  }, [schedule]);
  const install = async () => {
    if (!prompt) { setGuide(true); return; }
    setBusy(true);
    try { await prompt.prompt(); const choice = await prompt.userChoice; setPrompt(null); if (choice.outcome === 'accepted') setOpen(false); else dismiss(); }
    catch { setGuide(true); }
    finally { setBusy(false); }
  };
  // Keep promotional prompts out of assessments and the focused lesson editor.
  const takingExam = /^\/(exams|competitions)\/[^/]+$/.test(pathname || '') || /\/courses\/lesson$/.test(pathname || '');
  useEffect(() => {
    const element = installRef.current;
    if (!element) { document.documentElement.style.removeProperty('--klevro-ai-dock-bottom'); return; }
    const update = () => document.documentElement.style.setProperty('--klevro-ai-dock-bottom', `${element.getBoundingClientRect().height + (Number.parseFloat(getComputedStyle(element).bottom) || 0) + 14}px`);
    update(); const observer = new ResizeObserver(update); observer.observe(element); window.addEventListener('resize', update);
    return () => { observer.disconnect(); window.removeEventListener('resize', update); document.documentElement.style.removeProperty('--klevro-ai-dock-bottom'); };
  }, [open, installed, takingExam, assistantOpen, guide]);
  if (!open || installed || takingExam || assistantOpen) return null;
  return <aside ref={installRef} className={styles.install} aria-label={ar ? 'تثبيت تطبيق Klevro' : 'Install Klevro'} dir={ar ? 'rtl' : 'ltr'}>
    <div className={styles.installTop}><Smartphone size={25} aria-hidden="true"/><div><h2>{ar ? 'منصتك أقرب… حمّل التطبيق' : 'Your learning space, one tap away'}</h2><p>{ar ? 'ثبّت Klevro على الموبايل أو الكمبيوتر وافتح دروسك مباشرة.' : 'Install Klevro on your phone or computer for direct access to your learning space.'}</p></div><button className={styles.close} aria-label={ar ? 'إخفاء دعوة التثبيت' : 'Dismiss installation invitation'} onClick={dismiss}><X size={17}/></button></div>
    <div className={styles.actions}><button className={styles.primary} disabled={busy} onClick={install}><Download size={17}/>{ar ? 'حمّل التطبيق' : 'Install app'}</button><button className={styles.secondary} onClick={dismiss}>{ar ? 'لاحقًا' : 'Later'}</button></div>
    {guide && <p className={styles.guide} role="status">{ios ? (ar ? 'في Safari: اضغط مشاركة، ثم «إضافة إلى الشاشة الرئيسية»، ثم افتح التطبيق من أيقونته.' : 'In Safari, tap Share → Add to Home Screen, then open the app from its icon.') : (ar ? 'افتح قائمة المتصفح واختر «تثبيت Klevro» أو «تثبيت هذا الموقع كتطبيق». إذا لم يظهر الخيار، جرّب Chrome أو Edge بعد تحديثهما.' : 'Open your browser menu and choose Install Klevro or Install this site as an app. If unavailable, try an up-to-date Chrome or Edge browser.')}</p>}
  </aside>;
}
