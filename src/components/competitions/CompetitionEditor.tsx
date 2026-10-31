'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Save, Upload, Download, FileSpreadsheet, Trophy, Pencil, Trash2, ArrowUp, ArrowDown, Copy } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import LearningBackdrop from '@/components/student/LearningBackdrop';
import HtmlRenderer from '@/components/HtmlRenderer';
import { useLanguage } from '@/contexts/LanguageContext';
import { checkAuthSession } from '@/lib/auth';
import { validateExamQuestionForSave } from '@/lib/examQuestionValidation';
import { competitionRequest, competitionError } from './api';
import { competitionTypes, newCompetitionQuestion, normalizeCompetitionQuestion, questionForSave, competitionLocalDate, type CompetitionQuestion, type CompetitionOptions } from './authoring';
import CompetitionQuestionImport from './CompetitionQuestionImport';
import CompetitionQuestionForm from './CompetitionQuestionForm';
import styles from './CompetitionAuthoring.module.css';
export default function CompetitionEditor() {
  const params = useParams(); const id = String(params.id); const pathname = usePathname(); const router = useRouter();
  const base = pathname.startsWith('/super-admin') ? '/super-admin' : '/school-admin';
  const { language } = useLanguage(); const ar = language === 'ar'; const text = (a: string, e: string) => ar ? a : e;
  const [room, setRoom] = useState<any>(null), [questions, setQuestions] = useState<CompetitionQuestion[]>([]), [options, setOptions] = useState<CompetitionOptions>({ schools: [], subjects: [], grades: [], courses: [], exams: [] });
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState(''), [dirty, setDirty] = useState(false);
  const [editing, setEditing] = useState<CompetitionQuestion | null>(null), [showTransfer, setShowTransfer] = useState(false);
  const file = useRef<HTMLInputElement>(null), metadataFile = useRef<HTMLInputElement>(null), editor = useRef<HTMLDivElement>(null);
  const current = useRef(questions);
  useEffect(() => { current.current = questions; }, [questions]);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const session = await checkAuthSession(); if (!session.authenticated) { router.replace(base + '/login'); return; }
      if (!['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(session.user.role) || (base === '/super-admin' && session.user.role !== 'SUPER_ADMIN')) throw new Error('ADMIN_REQUIRED');
      const [data, sources] = await Promise.all([competitionRequest('/' + id), competitionRequest('/manage/options')]);
      if (!data.admin) throw new Error('ADMIN_REQUIRED');
      setRoom(data.room); setQuestions(data.questions.map(normalizeCompetitionQuestion)); setOptions(sources); setDirty(false);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [base, id, router]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (dirty || editing) event.preventDefault(); }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [dirty, editing]);
  const changeQuestions = (next: CompetitionQuestion[]) => { setQuestions(next); setDirty(true); setMessage(''); };
  const save = async (review = false) => {
    if (!room || editing) return; setBusy(true); setError(''); setMessage('');
    try {
      await competitionRequest('/manage/' + id, { ...room, opensAt: competitionLocalDate(room.opensAt), closesAt: competitionLocalDate(room.closesAt), questions: questions.map(questionForSave) }, 'PATCH');
      await load();
      setDirty(false); setMessage(text('تم حفظ الأسئلة والميتا داتا في المسابقة.', 'Questions and metadata saved to the competition.'));
      if (review) router.push(base + '/competitions/' + id);
    } catch (e) { setError(competitionError((e as Error).message, ar)); } finally { setBusy(false); }
  };
  const editQuestion = (question: CompetitionQuestion) => { setEditing(structuredClone(normalizeCompetitionQuestion(question))); setError(''); setTimeout(() => editor.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30); };
  const commitQuestion = () => {
    if (!editing) return; const prepared = questionForSave(editing);
    const validation = ['MCQ', 'TRUE_FALSE', 'MULTI_SELECT'].includes(prepared.type) ? validateExamQuestionForSave({ ...prepared, correctAnswers: prepared.type === 'MULTI_SELECT' ? prepared.correctAnswer : undefined }, language) : null;
    if ((!prepared.text.trim() && !prepared.textEn?.trim()) || prepared.correctAnswer === undefined || prepared.correctAnswer === null || prepared.correctAnswer === '' || !Number.isInteger(prepared.points) || prepared.points < 1 || prepared.points > 10000 || !Number.isInteger(prepared.seconds) || prepared.seconds < 5 || prepared.seconds > 3600 || validation?.error) { setError(validation?.error || text('راجع نص السؤال ومفتاح الإجابة والدرجة والوقت.', 'Check the question, answer key, points and time.')); return; }
    const index = questions.findIndex(question => question.id === prepared.id); const next = [...questions];
    prepared.metadata = { ...prepared.metadata, requiresAnswerReview: false };
    if (index >= 0) next[index] = prepared; else next.push(prepared);
    changeQuestions(next); setEditing(null); setError('');
  };
  const transfer = (incoming: CompetitionQuestion[]) => {
    const known = new Set(questions.map(question => question.origin?.key || question.metadata?.origin?.key).filter(Boolean));
    const additions = incoming.filter(question => { const key = question.origin?.key || question.metadata?.origin?.key; if (!key) return true; if (known.has(key)) return false; known.add(key); return true; });
    if (questions.length + additions.length > 500) { setError(competitionError('QUESTION_LIMIT', ar)); return; }
    changeQuestions([...questions, ...additions]); setShowTransfer(false); setMessage(text('تم نقل المجموعة بالكامل إلى المحرر. احفظ المسابقة لتثبيت التغييرات.', 'The complete selection was copied to the editor. Save the competition to persist the changes.'));
  };
  const importFile = async (event: React.ChangeEvent<HTMLInputElement>, metadata = false) => {
    const upload = event.target.files?.[0]; event.target.value = ''; if (!upload) return;
    if (upload.size > 8 * 1024 * 1024) { setError(text('الحد الأقصى للملف 8 ميجابايت.', 'Maximum file size is 8 MB.')); return; }
    setBusy(true); setError(''); const snapshot = JSON.stringify(current.current);
    try {
      const [XLSX, { importCompetitionMetadata, importCompetitionWorkbook }] = await Promise.all([import('xlsx'), import('./competitionWorkbook')]);
      const workbook = XLSX.read(await upload.arrayBuffer(), { type: 'array' });
      if (snapshot !== JSON.stringify(current.current)) throw new Error(text('تغيرت الأسئلة أثناء قراءة الملف. أعد الاستيراد.', 'Questions changed while reading the file. Import again.'));
      const next = metadata ? importCompetitionMetadata(workbook, current.current) : importCompetitionWorkbook(workbook, current.current, language);
      changeQuestions(next); setMessage(text('تم تطبيق الملف في المحرر. راجع الأسئلة ثم احفظ المسابقة.', 'Workbook applied in the editor. Review the questions, then save the competition.'));
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  const download = async (template = false, metadata = false) => { try { const [XLSX, { competitionMetadataWorkbook, competitionWorkbook }] = await Promise.all([import('xlsx'), import('./competitionWorkbook')]); XLSX.writeFile(metadata ? competitionMetadataWorkbook(questions, language) : competitionWorkbook(template ? null : questions, language), metadata ? 'competition_metadata.xlsx' : template ? 'competition_questions_template.xlsx' : 'competition_questions_edit.xlsx'); } catch (e) { setError((e as Error).message); } };
  const changeEditing = (key: string, value: any) => setEditing(old => old ? ({ ...old, [key]: value }) : old);
  return <DashboardLayout mainClassName={styles.main}><div className={styles.page} dir={ar ? 'rtl' : 'ltr'}><LearningBackdrop/><section className={styles.hero}><div><span className={styles.eyebrow}><Trophy size={17}/>{text('الخطوة الثانية · محرر الأسئلة', 'Step 2 · Question editor')}</span><h1>{room ? (ar ? room.title : room.titleEn || room.title) : text('أسئلة المسابقة', 'Competition questions')}</h1><p>{room?.subject} {room?.grade ? ' · ' + room.grade : ''}</p></div><div className={styles.actions}><Link className={styles.secondary} href={base + '/competitions/' + id + '/preview'} target="_blank" rel="noopener noreferrer" title={text('معاينة آخر نسخة محفوظة', 'Preview the last saved version')}>{text('معاينة كطالب', 'Preview as student')}</Link><Link className={styles.secondary} href={base + '/competitions'}>{text('كل المسابقات', 'All competitions')}</Link></div></section>{(dirty || editing) && <p className={styles.notice}>{text('المعاينة تعرض آخر نسخة محفوظة. احفظ تعديلات الأسئلة أولًا لتظهر فيها.', 'The preview shows the last saved version. Save your question changes to include them.')}</p>}
    <nav className={styles.steps} aria-label={text('خطوات إنشاء المسابقة', 'Competition creation steps')}><Link href={base + '/competitions/' + id + '/settings'}><b>1</b>{text('بيانات المسابقة', 'Competition details')}</Link><span aria-current="step"><b>2</b>{text('الأسئلة', 'Questions')}</span><span><b>3</b>{text('المراجعة والنشر', 'Review & publish')}</span></nav>
    {error && <p role="alert" className={styles.error}>{competitionError(error, ar)}</p>}{message && <p role="status" className={styles.success}>{message}</p>}
    {room?.participants > 0 && <p className={styles.notice}>{text("تعديلات الأسئلة تخص المشاركين الجدد. كل طالب انضم بالفعل يحتفظ بنسخة محاولته ونتائجه.", "Question edits apply to new participants. Students who already joined keep their original attempt and results.")}</p>}{loading ? <p role="status">{text('جارٍ تحميل الأسئلة…', 'Loading questions…')}</p> : room && <>
      <div className={styles.toolbar} role="group" aria-label={text('أدوات الأسئلة', 'Question tools')}>
        <button type="button" className={styles.secondary} disabled={busy || !!editing || !questions.length} onClick={() => download()}><Download size={16}/>{text('تصدير الأسئلة للتعديل', 'Export questions for editing')}</button>
        <button type="button" className={styles.secondary} disabled={busy || !!editing} onClick={() => file.current?.click()}><Upload size={16}/>{text('استيراد الأسئلة', 'Import questions')}</button>
        <button type="button" className={styles.secondary} onClick={() => download(true)}><FileSpreadsheet size={16}/>{text('نموذج الأسئلة', 'Questions template')}</button>
        <button type="button" className={styles.secondary} disabled={busy || !!editing || !questions.length} onClick={() => metadataFile.current?.click()}><Upload size={16}/>{text('استيراد ميتا داتا متقدمة', 'Import advanced metadata')}</button>
        <button type="button" className={styles.secondary} onClick={() => download(false, true)}><FileSpreadsheet size={16}/>{text('نموذج الميتا داتا', 'Metadata template')}</button>
        <button type="button" className={styles.secondary} disabled={busy || !!editing} aria-expanded={showTransfer} onClick={() => setShowTransfer(value => !value)}><Copy size={16}/>{text('نقل امتحان أو مقرر', 'Copy exam or course')}</button>
        <button type="button" className={styles.primary} disabled={busy || !!editing || questions.length >= 500} onClick={() => editQuestion(newCompetitionQuestion())}><Plus size={17}/>{text('إضافة سؤال', 'Add question')}</button>
        <input ref={file} hidden type="file" accept=".xlsx,.xls,.csv" onChange={event => void importFile(event)}/><input ref={metadataFile} hidden type="file" accept=".xlsx,.xls,.csv" onChange={event => void importFile(event, true)}/>
      </div>
      {showTransfer && <CompetitionQuestionImport ar={ar} exams={options.exams} courses={options.courses} currentCount={questions.length} seconds={30} disabled={busy} onImport={transfer}/>}
      {editing && <section className={styles.editor} ref={editor} aria-label={text('تحرير السؤال', 'Edit question')}><div className={styles.grid}><label className={styles.field}>{text('المجموعة (اختياري)', 'Group (optional)')}<input className={styles.input} value={editing.group || ''} onChange={event => changeEditing('group', event.target.value)}/></label><label className={styles.field}>{text('وقت السؤال بالثواني', 'Seconds per question')}<input className={styles.input} type="number" min={5} max={3600} value={editing.seconds} onChange={event => changeEditing('seconds', Number(event.target.value))}/></label></div><CompetitionQuestionForm question={editing} setQuestion={setEditing} language={language} onSave={commitQuestion} onCancel={() => setEditing(null)} onError={setError}/></section>}
      <section aria-labelledby="questions-list-title"><div className={styles.row} style={{ marginBottom: 16 }}><h2 id="questions-list-title" style={{ fontSize: 19, fontWeight: 800 }}>{text('قائمة الأسئلة', 'Question list')} ({questions.length}/500)</h2><span className={styles.tag}>{text('إجمالي الدرجات:', 'Total points:')} {questions.reduce((sum, question) => sum + question.points, 0)}</span></div>
        {!questions.length ? <div className={styles.empty}><FileSpreadsheet size={43}/><h2>{text('جهّز أسئلة مسابقتك', 'Build your competition questions')}</h2><p>{text('أضف سؤالًا، استورد ملفًا، أو انقل امتحانًا أو مقررًا بالكامل.', 'Add a question, import a workbook, or copy an entire exam or course.')}</p></div> : <div className={styles.list}>{questions.map((question, index) => <article key={question.id} className={styles.questionRow}><div className={styles.questionBody}>{question.metadata?.requiresAnswerReview && <p className={styles.error}>{text('راجع مفتاح الإجابة قبل النشر · افتح تعديل السؤال', 'Review the answer key before publishing · edit this question')}</p>}{question.group && <p className={styles.tag}>{question.group}</p>}<h3>{index + 1}. <HtmlRenderer tag="span" html={ar ? question.text : question.textEn || question.text}/></h3><p>{competitionTypes.find(type => type[0] === question.type)?.[ar ? 1 : 2] || question.type} · {question.points} {text('درجة', 'points')} · {question.seconds} {text('ثانية', 'seconds')}</p></div><div className={styles.questionActions}><button type="button" disabled={busy || !!editing || index === 0} aria-label={text('نقل السؤال لأعلى ', 'Move question up ') + (index + 1)} onClick={() => { const next = [...questions]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; changeQuestions(next); }}><ArrowUp size={16}/></button><button type="button" disabled={busy || !!editing || index === questions.length - 1} aria-label={text('نقل السؤال لأسفل ', 'Move question down ') + (index + 1)} onClick={() => { const next = [...questions]; [next[index], next[index + 1]] = [next[index + 1], next[index]]; changeQuestions(next); }}><ArrowDown size={16}/></button><button type="button" disabled={busy || !!editing} aria-label={text('تعديل السؤال ', 'Edit question ') + (index + 1)} onClick={() => editQuestion(question)}><Pencil size={16}/></button><button type="button" disabled={busy || !!editing} aria-label={text('حذف السؤال ', 'Remove question ') + (index + 1)} onClick={() => changeQuestions(questions.filter(item => item.id !== question.id))}><Trash2 size={16}/></button></div></article>)}</div>}
      </section>
      <div className={styles.footer}><p className={styles.muted}>{editing ? text('اعتمد السؤال أو ألغ تعديله أولًا.', 'Apply the question or cancel editing first.') : dirty ? text('تغييرات لم تُحفظ بعد', 'Unsaved changes') : text('المسودة محفوظة', 'Draft saved')}</p><div className={styles.actions}><button type="button" className={styles.secondary} disabled={busy || !!editing} onClick={() => void save()}><Save size={17}/>{text('حفظ الأسئلة', 'Save questions')}</button><button type="button" className={styles.primary} disabled={busy || !!editing || !questions.length} onClick={() => void save(true)}>{text('حفظ ومراجعة للنشر', 'Save & review for publishing')}</button></div></div>
    </>}
  </div></DashboardLayout>;
}
