export const getInExamQuestionTypeLabel = (question: any, language: string) => {
  if (question?.type === 'MCQ') return language === 'ar' ? 'اختيار من متعدد' : 'Multiple Choice';
  if (question?.type === 'MULTI_SELECT') return language === 'ar' ? 'اختيار متعدد' : 'Multiple Select';
  if (question?.type === 'TEXT') return language === 'ar' ? 'شريحة شرح' : 'Explanation Slide';
  return language === 'ar' ? 'صح وخطأ' : 'True / False';
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
