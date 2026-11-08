"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Users, GraduationCap, ClipboardList, BarChart3, Plus, RefreshCw, ArrowUpRight, CalendarDays } from 'lucide-react';
import { API_URL, apiFetch } from '@/lib/api';
import { formatEgyptDate, formatEgyptDateTime } from '@/lib/egyptTime';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardLayout from '@/components/DashboardLayout';

export default function AdminOverview({ superAdmin = false }: { superAdmin?: boolean }) {
  const { language } = useLanguage(); const ar = language === 'ar';
  const txt = (a: string, e: string) => ar ? a : e;
  const prefix = superAdmin ? '/super-admin' : '/school-admin';
  const [stats, setStats] = useState<any>(null), [error, setError] = useState(''), [loading, setLoading] = useState(true), [reload, setReload] = useState(0);
  const [learning, setLearning] = useState<any>(null);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError(''); setStats(null);
      try {
        const res = await apiFetch(API_URL + (superAdmin ? '/super-admin/stats' : '/reports/school'), { signal: controller.signal, cache: 'no-store' });
        const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Could not load dashboard');
        if (!controller.signal.aborted) setStats(data);
      } catch (error: any) { if (!controller.signal.aborted) setError(error.message); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load(); return () => controller.abort();
  }, [superAdmin, reload]);
  useEffect(() => {
    if (superAdmin) return;
    const controller = new AbortController();
    apiFetch(API_URL + '/teaching/overview?limit=4&page=1&sort=achievement', { signal: controller.signal, cache: 'no-store' })
      .then(async response => { if (response.ok) { const result = await response.json(); if (!controller.signal.aborted) setLearning(result); } })
      .catch(() => {});
    return () => controller.abort();
  }, [superAdmin, reload]);
  const metric = (value: number | null | undefined, unit = '') => value == null ? '—' : value.toLocaleString(ar ? 'ar-EG' : 'en-GB', { maximumFractionDigits: 1 }) + unit;
  const cards = superAdmin ? [
    { title: txt('المدارس', 'Schools'), value: stats?.schoolsCount, icon: Building2, href: '/super-admin/schools' },
    { title: txt('الطلاب', 'Students'), value: stats?.studentsCount, icon: GraduationCap, href: '/super-admin/users?role=STUDENT' },
    { title: txt('المعلمون', 'Teachers'), value: stats?.teachersCount, icon: Users, href: '/super-admin/users?role=TEACHER' },
    { title: txt('الامتحانات المتاحة الآن', 'Exams available now'), value: stats?.activeExams, icon: ClipboardList, href: '/super-admin/exams' },
  ] : [
    { title: txt('الطلاب', 'Students'), value: stats?.studentsCount, icon: GraduationCap, href: stats?.teacher ? '/school-admin/follow-up' : '/school-admin/students' },
    { title: stats?.teacher ? txt('كورساتي', 'My courses') : txt('المعلمون', 'Teachers'), value: stats?.teacher ? stats.coursesCount : stats?.teachersCount, icon: Users, href: stats?.teacher ? '/school-admin/courses' : '/school-admin/teachers' },
    { title: txt('متوسط الدرجات — آخر 30 يومًا', 'Average score — last 30 days'), value: stats?.averageScore, unit: '%', icon: BarChart3, href: '/school-admin/reports' },
    { title: txt('نسبة النجاح — آخر 30 يومًا', 'Pass rate — last 30 days'), value: stats?.passRate, unit: '%', icon: ClipboardList, href: '/school-admin/reports' },
  ];
  return <DashboardLayout><div className="max-w-[1500px] mx-auto space-y-6" dir={ar ? 'rtl' : 'ltr'}>
    <div className="bg-white p-6 sm:p-8 rounded-[30px] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-5">
      <div><p className="text-indigo-600 font-bold text-sm mb-2">{txt('لوحة المتابعة العامة', 'Executive dashboard')}</p><h1 className="text-2xl sm:text-3xl font-black text-slate-900">{txt(superAdmin ? 'المنصة في نظرة واحدة' : stats?.teacher ? 'لوحة المعلم الرئيسية' : 'متابعة المدرسة واتخاذ القرار', superAdmin ? 'Your platform at a glance' : stats?.teacher ? 'Teacher overview dashboard' : 'School follow-up & decisions')}</h1><p className="text-sm text-slate-500 mt-3">{txt('مؤشرات محسوبة من السجلات الفعلية', 'Metrics calculated from real records')}</p></div>
      <div className="flex flex-wrap gap-2 items-center"><button onClick={() => setReload(value => value + 1)} className="report-secondary" aria-label={txt('تحديث اللوحة', 'Refresh dashboard')}><RefreshCw size={17} /></button>{!superAdmin && <Link href="/school-admin/follow-up" className="report-secondary"><GraduationCap size={18} />{txt('متابعة التعلّم التفصيلية', 'Detailed learning follow-up')}</Link>}<Link href={`${prefix}/reports`} className="report-primary"><BarChart3 size={18} />{txt('فتح التقارير', 'Open reports')}</Link></div>
    </div>
    {loading && <p role="status" className="premium-card p-8 rounded-[30px] font-bold text-indigo-700 text-center">{txt('جارٍ تحميل البيانات…', 'Loading records…')}</p>}
    {error && <div role="alert" className="report-error">{error} <button className="underline" onClick={() => setReload(value => value + 1)}>{txt('إعادة المحاولة', 'Retry')}</button></div>}
    {stats && <>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">{cards.map(card => <Link key={card.title} href={card.href} className="premium-card rounded-[24px] p-5 hover:border-indigo-300"><div className="flex justify-between text-indigo-600 mb-4"><card.icon size={22} /><ArrowUpRight size={17} /></div><p className="text-slate-500 text-sm font-bold">{card.title}</p><p className="text-3xl font-black text-slate-900 mt-2">{metric(card.value, card.unit)}</p></Link>)}</div>
      <p className="text-xs text-slate-500">{txt('آخر تحديث:', 'Updated:')} {formatEgyptDateTime(stats.generatedAt, language)}</p>
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <section className="premium-card p-6 rounded-[30px]"><div className="flex justify-between items-center gap-3 mb-6"><h2 className="text-lg font-black text-slate-900">{txt(superAdmin ? 'النشاط خلال آخر 7 أيام' : 'اتجاه متوسط الدرجات — آخر محاولة شهريًا', superAdmin ? 'Activity in the last 7 days' : 'Average score trend — latest attempt each month')}</h2><Link className="text-sm text-indigo-700 font-bold underline" href={`${prefix}/reports`}>{txt('التفاصيل', 'Details')}</Link></div>
          <div className="space-y-4">{(superAdmin ? stats.examsActivityData || [] : stats.performanceData || []).map((item: any) => {
            const value = superAdmin ? item.submissions : item.score;
            const max = superAdmin ? Math.max(1, ...(stats.examsActivityData || []).map((row: any) => row.submissions)) : 100;
            return <div key={item.date} className="grid grid-cols-[90px_1fr_55px] gap-3 items-center"><span className="text-xs font-bold text-slate-600">{formatEgyptDate(item.date, language, superAdmin ? { year: undefined } : { day: undefined })}</span><div className="h-2.5 rounded-full bg-slate-100 overflow-hidden" role="img" aria-label={`${value ?? '—'}${superAdmin ? '' : '%'}`}><div className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 rounded-full" style={{ width: `${value == null ? 0 : value / max * 100}%` }} /></div><span className="text-sm font-black text-slate-700">{metric(value, superAdmin ? '' : '%')}</span></div>;
          })}</div><p className="mt-5 text-xs text-slate-500">{txt(superAdmin ? 'عدد تسليمات الطلاب يوميًا، بعد استبعاد حسابات الإدارة.' : 'غياب البيانات يظهر بشرطة، ولا يُحسب كدرجة صفر.', superAdmin ? 'Daily student submissions, excluding admin accounts.' : 'Missing data is shown as a dash and is not a zero score.')}</p>
        </section>
        <section className="premium-card p-6 rounded-[30px]"><h2 className="font-black text-lg text-slate-900 mb-5">{txt('إجراءات مباشرة', 'Quick actions')}</h2><div className="grid gap-3">{(superAdmin ? [
          ['/super-admin/schools?action=add', txt('إدارة المدارس', 'Manage schools')],
          [`${prefix}/exams/new`, txt('إنشاء امتحان', 'Create exam')],
          [`${prefix}/courses`, txt('إدارة الدروس والكورسات', 'Manage lessons & courses')],
          [`${prefix}/skills-hub`, txt('إدارة المهارات والأنشطة', 'Manage skills & activities')],
        ] : [
          ['/school-admin/follow-up', txt('متابعة التعلّم والدروس', 'Learning & lesson follow-up')],
          ['/school-admin/schedule', txt('تقويم وجدولة المهام', 'Schedule & calendar')],
          ['/school-admin/messages', txt('محادثات الطلاب', 'Student chat messages')],
          [`${prefix}/courses`, txt('إدارة الدروس والكورسات', 'Manage lessons & courses')],
          [`${prefix}/exams/new`, txt('إنشاء امتحان', 'Create exam')],
        ]).map(([href, title]) => <Link className="report-secondary justify-between" key={href} href={href}><span>{title}</span><ArrowUpRight size={17} /></Link>)}</div>
          {superAdmin && <div className="mt-6 rounded-2xl bg-indigo-50 p-4 text-sm text-indigo-900 space-y-2"><p>{txt('مدارس أُضيفت آخر 30 يومًا:', 'Schools added in 30 days:')} <strong>{metric(stats.newSchools)}</strong></p><p>{txt('طلاب أُضيفوا آخر 30 يومًا:', 'Students added in 30 days:')} <strong>{metric(stats.newStudents)}</strong></p><p>{txt('طلاب نشطون آخر 30 يومًا:', 'Active students in 30 days:')} <strong>{metric(stats.activeStudents)}</strong></p></div>}
        </section>
      </div>
      {!superAdmin && <div className="grid lg:grid-cols-3 gap-6">
        <section className="premium-card p-6 rounded-[30px] lg:col-span-2"><div className="flex justify-between items-center gap-3 mb-5"><div><h2 className="text-lg font-black text-slate-900">{txt('الطلاب المتفوقون', 'Top learners')}</h2><p className="text-xs text-slate-500 mt-1">{txt('حسب أحدث التقييمات المكتملة', 'Ranked by latest completed assessments')}</p></div><Link href="/school-admin/follow-up" className="text-indigo-700 underline text-sm font-bold">{txt('عرض الكل', 'View all')}</Link></div>
          <div className="grid sm:grid-cols-2 gap-3">{[...(learning?.students || [])].filter((student: any) => student.averageScore != null).sort((a: any,b: any) => b.averageScore-a.averageScore).slice(0,4).map((student: any,index: number) => <Link key={student.id} href={`/school-admin/follow-up/students/${student.id}`} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 hover:border-indigo-200"><span className="grid place-items-center w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-black">{index+1}</span><span className="min-w-0 flex-1"><strong className="block truncate text-slate-800">{student.name}</strong><small className="text-slate-500">{student.grade || '—'} · {student.classroom?.name || student.username}</small></span><b className="text-indigo-700">{metric(student.averageScore,'%')}</b></Link>)}</div>
          {!learning?.students?.some((student: any)=>student.averageScore != null) && <p className="text-sm text-slate-500">{txt('ستظهر النتائج بعد توفر تقييمات مكتملة.', 'Learners appear here when completed assessments are available.')}</p>}
        </section>
        <section className="premium-card p-6 rounded-[30px]"><h2 className="text-lg font-black text-slate-900">{txt('نشاط الطلاب', 'Student activity')}</h2><p className="text-xs text-slate-500 mt-1">{txt('حالة النشاط خلال الفترة المحددة', 'Activity status in the selected period')}</p><div className="flex items-center justify-center gap-5 py-6"><div className="w-32 h-32 rounded-full grid place-items-center" style={{background:`conic-gradient(#4f46e5 0 ${((learning?.summary?.active||0)/Math.max(1,learning?.summary?.students||0))*100}%, #f97316 0 100%)`}} role="img" aria-label={txt('مخطط دائري لنشاط الطلاب','Student activity pie chart')}><div className="w-20 h-20 rounded-full bg-white grid place-items-center text-center"><b className="text-xl">{metric(learning?.summary?.students||0)}</b><small className="text-[10px] text-slate-500">{txt('طالب','students')}</small></div></div><div className="grid gap-3 text-sm"><span><i className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-600 me-2"/>{txt('نشط','Active')} <b>{metric(learning?.summary?.active||0)}</b></span><span><i className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500 me-2"/>{txt('بحاجة متابعة','Needs follow-up')} <b>{metric(learning?.summary?.inactive||0)}</b></span></div></div></section>
        <CourseInsights rows={learning?.lessons || []} metric={metric} txt={txt} />
        <Link href="/school-admin/messages" className="premium-card p-5 rounded-[24px] lg:col-span-3 flex items-center justify-between gap-4 hover:border-indigo-300"><span><strong className="block text-slate-900">{txt('رسائل الطلاب', 'Student messages')}</strong><small className="text-slate-500">{txt('افتح صندوق المحادثات وتابع أسئلة الطلاب', 'Open conversations and follow up on student questions')}</small></span><span className="report-primary">{txt('فتح الرسائل', 'Open messages')} <ArrowUpRight size={16}/></span></Link>
      </div>}
      {superAdmin ? <div className="report-table-wrap"><table><caption>{txt('آخر المدارس المضافة', 'Recently added schools')}</caption><thead><tr><th>{txt('المدرسة', 'School')}</th><th>{txt('الطلاب', 'Students')}</th><th>{txt('الحالة', 'Status')}</th><th>{txt('الإضافة — مصر', 'Added — Egypt')}</th></tr></thead><tbody>{(stats.recentSchools || []).map((school: any) => <tr key={school.id}><td><Link className="text-indigo-700 underline font-bold" href={`/super-admin/schools/${school.id}`}>{school.name}</Link></td><td>{metric(school.students)}</td><td>{school.status === 'ACTIVE' ? txt('نشطة', 'Active') : txt('موقوفة', 'Suspended')}</td><td>{formatEgyptDate(school.createdAt, language)}</td></tr>)}</tbody></table>{!stats.recentSchools?.length && <p className="p-8 text-slate-500">{txt('لا توجد مدارس مسجلة.', 'No schools registered.')}</p>}</div>
        : <section className="premium-card rounded-[30px] p-6"><div className="flex justify-between gap-3 mb-4"><h2 className="font-black text-lg text-slate-900">{txt('الامتحانات القادمة', 'Upcoming exams')}</h2><Link className="text-indigo-700 underline text-sm" href="/school-admin/exams">{txt('كل الامتحانات', 'All exams')}</Link></div>{stats.upcomingExams?.length ? <div className="grid sm:grid-cols-2 gap-3">{stats.upcomingExams.map((exam: any) => <Link className="rounded-2xl border border-slate-200 p-4 flex gap-3 items-start hover:border-indigo-300" key={exam.id} href={`/school-admin/exams/analytics/${exam.id}`}><CalendarDays size={20} className="text-indigo-600 shrink-0" /><span><strong className="text-slate-800">{exam.title}</strong><small className="block mt-2 text-slate-500">{formatEgyptDateTime(exam.startDate, language)}</small></span></Link>)}</div> : <p className="text-slate-500 text-sm">{txt('لا توجد امتحانات منشورة بموعد قادم.', 'No published exams with a future start time.')}</p>}</section>}
    </>}
  </div></DashboardLayout>;
}

function CourseInsights({ rows, metric, txt }: { rows: any[]; metric: (value: number | null, unit?: string) => string; txt: (a: string, e: string) => string }) {
  const courses = Object.values(rows.reduce((result: Record<string, any>, row: any) => {
    const id = row.courseId || row.courseTitle || 'untitled';
    const item = result[id] ||= { title: row.courseTitle || txt('بدون اسم كورس', 'Untitled course'), lessons: 0, completed: 0, expected: 0, scores: [] };
    item.lessons++; item.completed += Number(row.completed) || 0; item.expected += Number(row.expectedStudents) || 0;
    if (row.averageScore != null) item.scores.push(Number(row.averageScore));
    return result;
  }, {})) as any[];
  return <section className="premium-card p-6 rounded-[30px] lg:col-span-3"><div className="flex flex-wrap items-end justify-between gap-3 mb-5"><div><p className="text-xs font-black uppercase tracking-wider text-indigo-600">{txt('تحليل التعلّم', 'LEARNING ANALYTICS')}</p><h2 className="text-lg font-black text-slate-900 mt-1">{txt('أداء الكورسات ومشاركة الطلاب', 'Course performance & participation')}</h2></div><Link className="text-sm font-bold text-indigo-700 underline" href="/school-admin/reports">{txt('التقارير التفصيلية', 'Detailed reports')}</Link></div>{courses.length ? <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{courses.slice(0,6).map((course: any)=>{const avg=course.scores.length?course.scores.reduce((a:number,b:number)=>a+b,0)/course.scores.length:null;const participation=course.expected?course.completed/course.expected*100:0;return <article key={course.title} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4"><div className="flex justify-between gap-3"><h3 className="font-black text-slate-800 truncate">{course.title}</h3><span className="text-xs text-slate-500">{course.lessons} {txt('دروس','lessons')}</span></div><div className="mt-4 grid grid-cols-2 gap-3">{[[txt('متوسط التقييم','Assessment average'),avg,'from-indigo-500 to-violet-600'],[txt('إكمال الدروس','Lesson completion'),participation,'from-orange-400 to-rose-500']].map(([label,value,gradient]: any)=><div key={label} className="rounded-xl bg-white p-3"><small className="block text-slate-500">{label}</small><strong className="text-xl text-indigo-700">{metric(value,'%')}</strong><div className="mt-2 h-2 rounded-full bg-slate-100"><div className={`h-full rounded-full bg-gradient-to-r ${gradient}`} style={{width:`${Math.max(0,Math.min(100,Number(value)||0))}%`}}/></div></div>)}</div><div className="mt-3 flex items-center gap-2 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-indigo-500"/>{txt('متوسط التقييمات المكتملة','Completed assessment average')}<span className="ms-auto h-2 w-2 rounded-full bg-orange-500"/>{txt('إكمال الدروس','Lesson completion')}</div></article>})}</div> : <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">{txt('ستظهر المقارنة عند توفر بيانات تقييم أو تقدم للدروس.', 'Course comparisons appear when assessment or lesson progress data is available.')}</p>}</section>;
}
