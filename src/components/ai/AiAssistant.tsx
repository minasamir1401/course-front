'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import { Sparkles } from 'lucide-react';
import { aiRequest, studentAssistantAllowed } from '@/lib/aiClient';
import { checkAuthSession } from '@/lib/auth';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './AiAssistant.module.css';
const AiChat = dynamic(() => import('./AiChat'), { ssr: false });

export default function AiAssistant() {
  const path = usePathname(); const { language } = useLanguage();
  const [mode, setMode] = useState<'public' | 'student' | null>(null), [open, setOpen] = useState(false);
  const [assessment, setAssessment] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [publicEntry, setPublicEntry] = useState<HTMLElement | null>(null);
  const lessonId = path.match(/^\/lessons\/([^/]+)$/)?.[1];
  useEffect(() => { setPublicEntry(path === '/' ? document.getElementById('klevro-public-assistant-entry') : null); }, [path]);
  useEffect(() => {
    const update = () => { const blocked = document.documentElement.dataset.aiAssessment === 'true'; setAssessment(blocked); if (blocked) { setOpen(false); setExpanded(false); } };
    update(); window.addEventListener('klevro:ai-context', update);
    return () => window.removeEventListener('klevro:ai-context', update);
  }, [path]);
  useEffect(() => {
    let cancelled = false; setMode(null); setOpen(false); setExpanded(false);
    async function load() {
      try {
        if (path === '/') {
          const config = await aiRequest('/public/config'); if (!cancelled && config.enabled) setMode('public');
        } else if (studentAssistantAllowed(path) && path !== '/assistant') {
          const session = await checkAuthSession();
          if (!session.authenticated || session.user?.role !== 'STUDENT') return;
          const config = await aiRequest(`/student/config${lessonId ? `?lessonId=${encodeURIComponent(lessonId)}` : ''}`);
          if (!cancelled && config.enabled) setMode('student');
        }
      } catch { /* Disabled/unavailable AI does not interrupt the learning page. */ }
    }
    void load(); return () => { cancelled = true; };
  }, [path, lessonId]);
  useEffect(() => {
    if (!expanded || !open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setExpanded(false); return; }
      if (event.key !== 'Tab') return;
      const controls = Array.from(panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], textarea, select, input:not(:disabled), summary, [tabindex="0"]') || []).filter(element => element.getClientRects().length > 0);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || !panelRef.current?.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !panelRef.current?.contains(document.activeElement))) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keyboard);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', keyboard); };
  }, [expanded, open]);
  if (!mode || assessment || (path !== '/' && (!studentAssistantAllowed(path) || path === '/assistant'))) return null;
  return <>{mode === 'public' && publicEntry && createPortal(<button type="button" className={styles.publicEntry} onClick={() => setOpen(true)} aria-expanded={open} aria-controls="klevro-assistant"><Sparkles size={18} aria-hidden="true"/>{language === 'ar' ? 'اسأل مساعد Klevro' : 'Ask Klevro AI'}</button>, publicEntry)}<button type="button" className={`${styles.launcher} ${mode === 'public' ? styles.publicLauncher : ''}`} onClick={() => { if (open) setExpanded(false); setOpen(value => !value); }} aria-label={language === 'ar' ? 'افتح مساعد Klevro' : 'Open Klevro assistant'} aria-expanded={open} aria-controls="klevro-assistant"><Sparkles size={23}/><span>{language === 'ar' ? 'مساعد Klevro' : 'Klevro assistant'}<small>{mode === 'public' ? (language === 'ar' ? 'اسأل عن المنصة' : 'Ask about the platform') : (language === 'ar' ? 'نذاكر خطوة بخطوة' : 'Learn, one step at a time')}</small></span></button>
    {open && <div ref={panelRef} className={`${styles.window} ${mode === 'public' ? styles.publicWindow : ''} ${expanded ? styles.windowExpanded : ''}`} id="klevro-assistant" role={expanded ? 'dialog' : undefined} aria-modal={expanded || undefined} aria-label={expanded ? (language === 'ar' ? 'مساعد Klevro المكبّر' : 'Expanded Klevro assistant') : undefined}><AiChat key={`${path}:${mode}`} mode={mode} lessonId={lessonId} expanded={expanded} onToggleExpand={() => setExpanded(value => !value)} onClose={() => { setOpen(false); setExpanded(false); }}/></div>}</>;
}
