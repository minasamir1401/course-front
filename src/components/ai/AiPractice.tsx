'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { BookOpen, Check, CheckCircle2, ChevronLeft, ChevronRight, CircleHelp, LayoutList, ListChecks, RefreshCw, Sparkles, XCircle } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { aiRequest } from '@/lib/aiClient';
import type { AiPracticeData } from '@/lib/aiPractice';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './AiPractice.module.css';

function PlainMathText({ text }: { text: string }) {
  // Keep arithmetic in reading order inside Arabic sentences without parsing prose as HTML.
  return <>{text.split(/((?:\(?[+\-−]?[0-9٠-٩]+(?:[.,٫][0-9٠-٩]+)?[%٪]?\)?[ \t]*[+\-−×÷*/=<>≤≥][ \t]*)+\(?[+\-−]?[0-9٠-٩]+(?:[.,٫][0-9٠-٩]+)?[%٪]?\)?|[0-9٠-٩]+(?:[.,٫][0-9٠-٩]+)?[%٪])/g).map((part, index) => index % 2 ? <bdi key={index} dir="ltr">{part}</bdi> : part)}</>;
}
function MathText({ text }: { text: string }) {
  // Model prose is React text, never HTML. Only KaTeX's own untrusted-mode output is rendered.
  return <span style={{ whiteSpace: 'pre-wrap' }}>{text.split(/(\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g).map((part, index) => {
    if (index % 2 === 0) return <PlainMathText key={index} text={part}/>;
    const display = part.startsWith('\\[') || part.startsWith('$$');
    const formula = part.slice(part.startsWith('$') && !display ? 1 : 2, part.startsWith('$') && !display ? -1 : -2);
    try { return <span key={index} dir="ltr" tabIndex={0} role="math" aria-label={optionLabel(formula)} style={{ display: 'inline-block', maxWidth: '100%', overflowX: 'auto', verticalAlign: 'middle' }} dangerouslySetInnerHTML={{ __html: katex.renderToString(formula, { throwOnError: false, trust: false, maxExpand: 500, maxSize: 15, displayMode: display }) }}/>; }
    catch { return <span key={index}>{part}</span>; }
  })}</span>;
}
function optionLabel(text: string) {
  return text.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1 / $2').replace(/\\[()[\]]/g, '').replace(/\\%/g, '%');
}

export default function AiPractice({ initial, onChange, onNewPractice }: { initial: AiPracticeData; onChange: (value: AiPracticeData) => void; onNewPractice: () => void }) {
  const { language } = useLanguage(), ar = language === 'ar';
  const text = (a: string, b: string) => ar ? a : b;
  const [practice, setPractice] = useState(initial);
  const [layout, setLayout] = useState(initial.layout);
  const [current, setCurrent] = useState(() => Math.max(0, initial.questions.findIndex(question => !question.result)));
  const [drafts, setDrafts] = useState<Record<string, string | string[]>>({});
  const [pending, setPending] = useState<string | null>(null), [error, setError] = useState('');
  const active = useRef(true), sending = useRef(false), heading = useRef<HTMLHeadingElement>(null), id = useId();
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  // Conversation history and answer responses both contain the authoritative saved progress.
  async function refresh() {
    if (sending.current) return;
    sending.current = true; setPending('refresh'); setError('');
    try {
      const data = await aiRequest(`/practice/${encodeURIComponent(practice.messageId)}`);
      if (active.current) { setPractice(data.practice); onChange(data.practice); }
    } catch (cause) { if (active.current) setError(cause instanceof Error ? cause.message : text('تعذر تحديث التدريب.', 'Could not refresh practice.')); }
    finally { sending.current = false; if (active.current) setPending(null); }
  }
  async function submit(questionId: string) {
    if (sending.current) return;
    sending.current = true; setPending(questionId); setError('');
    try {
      const data = await aiRequest(`/practice/${encodeURIComponent(practice.messageId)}/answer`, { questionId, answer: drafts[questionId] });
      if (active.current) { setPractice(data.practice); onChange(data.practice); }
    } catch (cause) { if (active.current) setError(cause instanceof Error ? cause.message : text('تعذر حفظ الإجابة. حاول مجددًا.', 'Could not save your answer. Try again.')); }
    finally { sending.current = false; if (active.current) setPending(null); }
  }
  function navigate(index: number) { setCurrent(index); heading.current?.focus(); }
  const score = practice.score;
  const Previous = ar ? ChevronRight : ChevronLeft, Next = ar ? ChevronLeft : ChevronRight;
  return <section className={styles.practice} data-practice-message={practice.messageId} aria-label={text('تدريب تفاعلي', 'Interactive practice')} lang={language}>
    <header className={styles.header}>
      <span className={styles.eyebrow}><Sparkles size={15}/>{text('تدرّب مع Klevro', 'PRACTISE WITH KLEVRO')}</span>
      <h3 ref={heading} tabIndex={-1}>{practice.title}</h3><p>{practice.introduction}</p>
      <div className={styles.progressLabel}><span>{text('تقدّم التدريب', 'Practice progress')}</span><strong dir="ltr">{score.answered} / {score.total}</strong></div>
      <progress className={styles.progress} max={score.total} value={score.answered} aria-label={text('الأسئلة المجاب عنها', 'Questions answered')}/>
      <div className={styles.toolbar}><div className={styles.layout} role="group" aria-label={text('طريقة عرض الأسئلة', 'Question layout')}>
        <button type="button" aria-pressed={layout === 'step'} onClick={() => setLayout('step')}><ListChecks size={15}/>{text('سؤال بسؤال', 'One at a time')}</button>
        <button type="button" aria-pressed={layout === 'list'} onClick={() => setLayout('list')}><LayoutList size={15}/>{text('كل الأسئلة', 'All questions')}</button>
      </div><button className={styles.refresh} type="button" disabled={!!pending} onClick={() => void refresh()} aria-label={text('تحديث تقدّم التدريب', 'Refresh practice progress')}><RefreshCw size={16}/></button></div>
    </header>
    <div className={styles.questions}>{practice.questions.map((question, index) => {
      if (layout === 'step' && index !== current) return null;
      const result = question.result, answer = result?.submittedAnswer ?? drafts[question.id];
      const selected = Array.isArray(answer) ? answer : [];
      const ready = question.type === 'short_answer' ? typeof answer === 'string' && !!answer.trim() : selected.length > 0;
      return <article className={styles.question} key={question.id} data-question={question.id}>
        <div className={styles.questionMeta}><span>{text('السؤال', 'QUESTION')} {index + 1} <span className={styles.of}>{text('من', 'of')} {score.total}</span></span><span>{question.type === 'multiple_choice' ? text('اختيارات متعددة', 'Select all that apply') : question.type === 'short_answer' ? text('إجابة قصيرة', 'Short answer') : text('اختيار واحد', 'Single choice')}</span></div>
        <fieldset className={styles.fieldset}>
          <legend className={styles.prompt}><MathText text={question.prompt}/></legend>
          {question.type === 'multiple_choice' && <p className={styles.instruction}>{text('اختر كل الإجابات الصحيحة، ثم أكّد إجابتك.', 'Choose every correct answer, then confirm.')}</p>}
          {question.type === 'short_answer' ? <label className={styles.shortLabel}>{text('إجابتك', 'Your answer')}<input disabled={!!result || !!pending} aria-label={text(`إجابة السؤال ${index + 1}`, `Answer to question ${index + 1}`)} type="text" dir="auto" maxLength={300} autoComplete="off" value={typeof answer === 'string' ? answer : ''} onChange={event => setDrafts(previous => ({ ...previous, [question.id]: event.target.value }))} onKeyDown={event => { if (event.key === 'Enter' && ready && !event.nativeEvent.isComposing) { event.preventDefault(); void submit(question.id); } }}/></label>
            : <div className={styles.options}>{question.options.map((option, optionIndex) => <label className={styles.option} data-selected={selected.includes(option.id)} key={option.id}>
              <input disabled={!!result || !!pending} type={question.type === 'single_choice' ? 'radio' : 'checkbox'} aria-label={`${String.fromCharCode(65 + optionIndex)}: ${optionLabel(option.text)}`} name={`${id}-${question.id}`} value={option.id} checked={selected.includes(option.id)} onChange={() => setDrafts(previous => ({ ...previous, [question.id]: question.type === 'single_choice' ? [option.id] : selected.includes(option.id) ? selected.filter(item => item !== option.id) : [...selected, option.id] }))}/>
              <span className={styles.optionLetter} aria-hidden="true">{String.fromCharCode(65 + optionIndex)}</span><span className={styles.optionText}><MathText text={option.text}/></span>{selected.includes(option.id) && <Check className={styles.selectedCheck} size={16} aria-hidden="true"/>}
            </label>)}</div>}
        </fieldset>
        {!result && <div className={styles.questionActions}><details className={styles.hint}><summary><CircleHelp size={16}/>{text('محتاج تلميح؟', 'Need a hint?')}</summary><div><MathText text={question.hint}/></div></details><button type="button" className={styles.confirm} disabled={!ready || !!pending} onClick={() => void submit(question.id)}>{pending === question.id ? text('جارٍ حفظ الإجابة…', 'Saving answer…') : text('تأكيد الإجابة', 'Confirm answer')}<Check size={16}/></button></div>}
        {result && <div className={styles.feedback} data-correct={result.isCorrect} role="status"><strong>{result.isCorrect ? <CheckCircle2 size={19}/> : <XCircle size={19}/>} {result.isCorrect ? text('إجابة صحيحة، أحسنت!', 'Correct. Well done!') : text('محاولة مفيدة، خلّينا نفهمها.', 'Good effort. Let’s work through it.')}</strong>
          {!result.isCorrect && <p>{text('الإجابة الصحيحة: ', 'Correct answer: ')}<MathText text={result.correctAnswer}/></p>}<div className={styles.explanation}><MathText text={result.explanation}/></div></div>}
        {layout === 'step' && <nav className={styles.navigation} aria-label={text('التنقل بين أسئلة التدريب', 'Practice question navigation')}><button type="button" disabled={index === 0 || !!pending} onClick={() => navigate(index - 1)}><Previous size={16}/>{text('السابق', 'Previous')}</button><span dir="ltr">{index + 1} / {score.total}</span><button type="button" disabled={index === score.total - 1 || !!pending} onClick={() => navigate(index + 1)}>{text('التالي', 'Next')}<Next size={16}/></button></nav>}
      </article>;
    })}</div>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {score.completed && <section className={styles.summary} aria-label={text('نتيجة التدريب', 'Practice result')}><div className={styles.score}>{score.percent}<small>%</small></div><div><span className={styles.eyebrow}><BookOpen size={14}/>{text('خطوة جديدة في تعلّمك', 'ANOTHER STEP FORWARD')}</span><h4>{text('أنهيت التدريب!', 'Practice complete!')}</h4><p>{text(`أجبت عن ${score.correct} من ${score.total} بشكل صحيح. راجع الشرح وجرّب من جديد.`, `You answered ${score.correct} of ${score.total} correctly. Review the explanations and keep practising.`)}</p></div><button type="button" onClick={onNewPractice}><Sparkles size={16}/>{text('تدريب جديد', 'New practice')}</button></section>}
    <p className={styles.note}>{text('تدريب للمراجعة. تقدّمك محفوظ في المحادثة، ودرجات امتحاناتك لا تتغير. أسئلة المساعد قد تحتاج مراجعة.', 'Practice for revision. Progress is saved in this conversation; exam grades stay the same. AI questions may need review.')}</p>
  </section>;
}
