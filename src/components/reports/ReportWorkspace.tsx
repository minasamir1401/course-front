"use client";
import { questionMetadata } from "@/lib/bilingualMetadata";

import React, { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import styles from './StudentReports.module.css';
import frame from '../student/LearningPage.module.css';
import { BarChart3, Download, Filter, RefreshCw, Printer, ArrowUpRight, BookOpen, Users, GraduationCap, Target, Search, CalendarDays } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { apiFetch, API_URL } from '@/lib/api';
import { addCalendarDays, egyptDay, formatEgyptDate, formatEgyptDateTime } from '@/lib/egyptTime';
import { useLanguage } from '@/contexts/LanguageContext';
import { studentSubjectLabel } from '@/lib/studentLocale';
import ReportCharts from './ReportCharts';
import ReferenceIcon from '../student/ReferenceIcon';
import { StudentReportSummary, StudentReportNext, StudentReportPriority } from './StudentReportOverview';
import ReportBreakdown from './ReportBreakdown';
import ReportRecordCards from './ReportRecordCards';

type Role = 'STUDENT' | 'SCHOOL_ADMIN' | 'SUPER_ADMIN';
type Filters = { from: string; to: string; schoolId: string; grade: string; classroomId: string; courseId: string; examId: string; subExamId: string; subject: string; attemptPolicy: string; search: string };
const initialFilters = (examId = ''): Filters => {
  const to = egyptDay();
  return { from: addCalendarDays(to, -29), to, schoolId: '', grade: '', classroomId: '', courseId: '', examId, subExamId: '', subject: '', attemptPolicy: 'latest', search: '' };
};

export default function ReportWorkspace({ role, examId = '', initialTab = 'overview' }: { role: Role; examId?: string; initialTab?: string }) {
  const { language } = useLanguage();
  const ar = language === 'ar';
  const txt = (arabic: string, english: string) => ar ? arabic : english;
  const id = useId();
  const [draft, setDraft] = useState(() => initialFilters(examId));
  const [applied, setApplied] = useState(() => initialFilters(examId));
  const [tab, setTab] = useState(initialTab);
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [options, setOptions] = useState<any>(null);
  const [result, setReport] = useState<any>(null);
  const [studentStats, setStudentStats] = useState<any>(null);
  const [xp, setXp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [optionsError, setOptionsError] = useState('');
  const attendance = tab === 'attendance';
  const query = new URLSearchParams({ ...applied, language, page: String(page), limit: '25' }).toString();
  // Never render a result from the previous endpoint or filter selection while switching tabs.
  const report = result?.reportKind === (attendance ? 'attendance' : 'overview') && result?.reportQuery === query ? result : null;

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setOptionsError('');
        const res = await apiFetch(`${API_URL}/reports/options`, { signal: controller.signal });
        if (!res.ok) throw new Error('Could not load report filters');
        const data = await res.json();
        if (controller.signal.aborted) return;
        setOptions(data);
        if (role !== 'SUPER_ADMIN' && data.schools?.[0]?.id) {
          const schoolId = data.schools[0].id;
          setDraft(current => ({ ...current, schoolId }));
          setApplied(current => ({ ...current, schoolId }));
        }
        if (role === 'STUDENT') {
          const responses = await Promise.all(['/student/stats', '/student/xp-summary'].map(path => apiFetch(API_URL + path, { signal: controller.signal })));
          if (!responses.every(response => response.ok)) throw new Error('Could not load student progress');
          const [stats, summary] = await Promise.all(responses.map(response => response.json()));
          if (!controller.signal.aborted) { setStudentStats(stats); setXp(summary); }
        }
      } catch (error: any) { if (!controller.signal.aborted) setOptionsError(error.message); }
    }
    void load(); return () => controller.abort();
  }, [role, reload]);

  useEffect(() => {
    const controller = new AbortController();
    if (attendance && (!applied.schoolId || !applied.examId)) { setReport(null); setLoading(false); return () => controller.abort(); }
    async function load() {
      setLoading(true); setError(''); setReport(null);
      try {
        const res = await apiFetch(`${API_URL}/reports/${attendance ? 'exam-attendance' : 'overview'}?${query}`, { signal: controller.signal, cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || txt('تعذر تحميل التقرير', 'Could not load report'));
        if (!controller.signal.aborted) setReport({ ...data, reportKind: attendance ? 'attendance' : 'overview', reportQuery: query });
      } catch (error: any) { if (!controller.signal.aborted) setError(ar ? 'تعذر تحميل التقرير. أعد المحاولة.' : error.message); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load(); return () => controller.abort();
  }, [query, attendance, reload]);

  const update = (key: keyof Filters, value: string) => setDraft(current => ({ ...current, [key]: value,
    ...(key === 'schoolId' ? { classroomId: '', courseId: '', examId: '', subExamId: '' } : {}),
    ...(key === 'courseId' ? { examId: '', subExamId: '' } : {}),
    ...(key === 'examId' ? { subExamId: '' } : {}) }));
  const apply = (event: React.FormEvent) => { event.preventDefault(); setApplied({ ...draft }); setPage(1); };
  const selectedExam = options?.exams?.find((item: any) => item.id === draft.examId);
  const children = selectedExam?.modules?.flatMap((module: any) => module.subExams || []) || [];
  const exams = (options?.exams || []).filter((item: any) => !draft.courseId || item.courseId === draft.courseId).filter((item: any) => !draft.schoolId || item.schoolId === draft.schoolId || item.schools?.some((school: any) => school.id === draft.schoolId)
    || item.isCentral && !item.schoolId && !item.schools?.length);
  const prefix = role === 'SUPER_ADMIN' ? '/super-admin' : '/school-admin';
  const number = (value: number | null | undefined, suffix = '') => value == null ? '—' : `${value.toLocaleString(ar ? 'ar-EG' : 'en-GB', { maximumFractionDigits: 1 })}${suffix}`;
  const tabs = [ ['overview', txt('نظرة عامة', 'Overview')], ['attempts', txt('النتائج والمحاولات', 'Results & attempts')], ['skills', txt('المهارات والأسئلة', 'Skills & questions')],
    ...(role === 'STUDENT' ? [['courses', txt('الدروس وXP', 'Lessons & XP')]] : [['attendance', txt('المشاركة في الامتحان', 'Exam participation')]]) ];

  async function exportReport(format: 'csv' | 'xlsx') {
    setExporting(true); setError('');
    try {
      const res = await apiFetch(`${API_URL}/reports/export?${query}&kind=${attendance ? 'attendance' : 'overview'}&format=${format}`);
      if (!res.ok) { const data = await res.json(); throw new Error(data.error); }
      const url = URL.createObjectURL(await res.blob());
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `klevro-${applied.from}-${applied.to}.${format}`;
      anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error: any) { setError(ar ? 'تعذر تصدير التقرير. أعد المحاولة.' : error.message || 'Export failed'); }
    finally { setExporting(false); }
  }

  const select = (key: keyof Filters, label: string, values: { value: string; label: string }[], all = txt('الكل', 'All')) => (
    <label className="report-field" htmlFor={`${id}-${key}`}>
      <span id={`${id}-${key}-label`}>{label}</span><select id={`${id}-${key}`} aria-labelledby={`${id}-${key}-label`} value={draft[key]} onChange={event => update(key, event.target.value)}>
        <option value="">{all}</option>{values.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
    </label>
  );

  return <DashboardLayout mainClassName={role === 'STUDENT' ? `${frame.main} ${styles.main}` : undefined}>
    <div className={`report-workspace max-w-[1500px] mx-auto space-y-6 ${role === 'STUDENT' ? styles.student : ''}`} dir={ar ? 'rtl' : 'ltr'}>
      {role === 'STUDENT' && <header className={styles.hero}><div><small>{txt('مركز التقارير','Reporting center')}</small><h1><ReferenceIcon name="chart-bars" variant="duotone" size={48}/>{txt('تقدّمك وخطوتك التالية','Your progress & next step')}</h1><p>{txt('بيانات دروسك ونتائجك الفعلية، وجميع المواعيد بتوقيت مصر.','Your lesson progress and recorded results, with dates in Egypt time.')}</p><span className={styles.timeZone} dir="ltr">Africa/Cairo</span></div><div className={styles.referenceHeroArt} aria-hidden="true"/></header>}
      <div className={role === 'STUDENT' ? styles.toolbar : "flex flex-col md:flex-row gap-5 justify-between md:items-center"}>
        <div className="flex items-start gap-4" aria-hidden={role === 'STUDENT' || undefined}>
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100"><BarChart3 size={26} /></div>
          <div><p className="text-sm font-bold text-indigo-600 mb-1">{txt('مركز التقارير', 'Reporting center')}</p>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{txt(role === 'STUDENT' ? 'تقدّمك وخطوتك التالية' : role === 'SUPER_ADMIN' ? 'أداء المنصة والمدارس' : 'أداء المدرسة والطلاب', role === 'STUDENT' ? 'Your progress & next step' : role === 'SUPER_ADMIN' ? 'Platform & school performance' : 'School & student performance')}</h1>
            <p className="text-slate-500 text-sm mt-2">{txt('بيانات فعلية، فلاتر واضحة، وجميع التواريخ بتوقيت مصر.', 'Real records, explicit filters, all dates in Egypt time.')} <span dir="ltr">Africa/Cairo</span></p>
          </div>
        </div>
        <>{role === 'STUDENT' && <h2 className={styles.scopeTitle}><Filter size={17}/>{txt('نطاق التقرير','Report scope')}</h2>}<div className="flex flex-wrap gap-2 no-print">
          <button className="report-secondary" onClick={() => setReload(value => value + 1)} aria-label={txt('تحديث التقرير', 'Refresh report')}><RefreshCw size={17} />{txt('تحديث', 'Refresh')}</button>
          <button className="report-secondary" onClick={() => window.print()} disabled={!report}><Printer size={17} />{txt('طباعة العرض / PDF', 'Print view / PDF')}</button>
          <button className="report-primary" onClick={() => exportReport('xlsx')} disabled={exporting || !report}><Download size={17} />{exporting ? txt('جارٍ التصدير…', 'Exporting…') : 'Excel'}</button>
          <button className="report-secondary" onClick={() => exportReport('csv')} disabled={exporting || !report}>CSV</button>
        </div>
      </></div>

      <form onSubmit={apply} className={`premium-card rounded-[30px] p-5 sm:p-6 space-y-4 no-print ${role === 'STUDENT' ? styles.filters : ''}`}>
        <div className="flex items-center gap-2 font-black text-slate-800"><Filter size={18} />{txt('نطاق التقرير', 'Report scope')}</div>
        <div className={role === 'STUDENT' ? styles.filterGrid : "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"}>
          {!attendance && <><label className="report-field" htmlFor={`${id}-from`}><span>{txt('من يوم — توقيت مصر', 'From — Egypt time')}</span><input id={`${id}-from`} type="date" value={draft.from} max={draft.to} required onChange={event => update('from', event.target.value)} /></label>
            <label className="report-field" htmlFor={`${id}-to`}><span>{txt('إلى يوم — شامل', 'Through — inclusive')}</span><input id={`${id}-to`} type="date" value={draft.to} min={draft.from} required onChange={event => update('to', event.target.value)} /></label></>}
          {role === 'SUPER_ADMIN' && select('schoolId', txt('المدرسة', 'School'), (options?.schools || []).map((item: any) => ({ value: item.id, label: item.name })))}
          {role !== 'STUDENT' && <>{select('grade', txt('الصف', 'Grade'), (options?.grades || []).map((grade: string) => ({ value: grade, label: grade })))}
            {select('classroomId', txt('الفصل', 'Class'), (options?.classrooms || []).filter((item: any) => (!draft.schoolId || item.schoolId === draft.schoolId) && (!draft.grade || item.grade === draft.grade)).map((item: any) => ({ value: item.id, label: item.name })))}</>}
          <details className={role === 'STUDENT' ? styles.moreFilters : "sm:col-span-2 xl:col-span-4"} open={role !== 'STUDENT'}><summary className="cursor-pointer font-bold text-indigo-700 py-3">{txt('فلاتر إضافية', 'More filters')}</summary><div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-3">
          {!!options?.courses?.length && select('courseId', txt('الكورس', 'Course'), options.courses.map((item: any) => ({ value: item.id, label: item.title })))}
          {select('examId', txt('الامتحان', 'Exam'), exams.map((item: any) => ({ value: item.id, label: item.title })))}
          {children.length > 0 && select('subExamId', txt('الاختبار الفرعي', 'Exam section'), children.map((item: any) => ({ value: item.id, label: item.title })), txt('الامتحان الرئيسي', 'Parent exam'))}
          {!attendance && select('subject', txt('المادة', 'Subject'), (options?.subjects || []).map((subject: string) => ({ value: subject, label: role==='STUDENT'?studentSubjectLabel(subject,language):subject })))}
          <label className="report-field" htmlFor={`${id}-policy`}><span>{txt(role === 'STUDENT' ? 'المحاولة المستخدمة في التقرير' : 'المحاولة المعتمدة لكل طالب واختبار', role === 'STUDENT' ? 'Attempt used in report' : 'Attempt per student & exam section')}</span>
            <select id={`${id}-policy`} value={draft.attemptPolicy} onChange={event => update('attemptPolicy', event.target.value)}>
              <option value="latest">{txt('آخر محاولة', 'Latest attempt')}</option><option value="first">{txt('أول محاولة', 'First attempt')}</option><option value="best">{txt('أفضل محاولة', 'Best attempt')}</option>
            </select></label>
          </div></details>
          <label className="report-field" htmlFor={`${id}-search`}><span className="flex items-center gap-1"><Search size={14} />{txt('بحث في السجل', 'Search records')}</span><input id={`${id}-search`} value={draft.search} onChange={event => update('search', event.target.value)} placeholder={txt(role === 'STUDENT' ? 'اسم الامتحان' : 'الاسم، الكود أو الامتحان', role === 'STUDENT' ? 'Exam name' : 'Name, username or exam')} /></label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">{attendance ? txt('المشاركة تشمل جميع محاولات الامتحان المحدد. يُسجّل الغياب بعد انتهاء الموعد فقط.', 'Participation covers all attempts in the selected exam. Absence is recorded only after its deadline.') : txt('المتوسط والنجاح محسوبان من المحاولة المعتمدة داخل الفترة؛ XP منفصل عن الدرجة.', 'Average and pass rate use the selected attempt within the period; XP is separate from grades.')}</p>
          <div className="flex flex-wrap gap-2"><button className="report-secondary" type="button" onClick={() => { const reset = { ...initialFilters(examId), schoolId: applied.schoolId }; setDraft(reset); setApplied(reset); setPage(1); }}>{txt('إعادة ضبط', 'Reset')}</button><button className="report-primary" type="submit" disabled={loading}><Filter size={16} />{txt('تطبيق الفلاتر', 'Apply filters')}</button></div>
        </div>
      </form>

      {optionsError && <div role="alert" className="report-error">{txt('تعذر تحميل بعض بيانات الفلاتر أو التقدم.', 'Some filters or progress could not be loaded.')} {!ar && optionsError} <button className="underline" onClick={() => setReload(value => value + 1)}>{txt('إعادة المحاولة', 'Retry')}</button></div>}
      <nav aria-label={txt('أقسام التقرير', 'Report sections')} className={role === 'STUDENT' ? styles.tabs : "flex gap-2 overflow-x-auto no-print py-1"}>{tabs.map(([key, label]) => <button key={key} aria-pressed={tab === key} onClick={() => { setTab(key); setPage(1); }} className={`report-tab ${tab === key ? 'report-tab-active' : ''}`}>{role === 'STUDENT' && <ReferenceIcon name={({overview:'grid',attempts:'clipboard',skills:'layers',courses:'graduation-cap'} as Record<string,string>)[key] || 'chart-bars'} size={16}/>}<span>{label}</span></button>)}</nav>
      {error && <div role="alert" className="report-error">{error} <button className="underline font-black" onClick={() => setReload(value => value + 1)}>{txt('إعادة المحاولة', 'Retry')}</button></div>}
      {loading && <div role="status" className="premium-card p-10 text-center rounded-[30px] text-indigo-700 font-bold"><RefreshCw className="animate-spin mx-auto mb-3" />{txt('جارٍ حساب التقرير من السجلات…', 'Calculating report from records…')}</div>}
      {!loading && !error && attendance && !report && <div className="premium-card p-8 rounded-[30px] text-center"><CalendarDays className="mx-auto text-indigo-600 mb-3" /><p className="font-bold text-slate-700">{txt('اختر المدرسة والامتحان، ثم طبّق الفلاتر لعرض المشاركة.', 'Select a school and exam, then apply filters to see participation.')}</p></div>}
      {!loading && report && <>
        <div className={role === 'STUDENT' ? styles.dateLine : "text-xs text-slate-500 flex flex-wrap justify-between gap-2"}><span>{attendance ? report.exam?.title : `${formatEgyptDate(applied.from + 'T12:00Z', language)} — ${formatEgyptDate(applied.to + 'T12:00Z', language)}`}</span><span>{txt('آخر تحديث:', 'Updated:')} {formatEgyptDateTime(report.generatedAt, language)} · {txt('توقيت مصر', 'Egypt time')}</span></div>
        {attendance ? <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><Metric title={txt('المطلوب منهم الامتحان حاليًا', 'Currently assigned')} value={number(report.total)} icon={<Users size={20} />} />
            <Metric title={txt('سلّموا', 'Submitted')} value={number(report.attendedCount)} icon={<GraduationCap size={20} />} />
            <Metric title={txt('لم يسلّموا والموعد انتهى', 'Missed after deadline')} value={number(report.missedCount)} icon={<CalendarDays size={20} />} />
            <Metric title={txt('بانتظار الموعد أو التسليم', 'Upcoming or pending')} value={number(report.pendingCount)} icon={<Target size={20} />} /></div>
          <ReportRecordCards rows={report.rows} attendance role={role} language={language} />
          <div className="report-table-wrap hidden sm:block"><table><caption>{txt('مشاركة الطلاب — جميع محاولات الامتحان', 'Student participation — all exam attempts')}</caption><thead><tr><th>{txt('الطالب', 'Student')}</th><th>{txt('الصف', 'Grade')}</th><th>{txt('الحالة', 'Status')}</th><th>{txt('النتيجة', 'Score')}</th><th>{txt('التسليم — مصر', 'Submitted — Egypt')}</th></tr></thead>
            <tbody>{report.rows.map((row: any) => <tr key={row.id}><td><span className="font-bold">{row.name}</span><small className="block text-slate-500">{row.username}</small></td><td>{row.grade || '—'}</td><td><Status value={row.status} ar={ar} /></td><td>{row.percentage == null ? '—' : <Link className="text-indigo-700 font-bold underline" href={`${prefix}/exams/submissions/${row.submissionId}`}>{number(row.percentage, '%')}</Link>}</td><td>{formatEgyptDateTime(row.submittedAt, language)}</td></tr>)}</tbody></table>
            {!report.rows.length && <Empty ar={ar} />}</div>
        </> : <>
          {role === 'STUDENT' ? <StudentReportSummary stats={studentStats} report={report} language={language}/> : <div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><Metric title={txt('الطلاب المشاركون', 'Unique students')} value={number(report.summary.uniqueStudents)} icon={<Users size={20} />} />
            <Metric title={txt('متوسط الدرجة', 'Average score')} value={number(report.summary.averageScore, '%')} icon={<BarChart3 size={20} />} />
            <Metric title={txt('نسبة النجاح', 'Pass rate')} value={number(report.summary.passRate, '%')} icon={<GraduationCap size={20} />} />
            <Metric title={txt('المحاولات المعتمدة / كل المحاولات', 'Selected / all attempts')} value={`${number(report.summary.selectedAttempts)} / ${number(report.summary.totalAttempts)}`} icon={<Target size={20} />} /></div>}
          {!!report.summary.legacyAttempts && <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{txt(`يتضمن التقرير ${report.summary.legacyAttempts} محاولة قديمة. درجاتها محفوظة كما هي؛ لا تتوفر لها نسخة مؤكدة من السؤال والمدرسة وقت التسليم.`, `Includes ${report.summary.legacyAttempts} legacy attempts. Saved scores are preserved; question and school snapshots from submission time are unavailable.`)}</p>}
          {tab === 'overview' && <>{role === 'STUDENT' && <StudentReportNext report={report} language={language} onReview={()=>setTab('attempts')}/>}<ReportCharts report={report} language={language} student={role === 'STUDENT'} />{role === 'STUDENT' && <StudentReportPriority report={report} language={language} onDetails={()=>setTab('skills')}/>}<ReportBreakdown report={report} language={language} />
            {report.summary.eligibleCount != null && <p className="premium-card rounded-[30px] p-5 text-sm font-bold text-slate-700">{txt('المشاركة بين الطلاب المستهدفين حاليًا:', 'Participation among currently assigned students:')} {number(report.summary.participationRate, '%')} ({number(report.summary.eligibleParticipants)} / {number(report.summary.eligibleCount)})</p>}
            {role !== 'STUDENT' && report.skills.some((skill: any) => skill.sufficientEvidence && skill.correctRate < 60) && <div className="premium-card p-6 rounded-[30px]"><h2 className="font-black text-lg text-slate-900 mb-3">{txt('أولوية المتابعة', 'Follow-up priority')}</h2><p className="text-slate-600">{txt('ابدأ بمراجعة المهارات التالية ثم أعد تقييمها بعد تدريب مرتبط:', 'Review these skills and reassess after relevant practice:')}</p><ul className="mt-3 list-disc list-inside space-y-2">{report.skills.filter((skill: any) => skill.sufficientEvidence && skill.correctRate < 60).slice(0, 5).map((skill: any) => <li key={questionMetadata(skill, "name", language)}>{questionMetadata(skill, "name", language)} — {number(skill.correctRate, '%')} ({number(skill.answers)} {txt('إجابة', 'answers')})</li>)}</ul><Link className="report-secondary mt-4 w-fit" href={`${prefix}/students`}>{txt('افتح قائمة الطلاب', 'Open student list')}<ArrowUpRight size={16} /></Link></div>}
            {role !== 'STUDENT' && !!report.schools.length && <div className="report-table-wrap"><table><caption>{txt('المدارس ضمن نفس الفلاتر — راعِ اختلاف الاختبارات وحجم العينة', 'Schools within these filters — consider exam mix and sample size')}</caption><thead><tr><th>{txt('المدرسة', 'School')}</th><th>{txt('طلاب مميزون', 'Unique students')}</th><th>{txt('المتوسط', 'Average')}</th><th>{txt('النجاح', 'Pass rate')}</th></tr></thead><tbody>{report.schools.map((school: any) => <tr key={school.id}><td><Link className="text-indigo-700 underline" href={`/super-admin/schools/${school.id}`}>{school.name}</Link></td><td>{number(school.uniqueStudents)}</td><td>{number(school.averageScore, '%')}</td><td>{number(school.passRate, '%')}</td></tr>)}</tbody></table></div>}</>}
          {tab === 'attempts' && <><ReportRecordCards rows={report.students} role={role} language={language} /><div className="report-table-wrap hidden sm:block"><table><caption>{txt('المحاولات المعتمدة المطابقة للفلاتر', 'Selected attempts matching the filters')}</caption><thead><tr><th>{txt('الطالب / الامتحان', 'Student / exam')}</th>{role !== 'STUDENT' && <th>{txt('المدرسة', 'School')}</th>}<th>{txt('الدرجة', 'Score')}</th><th>{txt('النجاح', 'Pass status')}</th><th>{txt('التاريخ — مصر', 'Date — Egypt')}</th><th>{txt('التفاصيل', 'Details')}</th></tr></thead><tbody>{report.students.map((row: any) => <tr key={row.id}><td><strong>{role === 'STUDENT' ? row.examTitle : row.name}</strong><small className="block text-slate-500 mt-1">{role === 'STUDENT' ? row.subject || '' : row.examTitle}</small></td>{role !== 'STUDENT' && <td>{row.schoolName}</td>}<td className="font-bold">{number(row.percentage, '%')}<small className="block text-slate-500">{txt('حد النجاح', 'Pass threshold')}: {number(row.passingScore, '%')}</small></td><td><Status value={row.passed == null ? 'UNKNOWN' : row.passed ? 'PASSED' : 'FAILED'} ar={ar} /></td><td>{formatEgyptDateTime(row.createdAt, language)}</td><td><Link className="report-secondary w-fit" href={role === 'STUDENT' ? `/exams/result/${row.id}` : `${prefix}/exams/submissions/${row.id}`} aria-label={`${txt('تفاصيل', 'Details for')} ${row.examTitle}`}><ArrowUpRight size={18} /></Link></td></tr>)}</tbody></table>{!report.students.length && <Empty ar={ar} />}</div></>}
          {tab === 'skills' && <div className="space-y-6"><div className="report-table-wrap" tabIndex={0} role="region" aria-label={txt('أداء المهارات','Skill performance')}><table><caption>{txt('أداء المهارات — أقل من 5 إجابات دليل غير كافٍ للحكم على الإتقان', 'Skill performance — fewer than 5 answers is insufficient mastery evidence')}</caption><thead><tr><th>{txt('المهارة / مخرج التعلم', 'Skill / learning outcome')}</th><th>{txt('الإجابات', 'Answers')}</th><th>{txt('الصحيح', 'Correct')}</th><th>{txt('كفاية البيانات', 'Evidence')}</th></tr></thead><tbody>{report.skills.map((skill: any) => <tr key={questionMetadata(skill, "name", language)}><td>{questionMetadata(skill, "name", language)}</td><td>{number(skill.answers)}</td><td>{number(skill.correctRate, '%')}</td><td>{skill.sufficientEvidence ? txt('متاح للمتابعة', 'Available for follow-up') : txt('بيانات غير كافية', 'Insufficient evidence')}</td></tr>)}</tbody></table>{!report.skills.length && <p className="p-8 text-slate-500">{txt('لا توجد إجابات مرتبطة بمهارات في هذا النطاق. يلزم تصنيف الأسئلة لعرض تحليل المهارات.', 'No skill-tagged answers in this scope. Tag questions to enable skill analysis.')}</p>}</div>
            <div className="report-table-wrap" tabIndex={0} role="region" aria-label={txt('تحليل الأسئلة','Question analysis')}><table><caption>{txt('تحليل الأسئلة — الأصعب أولًا', 'Question analysis — lowest correct rate first')}</caption><thead><tr><th>{txt('السؤال', 'Question')}</th><th>{txt('الإجابات', 'Answers')}</th><th>{txt('نسبة الإجابة الصحيحة', 'Correct answer rate')}</th></tr></thead><tbody>{report.questions.map((question: any) => <tr key={question.id}><td className="max-w-xl">{String(questionMetadata(question, 'text', language)).replace(/<[^>]*>/g, '').slice(0, 240)}</td><td>{number(question.total)}</td><td>{number(question.correctRate, '%')}</td></tr>)}</tbody></table>{!report.questions.length && <Empty ar={ar} />}</div></div>}
          {tab === 'courses' && role === 'STUDENT' && <div className="premium-card rounded-[30px] p-6 space-y-5"><h2 className="text-xl font-black text-slate-900">{txt('التقدم الحالي في الدروس — جميع الفترات', 'Current lesson progress — all time')}</h2><p className="text-sm text-slate-500">{txt('تقدم الدروس وXP تراكميان، ولا يتغيران مع فلتر تاريخ محاولات الامتحان.', 'Lesson progress and XP are cumulative and are independent of the exam-attempt date filter.')}</p>{studentStats ? <><div className="grid sm:grid-cols-3 gap-4"><Metric title={txt('إكمال الدروس', 'Lesson completion')} value={number(studentStats.overallCourseProgress, '%')} icon={<GraduationCap size={20} />} /><Metric title="XP" value={number(xp?.totalXP)} icon={<Target size={20} />} /><Metric title={txt('دقائق النشاط المسجلة', 'Recorded active minutes')} value={number(studentStats.activeStudySeconds == null ? null : studentStats.activeStudySeconds / 60)} icon={<CalendarDays size={20} />} /></div><p className="text-xs text-slate-500">{txt('وقت النشاط يُقاس من بدء تشغيل هذه الميزة أثناء فتح الدرس والتفاعل معه، ولا يُستنتج من موضع الفيديو.', 'Active time is recorded from this feature’s introduction while the lesson is visible and receiving interaction. Video position is not treated as study time.')}</p>{studentStats.courseProgresses?.map((course: any) => <Link key={course.id} href={`/courses/${course.id}`} className="block rounded-2xl border border-slate-200 p-4 hover:border-indigo-300"><span className="flex justify-between gap-3 font-bold mb-2">{course.title}<span>{number(course.progressPercent, '%')}</span></span><progress className="w-full accent-indigo-600 h-2" value={course.progressPercent} max={100} aria-label={course.title} /><small className="text-slate-500">{number(course.completedLessonsCount)} / {number(course.totalLessons)} {txt('درس', 'lessons')}</small></Link>)}</> : <p>{txt('تعذر تحميل تقدم الدروس. استخدم إعادة المحاولة أعلى الصفحة.', 'Lesson progress unavailable. Retry using the refresh button above.')}</p>}</div>}
        </>}
        {(attendance || tab === 'attempts') && report.pagination.pages > 1 && <div className="flex flex-wrap justify-center items-center gap-4 no-print"><button className="report-secondary" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>{txt('السابق', 'Previous')}</button><span className="font-bold text-sm">{number(page)} / {number(report.pagination.pages)} · {number(report.pagination.total)} {txt('سجل', 'records')}</span><button className="report-secondary" disabled={page >= report.pagination.pages} onClick={() => setPage(value => value + 1)}>{txt('التالي', 'Next')}</button></div>}
        <p className="text-xs text-slate-500">{txt('تصدير Excel وCSV يشمل كل السجلات المطابقة للفلاتر. الطباعة تشمل العرض الحالي والصفحة الحالية من السجل.', 'Excel and CSV include all matching records. Printing includes the current view and current record page.')}</p>
      </>}
    </div>
  </DashboardLayout>;
}

function Metric({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return <div className="bg-white border border-slate-200/80 shadow-sm rounded-[24px] p-5"><div className="text-indigo-600 mb-3">{icon}</div><p className="text-slate-500 text-xs sm:text-sm font-bold leading-relaxed">{title}</p><p className="text-2xl font-black text-slate-900 mt-2"><bdi dir="ltr" className="student-number">{value}</bdi></p></div>;
}
function Status({ value, ar }: { value: string; ar: boolean }) {
  const labels: Record<string, string[]> = { SUBMITTED: ['سلّم', 'Submitted'], MISSED: ['انتهى دون تسليم', 'Missed deadline'], PENDING: ['بانتظار التسليم', 'Pending'], UPCOMING: ['لم يبدأ', 'Upcoming'], PASSED: ['ناجح', 'Passed'], FAILED: ['يحتاج مراجعة', 'Needs review'], UNKNOWN: ['غير متاح', 'Unavailable'] };
  return <span className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-bold ${['SUBMITTED', 'PASSED'].includes(value) ? 'bg-emerald-50 text-emerald-800' : ['MISSED', 'FAILED'].includes(value) ? 'bg-rose-50 text-rose-800' : 'bg-slate-100 text-slate-700'}`}>{labels[value]?.[ar ? 0 : 1] || value}</span>;
}
function Empty({ ar }: { ar: boolean }) { return <p className="p-10 text-center font-bold text-slate-500">{ar ? 'لا توجد سجلات مطابقة لهذه الفلاتر. جرّب توسيع الفترة أو تغيير الاختيار.' : 'No matching records. Widen the date range or change the filters.'}</p>; }
