'use client';
import dynamic from 'next/dynamic';
import type { Dispatch, SetStateAction } from 'react';
import { competitionTypes, type CompetitionQuestion } from './authoring';
import { translateCompetitionQuestion } from './translateCompetition';
const ExamQuestionsBuilder = dynamic(() => import('@/app/super-admin/exams/edit/[id]/components/QuestionsBuilder').then(module => module.QuestionsBuilder), { ssr: false });
const InteractiveQuestionEditor = dynamic(() => import('@/components/InteractiveQuestionEditor'), { ssr: false });

export default function CompetitionQuestionForm({ question, setQuestion, language, onSave, onCancel, onError }: {
  question: CompetitionQuestion; setQuestion: Dispatch<SetStateAction<CompetitionQuestion | null>>; language: string;
  onSave: () => void; onCancel: () => void; onError: (message: string) => void;
}) {
  const update = (field: string, value: any) => setQuestion(old => old ? { ...old, [field]: value } : old);
  const choices = Array.isArray(question.options) ? question.options : [];
  const updateOption = (index: number, value: string) => setQuestion(old => {
    if (!old) return old;
    const options = [...old.options]; const previous = options[index]; options[index] = value;
    const correctAnswer = old.type === 'MULTI_SELECT' ? (old.correctAnswers || old.correctAnswer || []).map((answer: string) => answer === previous ? value : answer) : old.correctAnswer === previous ? value : old.correctAnswer;
    return { ...old, options, correctAnswer, ...(old.type === 'MULTI_SELECT' ? { correctAnswers: correctAnswer } : {}) };
  });
  const toggle = (index: number) => {
    if (question.type === 'MULTI_SELECT') {
      const indices: number[] = question.correctAnswerIndices || choices.map((choice: string, i: number) => (question.correctAnswers || question.correctAnswer || []).includes(choice) ? i : -1).filter((i: number) => i >= 0);
      const next = indices.includes(index) ? indices.filter(i => i !== index) : [...indices, index];
      setQuestion(old => old ? { ...old, correctAnswerIndices: next, correctAnswers: next.map(i => choices[i]), correctAnswer: next.map(i => choices[i]), correctAnswersEn: next.map(i => old.optionsEn?.[i]), correctAnswerEn: next.map(i => old.optionsEn?.[i]).filter(Boolean) } : old);
    } else setQuestion(old => old ? { ...old, correctAnswerIndex: index, correctAnswer: choices[index], correctAnswerEn: old.optionsEn?.[index] } : old);
  };
  return <ExamQuestionsBuilder formOnly showQuestionForm tempQuestion={question} setTempQuestion={setQuestion}
    currentModule={{ questions: [] }} setCurrentModule={() => {}} activeSubExamIndex={null} source="questions" list={[]}
    language={language} editingQuestionIndex={null} setShowQuestionForm={(show: boolean) => { if (!show) onCancel(); }}
    updateCurrentQuestionField={update} updateQuestionOption={updateOption} toggleQuestionCorrectAnswer={toggle}
    isQuestionCorrectAnswer={(answer: string) => question.type === 'TRUE_FALSE' ? ['true', 'صحيح', 'صح', 'صواب'].includes(String(question.correctAnswer).toLowerCase()) === ['true', 'صحيح', 'صح', 'صواب'].includes(answer.toLowerCase()) : question.correctAnswer === answer}
    addQuestionSection={() => update('sections', [...(question.sections || []), { id: crypto.randomUUID(), type: 'EXPLANATION', content: '', contentEn: '' }])}
    removeQuestionSection={(index: number) => update('sections', (question.sections || []).filter((_: any, i: number) => i !== index))}
    handleSaveQuestionForSource={onSave} availableMetadata={{}} allExistingSkills={[]} customSkills={[]} showToast={onError}
    questionTypes={competitionTypes.map(([id, labelAr, labelEn]) => ({ id, labelAr, labelEn }))}
    translateQuestion={translateCompetitionQuestion} onTranslationError={(error: Error) => onError(error.message)}
    renderAnswerEditor={(authorLanguage: string) => question.type === 'TEXT' ? <label>{language === 'ar' ? 'الإجابة النموذجية' : 'Expected answer'}<textarea className="w-full border rounded-xl p-3" value={String(question[authorLanguage === 'en' ? 'correctAnswerEn' : 'correctAnswer'] || '')} onChange={event => update(authorLanguage === 'en' ? 'correctAnswerEn' : 'correctAnswer', event.target.value)}/></label> : <InteractiveQuestionEditor question={question} onChange={setQuestion} language={authorLanguage}/>}
  />;
}
