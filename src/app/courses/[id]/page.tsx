"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BookOpen, Lock, CheckCircle2, Play, Clock } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import StudentPageHeader, { StudentFeedback } from '@/components/student/StudentPageHeader';
import { API_URL, apiFetch } from '@/lib/api';
import { fetchStudentStats } from '@/lib/student-stats';
import { formatEgyptDateTime } from '@/lib/egyptTime';
import { useLanguage } from '@/contexts/LanguageContext';
export default function CourseDetailsPage() {
  const { id } = useParams(); const { language } = useLanguage(); const ar = language === 'ar'; const txt = (a: string,e: string) => ar ? a : e;
  const [course,setCourse] = useState<any>(null), [loading,setLoading] = useState(true), [error,setError] = useState(''), [reload,setReload] = useState(0), [progress,setProgress] = useState<number | null>(null);
  const [now,setNow] = useState(Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()),30000); return () => clearInterval(timer); },[]);
  useEffect(() => { const controller = new AbortController(); setLoading(true); setError(''); setCourse(null); setProgress(null);
    apiFetch(API_URL + '/courses/' + id, {signal:controller.signal}).then(async res => {if(!res.ok) throw new Error(); const data = await res.json(); if(!controller.signal.aborted) setCourse(data);}).catch(() => {if(!controller.signal.aborted) setError(txt('تعذر تحميل المقرر. تحقق من الاتصال ثم حاول مرة أخرى.', 'Could not load this course. Check your connection and retry.'));}).finally(() => {if(!controller.signal.aborted) setLoading(false);});
    fetchStudentStats('cookie_auth').then(data => {const item = data.courseProgresses?.find((item:any) => String(item.id || item.courseId) === String(id)); if(!controller.signal.aborted && item) setProgress(item.progressPercent);}).catch(() => {});
    return () => controller.abort();
  },[id,reload,language]);
  const lessons = (course?.lessons || []).filter((lesson:any) => lesson.isVisible !== false).sort((a:any,b:any) => (a.order || 0) - (b.order || 0));
  const available = (lesson:any) => (!lesson.publishDate || Date.parse(lesson.publishDate) <= now) && (!lesson.cutOffDate || Date.parse(lesson.cutOffDate) > now);
  const completed = (lesson:any) => lesson.progresses?.[0]?.isCompleted;
  const next = lessons.find((lesson:any) => available(lesson) && !completed(lesson)) || lessons.find(available);
  const groups: Record<string,any[]> = {};
  lessons.forEach((lesson:any) => {(groups[lesson.domain?.trim() || txt('الدروس', 'Lessons')] ||= []).push(lesson);});
  const percentage = progress ?? (lessons.length ? Math.round(lessons.filter(completed).length / lessons.length * 100) : 0);
  const href = (lesson:any) => '/lessons/' + lesson.id + '?courseId=' + id;
  return <DashboardLayout><div className="student-page"><StudentPageHeader title={course?.title || txt('تفاصيل المقرر', 'Course details')} description={course?.description} back={{href:'/courses',label:txt('مقرراتي الدراسية','My courses')}} action={next && <Link className="report-primary" href={href(next)}><Play size={18}/>{txt(completed(next) ? 'راجع دروسك' : percentage > 0 ? 'أكمل دراستك' : 'ابدأ أول درس', completed(next) ? 'Review lessons' : percentage > 0 ? 'Continue learning' : 'Start first lesson')}</Link>}/>
    {loading ? <p role="status" className="student-panel">{txt('جارٍ تحميل دروسك…','Loading lessons…')}</p> : error ? <StudentFeedback title={error} retry={() => setReload(v=>v+1)}/> : course && <>
    <section className="student-panel"><div className="flex flex-wrap justify-between gap-4 mb-4"><div><h2 className="font-black text-lg">{txt('تقدمك في المقرر','Course progress')}</h2><p className="text-sm text-slate-600 mt-1">{lessons.filter(completed).length} / {lessons.length} {txt('درس مكتمل','lessons completed')}</p></div><strong className="text-2xl text-indigo-700">{percentage}%</strong></div><progress aria-label={txt('تقدم المقرر','Course progress')} value={percentage} max={100} className="w-full h-3 accent-indigo-600"/><p className="text-sm text-amber-800 mt-3">{txt('نقاط التشجيع المكتسبة:','Reward points earned:')} {course.xpData?.totalCourseXP || 0} XP</p></section>
    {lessons.length ? Object.entries(groups).map(([domain,items]) => <details key={domain} open className="student-panel"><summary className="cursor-pointer font-black text-lg text-slate-900 py-2">{domain} <span className="text-sm font-medium text-slate-600">({items.length})</span></summary><ol className="mt-4 space-y-3">{items.map((lesson:any,index:number) => {const ready=available(lesson); const done=completed(lesson); const expired=lesson.cutOffDate && Date.parse(lesson.cutOffDate)<=now; const seconds=Number(lesson.durationSeconds || lesson.videoDurationSeconds || Number(lesson.durationMinutes || lesson.videoDurationMinutes)*60 || lesson.duration)||0;
      return <li key={lesson.id} className="rounded-[24px] border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4"><div className="flex gap-3 items-start flex-1 min-w-0"><span className="rounded-2xl p-3 bg-indigo-50 text-indigo-700">{done ? <CheckCircle2 size={22}/> : ready ? <BookOpen size={22}/> : <Lock size={22}/>}</span><div className="min-w-0"><h3 className="font-black text-slate-900 break-words">{index+1}. {lesson.title}</h3><div className="text-sm text-slate-600 mt-2 flex flex-wrap gap-3">{done && <span>{txt('مكتمل','Completed')}</span>}{seconds>0 && <span className="flex gap-1"><Clock size={16}/>{Math.ceil(seconds/60)} {txt('دقيقة','min')}</span>}</div>{!ready && <p className="text-sm text-amber-800 mt-2">{expired ? txt('انتهت إتاحة الدرس:','Lesson closed:') : txt('متاح من:','Available from:')} {formatEgyptDateTime(expired ? lesson.cutOffDate : lesson.publishDate,language)} · {txt('توقيت مصر','Egypt time')}</p>}</div></div>{ready ? <Link className={lesson.id===next?.id ? 'report-primary' : 'report-secondary'} href={href(lesson)}>{txt(done ? 'مراجعة الدرس' : lesson.id===next?.id && percentage>0 ? 'تابع من هنا' : 'افتح الدرس',done ? 'Review lesson' : lesson.id===next?.id && percentage>0 ? 'Continue here' : 'Open lesson')}</Link> : <span className="student-status">{txt(expired ? 'مغلق' : 'لم يبدأ',expired ? 'Closed' : 'Upcoming')}</span>}</li>;
    })}</ol></details>) : <div className="student-empty"><BookOpen className="mx-auto text-indigo-600 mb-4"/><h2 className="font-black text-lg">{txt('لم تُنشر دروس لهذا المقرر بعد','No published lessons yet')}</h2><p className="text-slate-600 mt-3">{txt('ارجع إلى مقرراتك لاختيار درس آخر.','Return to your courses to choose another lesson.')}</p><Link className="report-secondary mt-5" href="/courses">{txt('كل المقررات','All courses')}</Link></div>}
    </>}
  </div></DashboardLayout>;
}
