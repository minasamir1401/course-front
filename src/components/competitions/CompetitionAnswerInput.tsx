'use client';
import { useState } from 'react';
import { Circle, Diamond, Square, Triangle } from 'lucide-react';
import HtmlRenderer from '@/components/HtmlRenderer';
import InteractiveQuestionRenderer from '@/components/InteractiveQuestionRenderer';
import styles from './Competitions.module.css';
export default function CompetitionAnswerInput({ question, language, disabled, onAnswer, onInteract }: { question: any; language: string; disabled: boolean; onAnswer: (value: unknown, index?: number) => void; onInteract?: () => void }) {
  const [value, setValue] = useState(''), [selected, setSelected] = useState<number[]>([]), [chosen, setChosen] = useState<number | null>(null);
  const ar = language === 'ar', type = question.type || 'MCQ';
  const options = (!ar && question.optionsEn ? question.optionsEn : question.options) || [];
  const symbols = [Triangle, Diamond, Circle, Square];
  const submit = () => {
    if (type === 'MULTI_SELECT') onAnswer(selected.map(index => options[index]));
    else onAnswer(value);
  };
  if (['MCQ', 'TRUE_FALSE'].includes(type) && Array.isArray(options)) return <div className={styles.answers} data-answer-grid>{options.map((option: string, index: number) => {
    const Symbol = symbols[index % symbols.length];
    const label = type === 'TRUE_FALSE' && ar ? (index === 0 ? 'صحيح' : 'خطأ') : option;
    return <button key={index} className={styles.answer} data-answer-option data-chosen={chosen === index} disabled={disabled} onClick={() => { setChosen(index); onInteract?.(); onAnswer(option, index); }}><Symbol size={24}/><HtmlRenderer tag="span" html={label}/></button>;
  })}</div>;
  return <fieldset disabled={disabled} style={{ minWidth: 0 }}>
    {type === 'MULTI_SELECT' && Array.isArray(options) ? <><p className={styles.muted}>{ar ? 'اختر كل الإجابات الصحيحة، ثم أكد إجابتك.' : 'Select all correct answers, then submit.'}</p><div className={styles.answers} data-answer-grid>{options.map((option: string, index: number) => <label key={index} className={styles.answer} data-answer-option data-chosen={selected.includes(index)} style={{ cursor: 'pointer' }}><input type="checkbox" checked={selected.includes(index)} onChange={() => { onInteract?.(); setSelected(current => current.includes(index) ? current.filter(item => item !== index) : [...current, index]); }}/><HtmlRenderer tag="span" html={option}/></label>)}</div></> : type === 'TEXT' ? <label className={styles.form}>{ar ? 'إجابتك' : 'Your answer'}<textarea className={styles.input} value={value} onChange={event => setValue(event.target.value)} rows={3}/></label> : <InteractiveQuestionRenderer question={question} value={value} onChange={setValue} language={language}/>}
    <button className={styles.primary} style={{ marginTop: 16 }} type="button" disabled={disabled || (type === 'MULTI_SELECT' ? !selected.length : !value.trim())} onClick={submit}>{ar ? 'تأكيد الإجابة' : 'Submit answer'}</button>
  </fieldset>;
}
