'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { RefreshCw, Download, Printer, ArrowRight, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import HtmlRenderer from '@/components/HtmlRenderer';
import { API_URL, apiFetch } from '@/lib/api';
import { teachingRequest } from '@/lib/teachingClient';
import { egyptDay, addCalendarDays, formatEgyptDateTime, parseEgyptDate, toEgyptInput } from '@/lib/egyptTime';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTeachingData } from './useTeachingData';
import styles from './TeachingWorkspace.module.css';

export type TeachingMode = 'overview' | 'student' | 'lesson' | 'calendar' | 'notices';
const tierNames: Record<string, [string, string]> = { EXCELLENT: ['متفوق', 'Excellent'], AVERAGE: ['متوسط', 'Average'], NEEDS_SUPPORT: ['يحتاج دعم', 'Needs support'], UNASSESSED: ['لم يُقيّم بعد', 'Not assessed'] };
const kindNames: Record<string, [string, string]> = { questions: ['كويز', 'Quiz'], assignments: ['واجب', 'Assignment'], slides: ['تدريب', 'Practice'], QUIZ: ['كويز', 'Quiz'], ASSIGNMENT: ['واجب', 'Assignment'], LESSON: ['درس', 'Lesson'], EXAM: ['امتحان', 'Exam'], OTHER: ['مهمة', 'Task'] };

