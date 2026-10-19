"use client";
import { questionMetadata } from "@/lib/bilingualMetadata";
import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, XCircle, RefreshCw, Printer } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import HtmlRenderer from '@/components/HtmlRenderer';
import InteractiveResultRenderer from '@/components/InteractiveResultRenderer';
import { API_URL, apiFetch } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatEgyptDateTime } from '@/lib/egyptTime';

export default function SubmissionReview(_props: Record<string, unknown>) {
  const { id } = useParams(); const pathname = usePathname(); const { language } = useLanguage(); const ar = language === 'ar';
  const txt = (a: string, e: string) => ar ? a : e;
  const prefix = pathname.startsWith('/super-admin') ? '/super-admin' : '/school-admin';
  const [data, setData] = useState<any>(null), [error, setError] = useState(''), [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setData(null); setError('');
    apiFetch(`${API_URL}/exams/submissions/${id}`, { signal: controller.signal, cache: 'no-store' }).then(async response => {
      const json = await response.json(); if (!response.ok) throw new Error(json.error); if (!controller.signal.aborted) setData(json);
    }).catch(error => { if (!controller.signal.aborted) setError(error.message); });
    return () => controller.abort();
  }, [id, reload]);
  return <DashboardLayout><div className="max-w-6xl mx-auto space-y-6" dir={ar ? 'rtl' : 'ltr'}>
    <div className="flex flex-wrap items-center justify-between gap-3"><Link className="report-secondary" href={`${prefix}/reports`}><ArrowRight size={17} />{txt('العودة للتقارير', 'Back to reports')}</Link><button className="report-secondary" onClick={() => window.print()} disabled={!data}><Printer size={17} />{txt('طباعة / PDF', 'Print / PDF')}</button></div>
    {error && <div role="alert" className="report-error">{error}<button className="report-secondary ms-3" onClick={() => setReload(value => value + 1)}><RefreshCw size={16} />{txt('إعادة المحاولة', 'Retry')}</button></div>}
    {!data && !error && <p role="status" className="premium-card p-10 rounded-[30px] text-center text-indigo-700">{txt('جارٍ تحميل سجل الإجابة…', 'Loading saved submission…')}</p>}
    {data && <><section className="premium-card p-6 sm:p-8 rounded-[30px]"><p className="text-sm font-bold text-indigo-700">{txt('تقرير إجابة الطالب', 'Student submission report')}</p><h1 className="text-2xl font-black text-slate-900 mt-2">{data.exam?.title}</h1><p className="text-slate-600 font-bold mt-3">{data.user?.name}</p><p className="text-xs text-slate-500 mt-2">{formatEgyptDateTime(data.createdAt, language)} · {txt('توقيت مصر', 'Egypt time')}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">{[[txt('الدرجة', 'Score'), `${data.totalScore} / ${data.exam?.totalPoints ?? '—'}`], [txt('النسبة', 'Percentage'), data.percentage == null ? '—' : `${Math.round(data.percentage)}%`], [txt('الإجابات الصحيحة', 'Correct answers'), `${data.correctAnswers} / ${data.totalQuestions}`], [txt('حد النجاح', 'Pass threshold'), `${data.exam?.passingScore ?? '—'}%`]].map(([label, value]) => <div key={label} className="bg-slate-50 rounded-2xl p-4"><p className="text-xs text-slate-500 font-bold">{label}</p><p className="text-xl font-black text-slate-900 mt-2">{value}</p></div>)}</div>
      {!data.historicalSnapshot && <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{txt('سجل قديم: الدرجة المحفوظة ثابتة، ولا تتوفر نسخة مؤكدة من نص السؤال وقت التسليم.', 'Legacy record: saved grades are preserved; question text at submission time was not captured.')}</p>}
    </section><section className="space-y-4"><h2 className="text-xl font-black text-slate-900">{txt('الإجابات كما سُجّلت', 'Answers as recorded')}</h2>{(data.answers || []).map((answer: any, index: number) => {
      const question = answer.question || {}; const text = !ar && question.textEn ? question.textEn : question.text;
      const explanation = !ar && question.explanationEn ? question.explanationEn : question.explanation;
      const simple = ['MCQ', 'TRUE_FALSE', 'MULTI_SELECT', 'MULTIPLE_CHOICE'].includes(question.type);
      return <article key={answer.id || question.id || index} className="premium-card rounded-[30px] p-5 sm:p-7"><div className="flex items-center justify-between gap-3 mb-5"><h3 className="font-black text-slate-800">{txt('السؤال', 'Question')} {index + 1}</h3><span className={`flex gap-2 items-center rounded-xl px-3 py-2 text-xs font-bold ${answer.isCorrect ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>{answer.isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}{answer.isCorrect ? txt('صحيحة', 'Correct') : txt('غير صحيحة / لم يُجب', 'Incorrect / unanswered')}</span></div><HtmlRenderer html={text || ''} />
        {simple ? <div className="grid sm:grid-cols-2 gap-3 mt-5"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black text-slate-500 mb-2">{txt('إجابة الطالب', 'Student answer')}</p><HtmlRenderer html={String(answer.selectedAnswer || txt('لم يُجب', 'Unanswered'))} /></div><div className="rounded-2xl bg-emerald-50 p-4"><p className="text-xs font-black text-emerald-800 mb-2">{txt('الإجابة الصحيحة', 'Correct answer')}</p><HtmlRenderer html={String(question.correctAnswer || '')} /></div></div> : <div className="mt-5"><InteractiveResultRenderer question={question} studentAnswer={answer.selectedAnswer} language={language} /></div>}
        {explanation && <details className="mt-5 rounded-2xl border border-indigo-100 p-4"><summary className="cursor-pointer text-indigo-700 font-bold">{txt('شرح الإجابة', 'Answer explanation')}</summary><div className="mt-4"><HtmlRenderer html={explanation} /></div></details>}
        {(question.skill || question.learningOutcome) && <p className="text-xs text-slate-500 mt-4">{txt('المهارة / المخرج:', 'Skill / outcome:')} {questionMetadata(question, "skill", language) || questionMetadata(question, "learningOutcome", language)}</p>}
      </article>;
    })}{!data.answers?.length && <p className="premium-card rounded-[30px] p-8 text-slate-500">{txt('لا توجد إجابات محفوظة في هذا السجل.', 'No saved answers in this record.')}</p>}</section></>}
  </div></DashboardLayout>;
}
