"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Search } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import StudentPageHeader, { StudentFeedback } from '@/components/student/StudentPageHeader';
import { fetchStudentStats, readCachedStudentStats } from '@/lib/student-stats';
import { getFullImageUrl } from '@/lib/api';
import { shouldSkipImageOptimization } from '@/lib/imageDisplay';
import { useLanguage } from '@/contexts/LanguageContext';
export default function CoursesPage() {
  const { language } = useLanguage(); const ar = language === 'ar'; const txt = (a: string, e: string) => ar ? a : e;
  const [courses, setCourses] = useState<any[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState(''), [reload, setReload] = useState(0);
  const [search, setSearch] = useState(''), [subject, setSubject] = useState(''), [status, setStatus] = useState('');
  useEffect(() => { let cancelled = false; setLoading(true); setError('');
    const cached = readCachedStudentStats(); if (cached?.courseProgresses) { setCourses(cached.courseProgresses); setLoading(false); }
    fetchStudentStats('cookie_auth').then(data => { if (!cancelled) setCourses(data.courseProgresses || []); }).catch(() => { if (!cancelled) setError(txt('تعذر تحديث المقررات. أعد المحاولة.', 'Could not refresh your courses. Please retry.')); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reload, language]);
  const state = (course: any) => course.progressPercent >= 100 ? 'COMPLETED' : course.progressPercent > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';
  const states = { NOT_STARTED: txt('لم يبدأ', 'Not started'), IN_PROGRESS: txt('قيد الدراسة', 'In progress'), COMPLETED: txt('مكتمل', 'Completed') };
  const visible = courses.filter(course => (!subject || course.subject === subject) && (!status || state(course) === status) && (course.title + ' ' + (course.subject || '')).toLowerCase().includes(search.trim().toLowerCase()));
  const reset = () => { setSearch(''); setSubject(''); setStatus(''); };
  return <DashboardLayout><div className="student-page"><StudentPageHeader title={txt('مقرراتي الدراسية', 'My courses')} description={txt('اختر مقررًا وابدأ درسك التالي، أو تابع من حيث توقفت.', 'Choose a course and start your next lesson, or pick up where you left off.')}/>
    <div className="student-panel student-filters"><label className="report-field flex-[2] min-w-[180px]"><span className="flex gap-2"><Search size={16}/>{txt('ابحث عن مقرر', 'Search courses')}</span><input value={search} onChange={e => setSearch(e.target.value)} type="search"/></label><label className="report-field flex-1 min-w-[140px]"><span>{txt('المادة', 'Subject')}</span><select value={subject} onChange={e => setSubject(e.target.value)}><option value="">{txt('كل المواد', 'All subjects')}</option>{Array.from(new Set(courses.map(course => course.subject).filter(Boolean))).map(value => <option key={value} value={value}>{value}</option>)}</select></label><label className="report-field flex-1 min-w-[140px]"><span>{txt('حالة الدراسة', 'Learning status')}</span><select value={status} onChange={e => setStatus(e.target.value)}><option value="">{txt('كل الحالات', 'All statuses')}</option>{Object.entries(states).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>{(search || subject || status) && <button className="report-secondary" onClick={reset}>{txt('مسح الفلاتر', 'Clear filters')}</button>}</div>
    {error && <StudentFeedback title={error} retry={() => setReload(v => v + 1)}/>}
    {loading ? <p role="status" className="student-panel">{txt('جارٍ تحميل المقررات…', 'Loading courses…')}</p> : <><p role="status" className="text-sm text-slate-600">{visible.length} {txt('مقرر', 'courses')}</p>{visible.length ? <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">{visible.map(course => {
      const image = getFullImageUrl(course.coverImage || course.course?.coverImage || course.image || course.thumbnail || course.courseImage);
      const progress = Math.max(0, Math.min(100, Number(course.progressPercent) || 0));
      const seconds = Number(course.totalDurationSeconds) || Number(course.totalDurationMinutes || course.durationMinutes) * 60 || Number(course.totalDurationHours || course.durationHours) * 3600 || 0;
      return <article key={course.id} className="bg-white rounded-[30px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="relative aspect-[16/8] bg-indigo-50">{image ? <Image src={image} fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" alt="" className="object-cover" unoptimized={shouldSkipImageOptimization(image)}/> : <BookOpen className="absolute inset-0 m-auto text-indigo-400" size={48}/>}</div>
        <div className="p-6 space-y-4 flex flex-col flex-1"><div className="flex flex-wrap gap-2 items-center justify-between"><span className="text-sm text-slate-600">{course.subject || txt('مقرر دراسي', 'Course')}</span><span className="student-status" data-status={state(course) === 'COMPLETED' ? 'COMPLETED' : undefined}>{states[state(course)]}</span></div><h2 className="text-xl font-black text-slate-900 break-words">{course.title}</h2><p className="text-sm text-slate-600">{course.totalLessons || course.lessonsCount || 0} {txt('درس', 'lessons')}{seconds > 0 && <> · {Math.ceil(seconds / 60)} {txt('دقيقة', 'min')}</>}</p>
        <div><div className="flex justify-between text-sm mb-2"><span>{txt('تقدمك', 'Your progress')}</span><strong>{progress}%</strong></div><progress className="w-full h-2 accent-indigo-600" max={100} value={progress} aria-label={course.title}/></div>
        <Link href={'/courses/' + course.id} className="report-primary mt-auto">{states[state(course)] === states.COMPLETED ? txt('مراجعة المقرر', 'Review course') : progress ? txt('متابعة التعلم', 'Continue learning') : txt('ابدأ الآن', 'Start learning')}</Link></div></article>;
    })}</div> : <div className="student-empty"><BookOpen className="mx-auto text-indigo-600 mb-4" size={36}/><h2 className="text-xl font-black">{txt(courses.length ? 'لا توجد نتائج تطابق اختياراتك' : 'لم تُتح لك مقررات بعد', courses.length ? 'No matching courses' : 'No courses assigned yet')}</h2><p className="text-slate-600 mt-3">{txt(courses.length ? 'غيّر كلمات البحث أو امسح الفلاتر لعرض مقرراتك.' : 'ستظهر مقرراتك هنا بمجرد إتاحتها لصفك من المدرسة.', courses.length ? 'Change your search or clear filters.' : 'Courses will appear when your school assigns them to your grade.')}</p>{courses.length > 0 && <button className="report-secondary mt-5" onClick={reset}>{txt('عرض كل المقررات', 'Show all courses')}</button>}</div>}</>}
  </div></DashboardLayout>;
}
