import assert from 'node:assert/strict';
// @ts-ignore Node's strip-types runner needs the explicit extension.
import {
  buildCreatedModulePortalHref,
  getModuleCreationView,
} from '../src/lib/moduleCreationWorkflow.ts';

assert.equal(getModuleCreationView(false, 0), 'full-builder');
assert.equal(getModuleCreationView(true, 0), 'module-setup');
assert.equal(getModuleCreationView(true, 1), 'module-summary');

assert.equal(
  buildCreatedModulePortalHref('SUPER_ADMIN', 'exam-1', [
    { id: 'temp-1', title: 'SAT Writing 2' },
  ], {
    id: 'exam-1',
    modules: [
      { id: 'module-1', title: 'SAT Writing 2' },
    ],
  }),
  '/super-admin/exams/edit/exam-1?moduleId=module-1',
);

assert.equal(
  buildCreatedModulePortalHref('SCHOOL_ADMIN', 'exam-2', [
    { id: 'temp-2', title: 'Grammar' },
  ], {
    id: 'exam-2',
    modules: [
      { id: 'module-2', title: 'Grammar' },
    ],
  }),
  '/school-admin/exams/edit/exam-2?moduleId=module-2',
);

assert.equal(
  buildCreatedModulePortalHref('SUPER_ADMIN', 'exam-3', [], {
    id: 'exam-3',
    modules: [],
  }),
  null,
);
