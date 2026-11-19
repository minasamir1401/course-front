"use client";

import { useEffect, useState, type FormEvent } from 'react';
import { ClipboardList, Search } from 'lucide-react';
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

  const formatter = new Intl.DateTimeFormat(ar ? 'ar-EG' : 'en-GB', {
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Africa/Cairo',
  });
  const time = (value: string) => <time dateTime={value}>{formatter.format(new Date(value))}</time>;
  const filterStyle = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900';
  const buttonStyle = 'inline-flex items-center gap-2 rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-800 disabled:opacity-50';

  function search(event: FormEvent) {
    event.preventDefault();
    setRequest({ filters: { ...draft, entityId: '' } });
  }

  return <section className="space-y-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm" id="content-audit">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
        <ClipboardList className="h-5 w-5 text-indigo-600" aria-hidden="true" />
        {ar ? 'سجل الكورسات والامتحانات والمهارات' : 'Course, exam and skill activity'}
      </h2>
      <button type="button" className={buttonStyle} disabled={loading} onClick={() => setRequest({ filters })}>{ar ? 'تحديث السجل' : 'Refresh activity'}</button>
    </div>
    <form onSubmit={search} className="grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1.3fr_1fr_1fr_auto]">
      <label className="space-y-1 text-sm font-semibold text-slate-700">
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
      ] as const).map(([field, title]) => <label key={field} className="space-y-1 text-sm font-semibold text-slate-700">
        <span>{title}</span>
        <input className={filterStyle} value={draft[field]} maxLength={150} onChange={e => setDraft({ ...draft, [field]: e.target.value })} />
      </label>)}
      <button type="submit" className={buttonStyle} disabled={loading}><Search className="h-4 w-4" aria-hidden="true" />{ar ? 'بحث' : 'Search'}</button>
    </form>
    {filters.entityId && <button type="button" className={buttonStyle} onClick={() => setRequest({ filters: { ...filters, entityId: '' } })}>
      {ar ? 'إلغاء تحديد الكورس' : 'Clear course selection'}
    </button>}

    {!!data?.courses.length && <ul className="grid gap-2 md:grid-cols-2">
      {data.courses.map(course => <li key={course.id} className="min-w-0 space-y-1 break-words rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
        <p className="font-bold text-slate-900">{course.title}{course.deletedAt && (ar ? ' (محذوف)' : ' (deleted)')}</p>
        <p>{[course.isCentral ? (ar ? 'مركزي' : 'Central') : '', ...course.schoolNames].filter(Boolean).join(' · ') || unknown}</p>
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
    {!loading && !failed && !data?.events.length && <p className="text-sm text-slate-600">
      {ar ? 'مفيش عمليات مسجّلة بالبحث ده. التعديلات اللي حصلت قبل بدء التسجيل مش هتظهر هنا.' : 'No matching activity. Changes made before audit logging started are unavailable.'}
    </p>}
    {!!data?.events.length && <ol className="divide-y rounded-xl border border-slate-200">
      {data.events.map(event => <li key={event.id} className="grid gap-2 break-words p-3 text-sm text-slate-700 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-bold text-slate-900">{event.entityTitle || unknown}</p>
          <p>{label(event.category)} · {label(event.action)} · {label(event.itemType)}{event.itemTitle && event.itemTitle !== event.entityTitle ? ' · ' + event.itemTitle : ''}</p>
          {!!event.changedFields.length && <p>{ar ? 'الحقول: ' : 'Fields: '}<bdi>{event.changedFields.join(', ')}</bdi></p>}
        </div>
        <div>
          <p className="font-semibold">{event.actorName || unknown}{event.actorRole && ' · ' + label(event.actorRole)}</p>
          {event.actingAsName && <p>{ar ? 'بالنيابة عن ' : 'Acting as '}{event.actingAsName}</p>}
          {event.source !== 'api' && <p>{label(event.source)}</p>}
        </div>
        <div>
          <p>{[event.isCentral ? (ar ? 'مركزي' : 'Central') : '', event.schoolNames].filter(Boolean).join(' · ') || unknown}</p>
          <p>{time(event.recordedAt)}</p>
        </div>
      </li>)}
    </ol>}
    {data?.nextCursor && <button type="button" className={buttonStyle} disabled={loading}
      onClick={() => setRequest({ filters, cursor: data.nextCursor! })}>{ar ? 'عرض تعديلات أقدم' : 'Show older activity'}</button>}
    <p className="text-xs text-slate-500">{ar ? 'الأوقات بتوقيت القاهرة.' : 'All times are shown in Cairo time.'}</p>
  </section>;
}