export default function TeachingWorkspace({ mode = 'overview', entityId = '' }: { mode?: TeachingMode; entityId?: string }) {
  const { language } = useLanguage(), ar = language === 'ar'; const txt = (a: string, e: string) => ar ? a : e;
  const [draft, setDraft] = useState({ from: addCalendarDays(egyptDay(), -29), to: mode === 'calendar' ? addCalendarDays(egyptDay(), 30) : egyptDay(), search: '', courseId: '', activity: '', tier: '', page: '1' });
  const [applied, setApplied] = useState(draft), [reload, setReload] = useState(0), [selected, setSelected] = useState<string[]>([]);
  const [notice, setNotice] = useState(''), [actionError, setActionError] = useState(''), [busy, setBusy] = useState(false);
  const query = new URLSearchParams({ ...applied, limit: mode === 'calendar' || mode === 'notices' ? '100' : '25' }).toString();
  const path = `/teaching/${mode === 'student' ? 'students/' + encodeURIComponent(entityId) : mode === 'lesson' ? 'lessons/' + encodeURIComponent(entityId) : 'overview'}?${query}`;
  const { data, error, loading } = useTeachingData(path, reload);
  const titles: Record<TeachingMode, [string, string]> = { overview: ['متابعة الطلاب والتعلّم', 'Student learning follow-up'], student: ['ملف متابعة الطالب', 'Student learning profile'], lesson: ['متابعة الدرس', 'Lesson follow-up'], calendar: ['جدول الدروس والتقييمات', 'Teaching schedule'], notices: ['تنبيهات وتذكيرات المعلم', 'Teacher notices & reminders'] };
  const number = (value: any, suffix = '') => value == null ? '—' : Number(value).toLocaleString(ar ? 'ar-EG' : 'en-GB', { maximumFractionDigits: 1 }) + suffix;
  const date = (value: any) => value ? formatEgyptDateTime(value, language) : txt('لم يُسجل نشاط', 'No recorded activity');
  const tier = (value: string) => <span className={`${styles.badge} ${value === 'EXCELLENT' ? styles.good : value === 'NEEDS_SUPPORT' ? styles.danger : ''}`}>{tierNames[value]?.[ar ? 0 : 1] || value}</span>;
  const refresh = () => setReload(value => value + 1);
  const apply = (event: React.FormEvent) => { event.preventDefault(); setApplied({ ...draft, page: '1' }); setSelected([]); setNotice(''); };
  async function act(work: () => Promise<any>, success: string) {
    setBusy(true); setActionError(''); setNotice('');
    try { await work(); setNotice(success); refresh(); } catch (error: any) { setActionError(error.message); } finally { setBusy(false); }
  }
  async function exportStudent(format: string) {
    await act(async () => { const response = await apiFetch(`${API_URL}/teaching/students/${encodeURIComponent(entityId)}/export?${query}&format=${format}`);
      if (!response.ok) throw new Error(txt('تعذر تنزيل التقرير', 'Could not download report'));
      const url = URL.createObjectURL(await response.blob()), link = document.createElement('a'); link.href = url; link.download = `student-follow-up.${format}`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, txt('تم تجهيز التقرير', 'Report downloaded'));
  }
  const studentRows = mode === 'lesson' ? data?.lessonStudents || [] : data?.students || [];
  const toggle = (id: string) => setSelected(rows => rows.includes(id) ? rows.filter(value => value !== id) : rows.length < 200 ? [...rows, id] : rows);
  const allVisible = studentRows.filter((row: any) => row.status === 'ACTIVE').map((row: any) => row.id);
  return <DashboardLayout><div className={styles.page} dir={ar ? 'rtl' : 'ltr'}>
    <header className={styles.hero}><div><p className={styles.eyebrow}>{txt('مساحة المعلم · المتابعة والتوجيه', 'Teacher workspace · Follow-up & guidance')}</p><h1>{data?.profile?.name || data?.lesson?.title || titles[mode][ar ? 0 : 1]}</h1><p className={styles.muted}>{txt('نشاط حقيقي، درجات واضحة، وخطوة متابعة لكل طالب.', 'Recorded activity, clear grades, and a follow-up action for each student.')}</p></div><div className={`${styles.actions} ${styles.noPrint}`}>
      {mode !== 'overview' && <Link className={styles.button} href="/school-admin/follow-up"><ArrowRight size={15}/>{txt('العودة للمتابعة', 'Follow-up home')}</Link>}
      <button className={styles.button} onClick={refresh} aria-label={txt('تحديث المتابعة', 'Refresh follow-up')}><RefreshCw size={16}/></button>
      {mode === 'student' && <><button className={styles.button} disabled={busy || !data} onClick={() => exportStudent('xlsx')}><Download size={15}/>Excel</button><button className={styles.button} disabled={busy || !data} onClick={() => exportStudent('csv')}>CSV</button><button className={styles.button} onClick={() => window.print()}><Printer size={15}/>PDF / {txt('طباعة', 'Print')}</button></>}
    </div></header>
    <nav className={styles.nav} aria-label={txt('متابعة المعلم', 'Teacher follow-up')}>
      {[['/school-admin/follow-up', txt('الطلاب والدروس', 'Students & lessons'), mode === 'overview'], ['/school-admin/schedule', txt('الجدول', 'Schedule'), mode === 'calendar'], ['/school-admin/messages', txt('الرسائل', 'Messages'), false], ['/school-admin/reminders', txt('التنبيهات والتذكيرات', 'Notices & reminders'), mode === 'notices']].map(([href, label, active]) => <Link key={String(href)} href={String(href)} aria-current={active ? 'page' : undefined}>{label}</Link>)}
    </nav>
    <form onSubmit={apply} className={`${styles.panel} ${styles.filters}`}>
      <label className={styles.field}>{txt('من تاريخ — مصر', 'From — Egypt')}<input type="date" required value={draft.from} onChange={event => setDraft({ ...draft, from: event.target.value })}/></label>
      <label className={styles.field}>{txt('إلى تاريخ — شامل', 'Through — inclusive')}<input type="date" required value={draft.to} onChange={event => setDraft({ ...draft, to: event.target.value })}/></label>
      {mode !== 'student' && <label className={styles.field}>{txt('اسم الطالب أو المستخدم', 'Student name or username')}<input type="search" value={draft.search} onChange={event => setDraft({ ...draft, search: event.target.value })}/></label>}
      {mode === 'overview' && <><label className={styles.field}>{txt('النشاط', 'Activity')}<select value={draft.activity} onChange={event => setDraft({ ...draft, activity: event.target.value })}><option value="">{txt('الكل', 'All')}</option><option value="active">{txt('نشط خلال 7 أيام', 'Active within 7 days')}</option><option value="inactive">{txt('يحتاج متابعة النشاط', 'Inactive / no recorded activity')}</option></select></label><label className={styles.field}>{txt('المستوى', 'Achievement')}<select value={draft.tier} onChange={event => setDraft({ ...draft, tier: event.target.value })}><option value="">{txt('الكل', 'All')}</option>{Object.entries(tierNames).map(([key, labels]) => <option key={key} value={key}>{labels[ar ? 0 : 1]}</option>)}</select></label></>}
      <button className={`${styles.button} ${styles.primary}`} type="submit">{txt('تطبيق الفلاتر', 'Apply filters')}</button>
    </form>
    {(error || actionError) && <div className={styles.error} role="alert">{error || actionError} <button onClick={refresh}>{txt('إعادة المحاولة', 'Retry')}</button></div>}
    {notice && <p className={styles.success} role="status">{notice}</p>}
    {loading && <p className={styles.empty} role="status">{txt('جارٍ تحميل السجلات…', 'Loading records…')}</p>}
    {data && <>
      {mode === 'student' && <section className={styles.panel}><h2>{txt('بيانات الطالب وولي الأمر', 'Student & guardian')}</h2><dl className={styles.profile}>{[
        [txt('اسم المستخدم', 'Username'), data.profile.username], [txt('الصف والفصل', 'Grade & classroom'), `${data.profile.grade || '—'} · ${data.profile.classroom?.name || '—'}`],
        [txt('ولي الأمر', 'Guardian'), data.profile.parent?.name || txt('غير مسجل', 'Not recorded')], [txt('هاتف ولي الأمر', 'Guardian phone'), data.profile.parent?.phone || '—'], [txt('بريد ولي الأمر', 'Guardian email'), data.profile.parent?.email || '—'],
        [txt('آخر نشاط', 'Last activity'), date(data.students[0]?.lastSeenAt)]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><div className={styles.actions} style={{ marginTop: 18 }}><Link className={`${styles.button} ${styles.primary}`} href={`/school-admin/messages?studentId=${encodeURIComponent(entityId)}`}>{txt('إرسال رسالة للطالب', 'Message student')}</Link><button className={styles.button} onClick={() => setSelected([entityId])}>{txt('إرسال تنبيه أو تذكير', 'Send notice or reminder')}</button></div></section>}
      {mode !== 'calendar' && mode !== 'notices' && <>
        <div className={styles.metrics}>{[
          [txt('الطلاب ضمن النطاق', 'Students in scope'), number(data.summary.students), txt('الحسابات المسموح لك بمتابعتها', 'Your permitted roster')],
          [txt('نشطون خلال 7 أيام', 'Active within 7 days'), number(data.summary.active), txt('زيارات ونشاط تعلّم مسجل', 'Recorded visits and learning activity')],
          [txt('بحاجة لمتابعة النشاط', 'Activity follow-up'), number(data.summary.inactive), txt('ليس حكمًا على المستوى الدراسي', 'Separate from academic achievement')],
          [txt('متوسط التقييمات المكتملة', 'Completed-assessment average'), number(data.summary.averageScore, '%'), txt('أحدث المحاولات؛ بدون XP', 'Latest attempts; XP excluded')],
        ].map(([label, value, detail]) => <div className={styles.metric} key={label}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>)}</div>
        <p className={styles.policy}>{txt('المتفوق ≥85%، المتوسط ≥60%، ويحتاج الدعم أقل من 60%. غير المقيّم لا يُحسب صفرًا. التقييم يشمل أحدث امتحان/قسم، وكويزات وواجبات الدرس المكتملة. المحاولات الجزئية تظهر بتقدمها منفصلة. الوقت المسجل لا يفرض مهلة للحل.', 'Excellent ≥85%, average ≥60%, support below 60%. Unassessed is not zero. Scores use latest exams/sections and completed lesson quizzes/assignments. Partial attempts remain separate. Recorded time is not a time limit.')}</p>
      </>}
      {mode === 'calendar' && <CalendarManager query={query} reload={reload} data={data} ids={selected} ar={ar} busy={busy} act={act}/>}
      {mode !== 'student' && <section className={styles.panel}><div className={styles.actions} style={{ justifyContent: 'space-between', marginBottom: 12 }}><h2>{mode === 'lesson' ? txt('حالة الطلاب في الدرس', 'Students in this lesson') : mode === 'calendar' ? txt('اختيار الطلاب لإسناد المهام في التقويم', 'Select students for task assignment') : txt('الطلاب وخطوة المتابعة', 'Students & follow-up')}</h2><span className={styles.muted}>{selected.length} {txt('محددون', 'selected')}</span></div>
        <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th><input className={styles.check} type="checkbox" aria-label={txt('اختيار الطلاب المعروضين النشطين', 'Select visible active accounts')} checked={!!allVisible.length && allVisible.every((id: string) => selected.includes(id))} onChange={event => setSelected(event.target.checked ? [...new Set([...selected, ...allVisible])].slice(0, 200) : selected.filter(id => !allVisible.includes(id)))}/></th><th>{txt('الطالب', 'Student')}</th><th>{txt('النشاط', 'Activity')}</th><th>{txt('المستوى', 'Achievement')}</th><th>{mode === 'lesson' ? txt('حالة الدرس', 'Lesson status') : txt('الدروس المكتملة', 'Completed lessons')}</th><th>{txt('التفاصيل', 'Details')}</th></tr></thead><tbody>
          {studentRows.map((row: any) => <tr key={row.id}><td><input className={styles.check} type="checkbox" disabled={row.status !== 'ACTIVE'} aria-label={`${txt('اختيار', 'Select')} ${row.name}`} checked={selected.includes(row.id)} onChange={() => toggle(row.id)}/></td><td><Link href={`/school-admin/follow-up/students/${row.id}`}>{row.name}</Link><small>{row.grade || '—'} · {row.classroom?.name || row.username}</small></td><td><span className={`${styles.badge} ${row.active ? styles.good : styles.warning}`}>{row.active ? txt('نشط', 'Active') : txt('متابعة', 'Follow up')}</span><small>{date(row.lastSeenAt)}</small><small>{number(row.activeDays)} {txt('يوم نشاط في الفترة', 'active days in range')}</small></td><td>{tier(row.tier)} <b>{number(row.averageScore, '%')}</b><small>{number(row.assessedCount)} {txt('تقييمات مكتملة', 'completed assessments')}</small></td><td>{mode === 'lesson' ? row.progress?.isCompleted ? txt('أكمل الدرس', 'Completed') : row.progress || row.assessments?.length ? txt('بدأ ولم يكمل', 'In progress') : txt('لم يبدأ', 'Not started') : number(row.completedLessons)}<small>{number((row.progress?.activeStudySeconds ?? row.activeStudySeconds) / 60)} {txt('دقيقة دراسة', 'study minutes')}</small></td><td>{mode === 'lesson' ? <details><summary>{txt('المحاولات والأسئلة', 'Attempts & questions')}</summary><AssessmentDetails rows={row.assessments} ar={ar}/></details> : <Link href={`/school-admin/follow-up/students/${row.id}`}>{txt('فتح ملف الطالب', 'Open profile')}</Link>}</td></tr>)}
        </tbody></table></div>{!studentRows.length && <p className={styles.empty}>{txt('لا يوجد طلاب مطابقون للفلاتر. جرّب فترة أوسع أو راجع الإسناد.', 'No matching students. Broaden filters or check assignments.')}</p>}
        {mode !== 'lesson' && data.pagination.pages > 1 && <div className={styles.pagination}><button className={styles.button} disabled={data.pagination.page <= 1} onClick={() => setApplied({ ...applied, page: String(data.pagination.page - 1) })}>{txt('السابق', 'Previous')}</button><span>{number(data.pagination.page)} / {number(data.pagination.pages)} · {number(data.pagination.total)}</span><button className={styles.button} disabled={data.pagination.page >= data.pagination.pages} onClick={() => setApplied({ ...applied, page: String(data.pagination.page + 1) })}>{txt('التالي', 'Next')}</button></div>}
      </section>}
      {selected.length > 0 && <Composer ids={selected} ar={ar} busy={busy} act={act} onClear={() => setSelected([])}/>}
      {mode === 'notices' && <NoticeHistory reload={reload} ar={ar} busy={busy} act={act}/>}
      {mode === 'student' && <section className={styles.panel}><h2>{txt('تقييمات الدروس والمحاولات', 'Lesson assessments & attempts')}</h2><AssessmentDetails rows={data.assessments} ar={ar}/>{!data.assessments?.length && <p className={styles.empty}>{txt('لا توجد محاولات تفصيلية مسجلة في الفترة. يبدأ التتبع التفصيلي عند تفعيل الميزة، ولا نختلق درجات من XP قديم.', 'No detailed attempts in range. Detailed tracking begins with this feature; historical XP is not fabricated into grades.')}</p>}</section>}
      {['overview', 'student'].includes(mode) && <div className={styles.split}><section className={styles.panel}><h2>{txt('الأداء في كل درس', 'Performance by lesson')}</h2><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>{txt('الدرس', 'Lesson')}</th><th>{txt('بدأ / أكمل / لم يبدأ', 'Started / completed / not started')}</th><th>{txt('متوسط الكويز', 'Quiz average')}</th><th>{txt('متوسط الواجب', 'Assignment average')}</th></tr></thead><tbody>{data.lessons.map((lesson: any) => <tr key={lesson.id}><td><Link href={`/school-admin/follow-up/lessons/${lesson.id}`}>{lesson.title}</Link><small>{lesson.courseTitle}</small></td><td>{number(lesson.started)} / {number(lesson.completed)} / {number(lesson.notStarted)}</td><td>{number(lesson.quizAverage, '%')}<small>{number(lesson.quizSubmitted)} {txt('تسليم مكتمل', 'completed')}</small></td><td>{number(lesson.assignmentAverage, '%')}<small>{number(lesson.assignmentSubmitted)} {txt('تسليم مكتمل', 'completed')}</small></td></tr>)}</tbody></table></div>{!data.lessons.length && <p className={styles.empty}>{txt('لا توجد دروس ضمن النطاق.', 'No lessons in scope.')}</p>}</section><section className={styles.panel}><h2>{txt('مهارات تحتاج توجيهًا', 'Skills to guide')}</h2><Skills rows={data.skills} ar={ar}/></section></div>}
      {mode === 'lesson' && <section className={styles.panel}><h2>{txt('المهارات والإجابات الصحيحة والخاطئة', 'Skills: correct & incorrect')}</h2><Skills rows={data.skills} ar={ar}/></section>}
      {mode === 'student' && <section className={styles.panel}><h2>{txt('أحدث نتائج الامتحانات والأقسام', 'Latest exam & section results')}</h2>{data.examResults?.map((row: any) => <div className={styles.event} key={row.id}><div><strong>{row.exam.title}</strong><p>{date(row.createdAt)} · {number(row.totalTime)} {txt('ثانية', 'seconds')}</p></div><strong>{number(row.percentage, '%')}</strong></div>)}{!data.examResults?.length && <p className={styles.empty}>{txt('لا توجد نتائج امتحانات في الفترة.', 'No exam results in range.')}</p>}</section>}
    </>}
  </div></DashboardLayout>;
}

function Skills({ rows, ar }: any) { return <div className={styles.skills}>{rows?.length ? rows.map((row: any) => <div className={styles.skillRow} key={row.name}><strong>{row.name}</strong><progress value={row.correct} max={Math.max(1, row.correct + row.incorrect)} aria-label={row.name}/><span className={styles.muted}>{ar ? `صحيح ${row.correct} · خطأ ${row.incorrect} · ${row.students} طلاب` : `Correct ${row.correct} · Incorrect ${row.incorrect} · ${row.students} students`}{row.evidenceCount < 5 ? ar ? ' · دليل محدود' : ' · Limited evidence' : ''}</span></div>) : <p className={styles.empty}>{ar ? 'لا توجد أدلة كافية لعرض المهارات.' : 'No recorded skill evidence.'}</p>}</div>; }
function AssessmentDetails({ rows = [], ar }: any) { return <div className={styles.stack}>{rows.map((row: any) => <div className={styles.answer} key={`${row.lessonId}-${row.kind}`}><strong>{kindNames[row.kind]?.[ar ? 0 : 1]} · {row.completed ? `${row.score}%` : ar ? 'جارٍ الحل' : 'In progress'}</strong><p className={styles.muted}>{row.answered} / {row.expected} {ar ? 'أسئلة' : 'questions'} · {row.elapsedSeconds == null ? '—' : row.elapsedSeconds} {ar ? 'ثانية مسجلة' : 'recorded seconds'}</p><div className={styles.stack}>{row.answers?.map((answer: any) => <div key={answer.id}><HtmlRenderer html={String(answer.questionSnapshot?.text || answer.questionSnapshot?.questionText || answer.questionSnapshot?.title || answer.questionKey)}/><span className={`${styles.badge} ${answer.isCorrect ? styles.good : styles.danger}`}>{answer.isCorrect ? ar ? 'صحيحة' : 'Correct' : ar ? 'تحتاج مراجعة' : 'Incorrect'}</span> <small>{answer.questionSnapshot?.skill || answer.questionSnapshot?.skillEn || '—'} · {answer.elapsedSeconds ?? '—'} {ar ? 'ثانية' : 'seconds'}</small><pre>{typeof answer.selectedAnswer === 'string' ? answer.selectedAnswer : JSON.stringify(answer.selectedAnswer)}</pre></div>)}</div></div>)}</div>; }
function Composer({ ids, ar, busy, act, onClear }: any) {
  const [type, setType] = useState('message'), [body, setBody] = useState(''), [title, setTitle] = useState(''), [sendAt, setSendAt] = useState(''), [requestId, setRequestId] = useState(() => crypto.randomUUID());
  return <section className={`${styles.panel} ${styles.composer} ${styles.noPrint}`}><h2>{ar ? `تواصل مع ${ids.length} طالب محدد` : `Contact ${ids.length} selected students`}</h2><form className={styles.stack} onSubmit={event => { event.preventDefault(); void act(async () => {
    await teachingRequest(type === 'message' ? '/messages' : '/teaching/notices', { method: 'POST', body: JSON.stringify({ recipientIds: ids, body, title, sendAt: sendAt ? parseEgyptDate(sendAt).toISOString() : undefined, requestId }) });
    setBody(''); setTitle(''); setRequestId(crypto.randomUUID()); onClear();
  }, ar ? 'تم حفظ الإرسال والتذكير.' : 'Message or reminder saved.'); }}>
    <div className={styles.filters}><label className={styles.field}>{ar ? 'طريقة التواصل' : 'Communication'}<select value={type} onChange={event => { setType(event.target.value); setRequestId(crypto.randomUUID()); }}><option value="message">{ar ? 'رسالة للطالب' : 'Student message'}</option><option value="notice">{ar ? 'تنبيه أو تذكير' : 'Notice / reminder'}</option></select></label>{type === 'notice' && <><label className={styles.field}>{ar ? 'عنوان التنبيه' : 'Notice title'}<input required maxLength={160} value={title} onChange={event => setTitle(event.target.value)}/></label><label className={styles.field}>{ar ? 'موعد الإرسال — مصر، فارغ للإرسال الآن' : 'Send at — Egypt, blank for now'}<input type="datetime-local" value={sendAt} onChange={event => setSendAt(event.target.value)}/></label></>}</div>
    <label className={styles.field}>{ar ? 'نص الرسالة أو التوجيه' : 'Message or guidance'}<textarea required maxLength={type === 'message' ? 4000 : 2000} value={body} onChange={event => setBody(event.target.value)}/></label><div className={styles.actions}><button className={`${styles.button} ${styles.primary}`} disabled={busy}>{busy ? ar ? 'جارٍ الحفظ…' : 'Saving…' : ar ? 'إرسال للمحددِين' : 'Send to selected'}</button><button type="button" className={styles.button} onClick={onClear}>{ar ? 'إلغاء الاختيار' : 'Clear selection'}</button></div>
  </form></section>;
}
function NoticeHistory({ reload, ar, busy, act }: any) {
  const { data, error } = useTeachingData('/teaching/notices', reload);
  return <section className={styles.panel}><h2>{ar ? 'سجل التنبيهات والتذكيرات' : 'Notice & reminder history'}</h2>{error && <p role="alert" className={styles.error}>{error}</p>}{data?.items.map((item: any) => <div className={styles.event} key={item.id}><div><strong>{item.title}</strong><p>{formatEgyptDateTime(item.sendAt, ar ? 'ar' : 'en')} · {item._count.recipients} {ar ? 'طالب' : 'students'} · {item.cancelledAt ? ar ? 'ملغي' : 'Cancelled' : item.deliveredAt ? ar ? 'تمت المعالجة' : 'Processed' : ar ? 'مجدول' : 'Scheduled'}</p><p>{item.body}</p></div>{!item.deliveredAt && !item.cancelledAt && <button className={styles.button} disabled={busy} onClick={() => act(() => teachingRequest('/teaching/notices/' + item.id, { method: 'DELETE' }), ar ? 'تم إلغاء التذكير' : 'Reminder cancelled')}>{ar ? 'إلغاء التذكير' : 'Cancel reminder'}</button>}</div>)}{data && !data.items.length && <p className={styles.empty}>{ar ? 'لم تُنشأ تنبيهات بعد. اختر الطلاب واكتب التنبيه أعلاه.' : 'No notices yet. Select students and compose a notice above.'}</p>}</section>;
}
function CalendarManager({ query, reload, data: overview, ids, ar, busy, act }: any) {
  const { data, error } = useTeachingData('/teaching/calendar?' + query, reload);
  const fresh = () => ({ id: '', source: 'TASK', kind: 'ASSIGNMENT', title: '', startsAt: '', dueAt: '', courseId: '', lessonId: '', revision: 0, expectedUpdatedAt: '' });
  const [form, setForm] = useState<any>(fresh), [editingIds, setEditingIds] = useState<string[] | null>(null);
  const todayStr = egyptDay();
  const [monthCursor, setMonthCursor] = useState(() => todayStr.slice(0, 7));
  const [selectedDay, setSelectedDay] = useState('');

  const edit = (item: any) => {
    setForm({ ...fresh(), ...item, startsAt: toEgyptInput(item.startsAt), dueAt: toEgyptInput(item.dueAt) });
    setEditingIds(item.recipientIds || null);
  };

  const shiftMonth = (delta: number) => {
    const [y, m] = monthCursor.split('-').map(Number);
    const d = new Date(Date.UTC(y, m - 1 + delta, 1, 12, 0, 0));
    setMonthCursor(d.toISOString().slice(0, 7));
  };

  const calendarCells = useMemo(() => {
    const [y, m] = monthCursor.split('-').map(Number);
    const firstOfMonth = new Date(Date.UTC(y, m - 1, 1, 12, 0, 0));
    // Week starts on Saturday (day 6 in JS UTCDay: 0=Sun..6=Sat -> offset = (day + 1) % 7)
    const startOffset = (firstOfMonth.getUTCDay() + 1) % 7;
    const gridStart = addCalendarDays(`${monthCursor}-01`, -startOffset);
    const eventsByDay: Record<string, any[]> = {};
    for (const ev of data?.events || []) {
      const dayKey = egyptDay(ev.dueAt || ev.startsAt);
      if (dayKey) {
        (eventsByDay[dayKey] ||= []).push(ev);
      }
      if (ev.startsAt) {
        const startKey = egyptDay(ev.startsAt);
        if (startKey && startKey !== dayKey) {
          (eventsByDay[startKey] ||= []).push(ev);
        }
      }
    }
    return Array.from({ length: 42 }, (_, idx) => {
      const dateStr = addCalendarDays(gridStart, idx);
      return {
        dateStr,
        dayNum: Number(dateStr.slice(8, 10)),
        inMonth: dateStr.startsWith(monthCursor),
        isToday: dateStr === todayStr,
        events: eventsByDay[dateStr] || [],
      };
    });
  }, [monthCursor, data?.events, todayStr]);

  const monthLabel = useMemo(() => {
    const [y, m] = monthCursor.split('-').map(Number);
    const d = new Date(Date.UTC(y, m - 1, 15, 12, 0, 0));
    return d.toLocaleDateString(ar ? 'ar-EG' : 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  }, [monthCursor, ar]);

  const weekdays = ar
    ? ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']
    : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  const visibleEvents = useMemo(() => {
    const all = data?.events || [];
    if (!selectedDay) return all;
    const filtered = all.filter((ev: any) => egyptDay(ev.dueAt || ev.startsAt) === selectedDay || (ev.startsAt && egyptDay(ev.startsAt) === selectedDay));
    return filtered.length ? filtered : all;
  }, [data?.events, selectedDay]);

  return (
    <div className={styles.stack}>
      <section className={styles.calendarCard}>
        <div className={styles.calendarHeader}>
          <div>
            <h2 className={styles.calendarMonthTitle} style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
              <CalendarDays size={22} color="#4f46e5" />
              <span>{monthLabel}</span>
            </h2>
            <p className={styles.muted} style={{ marginTop: 4 }}>
              {ar ? 'اضغط على أي يوم في التقويم لإضافة مهمة في هذا التاريخ أو استعراض مواعيده.' : 'Click any day on the calendar to schedule a task on that date or inspect its events.'}
            </p>
          </div>
          <div className={styles.actions}>
            {selectedDay && (
              <button type="button" className={styles.button} onClick={() => setSelectedDay('')}>
                {ar ? `عرض كل الشهر (${selectedDay})` : `Show all month (${selectedDay})`}
              </button>
            )}
            <button type="button" className={styles.button} onClick={() => shiftMonth(-1)} aria-label={ar ? 'الشهر السابق' : 'Previous month'}>
              {ar ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              <span>{ar ? 'السابق' : 'Prev'}</span>
            </button>
            <button
              type="button"
              className={styles.button}
              onClick={() => {
                setMonthCursor(todayStr.slice(0, 7));
                setSelectedDay('');
              }}
            >
              {ar ? 'اليوم' : 'Today'}
            </button>
            <button type="button" className={styles.button} onClick={() => shiftMonth(1)} aria-label={ar ? 'الشهر التالي' : 'Next month'}>
              <span>{ar ? 'التالي' : 'Next'}</span>
              {ar ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
        </div>

        <div className={styles.calendarWeekdays}>
          {weekdays.map(day => (
            <div key={day} className={styles.calendarWeekday}>{day}</div>
          ))}
        </div>

        <div className={styles.calendarGrid}>
          {calendarCells.map(cell => (
            <div
              key={cell.dateStr}
              onClick={() => {
                setSelectedDay(prev => (prev === cell.dateStr ? '' : cell.dateStr));
                if (!form.id) {
                  setForm((prev: any) => ({ ...prev, dueAt: `${cell.dateStr}T18:00` }));
                }
              }}
              className={`${styles.calendarCell} ${!cell.inMonth ? styles.calendarCellMuted : ''} ${cell.isToday ? styles.calendarCellToday : ''} ${selectedDay === cell.dateStr ? styles.calendarCellSelected : ''}`}
            >
              <div className={styles.calendarDayNumber}>
                <span>{cell.dayNum.toLocaleString(ar ? 'ar-EG' : 'en-GB')}</span>
                {cell.events.length > 0 && (
                  <span className={styles.badge} style={{ padding: '1px 6px', fontSize: 10 }}>
                    {cell.events.length}
                  </span>
                )}
              </div>
              <div className={styles.calendarPills}>
                {cell.events.slice(0, 3).map((ev: any) => (
                  <div
                    key={ev.source + ev.id}
                    onClick={e => {
                      e.stopPropagation();
                      edit(ev);
                    }}
                    title={`${kindNames[ev.kind]?.[ar ? 0 : 1] || ev.kind}: ${ev.title}`}
                    className={`${styles.calendarPill} ${ev.kind === 'EXAM' ? styles.calendarPillExam : ev.source === 'TASK' ? styles.calendarPillTask : ''}`}
                  >
                    {ev.title}
                  </div>
                ))}
                {cell.events.length > 3 && (
                  <small className={styles.muted} style={{ fontSize: 10 }}>
                    +{cell.events.length - 3} {ar ? 'أخرى' : 'more'}
                  </small>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className={styles.split}>
        <section className={styles.panel}>
          <h2>{ar ? 'مواعيد الدروس والامتحانات والمهام' : 'Lessons, assessments & tasks'}</h2>
          <p className={styles.muted}>{ar ? 'المواعيد كلها بتوقيت مصر. تعديل درس أو امتحان يحدّث مصدره، والمهمة المستقلة تظهر للطلاب المحددين.' : 'All dates use Egypt time. Source edits update the lesson/exam; tasks appear for selected students.'}</p>
          {error && <p role="alert" className={styles.error}>{error}</p>}
          {visibleEvents.map((item: any) => (
            <div className={styles.event} key={item.source + item.id}>
              <div>
                <span className={styles.badge}>{kindNames[item.kind]?.[ar ? 0 : 1]}</span>
                <h3>{item.title}</h3>
                <p>{item.startsAt ? formatEgyptDateTime(item.startsAt, ar ? 'ar' : 'en') : '—'} ← {item.dueAt ? formatEgyptDateTime(item.dueAt, ar ? 'ar' : 'en') : '—'}</p>
              </div>
              <div className={styles.actions}>
                <button className={styles.button} onClick={() => edit(item)}>{ar ? 'تعديل الموعد' : 'Edit schedule'}</button>
                {item.source === 'TASK' && (
                  <button className={styles.button} disabled={busy} onClick={() => act(() => teachingRequest('/teaching/tasks/' + item.id, { method: 'DELETE', body: JSON.stringify({ revision: item.revision }) }), ar ? 'تم إلغاء المهمة' : 'Task cancelled')}>
                    {ar ? 'إلغاء' : 'Cancel'}
                  </button>
                )}
              </div>
            </div>
          ))}
          {data && !visibleEvents.length && <p className={styles.empty}>{ar ? 'لا توجد مواعيد ضمن الفترة المختارة.' : 'No events in this range.'}</p>}
        </section>

        <section className={styles.panel}>
          <h2>{form.id ? (ar ? 'تعديل الموعد' : 'Edit schedule') : (ar ? 'إضافة مهمة للطلاب المحددين' : 'Create a task for selected students')}</h2>
          <form className={styles.stack} onSubmit={event => {
            event.preventDefault();
            void act(async () => {
              const payload = { ...form, startsAt: form.startsAt ? parseEgyptDate(form.startsAt).toISOString() : null, dueAt: parseEgyptDate(form.dueAt).toISOString(), recipientIds: editingIds || ids };
              await teachingRequest(form.source !== 'TASK' ? `/teaching/calendar/${form.source}/${form.id}` : '/teaching/tasks' + (form.id ? '/' + form.id : ''), { method: form.source !== 'TASK' ? 'PATCH' : form.id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
              setForm(fresh());
              setEditingIds(null);
            }, ar ? 'تم حفظ الجدول' : 'Schedule saved');
          }}>
            {form.source === 'TASK' && (
              <>
                <label className={styles.field}>{ar ? 'عنوان المهمة' : 'Task title'}<input required maxLength={160} value={form.title} onChange={event => setForm({ ...form, title: event.target.value })}/></label>
                <label className={styles.field}>{ar ? 'النوع' : 'Type'}<select value={form.kind} onChange={event => setForm({ ...form, kind: event.target.value })}>{['LESSON', 'QUIZ', 'ASSIGNMENT', 'EXAM', 'OTHER'].map(key => <option key={key} value={key}>{kindNames[key][ar ? 0 : 1]}</option>)}</select></label>
                <label className={styles.field}>{ar ? 'ربط بكورس — اختياري' : 'Course — optional'}<select value={form.courseId} onChange={event => setForm({ ...form, courseId: event.target.value, lessonId: '' })}><option value="">—</option>{overview.courses.map((course: any) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></label>
                <label className={styles.field}>{ar ? 'ربط بدرس — اختياري' : 'Lesson — optional'}<select value={form.lessonId} onChange={event => setForm({ ...form, lessonId: event.target.value })}><option value="">—</option>{overview.lessons.filter((lesson: any) => !form.courseId || lesson.courseId === form.courseId).map((lesson: any) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}</select></label>
                <p className={styles.muted}>{ar ? 'عدد الطلاب المحددين:' : 'Selected recipients:'} {(editingIds || ids).length}</p>
              </>
            )}
            <label className={styles.field}>{ar ? 'البداية — مصر' : 'Starts — Egypt'}<input type="datetime-local" value={form.startsAt} onChange={event => setForm({ ...form, startsAt: event.target.value })}/></label>
            <label className={styles.field}>{ar ? 'الإغلاق أو التسليم — مصر' : 'Closes / due — Egypt'}<input required type="datetime-local" value={form.dueAt} onChange={event => setForm({ ...form, dueAt: event.target.value })}/></label>
            <button className={`${styles.button} ${styles.primary}`} disabled={busy || form.source === 'TASK' && !(editingIds || ids).length}>{ar ? 'حفظ الموعد' : 'Save schedule'}</button>
            {form.id && <button type="button" className={styles.button} onClick={() => { setForm(fresh()); setEditingIds(null); }}>{ar ? 'إضافة مهمة جديدة بدل التعديل' : 'Create a new task instead'}</button>}
          </form>
        </section>
      </div>
    </div>
  );
}
