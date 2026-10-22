'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, CheckCheck, GraduationCap, Search, Users } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import styles from './CertificateRecipients.module.css';

export type CertificateAudience = { schoolId: string; grade: string; studentIds: string[] };
type Student = { id: string; name: string; username: string };
type Options = { schools: { id: string; name: string }[]; schoolId: string | null; grades: { value: string; count: number }[] };
export default function CertificateRecipients({ ar, superAdmin, value, onChange, disabled }: {
  ar: boolean; superAdmin: boolean; value: CertificateAudience; onChange: (value: CertificateAudience) => void; disabled: boolean;
}) {
  const [options, setOptions] = useState<Options>({ schools: [], schoolId: null, grades: [] });
  const [optionsReady, setOptionsReady] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [roster, setRoster] = useState<{ key: string; items: Student[]; complete: boolean }>({ key: '', items: [], complete: false });
  const [retry, setRetry] = useState(0);
  const allCheckbox = useRef<HTMLInputElement>(null);
  const audienceKey = JSON.stringify([value.schoolId, value.grade]);
  const students = useMemo(() => roster.key === audienceKey && roster.complete ? roster.items : [], [roster, audienceKey]);
  const ready = roster.key === audienceKey && roster.complete;
  const selected = useMemo(() => new Set(value.studentIds), [value.studentIds]);
  const visible = students.filter(student => `${student.name} ${student.username}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const allSelected = students.length > 0 && students.every(student => selected.has(student.id));
  useEffect(() => { if (allCheckbox.current) allCheckbox.current.indeterminate = selected.size > 0 && !allSelected; }, [selected, allSelected]);
  useEffect(() => {
    const controller = new AbortController();
    const schoolQuery = value.schoolId ? `?schoolId=${encodeURIComponent(value.schoolId)}` : '';
    apiFetch(`/api/certificates/audience${schoolQuery}`, { signal: controller.signal, cache: 'no-store' }).then(async response => {
      if (!response.ok) throw new Error();
      const data: Options = await response.json();
      if (controller.signal.aborted) return;
      setOptions(data); setOptionsReady(true); setError('');
      if (!superAdmin && data.schoolId && !value.schoolId) onChange({ schoolId: data.schoolId, grade: '', studentIds: [] });
    }).catch(() => { if (!controller.signal.aborted) setError(ar ? 'تعذر تحميل المدارس والصفوف. أعد المحاولة.' : 'Could not load schools and grades. Please retry.'); });
    return () => controller.abort();
  }, [value.schoolId, superAdmin, ar, retry, onChange]);
  useEffect(() => {
    if (!value.schoolId || !value.grade) return;
    const controller = new AbortController();
    const load = async () => {
      const items: Student[] = []; let cursor: string | null = null;
      const seenCursors = new Set<string>();
      do {
        const params = new URLSearchParams({ schoolId: value.schoolId, grade: value.grade });
        if (cursor) params.set('cursor', cursor);
        const response = await apiFetch(`/api/certificates/recipients?${params}`, { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error();
        const data: { items: Student[]; nextCursor: string | null } = await response.json();
        items.push(...data.items); cursor = data.nextCursor || null;
        if (cursor && seenCursors.has(cursor)) throw new Error();
        if (cursor) seenCursors.add(cursor);
      } while (cursor && !controller.signal.aborted);
      if (!controller.signal.aborted) {
        const unique = [...new Map(items.map(student => [student.id, student])).values()];
        unique.sort((a, b) => a.name.localeCompare(b.name, ar ? 'ar' : 'en') || a.username.localeCompare(b.username));
        setRoster({ key: audienceKey, items: unique, complete: true }); setError('');
      }
    };
    void load().catch(() => { if (!controller.signal.aborted) setError(ar ? 'تعذر تحميل طلاب الصف. أعد المحاولة.' : 'Could not load this grade’s students. Please retry.'); });
    return () => controller.abort();
  }, [value.schoolId, value.grade, audienceKey, ar, retry]);
  const changeAudience = (schoolId: string, grade: string) => {
    setQuery(''); setError(''); setRoster({ key: '', items: [], complete: false });
    if (schoolId !== value.schoolId) setOptionsReady(false);
    onChange({ schoolId, grade, studentIds: [] });
  };
  return <fieldset className={styles.picker} disabled={disabled}>
    <legend><Users size={19}/>{ar ? 'اختيار الطلاب المستلمين' : 'Choose recipients'}</legend>
    <p className={styles.hint}>{ar ? (superAdmin ? 'اختر المدرسة ثم الصف، وحدد الطلاب الذين تريد إرسال الشهادة لهم.' : 'اختر الصف الدراسي، ثم حدد طالبًا أو أكثر أو كل طلاب الصف.') : (superAdmin ? 'Choose a school and grade, then select the students receiving this certificate.' : 'Choose a grade, then select individual students or the entire grade.')}</p>
    <div className={styles.selectors}>
      {superAdmin ? <label><span><Building2 size={17}/>{ar ? 'المدرسة' : 'School'}</span><select value={value.schoolId} onChange={event => changeAudience(event.target.value, '')}><option value="">{ar ? 'اختر المدرسة' : 'Choose school'}</option>{options.schools.map(school => <option key={school.id} value={school.id}>{school.name}</option>)}</select></label> : <div className={styles.school}><Building2 size={20}/><div><small>{ar ? 'مدرستك' : 'Your school'}</small><strong>{options.schools.find(school => school.id === value.schoolId)?.name || (ar ? 'جارٍ التحميل…' : 'Loading…')}</strong></div></div>}
      <label><span><GraduationCap size={18}/>{ar ? 'الصف الدراسي' : 'Grade'}</span><select value={value.grade} disabled={!value.schoolId || !optionsReady || options.schoolId !== value.schoolId} onChange={event => changeAudience(value.schoolId, event.target.value)}><option value="">{ar ? 'اختر الصف الدراسي' : 'Choose grade'}</option>{options.schoolId === value.schoolId && options.grades.map(grade => <option key={grade.value} value={grade.value || '__empty__'}>{['__unassigned__', '__empty__'].includes(grade.value) ? (ar ? 'بدون صف محدد' : 'Unassigned grade') : grade.value} ({grade.count})</option>)}</select></label>
    </div>
    {optionsReady && value.schoolId && options.schoolId === value.schoolId && !options.grades.length && <p className={styles.hint}>{ar ? 'لا يوجد طلاب نشطون في هذه المدرسة.' : 'This school has no active students.'}</p>}
    {value.grade && <div className={styles.roster}>
      <div className={styles.rosterTop}><strong><Users size={18}/>{ar ? 'طلاب الصف' : 'Grade students'}</strong><span role="status" aria-live="polite">{ar ? `${selected.size} محدد من ${students.length}` : `${selected.size} of ${students.length} selected`}</span></div>
      <label className={styles.search}><Search size={18}/><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={ar ? 'ابحث داخل الصف بالاسم أو اسم المستخدم' : 'Search this grade by name or username'} aria-label={ar ? 'البحث في طلاب الصف' : 'Search grade students'} disabled={!ready}/></label>
      {ready && students.length > 0 && <div className={styles.selectionBar}><label><input ref={allCheckbox} type="checkbox" checked={allSelected} onChange={() => onChange({ ...value, studentIds: allSelected ? [] : students.map(student => student.id) })}/><CheckCheck size={17}/>{ar ? 'تحديد كل طلاب الصف' : 'Select all grade students'}</label>{selected.size > 0 && <button type="button" onClick={() => onChange({ ...value, studentIds: [] })}>{ar ? 'إلغاء التحديد' : 'Clear selection'}</button>}</div>}
      {!ready ? !error && <p role="status" className={styles.placeholder}>{ar ? 'جارٍ تحميل جميع طلاب الصف…' : 'Loading all grade students…'}</p> : <div className={styles.list} role="group" aria-label={ar ? 'قائمة الطلاب' : 'Student list'}>{visible.map(student => <label className={`${styles.student} ${selected.has(student.id) ? styles.selected : ''}`} key={student.id}><input type="checkbox" checked={selected.has(student.id)} onChange={event => onChange({ ...value, studentIds: event.target.checked ? [...value.studentIds, student.id] : value.studentIds.filter(id => id !== student.id) })}/><span className={styles.initial} aria-hidden="true">{student.name.trim().charAt(0)}</span><span><strong>{student.name}</strong><bdi>{student.username}</bdi></span></label>)}{!visible.length && <p className={styles.placeholder}>{ar ? (students.length ? 'لا توجد أسماء تطابق البحث.' : 'لا يوجد طلاب نشطون في هذا الصف.') : (students.length ? 'No students match this search.' : 'This grade has no active students.')}</p>}</div>}
      {query && students.length > 0 && <p className={styles.hint}>{ar ? `المعروض ${visible.length} من ${students.length}. تحديد الكل يشمل الصف كاملًا حتى الأسماء غير الظاهرة في البحث.` : `Showing ${visible.length} of ${students.length}. Select all includes the entire grade, including names hidden by this search.`}</p>}
    </div>}
    {error && <div role="alert" className={styles.error}>{error}<button type="button" onClick={() => { setError(''); setRetry(old => old + 1); }}>{ar ? 'أعد المحاولة' : 'Retry'}</button></div>}
  </fieldset>;
}
