"use client";

import { useEffect, useState, type FormEvent } from 'react';
import { BookOpen, ClipboardList, Clock3, GraduationCap, History, Layers3, RefreshCw, School, Search, UserRound } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiFetch } from '@/lib/api';

type Category = '' | 'course' | 'exam' | 'skill';
type Filters = { category: Category; q: string; school: string; actor: string; entityId: string };
type AuditEvent = {
  id: string; recordedAt: string; category: Exclude<Category, ''>; entityTitle: string | null;
  itemTitle: string | null; itemType: string; action: string; source: string;
  actorName: string | null; actorRole: string | null; actingAsName: string | null;
  schoolNames: string | null; isCentral: boolean; changedFields: string[];
};
type Course = {
  id: string; title: string; isCentral: boolean; schoolNames: string[];
  createdAt: string; updatedAt: string; deletedAt: string | null; creator: { name: string } | null;
  lastChange: { actorName: string | null; recordedAt: string } | null;
};
type AuditPage = { events: AuditEvent[]; nextCursor: string | null; courses: Course[] };
const initialFilters: Filters = { category: '', q: '', school: '', actor: '', entityId: '' };
const categories = {
  course: { icon: BookOpen, color: 'bg-indigo-50 text-indigo-700' },
  exam: { icon: GraduationCap, color: 'bg-sky-50 text-sky-800' },
  skill: { icon: Layers3, color: 'bg-violet-50 text-violet-800' },
};
const actionColors: Record<string, string> = {
  create: 'bg-emerald-50 text-emerald-800',
  update: 'bg-amber-50 text-amber-900',
  delete: 'bg-rose-50 text-rose-800',
  restore: 'bg-sky-50 text-sky-800',
};
const activityColumns = 'lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,10rem)]';

const labels: Record<string, [string, string]> = {
  course: ['كورس', 'Course'],
  exam: ['امتحان', 'Exam'],
  skill: ['مهارة', 'Skill'],
  create: ['إنشاء', 'Created'],
  update: ['تعديل', 'Updated'],
  delete: ['حذف', 'Deleted'],
  restore: ['استرجاع', 'Restored'],
  import: ['استيراد', 'Import'],
  system: ['عملية نظام أو تعديل مباشر', 'System or direct write'],
  Course: ['الكورس', 'Course'],
  Lesson: ['درس', 'Lesson'],
  LessonBlock: ['جزء من الدرس', 'Lesson block'],
  DynamicSection: ['قسم في الدرس', 'Lesson section'],
  Exam: ['الامتحان', 'Exam'],
  ExamFolder: ['مجلد امتحانات', 'Exam folder'],
  ExamModule: ['وحدة امتحان', 'Exam module'],
  SubExam: ['امتحان فرعي', 'Sub-exam'],
  Question: ['سؤال امتحان', 'Exam question'],
  SkillCluster: ['مجموعة مهارات', 'Skill group'],
  SkillLesson: ['درس مهارات', 'Skill lesson'],
  InteractiveActivity: ['نشاط تفاعلي', 'Interactive activity'],
  _CourseToSchool: ['مدارس الكورس', 'Course schools'],
  _ExamToSchool: ['مدارس الامتحان', 'Exam schools'],
  SUPER_ADMIN: ['سوبر أدمن', 'Super admin'],
  SCHOOL_ADMIN: ['مدير مدرسة', 'School admin'],
  TEACHER: ['معلم', 'Teacher'],
  EXAM_SUPERVISOR: ['مشرف امتحانات', 'Exam supervisor'],
};

