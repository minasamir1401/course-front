export type AiPracticeData = {
  messageId: string; version: 1; title: string; introduction: string; layout: 'step' | 'list';
  questions: Array<{ id: string; type: 'single_choice' | 'multiple_choice' | 'short_answer'; prompt: string;
    options: Array<{ id: string; text: string }>; hint: string;
    result?: { submittedAnswer: string | string[]; isCorrect: boolean; answeredAt: string; correctAnswer: string; explanation: string } }>;
  score: { answered: number; total: number; correct: number; completed: boolean; percent: number };
};
