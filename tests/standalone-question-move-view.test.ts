import assert from 'node:assert/strict';
// @ts-ignore Node's strip-types runner needs the explicit extension.
import {
  buildStandaloneMoveGroups,
  buildStandaloneMoveSelectionSummary,
} from '../src/lib/standaloneQuestionMoveView.ts';

const targets = [
  {
    id: 'sub-1',
    examId: 'parent-1',
    examTitle: 'مسودة امتحان بدون عنوان',
    moduleId: 'module-1',
    moduleTitle: 'مينا',
    title: 'مينل',
    questionsCount: 1,
  },
  {
    id: 'sub-2',
    examId: 'parent-1',
    examTitle: 'مسودة امتحان بدون عنوان',
    moduleId: 'module-1',
    moduleTitle: 'مينا',
    title: 'اختبار ثاني',
    questionsCount: 4,
  },
];

assert.deepEqual(buildStandaloneMoveGroups(targets), [
  {
    key: 'parent-1::module-1',
    examId: 'parent-1',
    examTitle: 'مسودة امتحان بدون عنوان',
    moduleId: 'module-1',
    moduleTitle: 'مينا',
    exams: targets,
  },
]);

assert.equal(
  buildStandaloneMoveSelectionSummary(
    {
      standaloneCount: 10,
      targets,
    },
    'sub-1',
    'ar',
  ),
  'سيتم نقل 10 أسئلة إلى: مينل داخل موديول مينا',
);

assert.equal(
  buildStandaloneMoveSelectionSummary(
    {
      standaloneCount: 10,
      targets,
    },
    'sub-1',
    'en',
  ),
  '10 questions will move to: مينل in module مينا',
);

assert.equal(
  buildStandaloneMoveSelectionSummary(
    {
      standaloneCount: 10,
      targets,
    },
    'missing',
    'ar',
  ),
  null,
);
