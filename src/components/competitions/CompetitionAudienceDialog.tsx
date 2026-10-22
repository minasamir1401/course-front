'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Save, School, X } from 'lucide-react';
import { useModalFocus } from '@/hooks/useModalFocus';
import { studentGradeLabel } from '@/lib/studentLocale';
import { competitionError, competitionRequest } from './api';
import styles from './CompetitionAuthoring.module.css';

export default function CompetitionAudienceDialog({ room, superAdmin, ar, onClose, onSaved }: {
  room: any; superAdmin: boolean; ar: boolean; onClose: () => void; onSaved: (room: any) => void;
}) {
  const [scope, setScope] = useState(room.schoolId ? 'SCHOOL' : 'GENERAL');
  const [schoolId, setSchoolId] = useState<string>(room.schoolId || '');
  const [grade, setGrade] = useState<string>(room.grade || '');
  const [options, setOptions] = useState<{ schools: { id: string; name: string }[]; grades: string[] }>({ schools: [], grades: [] });
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const dialog = useRef<HTMLDivElement>(null);
  const text = (a: string, e: string) => ar ? a : e;
  useModalFocus(true, dialog, () => { if (!busy) onClose(); });
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    competitionRequest('/manage/options' + (schoolId ? '?schoolId=' + encodeURIComponent(schoolId) : ''))
      .then(data => { if (active) setOptions({ schools: data.schools || [], grades: data.grades || [] }); })
      .catch(error => { if (active) setError(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [schoolId]);
  const grades = [...new Set([...Array.from({ length: 12 }, (_, index) => studentGradeLabel('Grade ' + (index + 1), 'ar')), ...options.grades, ...(grade ? [grade] : [])])];
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const updated = await competitionRequest('/manage/' + room.id + '/audience', { schoolId: superAdmin && scope === 'GENERAL' ? null : schoolId, grade: grade || null }, 'PATCH');
      onSaved(updated.room);
    } catch (error) { setError((error as Error).message); } finally { setBusy(false); }
  };
  return createPortal(<div className={styles.audienceBackdrop} onClick={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <div className={styles.audienceDialog} ref={dialog} role="dialog" aria-modal="true" aria-labelledby="competition-audience-title" tabIndex={-1} dir={ar ? 'rtl' : 'ltr'}>
      <div className={styles.row}><h2 id="competition-audience-title"><School size={21}/>{text('تحديد المدرسة والصف', 'Set school & grade')}</h2><button type="button" className={styles.secondary} disabled={busy} onClick={onClose} aria-label={text('إغلاق', 'Close')}><X size={18}/></button></div>
      <p className={styles.muted}>{ar ? room.title : room.titleEn || room.title}</p>
      <p className={styles.notice}>{text('يمكن تعديل تخصيص المسابقة بعد النشر ما دام لم ينضم أي طالب ولم تبدأ الجولة المباشرة.', 'The audience can change after publication until a student joins or the live round starts.')}</p>
      {error && <p className={styles.error} role="alert">{competitionError(error, ar)}</p>}
      <form className={styles.form} onSubmit={save}>
        {superAdmin && <label>{text('إتاحة المسابقة', 'Competition audience')}<select className={styles.input} disabled={busy} value={scope} onChange={event => { setScope(event.target.value); if (event.target.value === 'GENERAL') setSchoolId(''); }}><option value="GENERAL">{text('كل مدارس المنصة', 'All platform schools')}</option><option value="SCHOOL">{text('مدرسة محددة', 'A specific school')}</option></select></label>}
        {(scope === 'SCHOOL' || !superAdmin) && <label>{text('المدرسة المستهدفة', 'Target school')}<select className={styles.input} required value={schoolId} disabled={busy || loading || !superAdmin} onChange={event => setSchoolId(event.target.value)}><option value="">{text('اختر المدرسة', 'Choose school')}</option>{options.schools.map(school => <option value={school.id} key={school.id}>{school.name}</option>)}{room.schoolId && !options.schools.some(school => school.id === room.schoolId) && <option value={room.schoolId}>{room.schoolName}</option>}</select></label>}
        <label>{text('الصف المستهدف', 'Target grade')}<select className={styles.input} value={grade} disabled={busy || loading} onChange={event => setGrade(event.target.value)}><option value="">{text('كل الصفوف', 'All grades')}</option>{grades.map(grade => <option value={grade} key={grade}>{studentGradeLabel(grade, ar ? 'ar' : 'en')}</option>)}</select></label>
        {loading && <p className={styles.muted} role="status">{text('جارٍ تحميل المدارس والصفوف…', 'Loading schools and grades…')}</p>}
        <div className={styles.actions}><button className={styles.primary} type="submit" disabled={busy || loading || (scope === 'SCHOOL' && !schoolId)}><Save size={17}/>{busy ? text('جارٍ الحفظ…', 'Saving…') : text('حفظ التخصيص', 'Save audience')}</button><button className={styles.secondary} type="button" disabled={busy} onClick={onClose}>{text('إلغاء', 'Cancel')}</button></div>
      </form>
    </div>
  </div>, document.body);
}
