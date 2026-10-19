"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Clock, FileText, Layers } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import StudentPageHeader, { StudentFeedback } from '@/components/student/StudentPageHeader';
import { API_URL, apiFetch } from '@/lib/api';
import { getStudentExamTitle, getStudentExamDuration } from '@/lib/examModuleView';
import { studentExamAvailability, latestStudentSubmission, examAvailabilityLabel } from '@/lib/studentExamAvailability';
import { formatEgyptDateTime } from '@/lib/egyptTime';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ExamDetailsPage() {
  const { id } = useParams(); const { language } = useLanguage(); const ar = language === 'ar'; const txt = (a: string, e: string) => ar ? a : e;
  const [exam, setExam] = useState<any>(null), [loading, setLoading] = useState(true), [error, setError] = useState(''), [reload, setReload] = useState(0);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    apiFetch(API_URL + '/exams/' + id + '?includeQuestions=false', { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error(); const data = await response.json(); if (!controller.signal.aborted) setExam(data);
    }).catch(() => { if (!controller.signal.aborted) setError(txt('تعذر تحميل تفاصيل الامتحان. حاول مرة أخرى.', 'Could not load exam details. Please retry.')); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, reload, language]);
  const clean = (title: string) => (title || '').replace(/(?:الموديول|الموديل|المديول|موديول|مديول)\s+/g, 'القسم ');
  function examRow(child: any, moduleId?: string, sectionTitle?: string) {
    const submissions = (exam.submissions || []).filter((item: any) => child ? item.subExamId === child.id : !item.subExamId);
    const status = studentExamAvailability(child || exam, submissions, child ? exam : undefined, now);
    const last = latestStudentSubmission(submissions);
    const href = '/exams/' + exam.id + (child ? '?subExamId=' + child.id : moduleId ? '?moduleId=' + moduleId : '');
    const opens = child?.publishDate || exam.startDate; const closes = child?.cutOffDate || exam.endDate;
    const attempts = child?.attemptsAllowed ?? exam.attemptsAllowed;
    return <article key={child?.id || moduleId || exam.id} className="rounded-[24px] border border-slate-200 bg-white p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-black text-slate-900 break-words">{clean(child?.title || sectionTitle || exam.title)}</h3><span className="student-status" data-status={status}>{examAvailabilityLabel(status, ar)}</span></div>
      <div className="flex flex-wrap gap-4 text-sm text-slate-600"><span className="flex items-center gap-1"><Clock size={16}/>{getStudentExamDuration(exam, child?.id || null, moduleId)} {txt('دقيقة', 'min')}</span><span className="flex items-center gap-1"><FileText size={16}/>{child?.questionsCount ?? child?._count?.questions ?? child?.questions?.length ?? (moduleId ? exam.modules?.find((m: any) => m.id === moduleId)?.questionsCount : exam.questionsCount) ?? '—'} {txt('سؤال', 'questions')}</span><span>{txt('المحاولات:', 'Attempts:')} {submissions.length} / {attempts && attempts !== 999 ? attempts : txt('غير محدودة', 'Unlimited')}</span></div>
      {(opens || closes) && <p className="text-sm text-slate-600">{opens && <span className="block">{txt('يفتح:', 'Opens:')} {formatEgyptDateTime(opens, language)}</span>}{closes && <span className="block">{txt('يغلق:', 'Closes:')} {formatEgyptDateTime(closes, language)}</span>}<small>{txt('بتوقيت مصر', 'Egypt time')}</small></p>}
      <div className="flex flex-wrap gap-3">{status === 'AVAILABLE' ? <Link className="report-primary" href={href}>{txt(submissions.length ? 'محاولة جديدة' : 'ابدأ الاختبار', submissions.length ? 'New attempt' : 'Start exam')}</Link> : <span className="text-sm text-slate-600">{status === 'UPCOMING' ? txt('ستتمكن من البدء عند موعد الإتاحة.', 'You can start when the exam opens.') : status === 'CLOSED' ? txt('انتهت فترة استقبال الإجابات.', 'The submission period has ended.') : txt('استخدمت المحاولات المسموح بها.', 'You have used all available attempts.')}</span>}{last && <Link className="report-secondary" href={'/exams/result/' + last.id}>{txt('نتيجة آخر محاولة', 'Latest result')}</Link>}</div>
    </article>;
  }
  function sectionView(section: any, level = 0): React.ReactNode {
    const children = section.subModules || (exam.modules || []).filter((item: any) => item.parentModuleId === section.id);
    return <section key={section.id} className={level ? 'space-y-4 border-s-2 border-indigo-100 ps-4' : 'student-panel space-y-4'}><h2 className="text-lg font-black text-slate-900 flex gap-2 items-center"><Layers size={20}/>{clean(section.title)}</h2>
      {(section.subExams || []).map((child: any) => examRow(child))}
      {!section.subExams?.length && ((section.questionsCount ?? section._count?.questions ?? section.questions?.length ?? 0) > 0) && examRow(null, section.id, section.title)}
      {children.map((child: any) => sectionView(child, level + 1))}
      {!section.subExams?.length && !children.length && !(section.questionsCount || section._count?.questions || section.questions?.length) && <p className="text-sm text-slate-500">{txt('لا توجد اختبارات منشورة في هذا القسم.', 'No published exams in this section.')}</p>}
    </section>;
  }
  return <DashboardLayout><div className="student-page"><StudentPageHeader title={exam ? clean(getStudentExamTitle(exam)) : txt('تفاصيل الامتحان', 'Exam details')} description={txt('راجع المواعيد والمدة والمحاولات قبل البدء. جميع المواعيد بتوقيت مصر.', 'Check dates, duration and attempts before starting. All dates use Egypt time.')} back={{ href: '/exams', label: txt('الامتحانات', 'Exams') }}/>
    {loading ? <p role="status" className="student-panel">{txt('جارٍ تحميل التفاصيل…', 'Loading exam details…')}</p> : error ? <StudentFeedback title={error} retry={() => setReload(v => v + 1)}/> : exam && <>{(exam.modules || []).filter((item: any) => !item.parentModuleId).map((section: any) => sectionView(section))}{!exam.modules?.length && examRow(null)}</>}
  </div></DashboardLayout>;
}
