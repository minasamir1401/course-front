type ExamPassingInput = {
  percentage: number;
  passingScore?: number | null;
  correctAnswers: number;
  totalQuestions: number;
};

export function minimumCorrectAnswers(totalQuestions: number) {
  return Math.ceil(Math.max(0, totalQuestions) / 2);
}

export function hasPassedExam({ percentage, passingScore, correctAnswers, totalQuestions }: ExamPassingInput) {
  const requiredScore = Number.isFinite(Number(passingScore)) ? Number(passingScore) : 50;
  return percentage >= requiredScore && correctAnswers >= minimumCorrectAnswers(totalQuestions);
}
