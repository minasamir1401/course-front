'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { competitionRequest } from './api';
import styles from './Competitions.module.css';
type Row = { rank: number; name: string; school: string; score: number; correct: number; competitions: number; isMe?: boolean };
export default function Leaderboard({ publicView = false, className = '', hideArenaLink = false }: { publicView?: boolean; className?: string; hideArenaLink?: boolean }) {
  const { language } = useLanguage(); const ar = language === 'ar'; const [period, setPeriod] = useState('WEEK'); const [items, setItems] = useState<Row[]>([]); const [enabled, setEnabled] = useState(true); const [error, setError] = useState(false); const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true; setLoading(true); setError(false);
    const load = async () => { if (document.hidden) return; try { const data = publicView ? await fetch(`/api/public/competitions/leaderboard?period=${period}`, { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error(); return r.json(); }) : await competitionRequest(`/leaderboard?period=${period}`); if (active) { setItems(data.items || []); setEnabled(data.enabled); setError(false); } } catch { if (active) setError(true); } finally { if (active) setLoading(false); } };
    void load(); const timer = setInterval(load, 60000); document.addEventListener('visibilitychange', load);
    return () => { active = false; clearInterval(timer); document.removeEventListener('visibilitychange', load); };
  }, [period, publicView]);
  return <section className={[styles.board, className].join(' ')} aria-label={ar ? 'لوحة متصدري المنافسات' : 'Competition leaderboard'} dir={ar ? 'rtl' : 'ltr'}><div className={styles.row}><div><div className={styles.questionArt}><Trophy size={25}/><span className={styles.tag}>{ar ? 'نجوم التعلّم' : 'Learning champions'}</span></div><h2>{ar ? 'أفضل 5 طلاب في المنافسات' : 'Top 5 ranked students'}</h2><p className={styles.muted}>{ar ? 'نقاط منافسات حقيقية، منفصلة عن درجات الامتحانات الرسمية.' : 'Real competition points, separate from official exam grades.'}</p></div><div className={styles.tabs}>{[['WEEK', ar ? 'هذا الأسبوع' : 'This week'], ['MONTH', ar ? 'هذا الشهر' : 'This month'], ['ALL', ar ? 'كل الوقت' : 'All time']].map(([value, label]) => <button key={value} className={`${styles.secondary} ${period === value ? styles.selected : ''}`} aria-pressed={period === value} onClick={() => setPeriod(value)}>{label}</button>)}</div></div>
    {loading ? <p className={styles.loading} role="status">{ar ? 'جارٍ تحميل الترتيب…' : 'Loading rankings…'}</p> : error ? <p role="status" className={styles.empty}>{ar ? 'تعذر تحميل الترتيب الآن.' : 'Rankings could not be loaded.'}</p> : !enabled || !items.length ? <p className={styles.empty}>{publicView ? (ar ? 'أسماء النجوم ونتائجهم تظهر هنا بعد اعتماد النتائج وتفعيل النشر من الإدارة والمدرسة واختيار الطالب.' : 'Champions appear here after results are final, publication is enabled by administration and school, and students choose to participate publicly.') : (ar ? 'ابدأ منافسة وأكملها، ثم تظهر النقاط بعد اعتماد النتائج من الأدمن.' : 'Complete a competition. Points appear after an admin finalises the results.')}</p> : <div className={styles.boardGrid}>{items.map(item => <article className={styles.podium} key={item.rank}><span className={styles.rank}>{item.rank === 1 ? <Trophy size={21}/> : item.rank}</span><h3>{item.name}{item.isMe ? (ar ? ' · أنت' : ' · You') : ''}</h3><p className={styles.muted}>{item.school}</p><strong className={styles.points}>{item.score.toLocaleString(ar ? 'ar-EG' : 'en-GB')}</strong><p className={styles.tiny}>{ar ? 'نقطة منافسات' : 'Competition points'} · {item.competitions} {ar ? 'منافسة' : 'competitions'}</p></article>)}</div>}
    {!hideArenaLink && <div className={styles.actions}><Link className={styles.primary} href="/competitions">{ar ? 'ادخل ساحة المنافسة' : 'Enter the competition arena'}<ArrowUpRight size={17}/></Link></div>}
  </section>;
}
