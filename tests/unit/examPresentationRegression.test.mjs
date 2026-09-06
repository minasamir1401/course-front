import test from 'node:test';
import assert from 'node:assert/strict';
import { buildExamModuleViews } from '../../src/lib/examModuleView.ts';
import * as presentation from '../../src/lib/examModuleView.ts';

test('student heading uses the only root module instead of an unnamed wrapper', () => {
  assert.equal(presentation.getStudentExamTitle?.({ title: 'موديول بدون عنوان', modules: [
    { id: 'root', title: 'ميا' }, { id: 'child', title: '444', parentModuleId: 'root' },
  ] }), 'ميا');
});
test('a multi-module assessment retains its own title', () => {
  assert.equal(presentation.getStudentExamTitle?.({ title: 'تقييم الرياضيات', modules: [
    { id: 'a', title: 'الجبر' }, { id: 'b', title: 'الهندسة' },
  ] }), 'تقييم الرياضيات');
});
test('duration inherits through sub-module and parent and respects a child override', () => {
  const exam = { duration: 60, modules: [
    { id: 'root', duration: 45, subExams: [{ id: 'direct', duration: null }] },
    { id: 'child', parentModuleId: 'root', duration: null, subExams: [{ id: 'nested', duration: null }, { id: 'override', duration: 20 }] },
  ] };
  assert.equal(presentation.getStudentExamDuration?.(exam, 'direct'), 45);
  assert.equal(presentation.getStudentExamDuration?.(exam, 'nested'), 45);
  assert.equal(presentation.getStudentExamDuration?.(exam, 'override'), 20);
  assert.equal(presentation.getStudentExamDuration?.({ duration: 60, modules: [{ id: 'm', subExams: [{ id: 'e' }] }] }, 'e'), 60);
});

test('admin cards do not count nested exams twice when the API supplies totals', () => {
  const [card] = buildExamModuleViews([{ id: 'parent', modules: [{
    id: 'module', title: 'ميا', examsCount: 4,
    subExams: [{ questionsCount: 6 }, { questionsCount: 6 }],
    subModules: [
      { examsCount: 1, subExams: [{ questionsCount: 6 }] },
      { examsCount: 1, subExams: [{ questionsCount: 6 }] },
    ],
  }] }]);
  assert.equal(card.examsCount, 4);
  assert.equal(card.questionsCount, 24);
});

test('admin cards still sum nested exams when totals are absent', () => {
  const [card] = buildExamModuleViews([{ id: 'parent', modules: [{
    id: 'module', subExams: [{ questionsCount: 6 }],
    subModules: [{ subExams: [{ questionsCount: 6 }] }],
  }] }]);
  assert.equal(card.examsCount, 2);
  assert.equal(card.questionsCount, 12);
});
