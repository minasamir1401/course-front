'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Eye, RotateCcw, Pencil } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import CompetitionPlay from './CompetitionPlay';
import { competitionRequest } from './api';
import { useGameFeedback } from './useGameFeedback';
import styles from './CompetitionPreview.module.css';
import playStyles from './CompetitionPlay.module.css';

const freshAttempt = () => ({ joined: false, index: 0, score: 0, correct: 0, startedAt: null as number | null, completedAt: null as string | null, feedback: null as any });
export default function CompetitionPreview() {
  const { id } = useParams<{ id: string }>(), path = usePathname();
  const base = (path.startsWith('/super-admin') ? '/super-admin' : '/school-admin') + '/competitions';
  const { language } = useLanguage(), ar = language === 'ar';
  const text = (a: string, e: string) => ar ? a : e;
  const [data, setData] = useState<any>(null), [attempt, setAttempt] = useState(freshAttempt);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [now, setNow] = useState(Date.now());
  const [sound, setSound] = useState(true);
  const generation = useRef(0), inflight = useRef(false), automatic = useRef(''), warning = useRef('');
  const cancelRequests = useCallback(() => { generation.current++; }, []);
  const audio = useGameFeedback(sound && !!data?.policy?.sound, !!data?.policy?.motion);
  const reset = () => { generation.current++; automatic.current = ''; warning.current = ''; setAttempt(freshAttempt()); setError(''); setNow(Date.now()); };
  const load = useCallback(async () => {
    const revision = ++generation.current; setData(null); setError(''); setAttempt(freshAttempt()); automatic.current = ''; warning.current = '';
    try { const result = await competitionRequest('/manage/' + id + '/preview'); if (generation.current === revision) setData(result); }
    catch (error) { if (generation.current === revision) setError((error as Error).message); }
  }, [id]);
  useEffect(() => { void load(); const clock = setInterval(() => setNow(Date.now()), 250); return () => { cancelRequests(); clearInterval(clock); }; }, [load, cancelRequests]);
  const current = data?.questions[attempt.index];
  const question = useMemo(() => current && attempt.startedAt !== null && !attempt.completedAt ? { ...current, index: attempt.index, startedAt: new Date(attempt.startedAt).toISOString() } : null, [current, attempt.index, attempt.startedAt, attempt.completedAt]);
  const remaining = question ? Math.max(0, Math.ceil((attempt.startedAt! + question.seconds * 1000 - now) / 1000)) : 0;
  const answer = async (value: unknown, index?: number) => {
    if (!question || inflight.current || attempt.completedAt) return;
    inflight.current = true; setBusy(true); setError(''); audio.unlock();
    const revision = generation.current;
    try {
      const result = await competitionRequest('/manage/' + id + '/preview-answer', { questionId: question.id, language, elapsedMs: Math.min(86400000, Math.max(0, Date.now() - attempt.startedAt!)), ...(index === undefined ? { answer: value } : { selectedIndex: index }) });
      if (revision !== generation.current) return;
      const next = attempt.index + 1, correct = attempt.correct + (result.correct ? 1 : 0), complete = next === data.questions.length;
      setAttempt(previous => ({ ...previous, index: next, startedAt: null, score: previous.score + result.points, correct, feedback: result, completedAt: complete ? new Date().toISOString() : null }));
      void audio.play(result.correct ? 'correct' : 'incorrect');
      if (complete) void audio.play(correct >= data.questions.length * .75 ? 'victory' : 'complete', .72);
    } catch (error) { if (revision === generation.current) setError((error as Error).message); }
    finally { if (revision === generation.current) { inflight.current = false; setBusy(false); } }
  };
  useEffect(() => {
    if (!question || busy || attempt.completedAt) return;
    if (!remaining && automatic.current !== question.id) { automatic.current = question.id; void answer(null); }
    else if (remaining > 0 && remaining <= 5 && warning.current !== question.id + ':' + remaining) { warning.current = question.id + ':' + remaining; void audio.play('warning'); }
  });
  const state = data ? {
    room: { ...data.room, status: attempt.completedAt ? 'FINISHED' : 'OPEN', mode: 'SELF_PACED', opensAt: null, closesAt: null, teams: false, prizeLabel: null, participants: 0, questionCount: data.questions.length },
    policy: { ...data.policy, enabled: true, leaderboard: false, publicBoard: false },
    entry: attempt.joined ? { id: 'preview', currentIndex: attempt.index, score: attempt.score, correct: attempt.correct, finishedAt: attempt.completedAt } : null,
    question, feedback: attempt.feedback, leaders: [], teamScores: [],
  } : null;
  return <DashboardLayout mainClassName={playStyles.main}><div dir={ar ? 'rtl' : 'ltr'}>
    <aside className={styles.banner} aria-label={text('وضع المعاينة', 'Preview mode')}>
      <div><strong><Eye size={20}/>{text('معاينة كطالب', 'Preview as student')}</strong><p>{text('جرّب الحل والوقت والأصوات. الإجابات والنتيجة تجريبية ولا تُسجّل ضمن مشاركات الطلاب أو الترتيب.', 'Try the questions, timer and sounds. Preview answers and scores are not saved to student participation or rankings.')}</p>
      {data?.room.mode === 'LIVE' && <p>{text('في معاينة المسابقة المباشرة، تنتقل بين الأسئلة بنفسك لتجربتها.', 'In a live competition preview, advance through the questions yourself to try them.')}</p>}</div>
      <nav className={styles.actions}><Link href={base + '/' + id + '/edit'}><Pencil size={16}/>{text('تعديل المسابقة', 'Edit competition')}</Link><button type="button" disabled={busy || !data?.questions.length} onClick={reset}><RotateCcw size={16}/>{text('إعادة المعاينة', 'Restart preview')}</button></nav>
    </aside>
    {data && !data.questions.length ? <section className={styles.empty}><h1>{text('أضف أسئلة لبدء المعاينة', 'Add questions to start the preview')}</h1><p>{text('احفظ أسئلة المسابقة أولًا، ثم افتح المعاينة لتجربتها كطالب.', 'Save the competition questions, then open the preview to try them as a student.')}</p><Link href={base + '/' + id + '/edit'}>{text('إضافة الأسئلة', 'Add questions')}</Link></section> :
      <CompetitionPlay state={state} ar={ar} busy={busy} remaining={remaining} complete={!!attempt.completedAt} error={error} sound={sound && !!data?.policy?.sound} soundAllowed={!!data?.policy?.sound} password="" setPassword={() => {}} backHref={base}
        onSound={() => { if (!sound) audio.unlock(true); setSound(value => !value); }}
        onPreview={() => { audio.unlock(true); void audio.play('start'); }}
        onJoin={() => { audio.unlock(); void audio.play('select'); setAttempt(previous => ({ ...previous, joined: true })); }}
        onStart={() => { if (!current || attempt.startedAt !== null || inflight.current) return; audio.unlock(); void audio.play('start'); const startedAt = Date.now(); setNow(startedAt); setAttempt(previous => ({ ...previous, startedAt })); }}
        onSelect={() => { audio.unlock(); void audio.play('select'); }} onAnswer={(value, index) => void answer(value, index)} onRetry={() => void load()}/>}
  </div></DashboardLayout>;
}
