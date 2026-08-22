import assert from 'node:assert/strict';
// @ts-ignore Node's strip-types runner needs the explicit extension.
import { buildExamModuleViews, shouldRenderModulePortal } from '../src/lib/examModuleView.ts';

assert.equal(shouldRenderModulePortal('module-1', null), true);
assert.equal(shouldRenderModulePortal('module-1', 'exam-1'), false);

const views = buildExamModuleViews([
  {
    id: 'container-1',
    title: 'Exam container',
    description: 'Legacy wrapper',
    grade: 'Grade 10',
    isCentral: true,
    modules: [
      {
        id: 'module-1',
        title: 'النحو',
        description: 'اختبارات النحو',
        examsCount: 3,
        questionsCount: 9,
        subExams: [{ id: 'exam-1' }, { id: 'exam-2' }, { id: 'exam-3' }],
      },
    ],
  },
]);

assert.deepEqual(views, [
  {
    id: 'module-1',
    parentExamId: 'container-1',
    title: 'النحو',
    description: 'اختبارات النحو',
    grade: 'Grade 10',
    isCentral: true,
    examsCount: 3,
    questionsCount: 9,
  },
]);

const childExamQuestionsOnly = buildExamModuleViews([
  {
    id: 'container-2',
    modules: [
      {
        id: 'module-2',
        title: 'النحو',
        questionsCount: 24,
        questions: Array.from({ length: 12 }, (_, index) => ({ id: `legacy-${index}` })),
        subExams: [
          { id: 'exam-1', questionsCount: 6 },
          { id: 'exam-2', questionsCount: 6 },
        ],
      },
    ],
  },
]);

assert.equal(childExamQuestionsOnly[0].questionsCount, 12);
