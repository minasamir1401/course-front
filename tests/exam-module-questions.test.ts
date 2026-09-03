import assert from 'node:assert/strict';
import { getStandaloneExamQuestions } from '../src/lib/examModuleQuestions.ts';

const questions = [
  { id: 'standalone-1', text: 'Standalone question' },
  { id: 'module-1', moduleId: 'module-1', text: 'Module question' },
  { id: 'sub-exam-1', moduleId: 'module-1', subExamId: 'sub-exam-1', text: 'Sub-exam question' },
];

assert.deepEqual(
  getStandaloneExamQuestions(questions),
  [questions[0]],
  'only questions without a module or sub-exam belong in the standalone editor',
);

console.log('exam-module-questions tests passed');
