'use client';
import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Search, Trophy, Pencil, CheckCircle2, XCircle, Clock3 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import HtmlRenderer from '@/components/HtmlRenderer';
import { useLanguage } from '@/contexts/LanguageContext';
import { studentGradeLabel } from '@/lib/studentLocale';
import { competitionRequest, competitionError } from './api';
import styles from './CompetitionResults.module.css';

function AnswerValue({ value, empty }: { value: unknown; empty: string }) {
  if (value === null || value === undefined || value === '') return <span>{empty}</span>;
  return <HtmlRenderer html={Array.isArray(value) ? value.map(item => typeof item === 'string' ? item : JSON.stringify(item)).join('، ') : typeof value === 'string' ? value : JSON.stringify(value)} />;
}
export default function CompetitionResults() {
  const { id } = useParams<{ id: string }>(); const path = usePathname();
  const root = (path.startsWith('/super-admin') ? '/super-admin' : '/school-admin') + '/competitions';
  const { language } = useLanguage(); const ar = language === 'ar'; const text = (a: string, e: string) => ar ? a : e;
  const [data, setData] = useState<any>(null), [detail, setDetail] = useState<any>(null), [entryId, setEntryId] = useState('');
  const [search, setSearch] = useState(''), [query, setQuery] = useState(''), [page, setPage] = useState(1);
  const [error, setError] = useState(''), [detailError, setDetailError] = useState(''), [loading, setLoading] = useState(true), [detailLoading, setDetailLoading] = useState(false), [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    competitionRequest('/manage/' + id + '/results?page=' + page + '&search=' + encodeURIComponent(query)).then(result => { if (active) setData(result); }).catch(error => { if (active) setError(error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, page, query, retry]);
  useEffect(() => {
    if (!entryId) return;
    let active = true; setDetailLoading(true); setDetail(null); setDetailError('');
    competitionRequest('/manage/' + id + '/results/' + entryId).then(result => { if (active) setDetail(result); }).catch(error => { if (active) setDetailError(error.message); }).finally(() => { if (active) setDetailLoading(false); });
    return () => { active = false; };
  }, [id, entryId, retry]);
  const statusLabel = (status: string) => ({ CORRECT: text('صحيحة', 'Correct'), INCORRECT: text('خاطئة', 'Incorrect'), TIMED_OUT: text('انتهى الوقت', 'Timed out'), UNANSWERED: text('لم يُجب', 'Unanswered') }[status]);
  return <DashboardLayout><div className={styles.page} dir={ar ? 'rtl' : 'ltr'}>
    <div className={styles.actions} style={{ marginBottom: 14 }}><button type="button" disabled={loading || detailLoading} onClick={() => setRetry(value => value + 1)}>{text('تحديث النتائج', 'Refresh results')}</button></div>
    <header className={styles.header}><div><span className={styles.eyebrow}><Trophy size={18}/>{text('نتائج الطلاب', 'Student results')}</span><h1>{data?.room ? (ar ? data.room.title : data.room.titleEn || data.room.title) : text('نتائج المسابقة', 'Competition results')}</h1><p>{text('اضغط على اسم الطالب لعرض كل إجاباته وما حلّه صح أو خطأ.', 'Select a student to review every answer and see what was correct or incorrect.')}</p></div><nav className={styles.actions}><Link href={root}>{text('كل المسابقات', 'All competitions')}</Link><Link href={root + '/' + id + '/edit'}><Pencil size={16}/>{text('تعديل المسابقة', 'Edit competition')}</Link><Link href={root + '/' + id}>{text('تشغيل المسابقة واعتماد النتائج', 'Host & finalise results')}</Link></nav></header>
    {data?.room.status === 'OPEN' && <p className={styles.notice}>{text('النتائج هنا مباشرة. الترتيب النهائي على الرئيسية يظهر بعد اعتماد النتائج وتفعيل النشر وفق إعدادات المنصة والمدرسة والطالب.', 'These results are live. Homepage rankings appear after finalisation and publication according to platform, school and student settings.')}</p>}
    <div className={styles.workspace}><section className={styles.card} aria-labelledby="participants-title"><h2 id="participants-title">{text('كل الطلاب المشاركين', 'All participants')} {data ? '(' + data.total + ')' : ''}</h2>
      <form className={styles.search} onSubmit={event => { event.preventDefault(); setPage(1); setQuery(search.trim()); }}><label className="sr-only" htmlFor="student-result-search">{text('ابحث باسم الطالب', 'Search student name')}</label><input id="student-result-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder={text('ابحث باسم الطالب…', 'Search student name…')}/><button type="submit" aria-label={text('بحث', 'Search')}><Search size={18}/></button></form>
      {error ? <p role="alert">{competitionError(error, ar)} <button onClick={() => setRetry(value => value + 1)}>{text('إعادة المحاولة', 'Retry')}</button></p> : loading ? <p role="status">{text('جارٍ تحميل النتائج…', 'Loading results…')}</p> : !data?.entries.length ? <p className={styles.empty}>{query ? text('لا يوجد طالب بهذا الاسم.', 'No matching student.') : text('لم ينضم طلاب بعد.', 'No students have joined yet.')}</p> : <div className={styles.students}>{data.entries.map((entry: any) => <button key={entry.id} className={styles.student} aria-pressed={entry.id === entryId} onClick={() => setEntryId(entry.id)}><span><strong>{entry.student.name}</strong><small>{entry.student.school?.name} · {studentGradeLabel(entry.student.grade || '', language)}</small><small>{entry.finishedAt ? text('أكمل المسابقة', 'Completed') : text('المحاولة جارية', 'In progress')} · {entry.answered}/{entry.questionCount} {text('إجابة', 'answered')}</small></span><span><b>{entry.score}</b><small>{entry.correct}/{entry.questionCount} {text('صحيحة', 'correct')}</small></span></button>)}</div>}
      {data?.pages > 1 && <div className={styles.actions}><button disabled={page <= 1} onClick={() => setPage(value => value - 1)}>{text('السابق', 'Previous')}</button><span>{page}/{data.pages}</span><button disabled={page >= data.pages} onClick={() => setPage(value => value + 1)}>{text('التالي', 'Next')}</button></div>}
    </section><section className={styles.card} aria-label={text('تفاصيل إجابات الطالب', 'Student answer details')} aria-live="polite">
      {detailLoading ? <p role="status">{text('جارٍ تحميل الإجابات…', 'Loading answers…')}</p> : detailError ? <p role="alert">{competitionError(detailError, ar)} <button onClick={() => setRetry(value => value + 1)}>{text('إعادة المحاولة', 'Retry')}</button></p> : !detail ? <div className={styles.empty}><Trophy size={38}/><h2>{text('اختر اسم طالب', 'Select a student')}</h2><p>{text('ستظهر الأسئلة وإجابة الطالب والإجابة الصحيحة ودرجته في كل سؤال.', 'Review the questions, submitted answers, answer keys and points for each question.')}</p></div> : <>
        <h2>{detail.entry.student.name}</h2><p>{detail.entry.student.school?.name} · {studentGradeLabel(detail.entry.student.grade || '', language)}</p><div className={styles.metrics}><span>{text('إجمالي النقاط', 'Total points')}<b>{detail.entry.score}</b></span><span>{text('صحيحة', 'Correct')}<b>{detail.answers.filter((answer: any) => answer.correct === true).length}</b></span><span>{text('خاطئة أو انتهى وقتها', 'Incorrect or timed out')}<b>{detail.answers.filter((answer: any) => answer.correct === false).length}</b></span><span>{text('لم يُجب', 'Unanswered')}<b>{detail.answers.filter((answer: any) => answer.correct === null).length}</b></span></div>
        <p className={styles.notice}>{text('هذه نسخة الأسئلة الخاصة بمحاولة الطالب، حتى لو عُدّلت المسابقة بعدها.', 'These are the questions from this student’s attempt, including when the competition was edited later.')}</p>
        <div className={styles.answers}>{detail.answers.map((answer: any) => <article className={styles.answer} key={answer.questionId} data-status={answer.status}><div className={styles.answerHeading}><h3>{text('السؤال', 'Question')} {answer.index}</h3><span>{answer.status === 'CORRECT' ? <CheckCircle2 size={18}/> : answer.status === 'UNANSWERED' ? <Clock3 size={18}/> : <XCircle size={18}/>} {statusLabel(answer.status)}</span></div><HtmlRenderer html={ar ? answer.text : answer.textEn || answer.text}/><dl><div><dt>{text('إجابة الطالب', 'Student answer')}</dt><dd><AnswerValue value={answer.answer} empty={text('لم يسجل إجابة', 'No answer recorded')}/></dd></div><div><dt>{text('الإجابة الصحيحة', 'Correct answer')}</dt><dd><AnswerValue value={!ar && answer.correctAnswerEn != null ? answer.correctAnswerEn : answer.correctAnswer} empty="—"/></dd></div></dl><p>{text('النقاط', 'Points')}: {answer.points} · {text('درجة السؤال', 'Question points')}: {answer.maxPoints}{answer.elapsedMs != null && <> · {text('الوقت', 'Time')}: {Math.ceil(answer.elapsedMs / 1000)} {text('ثانية', 'seconds')}</>}</p>{(answer.explanation || answer.explanationEn) && <details><summary>{text('الشرح', 'Explanation')}</summary><HtmlRenderer html={!ar && answer.explanationEn ? answer.explanationEn : answer.explanation || answer.explanationEn}/></details>}</article>)}</div>
      </>}
    </section></div>
  </div></DashboardLayout>;
}