export default function ContentAuditPanel() {
  const { language } = useLanguage();
  const ar = language === 'ar';
  const label = (value: string) => labels[value]?.[ar ? 0 : 1] ?? value;
  const unknown = ar ? 'غير معروف' : 'Unknown';
  const [draft, setDraft] = useState<Filters>(initialFilters);
  const [request, setRequest] = useState<{ filters: Filters; cursor?: string }>({ filters: initialFilters });
  const [data, setData] = useState<AuditPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const { filters, cursor } = request;

  useEffect(() => {
    let current = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => Boolean(value)));
    if (cursor) params.set('cursor', cursor);
    setLoading(true);
    setFailed(false);
    if (!cursor) setData(null);
    async function fetchAudit() {
      try {
        const response = await apiFetch('/api/admin/monitor/content-audit?' + params, { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('Unable to load content audit');
        const page: AuditPage = await response.json();
        if (current) setData(previous => cursor && previous
          ? { ...page, events: [...previous.events, ...page.events], courses: previous.courses } : page);
      } catch {
        if (current) setFailed(true);
      } finally {
        window.clearTimeout(timeout);
        if (current) setLoading(false);
      }
    }
    void fetchAudit();
    return () => { current = false; window.clearTimeout(timeout); controller.abort(); };
  }, [filters, cursor, request]);

  const dateFormatter = new Intl.DateTimeFormat(ar ? 'ar-EG' : 'en-GB', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
    timeZone: 'Africa/Cairo',
  });
  const clockFormatter = new Intl.DateTimeFormat(ar ? 'ar-EG' : 'en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Africa/Cairo',
  });
  const time = (value: string) => <time dateTime={value}>{dateFormatter.format(new Date(value))} · {clockFormatter.format(new Date(value))}</time>;
  const filterStyle = 'h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-indigo-500';
  const buttonStyle = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:opacity-50';
  const columnLabels = [ar ? 'المحتوى والتعديل' : 'Content and action', ar ? 'نفّذ التعديل' : 'Changed by', ar ? 'المدرسة' : 'School', ar ? 'التاريخ والوقت' : 'Date and time'];

  function search(event: FormEvent) {
    event.preventDefault();
    setRequest({ filters: { ...draft, entityId: '' } });
  }

  return <section dir={ar ? 'rtl' : 'ltr'} aria-labelledby="content-audit-title" className="min-w-0 scroll-mt-6 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm" id="content-audit">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-white p-4 sm:p-6">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white">
          <ClipboardList className="size-5" aria-hidden="true" />
        </span>
        <h2 id="content-audit-title" className="text-lg leading-snug font-bold text-slate-950 sm:text-xl">
          {ar ? 'سجل الكورسات والامتحانات والمهارات' : 'Course, exam and skill activity'}
        </h2>
      </div>
      <button type="button" className={buttonStyle} disabled={loading} onClick={() => setRequest({ filters })}>
        <RefreshCw className="size-4" aria-hidden="true" />
        {ar ? 'تحديث السجل' : 'Refresh activity'}
      </button>
    </div>
    <div className="space-y-5 p-4 sm:p-6">
    <form onSubmit={search} className="grid items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
      <label className="grid min-w-0 gap-1.5 text-sm font-semibold text-slate-700">
        <span>{ar ? 'نوع المحتوى' : 'Content type'}</span>
        <select className={filterStyle} value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value as Category })}>
          <option value="">{ar ? 'الكل' : 'All'}</option>
          <option value="course">{ar ? 'الكورسات والدروس' : 'Courses and lessons'}</option>
          <option value="exam">{ar ? 'الامتحانات والأسئلة' : 'Exams and questions'}</option>
          <option value="skill">{ar ? 'المهارات والأنشطة' : 'Skills and activities'}</option>
        </select>
      </label>
      {([
        ['q', ar ? 'اسم المحتوى' : 'Content name'],
        ['school', ar ? 'اسم المدرسة' : 'School name'],
        ['actor', ar ? 'اسم الشخص' : 'Person’s name'],
      ] as const).map(([field, title]) => <label key={field} className="grid min-w-0 gap-1.5 text-sm font-semibold text-slate-700">
        <span>{title}</span>
        <input className={filterStyle} value={draft[field]} maxLength={150} onChange={e => setDraft({ ...draft, [field]: e.target.value })} />
      </label>)}
      <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50" disabled={loading}>
        <Search className="size-4" aria-hidden="true" />{ar ? 'بحث' : 'Search'}
      </button>
    </form>
    {filters.entityId && <button type="button" className={buttonStyle} onClick={() => setRequest({ filters: { ...filters, entityId: '' } })}>
      {ar ? 'إلغاء تحديد الكورس' : 'Clear course selection'}
    </button>}

    {!!data?.courses.length && <ul className="grid gap-3 md:grid-cols-2">
      {data.courses.map(course => <li key={course.id} className="flex min-w-0 flex-col items-start gap-2 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 text-sm text-slate-700 [overflow-wrap:anywhere]">
        <p className="flex min-w-0 items-start gap-2 font-bold text-slate-900">
          <BookOpen className="mt-0.5 size-4 shrink-0 text-indigo-600" aria-hidden="true" />
          <span>{course.title}{course.deletedAt && (ar ? ' (محذوف)' : ' (deleted)')}</span>
        </p>
        <p className="text-slate-600">{[course.isCentral ? (ar ? 'مركزي' : 'Central') : '', ...course.schoolNames].filter(Boolean).join(' · ') || unknown}</p>
        <p>{ar ? 'أنشأه: ' : 'Created by: '}{course.creator?.name || unknown} · {time(course.createdAt)}</p>
        <p>{ar ? 'آخر تعديل في السجل: ' : 'Latest audited change: '}{course.lastChange
          ? <>{course.lastChange.actorName || unknown} · {time(course.lastChange.recordedAt)}</>
          : <>{unknown} · {ar ? 'وقت تحديث الكورس في القاعدة ' : 'Course database timestamp '}{time(course.updatedAt)}</>}</p>
        {!filters.entityId && <button type="button" className={buttonStyle}
          onClick={() => setRequest({ filters: { ...filters, category: 'course', entityId: course.id } })}>
          {ar ? 'عرض سجل الكورس' : 'View course history'}
        </button>}
      </li>)}
    </ul>}

    {failed && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{ar ? 'تعذّر تحميل السجل. حاول التحديث.' : 'Could not load activity. Try refreshing.'}</p>}
    {loading && <p role="status" className="text-sm text-slate-600">{ar ? 'جارٍ تحميل السجل…' : 'Loading activity…'}</p>}
    {!loading && !failed && !data?.events.length && <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-600">
      {ar ? 'مفيش عمليات مسجّلة بالبحث ده. التعديلات اللي حصلت قبل بدء التسجيل مش هتظهر هنا.' : 'No matching activity. Changes made before audit logging started are unavailable.'}
    </p>}
    {!!data?.events.length && <div className="lg:overflow-hidden lg:rounded-2xl lg:border lg:border-slate-200">
      <div aria-hidden="true" className={`hidden gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600 lg:grid ${activityColumns}`}>
        {columnLabels.map(title => <span key={title}>{title}</span>)}
      </div>
      <ol className="space-y-3 lg:divide-y lg:divide-slate-200 lg:space-y-0">
        {data.events.map(event => {
          const { icon: CategoryIcon, color } = categories[event.category];
          const recordedAt = new Date(event.recordedAt);
          return <li key={event.id} className={`grid min-w-0 grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 [overflow-wrap:anywhere] lg:items-start lg:rounded-none lg:border-0 lg:hover:bg-slate-50/60 ${activityColumns}`}>
            <div className="col-span-2 min-w-0 space-y-1.5 border-b border-slate-100 pb-3 lg:col-span-1 lg:border-0 lg:pb-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
                  <CategoryIcon className="size-3.5" aria-hidden="true" />{label(event.category)}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${actionColors[event.action] || 'bg-slate-100 text-slate-700'}`}>{label(event.action)}</span>
              </div>
              <p className="font-bold text-slate-950">{event.entityTitle || unknown}</p>
              <p className="text-xs text-slate-600">{label(event.itemType)}{event.itemTitle && event.itemTitle !== event.entityTitle ? ' · ' + event.itemTitle : ''}</p>
              {!!event.changedFields.length && <p className="text-xs text-slate-600">{ar ? 'الحقول: ' : 'Fields: '}<bdi>{event.changedFields.join(', ')}</bdi></p>}
            </div>
            <div className="min-w-0 space-y-1">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 lg:sr-only"><UserRound className="size-3.5 shrink-0" aria-hidden="true" />{columnLabels[1]}</p>
              <p className="font-semibold text-slate-900">{event.actorName || unknown}</p>
              {event.actorRole && <p className="text-xs text-slate-600">{label(event.actorRole)}</p>}
              {event.actingAsName && <p className="text-xs text-slate-600">{ar ? 'بالنيابة عن ' : 'Acting as '}{event.actingAsName}</p>}
              {event.source !== 'api' && <p className="text-xs text-slate-600">{label(event.source)}</p>}
            </div>
            <div className="min-w-0 space-y-1">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 lg:sr-only"><School className="size-3.5 shrink-0" aria-hidden="true" />{columnLabels[2]}</p>
              <p>{[event.isCentral ? (ar ? 'مركزي' : 'Central') : '', event.schoolNames].filter(Boolean).join(' · ') || unknown}</p>
            </div>
            <div className="col-span-2 min-w-0 border-t border-slate-100 pt-3 lg:col-span-1 lg:border-0 lg:pt-0">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-600 lg:sr-only"><Clock3 className="size-3.5 shrink-0" aria-hidden="true" />{columnLabels[3]}</p>
              <time dateTime={event.recordedAt} className="block text-xs leading-relaxed text-slate-700">
                <span className="font-semibold">{dateFormatter.format(recordedAt)}</span>
                <span className="ms-2 tabular-nums lg:ms-0 lg:block">{clockFormatter.format(recordedAt)}</span>
              </time>
            </div>
          </li>;
        })}
      </ol>
    </div>}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="flex items-center gap-1.5 text-xs text-slate-600"><Clock3 className="size-3.5" aria-hidden="true" />{ar ? 'الأوقات بتوقيت القاهرة.' : 'All times are shown in Cairo time.'}</p>
      {data?.nextCursor && <button type="button" className={buttonStyle} disabled={loading}
        onClick={() => setRequest({ filters, cursor: data.nextCursor! })}><History className="size-4" aria-hidden="true" />{ar ? 'عرض تعديلات أقدم' : 'Show older activity'}</button>}
    </div>
    </div>
  </section>;
}
