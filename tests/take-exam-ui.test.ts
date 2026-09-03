import assert from 'node:assert/strict';
import {
  getSafeCurrentQuestion,
  getAnswerStatusLabel,
  getInExamQuestionTypeLabel,
  isQuestionAnswered,
  resolveTakeExamQuestions,
  toggleReviewFlag,
} from '../src/lib/takeExamUi.ts';

assert.equal(getInExamQuestionTypeLabel({ type: 'MCQ' }, 'en'), 'Multiple Choice');
assert.equal(getInExamQuestionTypeLabel({ type: 'MULTI_SELECT' }, 'ar'), 'اختيار متعدد');

assert.equal(isQuestionAnswered({ type: 'MCQ' }, { selectedAnswer: 'A' }), true);
assert.equal(isQuestionAnswered({ type: 'MCQ' }, null), false);
assert.equal(isQuestionAnswered({ type: 'MULTI_SELECT' }, { selectedAnswers: ['A', 'B'] }), true);
assert.equal(isQuestionAnswered({ type: 'MULTI_SELECT' }, { selectedAnswers: [] }), false);
assert.equal(isQuestionAnswered({ type: 'TEXT' }, null), true);

assert.equal(getAnswerStatusLabel({ type: 'MCQ' }, { selectedAnswer: 'A' }, 'en'), 'Answered');
assert.equal(getAnswerStatusLabel({ type: 'MCQ' }, null, 'en'), 'Not Answered');

assert.deepEqual(toggleReviewFlag([], 'q-1'), ['q-1']);
assert.deepEqual(toggleReviewFlag(['q-1'], 'q-1'), []);
assert.deepEqual(toggleReviewFlag(['q-1'], 'q-2'), ['q-1', 'q-2']);

assert.deepEqual(
  resolveTakeExamQuestions({
    questions: [undefined, { id: 'q-1', type: 'MCQ' }, null],
  }),
  [{ id: 'q-1', type: 'MCQ' }],
);

assert.deepEqual(
  resolveTakeExamQuestions({
    questions: [],
    selectedSubExam: {
      questions: [{ id: 'sub-q-1', type: 'MCQ' }],
    },
  }),
  [{ id: 'sub-q-1', type: 'MCQ' }],
);

assert.equal(
  getSafeCurrentQuestion([{ id: 'q-1' }, { id: 'q-2' }], 5)?.id,
  'q-2',
);
assert.equal(getSafeCurrentQuestion([], 0), null);
