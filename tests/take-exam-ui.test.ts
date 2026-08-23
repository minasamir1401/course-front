import assert from 'node:assert/strict';
import {
  getAnswerStatusLabel,
  getInExamQuestionTypeLabel,
  isQuestionAnswered,
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
