'use client';
import { useEffect, useState } from 'react';
import QuestionSummary from '@/components/QuestionSummary';
import { Copy, Layers } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { competitionError } from './api';
import { normalizeCompetitionQuestion, type CompetitionQuestion } from './authoring';
import styles from './CompetitionAuthoring.module.css';
type Section = { id: string; title: string; kind?: string; parentId?: string };
export default function CompetitionQuestionImport({ ar, courses, exams, seconds, currentCount, disabled, onImport }: { ar: boolean; courses: { id: string; title: string }[]; exams: { id: string; title: string }[]; seconds: number; currentCount: number; disabled: boolean; onImport: (questions: CompetitionQuestion[]) => void }) {
  const [kind, setKind] = useState('EXAM'), [source, setSource] = useState(''), [moduleId, setModuleId] = useState(''), [section, setSection] = useState('');
  const [sections, setSections] = useState<Section[]>([]), [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false), [error, setError] = useState(''), [retry, setRetry] = useState(0);
  const text = (a: string, e: string) => ar ? a : e;
  const effectiveSection = section || moduleId;
  useEffect(() => {
    if (!source) return;
    const controller = new AbortController(); setLoading(true); setError(''); setItems([]);
    const load = async () => {
      const all: any[] = []; let offset: number | null = 0; const visited = new Set<number>();
      do {
        const query = new URLSearchParams({ kind, sourceId: source, section: effectiveSection, seconds: String(seconds), offset: String(offset) });
        const response = await apiFetch('/api/competitions/manage/import?' + query, { cache: 'no-store', signal: controller.signal }); const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'SERVER_ERROR');
        all.push(...data.items); if (!controller.signal.aborted && all.length === data.items.length) setSections(data.sections);
        offset = data.nextOffset;
        if (offset !== null && visited.has(offset)) throw new Error('SERVER_ERROR');
        if (offset !== null) visited.add(offset);
        if (all.length > 500) throw new Error('QUESTION_LIMIT');
      } while (offset !== null && !controller.signal.aborted);
      if (!controller.signal.aborted) setItems(all);
    };
    void load().catch(e => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [effectiveSection, kind, source, seconds, retry]);
  const chooseSource = (value: string) => { setSource(value); setModuleId(''); setSection(''); setSections([]); setItems([]); setError(''); };
  const unsupported = items.filter(item => !item.supported);
  const subs = sections.filter(item => item.kind === 'SUB_EXAM' && (!moduleId || item.parentId === moduleId));
  return <section className={styles.card} aria-labelledby="whole-import-title"><h2 id="whole-import-title"><Layers size={21} style={{ display: 'inline' }}/> {text('نقل امتحان أو مقرر بالكامل', 'Copy an entire exam or course')}</h2><p className={styles.muted}>{text('اختر المصدر بالكامل، أو امتحانًا فرعيًا أو درسًا. تُنقل كل أسئلته بأنواعها ودرجاتها والميتا داتا والمجموعات إلى المسودة. يظل الأصل محفوظًا.', 'Choose a whole source, a sub-exam or a lesson. All its questions, types, points, metadata and groups are copied to this draft. The original is preserved.')}</p><fieldset disabled={disabled} className={styles.form} style={{ marginTop: 20 }}><div className={styles.grid}>
    <label className={styles.field}>{text('نوع المصدر', 'Source type')}<select className={styles.input} value={kind} onChange={event => { setKind(event.target.value); chooseSource(''); }}><option value="EXAM">{text('امتحان', 'Exam')}</option><option value="COURSE">{text('مقرر', 'Course')}</option></select></label>
    <label className={styles.field}>{kind === 'EXAM' ? text('الامتحان', 'Exam source') : text('المقرر', 'Course source')}<select className={styles.input} value={source} onChange={event => chooseSource(event.target.value)}><option value="">{text('اختر المصدر', 'Choose source')}</option>{(kind === 'EXAM' ? exams : courses).map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
    {source && kind === 'EXAM' && <><label className={styles.field}>{text('القسم', 'Exam section')}<select className={styles.input} value={moduleId} disabled={loading} onChange={event => { setModuleId(event.target.value); setSection(''); }}><option value="">{text('الامتحان بالكامل', 'Entire exam')}</option>{sections.filter(item => item.kind !== 'SUB_EXAM').map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label className={styles.field}>{text('الامتحان الفرعي', 'Sub-exam')}<select className={styles.input} value={section} disabled={loading} onChange={event => setSection(event.target.value)}><option value="">{text('كل الامتحانات الفرعية', 'All sub-exams')}</option>{subs.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label></>}
    {source && kind === 'COURSE' && <label className={styles.field}>{text('الدرس', 'Lesson')}<select className={styles.input} value={section} disabled={loading} onChange={event => setSection(event.target.value)}><option value="">{text('المقرر بالكامل', 'Entire course')}</option>{sections.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>}
    </div>{source && (loading ? <p role="status">{text('جارٍ مراجعة كل أسئلة المصدر…', 'Reviewing all source questions…')}</p> : error ? <p role="alert" className={styles.error}>{competitionError(error, ar)} <button type="button" className={styles.secondary} onClick={() => setRetry(value => value + 1)}>{text('إعادة المحاولة', 'Retry')}</button></p> : <><div className={styles.importSummary}><span className={styles.tag}>{items.length} {text('سؤال في الاختيار الحالي', 'questions in this selection')}</span><span className={styles.tag}>{new Set(items.map(item => item.sourceLabel)).size} {text('مجموعة', 'groups')}</span></div>{!!unsupported.length && <div role="alert" className={styles.error}>{text('تعذّر نقل بعض الأسئلة. راجع النوع والاختيارات والوقت الموضحة أدناه:', 'Some questions cannot be copied. Review the type, choices and timing below:')}<ul>{unsupported.map(item => <li key={item.key}>{item.sourceLabel} · <QuestionSummary html={String(item.text)}/> · {competitionError(item.reason, ar)}</li>)}</ul></div>}{items.some(item => item.needsReview) && <p className={styles.notice} role="status">{text('ستُنقل الأسئلة التي ينقصها مفتاح إجابة إلى المسودة أيضًا. أضف أو راجع الإجابة داخل المسابقة قبل النشر؛ لن يتغير المصدر.', 'Questions without answer keys will also be copied to the draft. Add or review their answers in the competition before publishing; the source is preserved.')}</p>}{currentCount + items.length > 500 && <p role="alert" className={styles.error}>{text('الحد الأقصى 500 سؤال للمسابقة. اختر قسمًا أو درسًا أصغر.', 'A competition supports up to 500 questions. Choose a smaller section or lesson.')}</p>}<div><button className={styles.primary} type="button" disabled={!items.length || !!unsupported.length || currentCount + items.length > 500} onClick={() => onImport(items.map(item => normalizeCompetitionQuestion({ ...item.question, id: undefined })))}><Copy size={17}/>{text('نقل كل الأسئلة إلى المسابقة', 'Copy all questions to competition')}</button></div></>)}
  </fieldset></section>;
}
