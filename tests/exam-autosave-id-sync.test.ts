import assert from 'node:assert/strict';
import { requiresExamAutosaveIdSync, requiresStandaloneExamQuestionIdSync } from '../src/lib/examAutosaveIdSync.ts';

assert.equal(
  requiresExamAutosaveIdSync(
    [{ id: 'module-1', questions: [{ id: 'question-1' }], subExams: [{ id: 'sub-exam-1', questions: [{ id: 'question-2' }] }] }],
    [{ id: 'module-1', questions: [{ id: 'question-1' }], subExams: [{ id: 'sub-exam-1', questions: [{ id: 'question-2' }] }] }],
  ),
  false,
  'an autosave response must not replace an already synchronized editor state',
);

assert.equal(
  requiresExamAutosaveIdSync(
    [{ id: 1, questions: [{ id: 2 }], subExams: [{ id: 3, questions: [{ id: 4 }] }] }],
    [{ id: 'module-1', questions: [{ id: 'question-1' }], subExams: [{ id: 'sub-exam-1', questions: [{ id: 'question-2' }] }] }],
  ),
  true,
  'a newly created module or question must still receive its database ID',
);

assert.equal(
  requiresStandaloneExamQuestionIdSync([{ id: 1 }]),
  true,
  'a newly saved standalone question must receive its database ID',
);

assert.equal(
  requiresStandaloneExamQuestionIdSync([{ id: 'question-1' }]),
  false,
  'an existing standalone question must not retrigger autosave synchronization',
);

console.log('exam-autosave-id-sync tests passed');
