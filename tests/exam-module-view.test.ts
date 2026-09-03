import assert from 'node:assert/strict';
// @ts-ignore Node's strip-types runner needs the explicit extension.
import {
  buildExamModuleViews,
  buildModuleCardSettingsHref,
  buildModuleEditHref,
  buildModulePortalHref,
  buildPrimaryModulePortalHref,
  buildSubExamEditorHref,
  getModulePortalQuestions,
  getExamWorkflowView,
  getStandaloneQuestions,
  shouldRenderModulePortal,
} from '../src/lib/examModuleView.ts';

assert.equal(shouldRenderModulePortal('module-1', null), true);
assert.equal(shouldRenderModulePortal('module-1', 'exam-1'), false);
assert.equal(getExamWorkflowView(null, null), 'full-editor');
assert.equal(getExamWorkflowView('module-1', null), 'module-portal');
assert.equal(getExamWorkflowView('module-1', 'exam-1'), 'sub-exam-editor');
assert.equal(
  buildModuleEditHref('SUPER_ADMIN', 'parent-edit-1', 'module-edit-1'),
  '/super-admin/exams/edit/parent-edit-1?view=editor',
);
assert.equal(
  buildModuleEditHref('SCHOOL_ADMIN', 'parent-edit-2', 'module-edit-2'),
  '/school-admin/exams/edit/parent-edit-2?view=editor',
);
assert.equal(buildModuleEditHref('SCHOOL_ADMIN', 'parent-edit-2', null), null);
assert.equal(
  buildModulePortalHref('SUPER_ADMIN', 'parent-portal-1', 'module-portal-1'),
  '/super-admin/exams/edit/parent-portal-1?moduleId=module-portal-1',
);
assert.equal(
  buildModulePortalHref('SCHOOL_ADMIN', 'parent-portal-2', 'module-portal-2'),
  '/school-admin/exams/edit/parent-portal-2?moduleId=module-portal-2',
);
assert.equal(buildModulePortalHref('SCHOOL_ADMIN', 'parent-portal-2', null), null);
assert.equal(
  buildModuleCardSettingsHref('SUPER_ADMIN', 'parent-card-1', 'module-card-1', false),
  '/super-admin/exams/edit/parent-card-1?moduleId=module-card-1',
);
assert.equal(
  buildModuleCardSettingsHref('SCHOOL_ADMIN', 'parent-card-2', 'module-card-2', false),
  '/school-admin/exams/edit/parent-card-2?moduleId=module-card-2',
);
assert.equal(
  buildModuleCardSettingsHref('SCHOOL_ADMIN', 'parent-card-3', 'module-card-3', true),
  '/school-admin/exams/edit/parent-card-3?view=editor',
);
assert.equal(
  buildPrimaryModulePortalHref('SUPER_ADMIN', 'parent-primary-1', [
    { id: 'module-1', title: 'Grammar' },
    { id: 'module-2', title: 'Reading' },
  ]),
  '/super-admin/exams/edit/parent-primary-1?moduleId=module-1',
);
assert.equal(
  buildPrimaryModulePortalHref('SCHOOL_ADMIN', 'parent-primary-2', []),
  null,
);
assert.equal(
  buildSubExamEditorHref('SUPER_ADMIN', 'parent-1', 'module-1', 'exam-1'),
  '/super-admin/exams/edit/parent-1?moduleId=module-1&subExamId=exam-1',
);
assert.equal(
  buildSubExamEditorHref('SCHOOL_ADMIN', 'parent-2', 'module-2', 'exam-2'),
  '/school-admin/exams/edit/parent-2?moduleId=module-2&subExamId=exam-2',
);
assert.equal(buildSubExamEditorHref('SCHOOL_ADMIN', 'parent-2', null, 'exam-2'), null);

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

assert.deepEqual(
  getModulePortalQuestions({
    questions: [{ id: 'legacy-1' }, { id: 'legacy-2' }],
    subExams: [{ id: 'child-1', questions: [{ id: 'child-question' }] }],
  }),
  [{ id: 'legacy-1' }, { id: 'legacy-2' }],
);

assert.deepEqual(
  getStandaloneQuestions({
    standaloneQuestions: [{ id: 'unassigned-1' }, { id: 'unassigned-2' }],
  }),
  [{ id: 'unassigned-1' }, { id: 'unassigned-2' }],
);

const hiddenDraftViews = buildExamModuleViews([
  {
    id: 'draft-1',
    title: 'Untitled Exam Draft',
    status: 'DRAFT',
    modules: [],
    questions: [],
  },
]);

assert.deepEqual(hiddenDraftViews, []);
