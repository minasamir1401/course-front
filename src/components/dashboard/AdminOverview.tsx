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
  const metric = (value: number | null | undefined, unit = '') => value == null ? '—' : value.toLocaleString(ar ? 'ar-EG' : 'en-GB', { maximumFractionDigits: 1 }) + unit;
  const cards = superAdmin ? [
    { title: txt('المدارس', 'Schools'), value: stats?.schoolsCount, icon: Building2, href: '/super-admin/schools' },
    { title: txt('الطلاب', 'Students'), value: stats?.studentsCount, icon: GraduationCap, href: '/super-admin/users?role=STUDENT' },
    { title: txt('المعلمون', 'Teachers'), value: stats?.teachersCount, icon: Users, href: '/super-admin/users?role=TEACHER' },
    { title: txt('الامتحانات المتاحة الآن', 'Exams available now'), value: stats?.activeExams, icon: ClipboardList, href: '/super-admin/exams' },
  ] : [
    { title: txt('الطلاب', 'Students'), value: stats?.studentsCount, icon: GraduationCap, href: '/school-admin/students' },
    { title: txt('المعلمون', 'Teachers'), value: stats?.teachersCount, icon: Users, href: '/school-admin/teachers' },
    { title: txt('متوسط الدرجات — آخر 30 يومًا', 'Average score — last 30 days'), value: stats?.averageScore, unit: '%', icon: BarChart3, href: '/school-admin/reports' },
    { title: txt('نسبة النجاح — آخر 30 يومًا', 'Pass rate — last 30 days'), value: stats?.passRate, unit: '%', icon: ClipboardList, href: '/school-admin/reports' },
  ];
  return <DashboardLayout><div className="max-w-[1500px] mx-auto space-y-6" dir={ar ? 'rtl' : 'ltr'}>
    <div className="bg-white p-6 sm:p-8 rounded-[30px] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between gap-5">
      <div><p className="text-indigo-600 font-bold text-sm mb-2">{txt('لوحة المتابعة', 'Activity dashboard')}</p><h1 className="text-2xl sm:text-3xl font-black text-slate-900">{txt(superAdmin ? 'المنصة في نظرة واحدة' : 'متابعة المدرسة واتخاذ القرار', superAdmin ? 'Your platform at a glance' : 'School follow-up & decisions')}</h1><p className="text-sm text-slate-500 mt-3">{txt('مؤشرات محسوبة من السجلات الفعلية', 'Metrics calculated from real records')}</p></div>
      <div className="flex flex-wrap gap-2 items-center"><button onClick={() => setReload(value => value + 1)} className="report-secondary" aria-label={txt('تحديث اللوحة', 'Refresh dashboard')}><RefreshCw size={17} /></button><Link href={`${prefix}/reports`} className="report-primary"><BarChart3 size={18} />{txt('فتح التقارير', 'Open reports')}</Link></div>
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
        <section className="premium-card p-6 rounded-[30px]"><h2 className="font-black text-lg text-slate-900 mb-5">{txt('إجراءات مباشرة', 'Quick actions')}</h2><div className="grid gap-3">{[
          [superAdmin ? '/super-admin/schools?action=add' : '/school-admin/students', txt(superAdmin ? 'إدارة المدارس' : 'متابعة الطلاب', superAdmin ? 'Manage schools' : 'Follow up students')],
          [`${prefix}/exams/new`, txt('إنشاء امتحان', 'Create exam')], [`${prefix}/courses`, txt('إدارة الدروس والكورسات', 'Manage lessons & courses')], [`${prefix}/skills-hub`, txt('إدارة المهارات والأنشطة', 'Manage skills & activities')],
        ].map(([href, title]) => <Link className="report-secondary justify-between" key={href} href={href}><span>{title}</span><Plus size={17} /></Link>)}</div>
          {superAdmin && <div className="mt-6 rounded-2xl bg-indigo-50 p-4 text-sm text-indigo-900 space-y-2"><p>{txt('مدارس أُضيفت آخر 30 يومًا:', 'Schools added in 30 days:')} <strong>{metric(stats.newSchools)}</strong></p><p>{txt('طلاب أُضيفوا آخر 30 يومًا:', 'Students added in 30 days:')} <strong>{metric(stats.newStudents)}</strong></p><p>{txt('طلاب نشطون آخر 30 يومًا:', 'Active students in 30 days:')} <strong>{metric(stats.activeStudents)}</strong></p></div>}
        </section>
      </div>
      {superAdmin ? <div className="report-table-wrap"><table><caption>{txt('آخر المدارس المضافة', 'Recently added schools')}</caption><thead><tr><th>{txt('المدرسة', 'School')}</th><th>{txt('الطلاب', 'Students')}</th><th>{txt('الحالة', 'Status')}</th><th>{txt('الإضافة — مصر', 'Added — Egypt')}</th></tr></thead><tbody>{(stats.recentSchools || []).map((school: any) => <tr key={school.id}><td><Link className="text-indigo-700 underline font-bold" href={`/super-admin/schools/${school.id}`}>{school.name}</Link></td><td>{metric(school.students)}</td><td>{school.status === 'ACTIVE' ? txt('نشطة', 'Active') : txt('موقوفة', 'Suspended')}</td><td>{formatEgyptDate(school.createdAt, language)}</td></tr>)}</tbody></table>{!stats.recentSchools?.length && <p className="p-8 text-slate-500">{txt('لا توجد مدارس مسجلة.', 'No schools registered.')}</p>}</div>
        : <section className="premium-card rounded-[30px] p-6"><div className="flex justify-between gap-3 mb-4"><h2 className="font-black text-lg text-slate-900">{txt('الامتحانات القادمة', 'Upcoming exams')}</h2><Link className="text-indigo-700 underline text-sm" href="/school-admin/exams">{txt('كل الامتحانات', 'All exams')}</Link></div>{stats.upcomingExams?.length ? <div className="grid sm:grid-cols-2 gap-3">{stats.upcomingExams.map((exam: any) => <Link className="rounded-2xl border border-slate-200 p-4 flex gap-3 items-start hover:border-indigo-300" key={exam.id} href={`/school-admin/exams/analytics/${exam.id}`}><CalendarDays size={20} className="text-indigo-600 shrink-0" /><span><strong className="text-slate-800">{exam.title}</strong><small className="block mt-2 text-slate-500">{formatEgyptDateTime(exam.startDate, language)}</small></span></Link>)}</div> : <p className="text-slate-500 text-sm">{txt('لا توجد امتحانات منشورة بموعد قادم.', 'No published exams with a future start time.')}</p>}</section>}
    </>}
  </div></DashboardLayout>;
}
