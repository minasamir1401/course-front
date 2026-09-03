import assert from 'node:assert/strict';
import { normalizePersistedExamQuestion } from '../src/lib/persistedExamQuestion.ts';

const persistedQuestion = normalizePersistedExamQuestion({
  id: 'question-1',
  type: 'MCQ',
  options: '["Stomach", "Heart", "Lungs"]',
  correctAnswer: 'Stomach',
});

assert.deepEqual(
  persistedQuestion.options,
  ['Stomach', 'Heart', 'Lungs'],
  'options returned as database JSON must be converted before replacing editor state',
);

console.log('persisted-exam-question tests passed');
