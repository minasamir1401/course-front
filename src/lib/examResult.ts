export function getSubmissionTotalPoints(submission: any) {
  const directTotal = Number(submission?.exam?.totalPoints);
  if (Number.isFinite(directTotal) && directTotal >= 0) return directTotal;

  if (Array.isArray(submission?.answers) && submission.answers.length > 0) {
    return submission.answers.reduce((sum: number, answer: any) => {
      return sum + (Number(answer?.question?.points) || 0);
    }, 0);
  }

  if (Array.isArray(submission?.exam?.questions)) {
    return submission.exam.questions.reduce((sum: number, question: any) => {
      return sum + (Number(question?.points) || 0);
    }, 0);
  }

  return 0;
}
