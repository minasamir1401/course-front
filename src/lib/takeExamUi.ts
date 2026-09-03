export const getInExamQuestionTypeLabel = (question: any, language: string) => {
  if (question?.type === 'MCQ') return language === 'ar' ? 'اختيار من متعدد' : 'Multiple Choice';
  if (question?.type === 'MULTI_SELECT') return language === 'ar' ? 'اختيار متعدد' : 'Multiple Select';
  if (question?.type === 'TEXT') return language === 'ar' ? 'شريحة شرح' : 'Explanation Slide';
  return language === 'ar' ? 'صح وخطأ' : 'True / False';
};

export const resolveTakeExamQuestions = (exam: any) => {
  const primaryQuestions = Array.isArray(exam?.questions) ? exam.questions : [];
  const subExamQuestions = Array.isArray(exam?.selectedSubExam?.questions) ? exam.selectedSubExam.questions : [];
  const sourceQuestions = primaryQuestions.length > 0 ? primaryQuestions : subExamQuestions;

  return sourceQuestions.filter((question: any) => question && typeof question === 'object');
};

export const getSafeCurrentQuestion = (questions: any[], currentQuestionIndex: number) => {
  if (!Array.isArray(questions) || questions.length === 0) {
    return null;
  }

  const safeIndex = Math.min(Math.max(currentQuestionIndex || 0, 0), questions.length - 1);
  return questions[safeIndex] || null;
};

export const isQuestionAnswered = (question: any, answer: any) => {
  if (!question || question.type === 'TEXT') return true;
  if (!answer) return false;

  if (question.type === 'MULTI_SELECT') {
    return Array.isArray(answer.selectedAnswers) && answer.selectedAnswers.length > 0;
  }

  return Boolean(answer.selectedAnswer);
};

export const getAnswerStatusLabel = (question: any, answer: any, language: string) => (
  isQuestionAnswered(question, answer)
    ? (language === 'ar' ? 'تمت الإجابة' : 'Answered')
    : (language === 'ar' ? 'لم تتم الإجابة' : 'Not Answered')
);

export const toggleReviewFlag = (flaggedQuestionIds: string[], questionId: string) => {
  const normalizedQuestionId = String(questionId || '');
  if (!normalizedQuestionId) return flaggedQuestionIds;

  return flaggedQuestionIds.includes(normalizedQuestionId)
    ? flaggedQuestionIds.filter((id) => id !== normalizedQuestionId)
    : [...flaggedQuestionIds, normalizedQuestionId];
};
