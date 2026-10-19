"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, ArrowUpRight, CalendarDays, GraduationCap, RefreshCw, Star, Target } from 'lucide-react';
import StudentPageHeader from "@/components/student/StudentPageHeader";
import DashboardLayout from '@/components/DashboardLayout';
import { fetchStudentStats } from '@/lib/student-stats';
import { formatEgyptDateTime } from '@/lib/egyptTime';
import { useLanguage } from '@/contexts/LanguageContext';

export default function StudentOverview() {
  const router = useRouter(); const { language } = useLanguage(); const ar = language === 'ar';
  const txt = (a: string, e: string) => ar ? a : e;
  const [stats, setStats] = useState<any>(null), [error, setError] = useState(''), [reload, setReload] = useState(0);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError('');
      try {
        const user = JSON.parse(localStorage.getItem('lms_user') || localStorage.getItem('school_admin_user') || '{}');
        if (user.role === 'TEACHER') { router.replace('/school-admin'); return; }
        const data = await fetchStudentStats('cookie_auth'); if (!cancelled) setStats(data);
      } catch { if (!cancelled) setError(txt('تعذر تحميل تقدمك. أعد المحاولة.', 'Could not load your progress. Please retry.')); }
    }
    void load(); return () => { cancelled = true; };
  }, [reload, router]);
  const number = (value: number | null | undefined) => value == null ? '—' : value.toLocaleString(ar ? 'ar-EG' : 'en-GB');
  const courses = stats?.courseProgresses || [];
  const resume = [...courses].filter(course => course.progressPercent > 0 && course.progressPercent < 100).sort((a, b) => String(b.lastAccessedAt || '').localeCompare(String(a.lastAccessedAt || '')))[0] || courses.find((course: any) => course.progressPercent < 100);
  return <DashboardLayout><div className="max-w-[1400px] mx-auto space-y-6" dir={ar ? 'rtl' : 'ltr'}>
    <StudentPageHeader title={txt('أهلًا', 'Welcome') + (stats?.name ? '، ' + stats.name : '')} description={txt('ابدأ بخطوة واضحة اليوم، وتابع تقدمك الحقيقي.', 'Take one clear step today and follow your real progress.')} action={<>{resume && <Link href={`/courses/${resume.id}`} className="report-primary">{txt('أكمل دراستك', 'Continue learning')}<ArrowUpRight size={18}/></Link>}<button className="student-icon-button" onClick={() => setReload(value => value + 1)} aria-label={txt('تحديث تقدمك', 'Refresh progress')}><RefreshCw size={20}/></button></>}/>
    <div className="flex flex-wrap gap-3"><Link href="/assignments" className="report-secondary">{txt('واجباتك وتدريباتك', 'Your assignments')}</Link><Link href="/calendar" className="report-secondary">{txt('مواعيدك القادمة', 'Upcoming dates')}</Link></div>
    {error && <div role="alert" className="report-error">{error}<button className="underline ms-3" onClick={() => setReload(value => value + 1)}>{txt('إعادة المحاولة', 'Retry')}</button></div>}
    {!stats && !error && <p role="status" className="premium-card p-8 rounded-[30px] text-indigo-700 font-bold text-center">{txt('جارٍ تحميل دروسك…', 'Loading your lessons…')}</p>}
    {stats && <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[
        { label: txt('إكمال الدروس', 'Lesson completion'), value: `${number(stats.overallCourseProgress)}%`, icon: BookOpen },
        { label: txt('متوسط آخر محاولة لكل اختبار', 'Average latest attempt per exam'), value: stats.avgScore == null ? '—' : `${number(stats.avgScore)}%`, icon: GraduationCap },
        { label: txt('محاولات الامتحانات', 'Exam attempts'), value: number(stats.totalExams), icon: Target },
        { label: txt('نقاط التشجيع XP', 'Reward XP'), value: number(stats.xp), icon: Star },
      ].map(item => <div key={item.label} className="premium-card rounded-[24px] p-5"><item.icon size={22} className="text-indigo-600 mb-4" /><p className="text-xs sm:text-sm font-bold text-slate-500">{item.label}</p><p className="text-2xl font-black text-slate-900 mt-2">{item.value}</p></div>)}</div>
      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
        <section className="premium-card rounded-[30px] p-5 sm:p-7"><div className="flex justify-between items-center gap-3 mb-5"><h2 className="font-black text-lg text-slate-900">{txt('دروسك وخطوتك التالية', 'Your lessons & next step')}</h2><Link className="text-sm text-indigo-700 underline font-bold" href="/courses">{txt('كل الكورسات', 'All courses')}</Link></div>{courses.length ? <div className="space-y-3">{[...courses].sort((a, b) => Number(b.id === resume?.id) - Number(a.id === resume?.id)).slice(0, 4).map((course: any) => <Link key={course.id} href={`/courses/${course.id}`} className="block rounded-2xl border border-slate-200 p-4 hover:border-indigo-300 hover:bg-indigo-50/20 transition-colors"><div className="flex justify-between gap-3 mb-3"><span className="font-bold text-slate-800">{course.title}</span><span className="text-indigo-700 font-black">{number(course.progressPercent)}%</span></div><progress aria-label={course.title} className="w-full accent-indigo-600 h-2" max={100} value={course.progressPercent} /><div className="flex justify-between text-xs text-slate-500 mt-2"><span>{number(course.completedLessonsCount)} / {number(course.totalLessons)} {txt('درس', 'lessons')}</span><span className="text-indigo-700 font-bold">{txt(course.id === resume?.id ? 'تابع من هنا' : 'افتح الكورس', course.id === resume?.id ? 'Continue here' : 'Open course')}</span></div></Link>)}</div> : <p className="text-slate-500 leading-relaxed">{txt('لم تُتح لك كورسات بعد. ستظهر هنا بمجرد إتاحتها لصفك من المدرسة.', 'No courses assigned yet. They will appear when your school makes them available to your grade.')}</p>}</section>
        <section className="premium-card rounded-[30px] p-5 sm:p-7"><h2 className="font-black text-lg text-slate-900 mb-5">{txt('أقرب مواعيد الامتحانات', 'Upcoming exam dates')}</h2>{stats.upcomingTasks?.length ? <div className="space-y-3">{stats.upcomingTasks.map((exam: any) => <Link key={exam.id} href={`/exams/${exam.id}/details`} className="flex gap-3 rounded-2xl border border-slate-200 p-4 hover:border-indigo-300"><CalendarDays size={22} className="text-indigo-600 shrink-0" /><div><strong className="text-sm text-slate-800">{exam.title}</strong><small className="block text-slate-500 mt-2">{formatEgyptDateTime(exam.startDate, language)}</small></div></Link>)}</div> : <p className="text-slate-500 text-sm">{txt('لا توجد امتحانات منشورة بموعد قادم. يمكنك مراجعة المتاح الآن.', 'No published upcoming exams. Check exams available now.')}</p>}<Link className="report-secondary mt-5 w-full" href="/exams">{txt('استعرض الامتحانات', 'Browse exams')}<ArrowUpRight size={16} /></Link><Link className="report-secondary mt-3 w-full" href="/calendar">{txt('التقويم بتوقيت مصر', 'Calendar in Egypt time')}</Link></section>
      </div>
      <section className="premium-card rounded-[30px] p-6 flex flex-col sm:flex-row justify-between gap-4 sm:items-center"><div><h2 className="text-lg font-black text-slate-900">{txt('اعرف ما أتقنته وما يحتاج تدريبًا', 'See strengths and what needs practice')}</h2><p className="text-sm text-slate-500 mt-2">{txt('تقاريرك تفصل نتائج الامتحانات عن نقاط المكافآت.', 'Reports keep academic results separate from reward points.')}</p></div><Link className="report-primary" href="/reports">{txt('افتح تقريرك', 'Open your report')}<ArrowUpRight size={17} /></Link></section>
      <p className="text-xs text-slate-500">{txt('آخر تحديث:', 'Updated:')} {formatEgyptDateTime(stats.generatedAt, language)} · {txt('توقيت مصر', 'Egypt time')}</p>
    </>}
  </div></DashboardLayout>;
}
