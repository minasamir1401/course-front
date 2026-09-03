import assert from 'node:assert/strict';
// @ts-ignore Node's strip-types runner needs the explicit extension.
import {
  buildExamEditRoleFallbackHref,
  buildSuperAdminRouteRoleFallbackHref,
} from '../src/lib/examEditRoleFallback.ts';

assert.equal(
  buildExamEditRoleFallbackHref({
    requestedRole: 'SUPER_ADMIN',
    examId: 'exam-1',
    search: '?view=editor&editModuleId=123',
    hasSuperAdminToken: false,
    hasSchoolAdminSession: true,
  }),
  '/school-admin/exams/edit/exam-1?view=editor&editModuleId=123',
);

assert.equal(
  buildExamEditRoleFallbackHref({
    requestedRole: 'SUPER_ADMIN',
    examId: 'exam-2',
    search: '',
    hasSuperAdminToken: false,
    hasSchoolAdminSession: false,
  }),
  null,
);

assert.equal(
  buildSuperAdminRouteRoleFallbackHref({
    pathname: '/super-admin/exams/edit/exam-9',
    search: '?view=editor&editModuleId=123',
    hasSuperAdminToken: false,
    hasSchoolAdminSession: true,
  }),
  '/school-admin/exams/edit/exam-9?view=editor&editModuleId=123',
);

assert.equal(
  buildSuperAdminRouteRoleFallbackHref({
    pathname: '/super-admin/users',
    search: '',
    hasSuperAdminToken: false,
    hasSchoolAdminSession: true,
  }),
  null,
);

assert.equal(
  buildExamEditRoleFallbackHref({
    requestedRole: 'SCHOOL_ADMIN',
    examId: 'exam-3',
    search: '?view=editor',
    hasSuperAdminToken: true,
    hasSchoolAdminSession: false,
  }),
  null,
);
