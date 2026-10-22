import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCompetitionQuestion, questionForSave } from '../../src/components/competitions/authoring.ts';

test('numeric answer labels remain strings through editing and bilingual saving', () => {
  const question = normalizeCompetitionQuestion({ id: 'q', type: 'MCQ', text: '2 + 3?', options: '["4","5"]', optionsEn: '["4","5"]', correctAnswer: '5', correctAnswerEn: '5', points: 2, seconds: 60 });
  assert.equal(question.correctAnswerEn, '5');
  assert.equal(normalizeCompetitionQuestion(question).correctAnswerEn, '5');
  const saved = questionForSave(question);
  assert.equal(saved.correctAnswer, '5'); assert.equal(saved.correctAnswerEn, '5');
  assert.deepEqual(saved.options, ['4', '5']);
});

test('scalar bilingual answers stay editable text even when they resemble JSON', () => {
  for (const type of ['MCQ', 'TRUE_FALSE', 'TEXT']) {
    for (const answer of ['0', 'true', 'false', 'null', '[1,2]', '{"value":1}', 5, false]) {
      const question = normalizeCompetitionQuestion({ type, text: 'Question', correctAnswer: answer, correctAnswerEn: answer });
      assert.equal(question.correctAnswer, String(answer));
      assert.equal(question.correctAnswerEn, String(answer));
      assert.equal(normalizeCompetitionQuestion(question).correctAnswerEn, String(answer));
    }
  }
});

test('structured answer keys still decode for multiple answers and interactive questions', () => {
  const multiple = normalizeCompetitionQuestion({ type: 'MULTI_SELECT', correctAnswer: '["1","2"]', correctAnswerEn: '["1","2"]' });
  assert.deepEqual(multiple.correctAnswers, ['1', '2']);
  assert.deepEqual(multiple.correctAnswerEn, ['1', '2']);
  const interactive = normalizeCompetitionQuestion({ type: 'MATCHING', correctAnswer: '{"a":"b"}', correctAnswerEn: '{"c":"d"}' });
  assert.deepEqual(interactive.correctAnswer, { a: 'b' });
  assert.deepEqual(interactive.correctAnswerEn, { c: 'd' });
});

test('reopening an edited imported question keeps new hints and explanations over old source metadata', () => {
  const imported = normalizeCompetitionQuestion({ type: 'MCQ', text: 'Question', options: ['A', 'B'], correctAnswer: 'A', metadata: { hint: 'Source hint', explanation: 'Source explanation' } });
  const edited = { ...imported, hint: 'Edited hint', explanation: 'Edited explanation', sections: [{ type: 'EXPLANATION', content: 'Edited explanation' }] };
  const reopened = normalizeCompetitionQuestion(questionForSave(edited));
  assert.equal(reopened.hint, 'Edited hint'); assert.equal(reopened.explanation, 'Edited explanation');
  assert.equal(reopened.sections[0].content, 'Edited explanation');
  assert.equal(imported.metadata.hint, 'Source hint');
});

test('unused answer boxes are removed with their translated positions without changing the answer key', () => {
  const saved = questionForSave(normalizeCompetitionQuestion({ type: 'MCQ', text: 'Question', options: ['A', '', 'B', ''], optionsEn: ['First', '', 'Second', ''], correctAnswer: 'B', correctAnswerEn: 'Second' }));
  assert.deepEqual(saved.options, ['A', 'B']); assert.deepEqual(saved.optionsEn, ['First', 'Second']);
  assert.equal(saved.correctAnswer, 'B'); assert.equal(saved.correctAnswerEn, 'Second');
});
