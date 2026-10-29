'use client';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Sparkles, BarChart3, TrendingUp, Target, ListOrdered, Copy, Check, ChevronDown } from 'lucide-react';
import { studyPlanParts, studyPlanTone } from '@/lib/aiStudyPlan';
import { formatEgyptDateTime } from '@/lib/egyptTime';
import { useLanguage } from '@/contexts/LanguageContext';
import AiReply from './AiReply';
import styles from './AiStudyPlan.module.css';

export default function AiStudyPlan({ narrative, generatedAt, busy, expanded, onToggle }: {
  narrative?: string; generatedAt?: string; busy: boolean; expanded: boolean; onToggle: () => void;
}) {
  const { language } = useLanguage(); const ar = language === 'ar', txt = (a: string, b: string) => ar ? a : b;
  const id = useId(), panelRef = useRef<HTMLElement>(null), wasBusy = useRef(false);
  const [copied, setCopied] = useState(false), [copyError, setCopyError] = useState(false);
  const parts = useMemo(() => studyPlanParts(narrative || ''), [narrative]);
  useEffect(() => { setCopied(false); setCopyError(false); }, [narrative]);
  useEffect(() => {
    const justFinished = wasBusy.current && !busy; wasBusy.current = busy;
    if (justFinished && narrative && expanded) {
      const frame = requestAnimationFrame(() => panelRef.current?.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }));
      return () => cancelAnimationFrame(frame);
    }
  }, [busy, narrative, expanded]);
  if (!narrative && !busy) return null;
  const date = generatedAt && Number.isFinite(Date.parse(generatedAt)) ? formatEgyptDateTime(generatedAt, language) : null;
  const icons = { summary: BarChart3, strength: TrendingUp, practice: Target, steps: ListOrdered };
  return <section ref={panelRef} className={styles.panel} aria-label={txt('ملخصك الدراسي وخطة المذاكرة', 'Your study summary and plan')} aria-busy={busy}>
    <header className={styles.header}>
      <div className={styles.identity}><span className={styles.icon}><Sparkles size={21}/></span><div><div className={styles.eyebrow}>{txt('من نتائجك، عشان خطوتك الجاية', 'FROM YOUR RESULTS TO YOUR NEXT STEP')}</div><h3>{txt('ملخصك الدراسي', 'Your study summary')}</h3><p>{busy ? txt('بنراجع المؤشرات وبنرتّب أولوياتك…', 'Reviewing your results and organising your priorities…') : txt('قراءة بسيطة لمستواك، وخطوات تقدر تنفّذها.', 'A clear view of your progress, with practical next steps.')}</p></div></div>
      <div className={styles.actions}>{!busy && <button type="button" aria-label={txt('نسخ الملخص', 'Copy summary')} title={txt('نسخ الملخص', 'Copy summary')} onClick={async () => { try { await navigator.clipboard.writeText(narrative || ''); setCopied(true); setCopyError(false); } catch { setCopyError(true); } }}>{copied ? <Check size={16}/> : <Copy size={16}/>}<span>{copied ? txt('اتنسخ', 'Copied') : txt('نسخ', 'Copy')}</span></button>}<button type="button" onClick={onToggle} aria-expanded={expanded} aria-controls={id} aria-label={expanded ? txt('طي الملخص', 'Collapse summary') : txt('عرض الملخص', 'Show summary')}><span>{expanded ? txt('طي', 'Collapse') : txt('عرض', 'Show')}</span><ChevronDown size={18} className={expanded ? styles.flipped : ''}/></button></div>
    </header>
    <div className={styles.meta}><span className={busy ? styles.processing : styles.saved}>{busy ? txt('جاري تجهيز الملخص', 'Preparing summary') : txt('محفوظ في حسابك', 'Saved to your account')}</span>{!busy && date && <time dateTime={generatedAt}>{txt('آخر تحديث: ', 'Updated: ')}{date}</time>}</div>
    {copyError && <p className={styles.copyError} role="status">{txt('تعذر النسخ من المتصفح. يمكنك تحديد النص ونسخه.', 'Copying is unavailable. You can select and copy the text.')}</p>}
    {copied && <span className={styles.srOnly} role="status">{txt('تم نسخ الملخص', 'Summary copied')}</span>}
    <div id={id} hidden={!expanded} className={styles.body}>
      {busy ? <div className={styles.loading}><p role="status">{txt('بنجهّز ملخصًا واضحًا وخطة مناسبة لبياناتك…', 'Preparing a clear summary and a plan based on your data…')}</p><div className={styles.skeletonGrid} aria-hidden="true">{[0, 1, 2, 3].map(index => <div className={styles.skeleton} key={index}><i/><i/><i/></div>)}</div></div>
        : <>{parts.intro && <div className={styles.intro}><AiReply content={parts.intro}/></div>}<div className={styles.grid}>{parts.sections.map((section, index) => {
          const tone = studyPlanTone(section.title), Icon = icons[tone];
          return <article className={styles.section} data-tone={tone} key={`${index}:${section.title}`}><div className={styles.sectionHeading}><span><Icon size={17}/></span><h4>{section.title}</h4></div><AiReply content={section.content}/></article>;
        })}</div><p className={styles.note}>{txt('الخطة بتساعدك تختار أولوياتك، وتقدر تناقش أي خطوة فيها مع المساعد أو معلمك.', 'Use this plan to choose your priorities. You can discuss any step with your assistant or teacher.')}</p></>}
    </div>
  </section>;
}
